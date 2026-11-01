import { stubFetch } from '../test/helpers';
import { ApiError, request } from './client';

describe(
  'api client',
  () => {
    it(
      'maps a failed fetch to a retryable NETWORK_ERROR',
      async () => {
        stubFetch(jest.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        const err = await request('/places').catch((e) => {
          return e;
        });
        expect(err).toBeInstanceOf(ApiError);
        expect(err).toMatchObject(
          { status: 0, code: 'NETWORK_ERROR', retryable: true }
        );
      }
    );
    it(
      'exposes the server error envelope',
      async () => {
        stubFetch(jest.fn().mockResolvedValue(new Response(
          JSON.stringify({
            error: {
              code: 'NO_DRIVERS_AVAILABLE',
              message: 'none',
              requestId: 'r-1'
            }
          }),
          { status: 409 }
        )));

        const err = await request('/rides').catch((e) => {
          return e;
        });
        expect(err).toMatchObject({
          status: 409,
          code: 'NO_DRIVERS_AVAILABLE',
          requestId: 'r-1',
          retryable: false
        });
      }
    );
    it(
      'treats 5xx without a JSON body as retryable',
      async () => {
        stubFetch(
          jest.fn().mockResolvedValue(
            new Response(
              '<html>bad gateway</html>',
              { status: 502 }
            )
          )
        );

        const err = await request('/rides').catch((e) => {
          return e;
        });
        expect(err).toMatchObject(
          { status: 502, code: 'UNKNOWN_ERROR', retryable: true }
        );
      }
    );
    it(
      'unwraps { data } on success',
      async () => {
        stubFetch(
          jest.fn().mockResolvedValue(
            new Response(
              JSON.stringify(
                { data: [1, 2] }
              ),
              { status: 200 }
            )
          )
        );
        await expect(request('/x')).resolves.toEqual([1, 2]);
      }
    );
  }
);
