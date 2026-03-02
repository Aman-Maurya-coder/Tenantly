# TRD-04 — QA, UAT, and Demo Reliability Plan

## 1) QA Strategy
Prioritize full happy-path completion across tenant, admin, and premium flows before visual polish.

## 2) Must-Pass Test Scenarios
1. Tenant can browse and filter published listings
2. Tenant can open listing details and usage counter increments
3. Tenant can request visits and usage counter increments
4. Tenant can track visit status (`Requested -> Scheduled -> Visited -> Decision`)
5. Tenant can shortlist and compare up to 3 properties
6. Admin can transition listing status (`Draft -> Review -> Published`)
7. Tenant can create support ticket and exchange threaded messages
8. Tenant can complete move-in checklist steps
9. Free user is gated after cap exceed
10. Stripe upgrade activates premium and removes cap restrictions
11. Live app and repo links are accessible

## 3) UAT Acceptance Gate
All Must scenarios above must pass once on staging-like environment and once on production deployment.

## 4) Demo Plan
- Primary: live demo on hosted production deployment
- Secondary: recorded fallback demo showing same full flow
- Include one seeded free user (near cap) and one seeded premium user

## 5) Exit Criteria
- Zero blocker bugs in core flow
- All required ACs pass
- Demo completed under 5 minutes
