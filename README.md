# Sawari Lahore ride booking (MERN)

A simplified ride-hailing app: a rider picks a pickup and destination in Lahore, chooses **Economy** or **Comfort**,
sees a fare and pickup ETA, requests a ride and follows its status. A small **driver** lets you play the
driver side (accept / complete) so the full lifecycle can be exercised in a browser.

| Layer | Stack |
|---|---|
| Backend | Node 20, Express 4, **plain JavaScript (ES modules)**, Mongoose 8, Zod, Pino |
| Database | MongoDB (2dsphere geo index, partial + unique indexes) |
| Tests | Jest + Supertest + mongodb-memory-server (API), Jest + Testing Library (UI), Playwright (E2E) |
