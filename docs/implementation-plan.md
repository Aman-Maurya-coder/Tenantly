# Implementation Plan: Booking Workflow Overhaul

Refactor the tenant booking journey so listings funnel into shortlist first, visit decisions move to the tenant side, move-in becomes a single tenant submission, inventory is defined on the listing itself, expired/reserved listings are hidden or disabled correctly, tenant support visibility stays private while admins retain full ticket visibility, and the frontend gets a coherent visual pass. The safest implementation order is backend domain/state changes first, then frontend workflow rewiring, then UI polish and regression verification.

## Steps

1. Phase 1 — Rework listing and visit domain rules.
2. Update `j:\cohort2026\buildathon\backend\src\models\Listing.js` to add inventory template data for each listing and a reservation/interest field that records which tenant currently owns interest in the listing.
3. Update `j:\cohort2026\buildathon\backend\src\controllers\listingController.js` so tenant-facing listing queries exclude expired listings (`moveInDate` before today), continue to restrict unpublished listings, and include reservation state needed to render disabled cards for other tenants. Preserve admin visibility of all listings.
4. Update `j:\cohort2026\buildathon\backend\src\controllers\shortlistController.js` so shortlist responses include enough listing state to show whether an item is already shortlisted, expired, or reserved, and extend comparison responses with the fields needed to request a visit from comparison results.
5. Replace the visit state machine in `j:\cohort2026\buildathon\backend\src\models\VisitRequest.js` and `j:\cohort2026\buildathon\backend\src\controllers\visitController.js` so admin only schedules/cancels and tenant owns the post-schedule actions: mark visited, mark interested, mark not interested. Remove the admin transitions for `Scheduled -> Visited` and `Visited -> Interested/NotInterested`, add tenant endpoints for those transitions, and when a tenant marks `Interested` set the listing reservation owner so other tenants see the listing as disabled on the listings page. This blocks the move-in flow changes.
6. Update `j:\cohort2026\buildathon\backend\src\routes\visitRoutes.js` to expose the new tenant action endpoints and remove obsolete admin-only workflow assumptions.
7. Phase 2 — Simplify move-in and add file upload support. This depends on Phase 1.
8. Update `j:\cohort2026\buildathon\backend\src\models\MoveIn.js` so documents are predefined records (2-3 required document types) with upload metadata (`label`, `storedName`, `originalName`, `mimeType`, `size`, `path`), and remove the admin verification-oriented status machine in favor of a single submission/completed flow.
9. Add `multer` to `j:\cohort2026\buildathon\backend\package.json`, create an upload middleware/helper under `src/middleware/` or `src/config/` for image/PDF acceptance and storage, and ensure only metadata/path is persisted in MongoDB.
10. Refactor `j:\cohort2026\buildathon\backend\src\controllers\moveInController.js` and `j:\cohort2026\buildathon\backend\src\routes\moveInRoutes.js` so the tenant can submit documents, agreement confirmation, and inventory conditions in one request, after which the move-in is immediately completed. Remove admin endpoints for document verification, inventory creation during move-in, and final completion; retain admin read visibility of uploaded files and submitted conditions.
11. Update listing creation/edit flows in `j:\cohort2026\buildathon\backend\src\controllers\listingController.js` and `j:\cohort2026\buildathon\frontend\src\pages\AdminListingsPage.jsx` so inventory checklist items are entered when the listing is created or edited, not during move-in.
12. Phase 3 — Rewire tenant/admin frontend workflow. Phase 1 and 2 backend APIs should land before these pages are wired; several of these steps can proceed in parallel once the contracts are stable.
13. Update `j:\cohort2026\buildathon\frontend\src\pages\ListingsPage.jsx` to render expired listings out of the tenant feed, show reserved/interested listings in a disabled state for other tenants, and surface clearer card-state badges.
14. Update `j:\cohort2026\buildathon\frontend\src\pages\ListingDetailPage.jsx` so tenant actions are shortlist-first: keep or add a strong shortlist CTA, remove the direct request-visit form entirely, and reflect shortlist state after adding with a disabled or selected success state without reload.
15. Update `j:\cohort2026\buildathon\frontend\src\pages\ShortlistPage.jsx` so each shortlisted item offers request-visit, comparison results also offer request-visit actions, and any reserved or expired state is shown clearly. Comparison should remain capped at 3 items.
16. Update `j:\cohort2026\buildathon\frontend\src\pages\MyVisitsPage.jsx` so tenants can mark scheduled visits as visited, then choose interested or not interested, and the initiate move-in action redirects to `j:\cohort2026\buildathon\frontend\src\pages\MyMoveInsPage.jsx` after creation instead of leaving the user on the visits screen.
17. Remove obsolete admin controls from `j:\cohort2026\buildathon\frontend\src\pages\AdminVisitsPage.jsx`, leaving only scheduling and cancellation management plus read-only visibility of tenant-made decisions.
18. Refactor `j:\cohort2026\buildathon\frontend\src\pages\MoveInDetailPage.jsx` into a single-submission experience using file inputs for the predefined document slots, agreement acceptance, and inventory-condition confirmation. Ensure admins can still open the page and view uploaded files and metadata.
19. Phase 4 — Extensions, support, and cross-page consistency. This can run in parallel with late frontend polish once core APIs are stable.
20. Update `j:\cohort2026\buildathon\frontend\src\pages\MyExtensionsPage.jsx` and `j:\cohort2026\buildathon\backend\src\controllers\extensionController.js` so the tenant sees all already-moved-in listings with a clear initiate-extension action, rather than a form centered on selecting from completed move-ins manually. Confirm whether already moved in maps to completed move-ins only; current user decision implies yes unless product scope changes.
21. Keep tenant support visibility private by leaving tenant ticket queries scoped to the signed-in user in `j:\cohort2026\buildathon\backend\src\controllers\supportController.js` and `j:\cohort2026\buildathon\frontend\src\pages\MyTicketsPage.jsx`, while preserving the admin-all-tickets view in `j:\cohort2026\buildathon\frontend\src\pages\AdminTicketsPage.jsx`.
22. Update `j:\cohort2026\buildathon\frontend\src\pages\TicketDetailPage.jsx` and `j:\cohort2026\buildathon\frontend\src\pages\AdminTicketsPage.jsx` only as needed to keep threading, status actions, and role-based ticket access consistent with the private-tenant visibility rule.
23. Phase 5 — Visual polish pass. Do this after workflow rewiring so styling is not redone twice.
24. Apply a cohesive UI refresh across `j:\cohort2026\buildathon\frontend\src\components\Layout.jsx`, `j:\cohort2026\buildathon\frontend\src\App.jsx`, `j:\cohort2026\buildathon\frontend\src\index.css`, and the touched pages: improve typography hierarchy, spacing, surfaces, buttons, badges, empty states, and loading states; make tenant/admin pages feel intentionally related rather than mixed dark/light fragments.
25. Phase 6 — Regression verification.
26. Validate booking flow manually: listing appears, shortlist add reflects instantly, shortlist request visit works, admin schedules, tenant marks visited, tenant marks interested or not interested, interested listing becomes disabled for others, move-in redirects to move-ins, one-shot move-in submits documents/inventory/agreement, admin can view uploads.
27. Validate negative cases manually: expired listing hidden for tenants, unpublished listing still hidden, other tenants cannot request reserved listing, comparison still enforces max 3, invalid file types are rejected, missing required document slots block submission.
28. Run frontend validation with `npm run build` and `npm run lint` in `j:\cohort2026\buildathon\frontend`. If backend test scripts still do not exist, run a backend startup smoke check with `npm install` to add `multer` and `npm start` in `j:\cohort2026\buildathon\backend`, then exercise the changed endpoints manually.

