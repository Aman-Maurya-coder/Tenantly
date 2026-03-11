import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useUser();
  const tenantLinks = [
    { to: '/listings', label: 'Listings' },
    { to: '/shortlist', label: 'Shortlist' },
    { to: '/visits', label: 'My Visits' },
    { to: '/move-ins', label: 'Move-Ins' },
    { to: '/extensions', label: 'Extensions' },
    { to: '/tickets', label: 'Support' },
    { to: '/contact-us', label: 'Contact Us' },
  ];
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/listings', label: 'Manage Listings' },
    { to: '/admin/visits', label: 'Visits' },
    { to: '/admin/move-ins', label: 'Move-Ins' },
    { to: '/admin/extensions', label: 'Extensions' },
    { to: '/admin/tickets', label: 'Tickets' },
  ];
  const roleLinks = !loading && user
    ? (user.role === 'admin' ? adminLinks : tenantLinks)
    : [];
  const navLinkClass = ({ isActive }) => `nav-link text-sm ${isActive ? 'font-semibold underline' : 'muted'}`;
  const mobileNavLinkClass = ({ isActive }) => `nav-link nav-link-mobile text-sm ${isActive ? 'font-semibold underline' : 'muted'}`;
  const dashboardLink = !loading && user
    ? (user.role === 'admin' ? '/' : '/listings')
    : '/';
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only p-2 absolute left-2 top-2 bg-white rounded">
        Skip to content
      </a>
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="page-container nav-shell" aria-label="Main">
          <div className="nav-bar-row">
            <Link to={dashboardLink} className="text-2xl font-bold" onClick={closeMobileMenu}>
              <img src="/logo-without-tagline.png" alt="Tenantly Logo" width={100} height={50} />
            </Link>

            <button
              type="button"
              className="nav-toggle"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            >
              <span className={`nav-toggle-bar ${isMobileMenuOpen ? 'nav-toggle-bar-open-top' : ''}`} />
              <span className={`nav-toggle-bar ${isMobileMenuOpen ? 'nav-toggle-bar-open-middle' : ''}`} />
              <span className={`nav-toggle-bar ${isMobileMenuOpen ? 'nav-toggle-bar-open-bottom' : ''}`} />
            </button>
          </div>

          <div className="nav-desktop-actions">
            <SignedOut>
              <NavLink to="/sign-in" className={navLinkClass}>Sign In</NavLink>
              <Link to="/sign-up" className="btn btn-primary">Sign Up</Link>
            </SignedOut>

            <SignedIn>
              {!loading && user && (
                <>
                  <NavLink to="/" className={navLinkClass}>Home</NavLink>
                  {roleLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} className={navLinkClass}>{link.label}</NavLink>
                  ))}
                  <UserButton />
                </>
              )}
            </SignedIn>
          </div>

          {isMobileMenuOpen && (
            <div id="mobile-navigation" className="nav-mobile-panel">
              <SignedOut>
                <NavLink to="/sign-in" className={mobileNavLinkClass} onClick={closeMobileMenu}>Sign In</NavLink>
                <Link to="/sign-up" className="btn btn-primary nav-mobile-cta" onClick={closeMobileMenu}>Sign Up</Link>
              </SignedOut>

              <SignedIn>
                {!loading && user && (
                  <>
                    <NavLink to="/" className={mobileNavLinkClass} onClick={closeMobileMenu}>Home</NavLink>
                    {roleLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={mobileNavLinkClass}
                        onClick={closeMobileMenu}
                      >
                        {link.label}
                      </NavLink>
                    ))}
                    <div className="nav-mobile-user-row">
                      <span className="font-semibold text-sm">Account</span>
                      <UserButton />
                    </div>
                  </>
                )}
              </SignedIn>
            </div>
          )}
        </nav>
      </header>

      <main id="main-content" className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
