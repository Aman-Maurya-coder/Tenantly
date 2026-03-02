# TRD-05 — Submission Readiness Pack

## 1) Mandatory Submission Checklist
- `REQ-SUBM-001`: Live hosted production link
- `REQ-SUBM-002`: Public GitHub repository
- `REQ-SUBM-003`: Proper README (overview, features, setup, deployment link)
- `REQ-SUBM-004`: Demo-ready app with recorded fallback

## 2) Evidence Placeholders
- Frontend URL (Vercel): `<FRONTEND_URL>`
- Backend URL (Render): `<BACKEND_URL>`
- Public GitHub Repo: `<GITHUB_REPO_URL>`
- Recorded Demo URL: `<DEMO_VIDEO_URL>`

## 3) Judge-Facing Proof Points
- Problem/solution clarity
- End-to-end workflow completeness
- Monetization flow with premium gating
- Stability of hosted deployment
- Documentation quality and setup reproducibility

## 4) Final Risk Register
- Third-party dependency delays (Clerk/Stripe)
  - Mitigation: graceful fallback UX + manual override
- Deployment instability close to deadline
  - Mitigation: deploy by Day 4 and freeze changes
- Scope creep
  - Mitigation: no feature additions after Day 3

## 5) Final Sign-Off Conditions
- All `REQ-SUBM-*` checks pass
- Must-pass QA scenarios completed
- Links validated in incognito/non-dev environment