## Relevant Files

- `j:\cohort2026\buildathon\backend\src\models\Listing.js` — extend listing schema with inventory template and reservation/interest ownership state.
- `j:\cohort2026\buildathon\backend\src\models\VisitRequest.js` — replace admin-owned visit completion/decision states with tenant-owned transitions.
- `j:\cohort2026\buildathon\backend\src\models\MoveIn.js` — simplify move-in status/documents structure for one-shot completion.
- `j:\cohort2026\buildathon\backend\src\controllers\listingController.js` — tenant listing visibility, expiry filtering, reservation-disabled rendering data, admin create/edit inventory handling.
- `j:\cohort2026\buildathon\backend\src\controllers\shortlistController.js` — shortlist payload and comparison payload updates.
- `j:\cohort2026\buildathon\backend\src\controllers\visitController.js` — schedule-only admin controls plus tenant visited/interest actions.
- `j:\cohort2026\buildathon\backend\src\controllers\moveInController.js` — single-request submission, file metadata persistence, admin read-only access.
- `j:\cohort2026\buildathon\backend\src\controllers\extensionController.js` — expose already-moved-in listings cleanly for extension initiation.
- `j:\cohort2026\buildathon\backend\src\controllers\supportController.js` — preserve tenant-private ticket queries while keeping admin-all-ticket behavior intact.
- `j:\cohort2026\buildathon\backend\src\routes\visitRoutes.js` — tenant visit action endpoints.
- `j:\cohort2026\buildathon\backend\src\routes\moveInRoutes.js` — multipart upload route shape and removed admin mutation routes.
- `j:\cohort2026\buildathon\backend\src\routes\supportRoutes.js` — retain existing role-based ticket routing unless support API cleanup is needed.
- `j:\cohort2026\buildathon\backend\src\middleware\authMiddleware.js` — reuse existing tenant/admin guards; extend only if new shared endpoints need explicit role branching.
- `j:\cohort2026\buildathon\frontend\src\pages\ListingsPage.jsx` — disabled listing cards and expiry-aware tenant rendering.
- `j:\cohort2026\buildathon\frontend\src\pages\ListingDetailPage.jsx` — shortlist-first interaction and reflected shortlist state.
- `j:\cohort2026\buildathon\frontend\src\pages\ShortlistPage.jsx` — request-visit actions from shortlist items and comparison results.
- `j:\cohort2026\buildathon\frontend\src\pages\MyVisitsPage.jsx` — tenant-owned visited/interest actions and redirect to move-ins.
- `j:\cohort2026\buildathon\frontend\src\pages\AdminVisitsPage.jsx` — remove visited/interest buttons from admin side.
- `j:\cohort2026\buildathon\frontend\src\pages\MoveInDetailPage.jsx` — one-shot multipart upload and inventory/doc/agreement submission UI.
- `j:\cohort2026\buildathon\frontend\src\pages\MyMoveInsPage.jsx` — redirect landing target and completed move-in display.
- `j:\cohort2026\buildathon\frontend\src\pages\AdminListingsPage.jsx` — listing inventory template fields.
- `j:\cohort2026\buildathon\frontend\src\pages\MyExtensionsPage.jsx` — moved-in listing chooser and initiate-extension CTA.
- `j:\cohort2026\buildathon\frontend\src\pages\MyTicketsPage.jsx` — tenant-scoped ticket list.
- `j:\cohort2026\buildathon\frontend\src\pages\TicketDetailPage.jsx` — confirm access/rendering rules after support visibility changes.
- `j:\cohort2026\buildathon\frontend\src\pages\AdminTicketsPage.jsx` — consistency with admin ticket browsing.
- `j:\cohort2026\buildathon\frontend\src\components\Layout.jsx` — navigation consistency and polished shell.
- `j:\cohort2026\buildathon\frontend\src\index.css` — shared visual system for the polish pass.

