# TRD-02 — Technical Architecture & Deployment Design

## 1) Architecture Summary
- Frontend: React SPA on Vercel
- Backend: Express REST API on Render
- Database: MongoDB Atlas (Mongoose models)
- Auth: Clerk
- Payments: Stripe Checkout + Webhooks

## 2) High-Level Modules
- `AuthModule`
- `ListingModule`
- `VisitModule`
- `ShortlistModule`
- `ComparisonModule`
- `MoveInModule`
- `SupportModule`
- `SubscriptionModule`
- `AdminModule`

## 3) Core Data Entities
- `User`
- `Listing`
- `VisitRequest`
- `Shortlist`
- `ComparisonSnapshot`
- `MoveInChecklist`
- `MoveInTask`
- `SupportTicket`
- `SupportMessage`
- `StayExtensionRequest`
- `Subscription`
- `UsageCounter`

## 4) Deployment Topology
- Vercel serves frontend
- Render serves backend API
- Atlas serves persistent data
- Clerk + Stripe as managed external dependencies

## 5) Environment & Secrets
- Separate dev/prod environment variables
- Secrets stored only in platform env settings
- No card data stored in project database

## 6) Reliability Principles
- Premium gating is server-side only
- Webhook processing must be idempotent
- Graceful degraded UX for upstream outages (Clerk/Stripe)
