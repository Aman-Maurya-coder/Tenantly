# TRD-01 — Product Requirements & Functional Specification

## 1) Problem Statement
Renters currently use fragmented tools for discovery, visits, and move-in operations. This platform unifies those workflows.

## 2) Buildathon Goals (6 Days)
- Deliver one complete Tenant + Admin flow
- Demonstrate structured workflows and clear status transitions
- Include premium monetization with Stripe

## 3) Personas
- `Tenant`
- `Admin` (includes moderation + support responsibilities in MVP)

## 4) In Scope (MVP)
### Tenant
- Browse listings with filters
- View property details
- Request visits
- Track visit status
- Shortlist properties
- Compare up to 3 properties
- Use move-in checklist
- Create support ticket and reply in thread
- Request stay extension

### Admin
- Review and publish listings
- Manage support tickets
- Change listing status (`Draft -> Review -> Published`)

### Monetization
- Free tier: 3 listing-detail views + 3 visit requests per month
- Premium: unlocks continued usage beyond free caps

## 5) Out of Scope
- Native mobile apps
- Complex recommendation engine
- Coupons, prorations, multi-plan billing
- Multi-currency and regional tax logic

## 6) Core User Flows
1. Tenant signs in -> searches listing -> opens details -> requests visit -> tracks status
2. Tenant shortlists and compares 2–3 properties
3. Admin reviews listing and publishes
4. Tenant completes move-in checklist and can raise support ticket
5. Tenant reaches cap -> upgrade prompt -> Stripe checkout -> premium access

## 7) Functional Requirements
- `REQ-FUNC-001` to `REQ-FUNC-008` are all **Must** for MVP
- Comparison supports max 3 properties only
- Ticket thread supports text messages with timestamps

## 8) Success Metrics
- Demo completed in <= 5 minutes
- No broken core route/workflow
- Premium upgrade flow demonstrated (live or fallback recording)