## Verification

1. Confirm tenant listing queries no longer return expired listings while admin listing management still shows them.
2. Confirm adding to shortlist updates the listing detail action state immediately and prevents duplicate shortlist entries.
3. Confirm request visit is absent from listing detail and present on shortlist items plus comparison results.
4. Confirm only tenants can mark visits as visited/interested/not interested; admin can schedule and manage cancellation only.
5. Confirm a listing marked interested stays visible but disabled for all other tenants and remains reachable for the owning tenant through shortlist and my visits.
6. Confirm initiating move-in from visits lands the user on the move-ins page and the created record is visible there.
7. Confirm predefined document slots accept only images/PDFs via multipart upload, persist file metadata/path in MongoDB, and are viewable from admin pages.
8. Confirm inventory is created on the listing and reused in move-in submission without any admin-side inventory step.
9. Confirm the move-in can be completed in one tenant submission containing documents, agreement acceptance, and inventory conditions.
10. Confirm extension initiation shows already moved-in listings and starts the request flow cleanly.
11. Confirm tenant support pages still show only the signed-in user’s tickets, while admin support pages still show all tickets, and ticket detail access remains role-appropriate.
12. Run `npm run build` and `npm run lint` in the frontend, then smoke-test backend startup and the modified endpoints.

## Decisions

- Direct request-visit from listing detail is removed; shortlist becomes the required entry point.
- Request-visit is added to shortlist cards and shortlist comparison results.
- Expired listings are hidden from tenant listing discovery based on `moveInDate` but remain visible to admins.
- After a tenant marks a visit as interested, other tenants still see the listing in all listings but in a disabled/unavailable state.
- The interested tenant should continue the journey from shortlist or my visits depending on current stage.
- The visit lifecycle becomes admin schedules, tenant marks visited, tenant decides interested or not interested.
- One-shot move-in means the tenant uploads predefined documents, accepts the agreement, and records inventory condition in one go.
- Use `multer` first; store files on the server and persist document metadata/path in MongoDB rather than file bytes.
- Inventory checklist is defined at listing creation/edit time, not generated during move-in.
- Tenant support visibility remains private; admins continue to see all tickets.

## Further Considerations

1. Listing reservation should likely clear automatically if the interested tenant later marks not interested, cancels, or the move-in is abandoned. Recommended: define and implement those release rules during execution so listings do not stay disabled indefinitely.
2. The requirements docs currently describe a different visit and move-in workflow; after implementation, update the TRD documents if they are still used for demo/UAT so the product narrative matches the code.