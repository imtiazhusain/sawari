# Database schema (MongoDB / Mongoose)

The Mongoose models in `backend/src/models/` are the schema. Indexes are created on startup by Mongoose
(`autoIndex`); `npm run db:sync` (`src/seed/syncIndexes.js`) creates/updates them explicitly and is the step to run per
environment in a pipeline. Schema changes are additive; destructive changes would need a scripted migration.

## riders
| Field | Type | Notes |
|---|---|---|
| name | string | |
| phone | string | **unique** |

## drivers
| Field | Type | Notes |
|---|---|---|
| name, phone | string | phone **unique** |
| category | `economy` \| `comfort` | the only category this driver serves |
| vehicle | `{model, plate}` | |
| status | `offline` \| `available` \| `busy` | availability |
| location | GeoJSON Point `[lng, lat]` | **2dsphere** index → nearest-driver queries |
| currentRide | ObjectId \| null | set while busy; releases are conditional on it |

Indexes: `{location: 2dsphere}`, `{status, category}`.

## rides (also holds the driver assignment and fare)
| Field | Type | Notes |
|---|---|---|
| rider | ObjectId → riders | |
| driver | ObjectId → drivers \| null | assignment; set atomically when accepted |
| category | enum | |
| status | `requested` \| `accepted` \| `completed` \| `cancelled` | see state machine |
| isActive | boolean | true while requested/accepted |
| pickup, destination | `{address, location: Point}` | |
| distanceKm, etaMinutes | number | computed server-side |
| fare | `{currency:'PKR', baseFare, ratePerKm, distanceKm, total}` | snapshot at request time — later rate changes never alter an existing ride |
| idempotencyKey, requestHash | string | duplicate-request protection |
| acceptedAt, completedAt, cancelledAt, cancelledBy, cancelReason | | audit trail |
| createdAt, updatedAt | date | |

Indexes — each one enforces a rule in the database rather than trusting application code:

| Index | Purpose |
|---|---|
| `{rider, idempotencyKey}` **unique** | the same request can create at most one ride, even under concurrency |
| `{rider}` **unique, partial** (`isActive: true`) | a rider can have only one active ride |
| `{pickup.location: 2dsphere}` | nearby open requests for a driver |
| `{status, category}` | offer queries |

## Why embed assignment and fare in `rides`
A ride has exactly one assignment and one fare, and they are always read together with the ride. Keeping them in one
document means *accept* flips `status` and sets `driver` in a **single atomic write**, which is the foundation of the
concurrency guarantees. A separate `assignments` collection becomes worthwhile once re-assignment history matters
(driver declines/timeouts), at which point it is added alongside, not instead.
