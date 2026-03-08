# Feature Plan: Listing Images, Admin Dashboard, and Landing Page Redesign

Add multi-image listing support end-to-end, surface the listing cover image anywhere listing data is shown, introduce a dedicated admin dashboard route with cross-module summary metrics, and redesign the landing page into a richer marketing-style experience that still respects the existing Tenantly design system. The recommended approach is to extend the existing listing CRUD flow with multipart image upload and image metadata on the Listing model, add lightweight admin stats endpoints per domain plus one dashboard page on the frontend, and keep the landing-page redesign inside the current React/Tailwind/CSS-token stack rather than introducing a new UI framework.

## Implementation Steps

1. **Backend listing media foundation**: Extend the Listing schema in `backend/src/models/Listing.js` with an images array suitable for multiple uploads where index 0 is the cover image, keeping stored path, original name, mime type, size, and alt text/caption optionality minimal for v1. Update listing create/update normalization in `backend/src/controllers/listingController.js` so image metadata is preserved and returned consistently.

2. **Backend upload flow for listings**: Add a dedicated listing upload middleware alongside the existing move-in uploader in `backend/src/middleware/uploadMiddleware.js`, using a separate `uploads/listings` directory, image-only validation, sane file-count/file-size limits, and filename sanitization. Update `backend/src/routes/listingRoutes.js` to accept multipart form data for create/update or to add focused image management endpoints if that produces a cleaner admin flow. Reuse the existing static `/uploads` serving already present in `backend/src/app.js`.

3. **Admin listing form changes**: Update `frontend/src/pages/AdminListingsPage.jsx` to support selecting multiple images during create/edit, previewing the current cover plus gallery thumbnails, and preserving the existing Draft/Review/Published workflow. The first uploaded image should be treated as the cover by default. Keep create/edit in the current page unless implementation shows a split form component is needed.

4. **Propagate listing cover images everywhere listings are visible**: Update browse/detail and linked workflow surfaces so listing cover imagery appears consistently wherever a listing is shown to admins or tenants. Minimum frontend targets are:
   - `frontend/src/pages/ListingsPage.jsx`
   - `frontend/src/pages/ListingDetailPage.jsx`
   - `frontend/src/pages/ShortlistPage.jsx`
   - `frontend/src/pages/MyVisitsPage.jsx`
   - `frontend/src/pages/AdminVisitsPage.jsx`
   - `frontend/src/pages/MyMoveInsPage.jsx`
   - `frontend/src/pages/AdminMoveInsPage.jsx`
   - `frontend/src/pages/MyExtensionsPage.jsx`
   - `frontend/src/pages/AdminExtensionsPage.jsx`
   
   For detail screens that already focus on one listing, support a gallery/hero treatment; for list cards, render only the cover image to avoid visual noise.

5. **Ensure backend populations include image fields**: Audit backend populate/select usage so listing image metadata is returned on visit, move-in, shortlist, extension, and ticket related responses where listing objects are embedded. Primary files are:
   - `backend/src/controllers/moveInController.js`
   - `backend/src/controllers/visitController.js`
   - `backend/src/controllers/extensionController.js`
   - `backend/src/controllers/supportController.js`
   - Shortlist-related controllers/routes if they currently select only title/location/budget

6. **Admin metrics endpoints**: Add summary endpoints for listings, visits, move-ins, and extensions, modeled after the existing ticket stats pattern in `backend/src/controllers/supportController.js`. Recommended metrics are:
   - Listings by status plus reserved/available totals
   - Visits by workflow state
   - Move-ins by initiated/completed
   - Extensions by pending/approved/rejected/cancelled
   
   Reuse the ticket stats endpoint as-is and normalize response shapes so the dashboard can render cards consistently.

7. **Dedicated admin dashboard page and routing**: Create a new dashboard page in the frontend, add a route such as `/admin/dashboard` in `frontend/src/App.jsx`, and update `frontend/src/components/Layout.jsx` plus `frontend/src/pages/HomePage.jsx` so admin navigation points to the new dashboard instead of treating Manage Listings as the dashboard. The dashboard should aggregate all five metric groups, show top-level cards, and link users into the existing admin management pages.

8. **Landing page redesign**: Rebuild `frontend/src/pages/HomePage.jsx` into a substantial marketing-style landing page with a strong hero, product explanation sections, feature/process sections for browse → visit → move-in → extension/support, admin benefits, calls to action, and purposeful motion. Use the existing CSS token system in `frontend/src/index.css` and rules from `docs/design-system.md`, but extend tokens/classes as needed for richer backgrounds, layered sections, reveal animations, and responsive image/media blocks.

9. **Shared visual primitives for images/dashboard cards if needed**: If duplication becomes high while implementing steps 3, 4, 7, and 8, extract small reusable UI pieces such as listing image component(s), stat card(s), or section wrappers under `frontend/src/components/`. Keep this optional and only do it when it materially reduces repetition.

10. **Regression and polish pass**: Verify empty states, missing-image fallbacks, reserved listing behavior, reduced-motion handling, keyboard focus, and mobile layouts across the new dashboard and landing page. Ensure admin-only functionality remains protected and existing tenant flows still work when listings have no images.

