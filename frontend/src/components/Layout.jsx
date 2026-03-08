import { Link, NavLink, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

export default function Layout() {
  const { user, loading } = useUser();
  const navLinkClass = ({ isActive }) => `text-sm ${isActive ? 'font-semibold underline' : 'muted'}`;
  const dashboardLink = !loading && user
    ? (user.role === 'admin' ? '/admin/dashboard' : '/listings')
    : '/';

  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only p-2 absolute left-2 top-2 bg-white rounded">
        Skip to content
      </a>
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="page-container flex flex-wrap items-center justify-between gap-3 py-4" aria-label="Main">
          <Link to={dashboardLink} className="text-2xl font-bold">Tenantly</Link>

          <div className="flex items-center gap-4 text-sm">
            <SignedOut>
              <NavLink to="/sign-in" className={navLinkClass}>Sign In</NavLink>
              <Link to="/sign-up" className="btn btn-primary">Sign Up</Link>
            </SignedOut>

            <SignedIn>
              {!loading && user && (
                <>
                  <NavLink to="/" className={navLinkClass}>Home</NavLink>
                  {user.role === 'tenant' && (
                    <>
                      <NavLink to="/listings" className={navLinkClass}>Listings</NavLink>
                      <NavLink to="/shortlist" className={navLinkClass}>Shortlist</NavLink>
                      <NavLink to="/visits" className={navLinkClass}>My Visits</NavLink>
                      <NavLink to="/move-ins" className={navLinkClass}>Move-Ins</NavLink>
                      <NavLink to="/extensions" className={navLinkClass}>Extensions</NavLink>
                      <NavLink to="/tickets" className={navLinkClass}>Support</NavLink>
                      <NavLink to="/contact-us" className={navLinkClass}>Contact Us</NavLink>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <NavLink to="/admin/dashboard" className={navLinkClass}>Dashboard</NavLink>
                      <NavLink to="/admin/listings" className={navLinkClass}>Manage Listings</NavLink>
                      <NavLink to="/admin/visits" className={navLinkClass}>Visits</NavLink>
                      <NavLink to="/admin/move-ins" className={navLinkClass}>Move-Ins</NavLink>
                      <NavLink to="/admin/extensions" className={navLinkClass}>Extensions</NavLink>
                      <NavLink to="/admin/tickets" className={navLinkClass}>Tickets</NavLink>
                    </>
                  )}
                  {/* <span className="badge badge-info">{user.role}</span> */}
                  <UserButton />
                </>
              )}
            </SignedIn>
          </div>
        </nav>
      </header>

      <main id="main-content" className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
