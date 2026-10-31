import { stubFetch } from '../test/helpers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ESTIMATE, PLACES, RIDE } from '../test/fixtures';
import RiderPage from './RiderPage';

const json = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status });
const failure = (status: number, code: string, message: string) => new Response(JSON.stringify({ error: { code, message, requestId: 'r' } }), { status });

type Handler = (init?: RequestInit) => Response | Promise<Response>;
function stubApi(overrides: Record<string, Handler> = {}) {
  const handlers: Record<string, Handler> = {
    'POST /riders': () => json({ id: 'a'.repeat(24), name: 'Ayesha', phone: '+923001234567' }),
    'GET /places': () => json(PLACES),
    'POST /rides/estimate': () => json(ESTIMATE),
    [`GET /rides/${RIDE.id}`]: () => json(RIDE),
    ...overrides,
  };
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}`;
    const handler = handlers[key];
    if (!handler) throw new Error(`Unhandled request: ${key}`);
    return handler(init);
  });
  stubFetch(fetchMock);
  return fetchMock;
}

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RiderPage />
    </QueryClientProvider>,
  );

async function pickRoute() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('combobox', { name: 'Pickup' }));
  await user.click(await screen.findByRole('option', { name: /Liberty Market/ }));
  await user.click(screen.getByRole('combobox', { name: 'Destination' }));
  await user.click(await screen.findByRole('option', { name: /Packages Mall/ }));
  return user;
}

beforeEach(() => window.localStorage.clear());

describe('RiderPage', () => {
  it('books a ride end to end and shows the status view', async () => {
    const fetchMock = stubApi({ 'POST /rides': () => json(RIDE, 201) });
    renderPage();
    const user = await pickRoute();

    await user.click(await screen.findByRole('button', { name: /Request Economy ride/ }));

    expect(await screen.findByRole('heading', { name: 'Finding your driver' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/rides')).length).toBe(1);
    expect(JSON.parse(window.localStorage.getItem('sawari.activeRideId')!)).toBe(RIDE.id);
  });

  it('reuses the same Idempotency-Key when a failed booking is retried', async () => {
    let attempts = 0;
    const keys: string[] = [];
    stubApi({
      'POST /rides': (init) => {
        keys.push((init?.headers as Record<string, string>)['Idempotency-Key']);
        attempts += 1;
        if (attempts === 1) throw new TypeError('Failed to fetch'); // response lost: the server may have created the ride
        return json(RIDE, 200);
      },
    });
    renderPage();
    const user = await pickRoute();

    await user.click(await screen.findByRole('button', { name: /Request Economy ride/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the server/i);

    await user.click(screen.getByRole('button', { name: /Request Economy ride/ }));
    expect(await screen.findByRole('heading', { name: 'Finding your driver' })).toBeInTheDocument();

    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  });

  it('shows a friendly error when no driver is available, and lets the rider try again', async () => {
    stubApi({ 'POST /rides': () => failure(409, 'NO_DRIVERS_AVAILABLE', 'none') });
    renderPage();
    const user = await pickRoute();
    await user.click(await screen.findByRole('button', { name: /Request Economy ride/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/No drivers are free nearby/);
    expect(screen.getByRole('button', { name: /Request Economy ride/ })).toBeEnabled();
  });

  it('shows an error state when the fare estimate fails', async () => {
    stubApi({ 'POST /rides/estimate': () => failure(400, 'VALIDATION_ERROR', 'bad') });
    renderPage();
    await pickRoute();
    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid/);
  });

  it('cancels an active ride', async () => {
    window.localStorage.setItem('sawari.riderId', JSON.stringify('a'.repeat(24)));
    window.localStorage.setItem('sawari.activeRideId', JSON.stringify(RIDE.id));
    stubApi({ [`POST /rides/${RIDE.id}/cancel`]: () => json({ ...RIDE, status: 'cancelled' }) });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel ride' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ride cancelled' })).toBeInTheDocument());
  });

  it('drops a remembered ride that no longer exists', async () => {
    window.localStorage.setItem('sawari.riderId', JSON.stringify('a'.repeat(24)));
    window.localStorage.setItem('sawari.activeRideId', JSON.stringify(RIDE.id));
    stubApi({ [`GET /rides/${RIDE.id}`]: () => failure(404, 'NOT_FOUND', 'gone') });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Where to?' })).toBeInTheDocument();
  });
});