## Relevant Files

### Backend
- `backend/src/models/Listing.js` — add persistent listing image metadata and keep status/inventory behavior intact
- `backend/src/controllers/listingController.js` — integrate image handling into listing create/update/read responses
- `backend/src/routes/listingRoutes.js` — wire admin upload/image management route(s)
- `backend/src/middleware/uploadMiddleware.js` — add listing image uploader beside move-in document uploader
- `backend/src/app.js` — already serves /uploads statically; verify resulting listing URLs align with frontend usage
- `backend/src/controllers/visitController.js` — include listing image fields in populated listing payloads and add visit stats endpoint
- `backend/src/controllers/moveInController.js` — include listing image fields in populated listing payloads and add move-in stats endpoint
- `backend/src/controllers/extensionController.js` — include listing image fields in populated listing payloads and add extension stats endpoint
- `backend/src/controllers/supportController.js` — keep ticket stats as dashboard input and include listing image fields where related listings are populated

### Frontend - Admin Pages
- `frontend/src/pages/AdminListingsPage.jsx` — add multi-image upload, previews, and cover/gallery rendering in admin listing management
- `frontend/src/pages/AdminVisitsPage.jsx` — show listing cover image for admin visit cards
- `frontend/src/pages/AdminMoveInsPage.jsx` — show listing cover image for admin move-in cards
- `frontend/src/pages/AdminExtensionsPage.jsx` — show listing cover image for admin extension entries
- `frontend/src/pages/AdminTicketsPage.jsx` — likely minor dashboard-link or shared stat-card alignment updates

### Frontend - Tenant Pages
- `frontend/src/pages/ListingsPage.jsx` — add cover image to public/tenant listing cards
- `frontend/src/pages/ListingDetailPage.jsx` — add listing gallery/hero and image fallback handling
- `frontend/src/pages/ShortlistPage.jsx` — add cover image to shortlisted listing entries and optionally compare context
- `frontend/src/pages/MyVisitsPage.jsx` — show listing cover image for tenant visit cards
- `frontend/src/pages/MyMoveInsPage.jsx` — show listing cover image for tenant move-in cards
- `frontend/src/pages/MyExtensionsPage.jsx` — show listing cover image for eligible move-ins and extension entries

### Frontend - Core/Layout
- `frontend/src/pages/HomePage.jsx` — full landing-page redesign
- `frontend/src/components/Layout.jsx` — add dedicated admin dashboard nav item and preserve role-based navigation
- `frontend/src/App.jsx` — add dedicated admin dashboard route
- `frontend/src/index.css` — add landing/dashboard image/layout/animation tokens and reusable classes while respecting reduced motion

## Verification Checklist

1. **Backend verification**: Create and update a listing with multiple images via the admin flow, then confirm uploaded files are reachable under `/uploads` and listing payloads return image metadata in all relevant endpoints.

2. **Listing visibility verification**: Confirm cover images render on browse listings, listing detail, shortlist, visit cards, move-in cards, extension cards, and admin listing/visit/move-in/extension views; confirm graceful fallback when a listing has no images.

3. **Dashboard verification**: Validate all admin metric cards against seeded data or database counts for listings, visits, move-ins, tickets, and extensions; confirm nav links route correctly to the new dashboard and existing admin pages.

4. **Landing page verification**: Test desktop and mobile layouts, reduced-motion behavior, CTA navigation, animation smoothness, and accessibility basics such as focus visibility, semantic headings, and readable contrast.

5. **Regression verification**: Run the repo's available frontend/backend lint or test commands if present, and perform manual smoke tests for shortlist, visit request creation, move-in initiation/submission, extension request flows, and support ticket flows after image-field changes.

## Design Decisions

- **Multiple images per listing**: First image is used as the cover image across all list surfaces
- **Dedicated admin dashboard**: New page at `/admin/dashboard` instead of overloading existing admin listings page
- **Complete metrics coverage**: Include all five admin metric areas in v1: listings, move-ins, tickets, visits, and extensions
- **Landing page approach**: Substantial redesign within the current design system and frontend stack
- **In scope**: Image upload/display, dashboard metrics/UI, landing-page redesign, and route/navigation updates
- **Out of scope** (unless discovered as necessary): Drag-and-drop image ordering, image cropping, CDN/off-box storage, tenant-uploaded listing media, full design-system rewrite

## Further Considerations

1. **Image management depth**: Recommended v1 behavior is add/replace/delete images during admin edit, without drag-and-drop reordering beyond upload order. This satisfies the requested feature while keeping complexity controlled.

2. **Landing-page imagery**: If no real brand/property assets exist in the repo, recommended approach is to use tasteful local illustration/shape-based sections or royalty-safe placeholder imagery bundled in frontend assets rather than hotlinked remote images.

3. **Dashboard composition**: Recommended layout is a top summary band with total counts and health signals, followed by one compact section per domain with direct links into the existing management pages.

---

**Plan Date**: March 8, 2026  
**Status**: Ready for implementation
