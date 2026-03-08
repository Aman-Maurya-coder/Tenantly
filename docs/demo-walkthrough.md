# Demo Walkthrough for Evaluators

## Objective
This guide provides a reliable demo sequence for evaluators, including two seed credentials (tenant + admin), setup steps, and a suggested walkthrough script.

## Seed Credentials (Evaluator Accounts)
Use two emails that you control (recommended: Gmail aliases to the same inbox):

- Tenant account
  - Email: `evaluator.tenant@gmail.com`
  - Password: `tenantpass`
  - Role in app DB: `tenant` (default)
- Admin account
  - Email: `evaluator.admin@gmail.com`
  - Password: `tenantadminpass`
  - Role in app DB: `admin`


## One-Time Setup for the Two Accounts
1. Ensure backend and frontend are running:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`
2. Sign in once with each account from the frontend. This auto-creates user rows in MongoDB (`users` collection).
```

## Optional Data Prep (Recommended)
Seed demo listings and media for a smoother walkthrough:

```bash
cd backend
npm run seed:demo-listings
```

## Suggested Demo Script (10-15 minutes)

### 1. Tenant Journey
1. Sign in as `evaluator.tenant@gmail.com`.
2. Open Listings and apply filters.
3. Open a listing detail and add it to shortlist.
4. Go to shortlist, compare 2 listings, request a visit.
5. Open My Visits and show status progression after admin action (below).

### 2. Admin Journey
1. Sign out and sign in as `evaluator.admin@gmail.com`.
2. Open Admin Visits and schedule the tenant visit.
3. Open Admin Listings and show listing lifecycle controls.
4. Open Admin Tickets and demonstrate ticket status management.
5. Open Admin Move-Ins and Admin Extensions pages to show queue visibility.

### 3. Tenant Follow-up Journey
1. Sign back in as tenant.
2. In My Visits, mark the scheduled visit as visited.
3. Set decision to `Interested`.
4. Initiate move-in and submit required docs + inventory + agreement.
5. Create a support ticket and add a reply.

### 4. Admin Completion
1. Sign in as admin again.
2. Approve submitted move-in.
3. (Optional) Decide stay-extension request.

## What Evaluators Can Verify Quickly
- RBAC: tenant vs admin route and action boundaries.
- Workflow correctness: shortlist -> visit -> decision -> move-in -> extension.
- Status transitions and business rules.
- Media/document upload path and persistence behavior.
- Dashboard/admin operational views.

## Troubleshooting
- If login fails: verify accounts exist in Clerk and email/password auth is enabled.
- If admin pages are inaccessible: re-run role promotion endpoint.
- If listings are empty: run `npm run seed:demo-listings` in `backend`.
- If CORS issues appear: set `FRONTEND_URL` in backend `.env` to your frontend origin.
