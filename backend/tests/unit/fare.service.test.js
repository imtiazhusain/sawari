import {
  calculateFare,
  estimateRoadDistanceKm,
  etaMinutesFor
} from '../../src/services/fare.service.js';
import { haversineKm, inServiceArea } from '../../src/utils/geo.js';

describe(
  'fare calculation',
  () => {
    it(
      'applies base + per-km rate, rounded up to the next PKR 10',
      () => {
        expect(calculateFare('economy', 5).total).toBe(280); // 100 + 35*5 = 275 -> 280
        expect(calculateFare('comfort', 5).total).toBe(440); // 160 + 55*5 = 435 -> 440
      }
    );
    it(
      'never goes below the category minimum fare',
      () => {
        expect(calculateFare('economy', 0.5).total).toBe(180);
        expect(calculateFare('comfort', 0.5).total).toBe(300);
      }
    );
    it(
      'comfort always costs more than economy for the same trip',
      () => {
        for (const km of [1, 4, 12, 30]) {
          expect(calculateFare('comfort', km).total).toBeGreaterThan(
            calculateFare(
              'economy',
              km
            ).total
          );
        }
      }
    );
  }
);

describe(
  'geo helpers',
  () => {
    it(
      'computes plausible distances',
      () => {
        const km = haversineKm(
          { lat: 31.5106, lng: 74.3446 },
          { lat: 31.4707, lng: 74.3547 }
        );
        expect(km).toBeGreaterThan(4);
        expect(km).toBeLessThan(5);
        expect(estimateRoadDistanceKm(
          { lat: 31.5106, lng: 74.3446 },
          { lat: 31.4707, lng: 74.3547 }
        )).toBeGreaterThan(km);
      }
    );
    it(
      'knows what is inside Lahore',
      () => {
        expect(inServiceArea({ lat: 31.52, lng: 74.35 })).toBe(true);
        expect(inServiceArea({ lat: 24.86, lng: 67.0 })).toBe(false); // Karachi
      }
    );
    it(
      'ETA has a 2 minute floor',
      () => {
        expect(etaMinutesFor(0)).toBe(2);
        expect(etaMinutesFor(3)).toBeGreaterThan(2);
      }
    );
  }
);
