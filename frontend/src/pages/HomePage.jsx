import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

const JOURNEY_STEPS = [
  {
    title: 'Browse with context',
    description: 'Cover imagery, availability state, pricing, and move-in timing appear before a tenant commits to a visit.',
  },
  {
    title: 'Schedule visits cleanly',
    description: 'Shortlist first, request the date, then let admins move the visit through scheduling and decision states.',
  },
  {
    title: 'Complete move-ins with proof',
    description: 'Inventory confirmation and required documents keep onboarding structured instead of being passed around informally.',
  },
  {
    title: 'Handle extensions and support',
    description: 'Post move-in work stays in the same product, with extension approvals and support threads tied back to the stay.',
  },
];

const ADMIN_BENEFITS = [
  'Dedicated dashboard with cross-module totals and direct action links.',
  'Inventory workflow that keeps Draft, Review, and Published states intact.',
  'Listing cover images propagated anywhere tenants or admins reference a listing.',
];

export default function HomePage() {
  const { user } = useUser();
  const primaryLink = user?.role === 'admin' ? '/admin/dashboard' : '/listings';
  const primaryLabel = user?.role === 'admin' ? 'Open admin dashboard' : 'Browse listings';
  const secondaryLink = user?.role === 'tenant' ? '/shortlist' : '/sign-up';
  const secondaryLabel = user?.role === 'tenant' ? 'View shortlist' : 'Create account';

  return (
    <div className="home-shell">
      <section className="hero-shell reveal-up">
        <div className="hero-grid">
          <div className="hero-panel">
            <p className="section-eyebrow">Rental operations without spreadsheet drift</p>
            <h1 className="text-5xl font-bold">Tenantly keeps the browse to move-in journey visible, structured, and easier to run.</h1>
            <p className="hero-copy">
              Give tenants a clearer listing experience with image-rich browsing while giving admins one route to monitor listings, visits, move-ins, extensions, and support.
            </p>

            <div className="button-row">
              <SignedOut>
                <>
                  <Link to="/sign-up" className="btn btn-primary">Create account</Link>
                  <Link to="/listings" className="btn btn-secondary">Browse listings</Link>
                </>
              </SignedOut>

              <SignedIn>
                <>
                  <Link to={primaryLink} className="btn btn-primary">{primaryLabel}</Link>
                  <Link to={secondaryLink} className="btn btn-secondary">{secondaryLabel}</Link>
                </>
              </SignedIn>
            </div>

            <div className="hero-highlights">
              <div className="hero-stat">
                <span>5 connected workflows</span>
                <strong>Listings, visits, move-ins, extensions, support</strong>
              </div>
              <div className="hero-stat">
                <span>Image-aware listing surface</span>
                <strong>Cover image follows the listing everywhere it appears</strong>
              </div>
            </div>
          </div>

          <div className="hero-ambient surface-card">
            <div className="ambient-stack">
              <div className="ambient-card ambient-card--primary">
                <p className="section-eyebrow">Admin clarity</p>
                <h2 className="text-2xl font-bold">One dashboard for current workload</h2>
                <p>See availability, scheduled visits, completed move-ins, pending extensions, and unresolved tickets at a glance.</p>
              </div>

              <div className="ambient-card ambient-card--accent">
                <p className="section-eyebrow">Tenant clarity</p>
                <h3 className="text-xl font-semibold">Listings now lead with imagery</h3>
                <p>Cards, detail views, shortlist entries, and post-visit flows all keep the same listing identity visible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section reveal-up">
        <div className="section-heading">
          <p className="section-eyebrow">How the product flows</p>
          <h2 className="text-3xl font-bold">A single product journey instead of disconnected admin and tenant screens.</h2>
        </div>

        <div className="process-grid">
          {JOURNEY_STEPS.map((step, index) => (
            <article key={step.title} className="marketing-card surface-card">
              <span className="process-index">0{index + 1}</span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="muted">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section reveal-up">
        <div className="marketing-grid">
          <article className="marketing-card surface-card">
            <p className="section-eyebrow">For tenants</p>
            <h3 className="text-2xl font-bold">Understand the listing before you request the visit.</h3>
            <p className="muted">Published listings present cover media, pricing, move-in timing, amenity context, and shortlist-first visit actions without making the flow ambiguous.</p>
          </article>

          <article className="marketing-card surface-card">
            <p className="section-eyebrow">For admins</p>
            <h3 className="text-2xl font-bold">Run the operation from one place.</h3>
            <div className="feature-list">
              {ADMIN_BENEFITS.map((benefit) => <p key={benefit}>{benefit}</p>)}
            </div>
          </article>
        </div>
      </section>

      <section className="cta-panel surface-card reveal-up">
        <div>
          <p className="section-eyebrow">Ready to continue</p>
          <h2 className="text-3xl font-bold">
            {user ? `Welcome back, ${user.name || user.email}.` : 'Start with listings, then let the workflow carry the rest.'}
          </h2>
          <p className="muted">Role-aware navigation keeps the right next step visible whether you are managing stock or planning a move.</p>
        </div>

        <div className="button-row">
          <SignedOut>
            <>
              <Link to="/sign-in" className="btn btn-secondary">Sign in</Link>
              <Link to="/sign-up" className="btn btn-primary">Sign up</Link>
            </>
          </SignedOut>

          <SignedIn>
            <>
              <Link to={primaryLink} className="btn btn-primary">{primaryLabel}</Link>
              {user?.role === 'admin' ? <Link to="/admin/listings" className="btn btn-secondary">Manage listings</Link> : <Link to="/visits" className="btn btn-secondary">My visits</Link>}
            </>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}
