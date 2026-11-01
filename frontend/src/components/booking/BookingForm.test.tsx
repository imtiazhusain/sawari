import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../api/client';
import { ESTIMATE, LIBERTY, PACKAGES, PLACES } from '../../test/fixtures';
import { BookingForm } from './BookingForm';

const base = {
  places: PLACES,
  placesLoading: false,
  placesError: false,
  onRetryPlaces: jest.fn(),
  pickup: LIBERTY,
  destination: PACKAGES,
  category: 'economy' as const,
  onPickup: jest.fn(),
  onDestination: jest.fn(),
  onCategory: jest.fn(),
  estimate: ESTIMATE,
  estimateLoading: false,
  estimateError: null,
  onRetryEstimate: jest.fn(),
  submitting: false,
  submitError: null,
  onSubmit: jest.fn(),
};

describe(
  'BookingForm states',
  () => {
    it(
      'prompts for both places before showing fares, and cannot submit',
      () => {
        render(<BookingForm
          {...base}
          pickup={null}
          destination={null}
          estimate={undefined}
        />);
        expect(screen.getByText(/Pick both places/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Request Economy ride/ })).toBeDisabled();
      }
    );
    it(
      'shows a loading skeleton while the estimate loads',
      () => {
        render(<BookingForm
          {...base}
          estimate={undefined}
          estimateLoading
        />);
        expect(screen.getByRole('status', { name: 'Loading fare estimate' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Request Economy ride/ })).toBeDisabled();
      }
    );
    it(
      'shows fares and lets the rider submit once an estimate is available',
      async () => {
        const onSubmit = jest.fn();
        render(<BookingForm {...base} onSubmit={onSubmit} />);
        expect(screen.getByText('Rs 310')).toBeInTheDocument();
        expect(screen.getByText('Rs 480')).toBeInTheDocument();
        await userEvent.click(
          screen.getByRole(
            'button',
            { name: /Request Economy ride/ }
          )
        );
        expect(onSubmit).toHaveBeenCalledTimes(1);
      }
    );
    it(
      'shows an empty state when no driver is available for any category',
      () => {
        const none = {
          ...ESTIMATE,
          options: ESTIMATE.options.map((o) => {
            return ({ ...o, available: false, etaMinutes: null });
          })
        };
        render(<BookingForm {...base} estimate={none} />);
        expect(screen.getByText('No drivers nearby right now')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Request/ })).toBeDisabled();
      }
    );
    it(
      'shows an error with a retry action when the estimate fails',
      async () => {
        const onRetryEstimate = jest.fn();
        render(<BookingForm
          {...base}
          estimate={undefined}
          estimateError={new ApiError(0, 'NETWORK_ERROR', 'x')}
          onRetryEstimate={onRetryEstimate}
        />);
        expect(screen.getByRole('alert')).toHaveTextContent(
          /can't reach the server/i
        );
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(onRetryEstimate).toHaveBeenCalled();
      }
    );
    it(
      'disables the button and shows progress while the request is in flight (no double submit)',
      async () => {
        const onSubmit = jest.fn();
        render(<BookingForm
          {...base}
          submitting
          onSubmit={onSubmit}
        />);

        const button = screen.getByRole(
          'button',
          { name: /Requesting your ride/ }
        );
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        await userEvent.click(button);
        expect(onSubmit).not.toHaveBeenCalled();
      }
    );
    it(
      'explains a failed booking in plain language',
      () => {
        render(<BookingForm
          {...base}
          submitError={new ApiError(409, 'NO_DRIVERS_AVAILABLE', 'raw')}
        />);
        expect(screen.getByRole('alert')).toHaveTextContent(
          /No drivers are free nearby/
        );
      }
    );
    it(
      'shows a retry when places fail to load',
      () => {
        render(<BookingForm
          {...base}
          pickup={null}
          destination={null}
          estimate={undefined}
          places={[]}
          placesError
        />);
        expect(screen.getByRole('alert')).toHaveTextContent(
          /couldn't load places/i
        );
      }
    );
  }
);
