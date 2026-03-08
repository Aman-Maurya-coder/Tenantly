# Rental Listings and Move-In Platform (Buildathon MVP)

## Project Overview
This is a role-based rental workflow platform with Clerk authentication and a Node/Express + MongoDB backend. It supports an end-to-end tenant journey from listing discovery to visit decision, move-in submission, support conversations, and stay-extension requests, with corresponding admin operations and dashboard visibility.

## Features Implemented

### Tenant Features
- Browse published and non-expired listings with filters (`locationText`, `budget`, `moveInDate`).
- View listing details, amenities, inventory template, and media.
- Shortlist listings (cap: 10) and remove from shortlist.
- Compare shortlisted listings side-by-side (2-3 max).
- Request visits from shortlisted context.
- Perform tenant-side visit actions:
	- Request cancellation
	- Mark visit as visited
	- Mark interest (`Interested` or `NotInterested`)
- Initiate move-in after an `Interested` visit.
- Submit move-in in one flow with required documents (`identityProof`, `addressProof`, `incomeProof`), agreement acceptance, and inventory condition data.
- Create and track support tickets with threaded messages.
- Reopen resolved tickets.
- Request stay extensions for completed move-ins.

### Admin Features
- Create, update, publish, and delete listings.
- Enforce listing status transitions: `Draft -> Review -> Published` (with allowed reverse transitions).
- Schedule visit requests and confirm tenant cancellation requests.
- Review all move-ins and approve submitted move-ins.
- Manage all support tickets and ticket status transitions.
- Review and decide extension requests (`approved` / `rejected`).
- Access aggregate stats endpoints for listings, visits, move-ins, tickets, and extensions.

### Access and Role Controls
- Clerk-based auth middleware protects private routes.
- User records are auto-created in MongoDB on first authenticated request.
- Role guards enforce `tenant` vs `admin` API boundaries.

## Workflow

### Core Tenant Journey
1. Browse listings -> add to shortlist.
2. From shortlist, request visit.
3. Admin schedules visit.
4. Tenant marks visit as `Visited`.
5. Tenant marks `Interested` or `NotInterested`.
6. If `Interested`, listing is reserved for that tenant.
7. Tenant initiates and submits move-in.
8. Admin approves move-in.
9. Tenant becomes eligible to request stay extension.

### Visit Status Workflow
- `Requested` -> `Scheduled` (admin)
- `Requested|Scheduled` -> `CancelRequested` (tenant)
- `CancelRequested` -> `Cancelled` (admin)
- `Scheduled` -> `Visited` (tenant)
- `Visited` -> `Interested|NotInterested` (tenant)

### Support Ticket Workflow
- Admin transitions:
	- `open -> in_progress`
	- `in_progress -> resolved`
	- `resolved -> closed|in_progress`
	- `reopened -> in_progress`
- Tenant transition:
	- `resolved -> reopened`

## Database Schema Designs (MongoDB / Mongoose)

### Key Collections
- `users`
	- `clerkId` (unique), `email` (unique), `name`, `role`
	- Roles: `tenant`, `admin`
- `listings`
	- Core fields: `title`, `description`, `locationText`, `budget`, `moveInDate`, `status`
	- Embedded: `amenities[]`, `inventoryTemplate[]`, `images[]`
	- Reservation fields: `reservedForTenant`, `reservationVisit`
	- Status enum: `Draft`, `Review`, `Published`
- `shortlists`
	- `tenant`, `listing`
	- Unique index: `{ tenant, listing }`
- `visitrequests`
	- `listing`, `tenant`, `requestedDate`, `scheduledDate`, notes, `status`
	- Status enum: `Requested`, `Scheduled`, `Visited`, `Interested`, `NotInterested`, `CancelRequested`, `Cancelled`
	- Index: `{ listing, tenant }`
- `moveins`
	- `tenant`, `listing`, `visit`, `documents[]`, agreement fields, `inventoryChecklist[]`, `status`
	- Status enum: `initiated`, `submitted`, `completed`
	- Unique index: `{ tenant, visit }`
- `supporttickets`
	- `tenant`, optional `relatedListing`, optional `relatedMoveIn`, `subject`, `category`, `status`, `messages[]`
	- Status enum: `open`, `in_progress`, `resolved`, `closed`, `reopened`
	- Indexes: `{ tenant, status }`, `{ status, category }`
- `stayextensions`
	- `tenant`, `moveIn`, `listing`, `currentEndDate`, `requestedEndDate`, `reason`, `status`
	- Status enum: `pending`, `approved`, `rejected`, `cancelled`
	- Index: `{ moveIn, status }`

### Relationship Summary
- One `User` can have many `Shortlist`, `VisitRequest`, `MoveIn`, `SupportTicket`, and `StayExtension` records.
- One `Listing` can have many `VisitRequest`, `Shortlist`, and `StayExtension` records.
- One `VisitRequest` can lead to one `MoveIn`.
- One `MoveIn` can have many `SupportTicket` references and many extension attempts over time.

## Code Structure and Organization

### Repository Layout
- `backend/`: Express API, domain logic, persistence, uploads/media services.
- `frontend/`: React app (Vite), routing, pages, API client, role-aware UI.
- `docs/`: TRDs, implementation notes, and design documents.

### Backend (`backend/src`)
- `app.js`, `server.js`: app wiring, middleware, and startup.
- `config/`: infrastructure setup (`db.js`).
- `models/`: Mongoose schemas per domain aggregate.
- `controllers/`: request handlers and workflow/state logic.
- `routes/`: API surface grouped by feature.
- `middleware/`: auth, upload filtering/storage, error handling.
- `services/`: media persistence and retrieval (GridFS-backed).
- `scripts/`: data migration and demo-listing seeding.

### Frontend (`frontend/src`)
- `App.jsx`: route map and protected route composition.
- `context/UserContext.jsx`: authenticated user profile and role hydration.
- `lib/api.js`: Axios client and Clerk token interceptor.
- `pages/`: tenant and admin page modules.
- `components/`: layout and reusable UI primitives.

## Setup and Run

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Clerk project

### Environment Variables

Backend (`backend/.env`):
- `MONGODB_URI`
- `PORT` (optional, defaults to `5000`)
- `FRONTEND_URL` (optional CORS allow origin)
- Clerk server-side env (for `@clerk/express`, typically `CLERK_SECRET_KEY`)

Frontend (`frontend/.env`):
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (optional, defaults to `http://localhost:5000/api`)

### Install and Run

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Optional demo data seed:
```bash
cd backend
npm run seed:demo-listings
```

## Mentionable Implementation Details
- Media uploads are normalized to `/api/media/:id` and served via GridFS streaming.
- Legacy listing images can be migrated by the seed/migration script.
- Listing reservation prevents competing tenants from progressing on reserved listings.
- Move-in submissions require all required document slots and full inventory confirmation.
- `PATCH /api/users/promote` exists for non-production environments to promote an existing user to admin by email.

## API Surface (High-Level)
- `/api/listings`
- `/api/media`
- `/api/shortlist`
- `/api/visits`
- `/api/move-in`
- `/api/support`
- `/api/extensions`
- `/api/users`

## Demo and Evaluator Guide
Use `docs/demo-walkthrough.md` for submission demo steps and evaluator credentials.

