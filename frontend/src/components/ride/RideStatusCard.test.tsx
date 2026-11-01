import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../api/client';
import { DRIVER, RIDE } from '../../test/fixtures';
import { RideStatusCard } from './RideStatusCard';

const props = {
  onCancel: jest.fn(),
  cancelling: false,
  cancelError: null,
  onReset: jest.fn()
};

describe(
  'RideStatusCard',
  () => {
    it(
      'shows the waiting state with a cancel action',
      async () => {
        const onCancel = jest.fn();
        render(<RideStatusCard
          {...props}
          ride={RIDE}
          onCancel={onCancel}
        />);
        expect(screen.getByRole('heading', { name: 'Finding your driver' })).toBeInTheDocument();
        await userEvent.click(
          screen.getByRole(
            'button',
            { name: 'Cancel ride' }
          )
        );
        expect(onCancel).toHaveBeenCalled();
      }
    );
    it(
      'shows the driver once assigned, and still allows cancelling',
      () => {
        render(<RideStatusCard
          {...props}
          ride={{
            ...RIDE,
            status: 'accepted',
            driver: DRIVER,
            driverId: DRIVER.id
          }}
        />);
        expect(screen.getByRole('heading', { name: 'Driver assigned' })).toBeInTheDocument();
        expect(screen.getByText('Usman Tariq')).toBeInTheDocument();
        expect(screen.getByText(/LEA-1021/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel ride' })).toBeEnabled();
      }
    );
    it(
      'hides cancel for completed rides and offers a new booking',
      async () => {
        const onReset = jest.fn();
        render(<RideStatusCard
          {...props}
          ride={{ ...RIDE, status: 'completed' }}
          onReset={onReset}
        />);
        expect(screen.queryByRole('button', { name: 'Cancel ride' })).not.toBeInTheDocument();
        await userEvent.click(
          screen.getByRole(
            'button',
            { name: 'Book another ride' }
          )
        );
        expect(onReset).toHaveBeenCalled();
      }
    );
    it(
      'shows the cancelled state',
      () => {
        render(<RideStatusCard
          {...props}
          ride={{
            ...RIDE,
            status: 'cancelled',
            cancelReason: 'Cancelled by rider'
          }}
        />);
        expect(screen.getByRole('heading', { name: 'Ride cancelled' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel ride' })).not.toBeInTheDocument();
      }
    );
    it(
      'shows progress while cancelling and surfaces cancel errors',
      () => {
        const { rerender } = render(<RideStatusCard
          {...props}
          ride={RIDE}
          cancelling
        />);
        expect(screen.getByRole('button', { name: /Cancelling/ })).toBeDisabled();
        rerender(<RideStatusCard
          {...props}
          ride={RIDE}
          cancelError={new ApiError(409, 'INVALID_STATE_TRANSITION', 'x')}
        />);
        expect(screen.getByRole('alert')).toHaveTextContent(/already changed/);
      }
    );
    it(
      'tells the rider when live updates are failing',
      () => {
        render(<RideStatusCard
          {...props}
          ride={RIDE}
          refreshError={new ApiError(0, 'NETWORK_ERROR', 'x')}
        />);
        expect(screen.getByRole('status')).toHaveTextContent(
          /last known status/
        );
      }
    );
  }
);
