# Dhaka Tesla Pool

Dhaka Tesla Pool is an MVP ride-pooling application for matching passenger ride requests with a driver's Tesla vehicle. Passengers can estimate fares, request rides, view their own rides, and cancel eligible requests. Drivers can configure a vehicle, open a pool, match requests, and move rides through the trip lifecycle.

## Problem Statement

Urban trips often have spare vehicle capacity but no simple way to share it. This project demonstrates a small, role-based pooling workflow with fare sharing, vehicle capacity limits, ride status transitions, and PostgreSQL persistence.

## Implemented Features

- Passenger and driver registration/login with JWT authentication.
- Passenger ride requests between supported Dhaka locations: Dhanmondi, Gulshan, Banani, and Mirpur.
- Fare estimation using a route-distance table, base fare, per-kilometre fare, and service fee.
- Driver vehicle creation, editing, and online/offline status.
- Driver pool creation with vehicle-capacity validation.
- Manual and automatic ride matching.
- Pool fares with an occupancy-based discount capped at 20%.
- Ride lifecycle: `REQUESTED` -> `MATCHED` -> `DRIVER_ARRIVED` -> `STARTED` -> `COMPLETED`.
- Cancellation handling for eligible rides and pools.
- Ownership checks so passengers can only access or cancel their own rides and drivers can only manage their own vehicles, pools, and assigned rides.
- Ride status history for auditable transitions.

## Screenshots and Demo

No screenshots, GIFs, public deployment, or demo video are committed yet. Add captured assets under `docs/` and replace the links below when they are available.

- Screenshots/GIFs: `docs/screenshots/` (planned)
- Demo video: **Not published**
- Deployment URL: **Not deployed**

## Architecture

```mermaid
flowchart LR
	Browser[Next.js browser app] -->|REST JSON + JWT| API[Express API]
	API --> Auth[Auth middleware]
	API --> Controllers[Controllers]
	Controllers --> Services[Ride and driver services]
	Services --> Prisma[Prisma ORM]
	Prisma --> DB[(PostgreSQL)]
	Seed[Prisma seed] --> DB
```

The frontend is a Next.js app. The backend is an Express API. Prisma owns the relational schema, migrations, and seed data. Authentication is stateless JWT authentication; the browser stores the token and sends it as a Bearer token.

## Database Diagram

```mermaid
erDiagram
	USER ||--o| VEHICLE : owns
	USER ||--o{ RIDEREQUEST : creates
	USER ||--o{ POOL : drives
	VEHICLE ||--o{ POOL : serves
	POOL ||--o{ POOLMEMBER : contains
	RIDEREQUEST ||--o| POOLMEMBER : joins
	RIDEREQUEST ||--o{ RIDESTatusHISTORY : records

	USER {
		uuid id PK
		string name
		string email UK
		string passwordHash
		enum role
	}
	VEHICLE {
		uuid id PK
		string name
		int capacity
		boolean isOnline
		uuid driverId FK
	}
	RIDEREQUEST {
		uuid id PK
		uuid passengerId FK
		string pickupLocation
		string destination
		int seats
		int estimatedFare
		int finalFare
		enum status
	}
	POOL {
		uuid id PK
		uuid driverId FK
		uuid vehicleId FK
		enum status
		int totalSeats
		int occupiedSeats
	}
	POOLMEMBER {
		uuid id PK
		uuid poolId FK
		uuid rideRequestId FK
		int seats
		int fare
	}
	RIDESTatusHISTORY {
		uuid id PK
		uuid rideRequestId FK
		enum fromStatus
		enum toStatus
		datetime createdAt
	}
```

