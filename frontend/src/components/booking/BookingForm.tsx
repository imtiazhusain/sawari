import type { FormEvent } from 'react';
import { friendlyError, isRetryable } from '../../lib/errors';
import { formatKm, titleCase } from '../../lib/format';
import type { Estimate, Place, RideCategory } from '../../types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CategorySelector } from './CategorySelector';
import { LocationInput } from './LocationInput';

interface Props {
  places: Place[];
  placesLoading: boolean;
  placesError: boolean;
  onRetryPlaces: () => void;

  pickup: Place | null;
  destination: Place | null;
  category: RideCategory;
  onPickup: (p: Place | null) => void;
  onDestination: (p: Place | null) => void;
  onCategory: (c: RideCategory) => void;

  estimate?: Estimate;
  estimateLoading: boolean;
  estimateError: unknown;
  onRetryEstimate: () => void;

  submitting: boolean;
  submitError: unknown;
  onSubmit: () => void;
}

export function BookingForm(p: Props) {
  const selected = p.estimate?.options.find((o) => {
    return o.category === p.category;
  });

  const noDrivers =
    p.estimate &&
    p.estimate.options.every((o) => {
      return !o.available;
    });

  const canSubmit =
    Boolean(p.pickup && p.destination && selected?.available) &&
    !p.estimateLoading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (canSubmit && !p.submitting) {
      p.onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      <h1 className="text-3xl font-bold leading-tight">
        Where to?
      </h1>

      {p.placesError && (
        <Alert action={{ label: 'Retry', onClick: p.onRetryPlaces }}>
          We couldn't load places. Check your connection.
        </Alert>
      )}

      <div className="grid gap-4">
        <LocationInput
          label="Pickup"
          shape="circle"
          value={p.pickup}
          places={p.places}
          onChange={p.onPickup}
          excludeId={p.destination?.id}
          disabled={p.placesLoading}
          placeholder="Search pickup in Lahore"
        />
        <LocationInput
          label="Destination"
          shape="square"
          value={p.destination}
          places={p.places}
          onChange={p.onDestination}
          excludeId={p.pickup?.id}
          disabled={p.placesLoading}
          placeholder="Search destination"
        />
      </div>

      <section
        aria-live="polite"
        aria-label="Fare estimate"
        className="min-h-[9rem]"
      >
        {!p.pickup || !p.destination ? (
          <p className="text-sm text-ink-soft">
            Pick both places to see fares and how soon a driver can reach you.
          </p>
        ) : p.estimateLoading ? (
          <div
            role="status"
            aria-label="Loading fare estimate"
            className="grid gap-2"
          >
            {[0, 1].map((i) => {
              return (
                <div key={i} className="h-[4.25rem] animate-pulse rounded-lg bg-line/60" />
              );
            })}
          </div>
        ) : p.estimateError ? (
          <Alert
            action={
              isRetryable(p.estimateError)
                ? { label: 'Try again', onClick: p.onRetryEstimate }
                : undefined
            }
          >
            {friendlyError(p.estimateError)}
          </Alert>
        ) : noDrivers ? (
          <EmptyState title="No drivers nearby right now">
            Drivers near {p.pickup.name} are all busy or offline. Try again in a minute.
          </EmptyState>
        ) : p.estimate ? (
          <div className="grid gap-3">
            <CategorySelector
              options={p.estimate.options}
              selected={p.category}
              onSelect={p.onCategory}
            />
            <p className="text-xs text-ink-faint">
              About {formatKm(p.estimate.distanceKm)} by road. The fare is locked in when you request.
            </p>
          </div>
        ) : null}
      </section>

      {p.submitError != null && (
        <Alert>
          {friendlyError(p.submitError)}
        </Alert>
      )}

      <Button
        type="submit"
        loading={p.submitting}
        disabled={!canSubmit}
      >
        {p.submitting
          ? 'Requesting your ride…'
          : `Request ${titleCase(p.category)} ride`}
      </Button>
    </form>
  );
}
