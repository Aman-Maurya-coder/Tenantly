# Rental Listings & Move-in Platform — Requirements Baseline and Traceability

**Version:** v1.0 (Final)  
**Date:** March 2, 2026

## 1) Project Context
Buildathon submission in 6 days.

**Locked Stack**
- Frontend: React (Vercel)
- Backend: Node.js + Express (Render)
- Database: MongoDB Atlas
- Auth: Clerk
- Payments: Stripe

## 2) MVP Scope Baseline
- Tenant: browse listings, view details, request visits, track visit status, shortlist, compare 2–3 properties
- Operations: move-in checklist, support tickets with threaded messages, stay extension request
- Admin: review/publish listings, manage tickets, listing status lifecycle
- Monetization: free tier with usage caps, premium upgrade after caps

## 3) Requirement Taxonomy
- `REQ-PLAT-*` Platform/stack/deployment
- `REQ-INT-*` Integrations
- `REQ-BIZ-*` Business rules/monetization
- `REQ-SUB-*` Subscription lifecycle
- `REQ-NFR-*` Non-functional requirements
- `REQ-FUNC-*` Functional requirements
- `REQ-SUBM-*` Submission requirements

## 4) Requirement Baseline
### Platform
- `REQ-PLAT-001`: Use MERN architecture
- `REQ-PLAT-002`: Frontend hosted on Vercel
- `REQ-PLAT-003`: Backend hosted on Render
- `REQ-PLAT-004`: Database on MongoDB Atlas

### Integrations
- `REQ-INT-001`: Authentication via Clerk
- `REQ-INT-002`: Payments via Stripe Checkout + webhook sync

### Business Rules
- `REQ-BIZ-001`: Free tier allows max 3 listing-detail views per monthly cycle
- `REQ-BIZ-002`: Free tier allows max 3 visit requests per monthly cycle
- `REQ-BIZ-003`: Premium required after either free-tier cap is reached

### Subscription
- `REQ-SUB-001`: Fixed monthly reset model
- `REQ-SUB-002`: Admin manual reset override for support/demo continuity

### Functional
- `REQ-FUNC-001`: Browse/filter listings (location text, budget, move-in date)
- `REQ-FUNC-002`: Property detail page (gallery, amenities, rules, availability)
- `REQ-FUNC-003`: Visit lifecycle (`Requested -> Scheduled -> Visited -> Decision`)
- `REQ-FUNC-004`: Shortlist + compare up to 3 properties
- `REQ-FUNC-005`: Move-in checklist (docs, agreement, inventory)
- `REQ-FUNC-006`: Support tickets with threaded messages
- `REQ-FUNC-007`: Stay extension request flow
- `REQ-FUNC-008`: Listing lifecycle (`Draft -> Review -> Published`)

### Non-functional
- `REQ-NFR-001`: Demo-ready reliability with no broken core flows
- `REQ-NFR-002`: Server-side entitlement enforcement for premium gating
- `REQ-NFR-003`: Basic logs for auth, payments, and workflow transitions

### Submission
- `REQ-SUBM-001`: Live hosted production link
- `REQ-SUBM-002`: Public GitHub repository
- `REQ-SUBM-003`: Proper README (overview, features, setup, deployment link)
- `REQ-SUBM-004`: Recorded fallback demo

## 5) Acceptance Criteria (Traceability Starters)
- `AC-REQ-BIZ-001-01`: 4th listing-detail view as free user triggers upgrade gate
- `AC-REQ-BIZ-002-01`: 4th visit request as free user triggers upgrade gate
- `AC-REQ-INT-002-01`: Successful Stripe payment updates plan to premium
- `AC-REQ-SUB-001-01`: Counters reset at monthly boundary
- `AC-REQ-NFR-001-01`: End-to-end demo path completes without blockers
- `AC-REQ-SUBM-001-01`: Public live URL opens without local setup