The canonical schema is [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Axios, Tailwind/PostCSS tooling.
- Backend: Node.js 20+, Express 5, TypeScript, JWT, bcryptjs, Zod.
- Data: PostgreSQL 16, Prisma 7.
- Local orchestration: Docker Compose.

## Project Structure

```text
backend/
  prisma/              Schema, migrations, and seed
  src/
	controllers/       HTTP request handlers
	middleware/        Auth, role, and error middleware
	routes/            Auth, passenger ride, and driver routes
	services/          Business rules and database operations
	utils/             Fare, distance, password, JWT, validation helpers
frontend/
  app/                 Next.js routes and screens
  components/          Shared UI components
  lib/                 API client and auth helpers
  types/               Shared frontend types
database/              Reserved for database-related project assets
docker-compose.yml     PostgreSQL, backend, and frontend services
```

## Prerequisites

- Node.js 20 or later and npm.
- Docker Desktop with Compose, recommended for PostgreSQL.
- PostgreSQL 16 if running the database without Docker.

## Environment Variables

Never commit real secrets. The root `.env.example` contains placeholder PostgreSQL values. For a local backend, create `backend/.env` with values like these:

```dotenv
DATABASE_URL=postgresql://tesla_user:tesla_password@localhost:5432/tesla_pool?schema=public
JWT_SECRET=replace-with-a-local-development-secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

The frontend optionally accepts:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`docker-compose.yml` supplies container-local database, API, and frontend values. Override `JWT_SECRET` through the shell or a local `.env` file; never use a production secret from this README.

## Local Setup

1. Clone the repository and install dependencies:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   cd ..
   ```

2. Start PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

3. Configure `backend/.env` as shown above.

4. Apply migrations and seed demo data:

   ```powershell
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. Start the backend and frontend in separate terminals:

   ```powershell
   # backend
   cd backend
   npm run dev
   ```

   ```powershell
   # frontend
   cd frontend
   npm run dev
   ```

   Open `http://localhost:3000`. The API health check is `http://localhost:5000/api/health`.

## Docker

The complete stack can be started with:

```powershell
docker compose up --build
```

This starts PostgreSQL on port `5432`, the API on port `5000`, and the frontend on port `3000`. The backend image runs `prisma migrate deploy` and `prisma db seed` before starting the API. Stop the stack with `docker compose down`; add `-v` only when you intentionally want to remove the local PostgreSQL volume.

## Demo Credentials

The seed creates one driver and three passengers. All use the password `password123` in local demo data only.

| Role | Name | Email |
| --- | --- | --- |
| Driver | Jashim | `jashim@teslapool.local` |
| Passenger | Nusrat | `nusrat@teslapool.local` |
| Passenger | Rafiq | `rafiq@teslapool.local` |
| Passenger | Shirin | `shirin@teslapool.local` |

The seeded vehicle is Bullet with capacity 3 and starts offline.

## API Overview

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Get current user |
| GET | `/api/rides` | Passenger | List own rides |
| GET | `/api/rides/estimate` | Passenger | Estimate a fare |
| POST | `/api/rides` | Passenger | Create a ride request |
| GET | `/api/rides/:id` | Passenger | Get one own ride |
| PATCH | `/api/rides/:id/cancel` | Passenger | Cancel an eligible ride |
| POST | `/api/driver/vehicle` | Driver | Create a vehicle |
| GET/PATCH | `/api/driver/vehicle` | Driver | Read or edit own vehicle |
| PATCH | `/api/driver/vehicle/status` | Driver | Set vehicle online/offline |
| GET | `/api/driver/rides/requests` | Driver | List requested rides |
| POST | `/api/driver/rides/:id/auto-match` | Driver | Automatically match a ride |
| PATCH | `/api/driver/rides/:id/status` | Driver | Advance an assigned ride |
| POST | `/api/driver/pools` | Driver | Create a pool |
| GET | `/api/driver/pools` | Driver | List own pools |
| GET | `/api/driver/pools/:id` | Driver | Read one own pool |
| POST | `/api/driver/pools/:id/members` | Driver | Add a ride to a pool |
| PATCH | `/api/driver/pools/:id/complete` | Driver | Complete a pool |
| PATCH | `/api/driver/pools/:id/cancel` | Driver | Cancel a pool |

## Fare Rules

- Base fare: `50`.
- Distance fare: `15` per kilometre.
- Service fee: `5%` of the passenger fare.
- Pool discount: `5% * (occupancy - 1)`, capped at `20%`.

For example, Dhanmondi to Gulshan is 8 km. One passenger's estimated fare is `(50 + 8 * 15) * 1.05 = 178.50`. With two occupied pool seats, the pooled fare is `169.58`; with three, it is `160.65`. Values are rounded to two decimal places by the fare utility.

## Testing and Consistency Requirements

There is currently no automated test script in either `package.json`. The meaningful backend test suite to add should exercise service/API behavior, not just line coverage:

- **Capacity:** attempts to add more seats than Bullet's remaining capacity are rejected; `occupiedSeats` never exceeds `totalSeats`.
- **State transitions:** invalid transitions such as `REQUESTED -> COMPLETED` and `COMPLETED -> STARTED` are rejected.
- **Fare correctness:** Nusrat and Rafiq's pooled fares match the documented fare formula and occupancy discount.
- **Authorization:** a passenger cannot read or cancel another passenger's ride; a driver cannot manage another driver's pool.
- **Cancellation:** completed, matched, started, and already-cancelled rides follow the service's cancellation rules; eligible cancellation releases pool seats atomically.
- **Concurrency:** create a one-seat-remaining Bullet pool, submit Nusrat and Shirin claims concurrently, and assert that at most one succeeds and the final occupancy is within capacity.

### Current concurrency decision

The MVP uses one PostgreSQL database as the source of truth. Prisma transactions group the related pool-member, occupancy, ride-status, and status-history writes so they commit or roll back together. Ownership is enforced in service queries, and the schema has foreign keys plus unique constraints for user email, one vehicle per driver, and one pool membership per ride. The MVP does not use distributed locks, a message broker, or multiple database writers, because it is a single-instance demo.

There are important known gaps. Both the manual `addRideToPool` path and the automatic `findAndMatchRide` path read `occupiedSeats`, check capacity, and then increment it from a previously-read pool object. The automatic path rechecks the ride and pool inside its transaction, but it still does not lock the pool row or make the capacity predicate part of the update. If Bullet has one seat left and Nusrat and Shirin submit claims at nearly the same time, both requests can observe that seat and both increments can commit. The transaction preserves write atomicity, but it does not currently guarantee `occupiedSeats <= totalSeats`. This is why the concurrent-claim test must be expected to expose the limitation rather than be described as already passing.

The database migration also does not define `CHECK` constraints for positive `seats`, `capacity`, `totalSeats`, or `occupiedSeats <= totalSeats`; those rules currently live in application code. Ride state-transition rules are also application-level, while the database only stores the enum values and history rows. Finally, fare columns are declared as `INTEGER`, but the fare utility returns values such as `178.50`; production-ready persistence should use a fixed-precision decimal or integer minor currency units consistently.

At larger scale, protect the invariant in the database transaction itself: lock the pool row (`SELECT ... FOR UPDATE`) or use a conditional atomic update such as `occupied_seats = occupied_seats + requested_seats WHERE occupied_seats + requested_seats <= total_seats`, then create the pool member only when that update succeeds. The service should return a conflict when the conditional update affects zero rows. Add an idempotency key for client retries, keep the unique `rideRequestId` constraint, and use an appropriate transaction/isolation policy. If multiple API instances are deployed, they should still coordinate through the database invariant rather than relying on in-process state.

## Build, Lint, and Tests

```powershell
cd backend
npm run build

cd ..\frontend
npm run lint
npm run build
```

No `npm test` command is configured yet. Until the behavioral suite described above is added, build/lint checks validate compilation and static quality but do not prove capacity, authorization, cancellation, fare, or race-condition behavior.

## Key Decisions and Trade-offs

- **PostgreSQL + Prisma:** relational constraints, migrations, and typed access fit the pool/member/status-history relationships; this adds migration discipline compared with an in-memory MVP.
- **JWT authentication:** simple stateless API authentication for the demo; production would need refresh-token rotation, revocation, and stronger browser storage protections.
- **Static route distances:** deterministic and dependency-free for the MVP; production should use a routing provider and cache route estimates.
- **Integer/decimal fare values in the current schema:** easy to display and sufficient for the demo, but production payments should use a currency-safe decimal or integer minor-unit representation consistently.
- **Single active pool per driver:** keeps the driver workflow simple and prevents overlapping vehicle assignments.
- **Transactions for related writes:** ride, pool member, occupancy, and history updates are grouped where implemented, while the manual match pre-check remains a known race to fix.
- **Database constraints:** foreign keys and selected unique constraints protect relationships and duplicate membership, while business invariants remain in application code until database `CHECK` constraints and conditional capacity updates are added.

## Known Limitations

- No production deployment, screenshots, GIFs, or demo video are published.
- No automated test runner or behavioral test suite is currently configured.
- Manual pool matching does not yet make the capacity check and occupancy increment one database-level conditional operation.
- Automatic matching also lacks a row lock or conditional capacity update, so concurrent claims can still over-allocate a pool.
- Positive numeric values, capacity bounds, and legal status transitions are not database `CHECK` constraints.
- Fare columns use integer database types even though the fare calculation can return decimal values.
- Supported locations and distances are hard-coded.
- JWTs are stored in browser local storage by the current frontend client.
- No payments, notifications, live driver location, rate limiting, refresh tokens, or production observability are included.

## Next Improvements

1. Add the behavioral and concurrent integration tests listed above.
2. Make manual pool matching capacity-safe with a row lock or conditional update and add idempotency handling.
3. Move route estimates to a routing service and replace demo fare arithmetic with currency-safe persistence.
4. Add CI for lint, build, migrations, seed, and integration tests.
5. Add production deployment, screenshots, a short demo video, monitoring, rate limiting, and secure session management.

## AI Usage

AI assistance was used throughout development as a coding and review aid across the full stack:

- **Backend:** helped draft Express routes, controllers, middleware, JWT authentication, role checks, ride/pool services, validation, fare utilities, and error handling.
- **Frontend:** helped build and refine the Next.js pages, forms, API client, authentication flow, passenger dashboard, and driver dashboard.
- **Database:** helped model the Prisma schema and relationships for users, vehicles, rides, pools, pool members, and ride status history; assisted with migration and seed-data structure.
- **Testing and consistency:** helped define meaningful acceptance tests for capacity, state transitions, fare calculation, authorization, cancellation, and concurrent pool claims; also identified the current manual-match race condition and the database-level remedies for a larger deployment.
- **Documentation:** helped produce the architecture diagram, ERD, setup instructions, API overview, trade-offs, limitations, and this AI disclosure.

Human review remains responsible for the final design, source changes, commands, credentials, security decisions, and validation. AI suggestions were checked against the repository before being documented. No real secrets or private credentials were supplied to or included in the generated content.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
