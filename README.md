# Sawari Ride Booking in Lahore

Sawari is a small ride-booking app built with MongoDB, Express, React, and Node.js.

A rider can select pickup and destination locations in Lahore, compare Economy and Comfort fares, and request a ride. The driver page lets you accept and complete requests, so you can try both sides of the booking process.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, and TanStack Query
- **Backend:** Node.js, Express, Mongoose, Zod, and Pino
- **Database:** MongoDB
- **Testing:** Jest, Supertest, React Testing Library, and Playwright

The backend uses JavaScript with ES modules. The frontend uses TypeScript.

## Running with Docker

From the project root:

```bash
docker compose up --build -d
docker compose exec api npm run db:sync
docker compose exec api npm run seed
```

The seed command adds 12 demo drivers around Lahore.

Once the services are running:

- [Rider page](http://localhost:8080)
- [Driver page](http://localhost:8080/driver)
- [API documentation](http://localhost:4000/docs)
- [Health check](http://localhost:4000/health)

The seed script also resets the demo drivers to available, so avoid running it while testing an active ride.

## Running locally

You need Node.js 20 or later and a running MongoDB instance.

### Backend

From the project root:

```bash
cd backend
cp .env.example .env
npm install
npm run db:sync
npm run seed
npm run dev
```

Update `MONGO_URI` in `backend/.env` if your database uses a different address.

The API runs at `http://localhost:4000` by default.

### Frontend

Open another terminal at the project root:

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173).

Vite forwards requests starting with `/api` to the backend on port 4000.

## Trying a ride

1. Open the rider page and select Liberty Market as the pickup and Packages Mall as the destination.
2. Choose an available category and request the ride.
3. Open the driver page in another tab.
4. Select an available driver of the same category near the pickup.
5. Accept the request.
6. Return to the rider tab to see the assigned driver.
7. Complete the ride from the driver page, or cancel it from the rider page.

Active ride details refresh every three seconds, so status changes may take a moment to appear.

## How it works

The frontend calls the backend through a shared `fetch` client. TanStack Query handles loading states, errors, caching, and polling.

On the backend, routes validate incoming requests and pass them to controllers. Controllers call services, where the booking rules, driver searches, and fare calculations live. Mongoose handles database access.

### Estimates

The estimate endpoint returns a fare and pickup ETA for each category.

Trip distance is calculated from the coordinates and multiplied by 1.3 to approximate road distance. Fares use a base charge and a per-kilometre rate, rounded up to the next PKR 10, with a minimum fare for each category.

Pickup ETA uses the distance from the nearest available driver to the pickup, assuming an average speed of 25 km/h.

These are estimates, not live road or traffic calculations.

### Booking

Creating a ride checks that a nearby driver is available and saves the ride as `requested`. It does not assign that driver immediately.

An available driver can then accept the request. The backend checks the driver's category, distance, and availability before assigning them.

The normal ride flow is:

```text
requested → accepted → completed
```

A rider can also cancel a ride while it is `requested` or `accepted`.

### Duplicate requests

Each booking attempt includes an `Idempotency-Key` header.

If the same rider retries the same request with the same key, the backend returns the existing ride. Reusing that key with different booking details is rejected.

MongoDB also enforces one active ride per rider.

## Configuration

Backend settings are loaded from environment variables and validated at startup.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Required | MongoDB connection string |
| `PORT` | `4000` | Backend port |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin allowed by CORS |
| `DRIVER_SEARCH_RADIUS_KM` | `5` | Maximum distance between driver and pickup |
| `LOG_LEVEL` | `info` | Logging level |
| `NODE_ENV` | `development` | Application environment |

The frontend uses `/api/v1` as its default API base. To call a different backend directly, set `VITE_API_URL` to its full API base, including `/api/v1`.

Keep local `.env` files out of version control. The repository includes example files for setup.

## API endpoints

All endpoints below use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/places` | Get the list of Lahore landmarks |
| POST | `/riders` | Find or create a demo rider |
| POST | `/rides/estimate` | Get fares and pickup estimates |
| POST | `/rides` | Request a ride |
| GET | `/rides/:id` | Get ride details |
| POST | `/rides/:id/accept` | Accept a ride |
| POST | `/rides/:id/cancel` | Cancel a ride |
| POST | `/rides/:id/complete` | Complete a ride |
| GET | `/drivers` | List drivers |
| GET | `/drivers/:id/offers` | Get nearby ride requests |
| PATCH | `/drivers/:id/availability` | Set a driver online or offline |

Creating a ride requires `X-Rider-Id` and `Idempotency-Key` headers. Accepting and completing a ride require a `driverId` in the request body.

Successful business API responses are wrapped in `data`:

```json
{
  "data": {}
}
```

Application errors include a code, message, and request ID. Validation errors may also include field details.

See the Swagger page at `/docs` for request and response schemas.

## Tests

Run each command from the directory shown.

### Backend

```bash
cd backend
npm test
```

To run only the unit tests:

```bash
npm run test:unit
```

Integration tests use `mongodb-memory-server` to start a temporary MongoDB instance. The first run may need internet access to download the MongoDB binary.

Backend tests cover fare calculations, input validation, ride creation, cancellation, driver assignment, duplicate requests, and concurrent updates.

### Frontend

```bash
cd frontend
npm test
npm run typecheck
```

Frontend tests cover the booking form, ride status display, API error handling, and rider-page interactions.

### Browser test

Start the Docker services and seed the demo drivers first. Then, from `frontend`:

```bash
npx playwright install chromium
npm run e2e
```

The Playwright test uses `http://localhost:8080` by default. Set `E2E_BASE_URL` if the app runs elsewhere.

It books a ride in the browser, accepts it through the API, checks that the driver appears, and cancels the ride.


## AI tooling disclosure

I used Claude (the chat interface, not Claude Code) to help create the map placeholder, draft test cases, improve parts of the UI, and format code. AI assistance was also used to prepare the documentation.

## Project structure

```text
docs/
  ARCHITECTURE.md    Architecture diagram, design decisions, and improvements
  DATABASE.md        Database schema, relationships, and indexes

backend/
  docs/
    openapi.yaml
  src/
    config/         Environment settings and database connection
    controllers/    Request and response handling
    domain/         Categories and ride status rules
    middlewares/    Validation, rider identification, and errors
    models/         Mongoose schemas and indexes
    routes/         API routes
    seed/           Demo drivers and index setup
    serializers/    Public response objects
    services/       Booking, matching, fares, and driver logic
    utils/          Logging, geography, and error helpers
  tests/
    integration/
    unit/

frontend/
  e2e/              Playwright test
  src/
    api/            HTTP client and endpoint functions
    components/     Booking, ride status, and shared UI
    hooks/          Queries and mutations
    lib/            Formatting, browser storage, and helpers
    pages/          RiderPage and DriverPage
    test/           Test setup and fixtures
    types/          Shared TypeScript types
```

## Documentation

- [Architecture and design notes](docs/ARCHITECTURE.md) — architecture diagram, technology choices, concurrency handling, retries, scaling, deployment, and proposed improvements.
- [Database schema](docs/DATABASE.md) — collections, fields, relationships, and indexes.
- [API specification](backend/docs/openapi.yaml) — endpoint definitions and request/response schemas. Swagger UI is available at [localhost:4000/docs](http://localhost:4000/docs) when the backend is running.

The setup and test commands are included above. Current limitations are listed below.

## Current limitations

This is a demo app with a few deliberate simplifications:

- There is no real authentication. Rider and driver IDs are supplied by the client.
- Places come from a fixed list of Lahore landmarks.
- Driver locations are seeded coordinates, not live GPS positions.
- The map is an SVG placeholder.
- Updates use polling rather than WebSockets.
- Requested rides do not expire automatically.
- There is no payment processing, surge pricing, or traffic-based routing.

Driver acceptance uses two conditional database updates with a compensating release if assignment fails. It is not a transaction across both documents, so a process failure between updates can leave inconsistent state.

Authentication, recovery for interrupted updates, live locations, and a routing provider would be needed before using this as a real ride-booking service.
