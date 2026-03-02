# Rental Listings & Move-in Platform (Buildathon MVP)

## Project Overview
A rental housing platform that unifies property discovery, visit scheduling, and move-in workflows with admin moderation and premium monetization.

## Features Implemented
### Tenant Side
- Browse listings with filters (location text, budget range, move-in date)
- View property details (gallery, amenities, rules, availability)
- Request property visits
- Track visit status: `Requested -> Scheduled -> Visited -> Decision`
- Shortlist properties
- Compare 2–3 properties side-by-side
- Move-in checklist
- Support ticketing with threaded messages
- Stay extension request

### Admin Side
- Review and publish listings
- Manage support tickets
- Listing status workflow: `Draft -> Review -> Published`

### Premium & Payments
- Free tier: up to 3 listing-detail views/month
- Free tier: up to 3 visit requests/month
- Premium upgrade unlocks continued usage
- Payments integrated via Stripe

## Tech Stack
- Frontend: React + Vercel
- Backend: Node.js + Express + Render
- Database: MongoDB Atlas
- Auth: Clerk
- Payments: Stripe

## Setup Instructions
1. Clone the repository
2. Install dependencies for frontend and backend
3. Configure environment variables for Clerk, Stripe, and MongoDB Atlas
4. Run backend server
5. Run frontend app
6. Seed demo data (optional but recommended)

## Deployment Link
- Live App: `<FRONTEND_URL>`
- API: `<BACKEND_URL>`

## Demo Reliability
- Live demo flow available
- Recorded fallback demo: `<DEMO_VIDEO_URL>`

## Public Repository
- GitHub: `<GITHUB_REPO_URL>`

## Known Limitations
- Single premium plan only
- Rolling 30-day usage windows deferred
- Coupons/prorations not included in MVP
