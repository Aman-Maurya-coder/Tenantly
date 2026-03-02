# TRD-03 — Integrations & Business Rules

## 1) Clerk Integration (`REQ-INT-001`)
- Clerk handles sign-up/sign-in/session lifecycle
- Backend validates user identity on protected routes
- Roles determine tenant/admin capabilities

## 2) Stripe Integration (`REQ-INT-002`)
- Stripe Checkout used for premium purchase
- Stripe webhooks update subscription status and entitlements
- Payment state source-of-truth comes from webhook-confirmed events

## 3) Premium Plan Rules
- `REQ-BIZ-001`: Free users can view at most 3 listing-detail pages/month
- `REQ-BIZ-002`: Free users can submit at most 3 visit requests/month
- `REQ-BIZ-003`: After cap, free user is paywalled and must upgrade

## 4) Reset Model Decision
- Primary: fixed monthly reset (`REQ-SUB-001`)
- Fallback: admin manual reset (`REQ-SUB-002`) for support/demo continuity
- Deferred: rolling 30-day model (post-buildathon)

## 5) Subscription States
- `free`
- `premium_active`
- `premium_past_due`
- `premium_canceled`

## 6) Failure Handling
- If Stripe fails temporarily, show billing unavailable message and preserve non-billing app functionality
- Admin can grant temporary premium for demo continuity if webhook delays occur
- Webhook reprocessing must not duplicate entitlement changes
