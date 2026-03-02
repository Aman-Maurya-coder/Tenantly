import { Link, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

export default function Layout() {
  const { user, loading } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-100">
      <nav className="bg-zinc-900 border-b border-zinc-800 shadow px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">Tenantly</Link>

        <div className="flex items-center gap-4 text-sm">
          <SignedOut>
            <Link to="/sign-in" className="text-gray-600 hover:text-blue-600">Sign In</Link>
            <Link to="/sign-up" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Sign Up</Link>
          </SignedOut>

          <SignedIn>
            {!loading && user && (
              <>
                <Link to="/listings" className="text-gray-600 hover:text-blue-600">Listings</Link>
                {user.role === 'tenant' && (
                  <>
                    <Link to="/visits" className="text-gray-600 hover:text-blue-600">My Visits</Link>
                    <Link to="/shortlist" className="text-gray-600 hover:text-blue-600">Shortlist</Link>
                    <Link to="/move-ins" className="text-gray-600 hover:text-blue-600">Move-Ins</Link>
                    <Link to="/tickets" className="text-gray-600 hover:text-blue-600">Support</Link>
                    <Link to="/extensions" className="text-gray-600 hover:text-blue-600">Extensions</Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/listings" className="text-gray-600 hover:text-blue-600">Manage Listings</Link>
                    <Link to="/admin/visits" className="text-gray-600 hover:text-blue-600">Visits</Link>
                    <Link to="/admin/move-ins" className="text-gray-600 hover:text-blue-600">Move-Ins</Link>
                    <Link to="/admin/tickets" className="text-gray-600 hover:text-blue-600">Tickets</Link>
                    <Link to="/admin/extensions" className="text-gray-600 hover:text-blue-600">Extensions</Link>
                  </>
                )}
                <span className="text-xs bg-zinc-800 text-zinc-200 px-2 py-1 rounded">{user.role}</span>
                <UserButton />
              </>
            )}
          </SignedIn>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
