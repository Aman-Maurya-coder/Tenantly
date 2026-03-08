import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

export default function HomePage() {
  const { user } = useUser();

  return (
    <div className="text-center mt-16">
      <h1 className="text-5xl font-bold mb-4">Welcome to Tenantly</h1>
      <p className="muted mb-8">Rental listings and move-in workflows with accessible, role-based journeys.</p>

      <SignedOut>
        <div className="flex gap-4 justify-center">
          <Link to="/sign-in" className="btn btn-primary">Sign In</Link>
          <Link to="/sign-up" className="btn btn-secondary">Sign Up</Link>
        </div>
      </SignedOut>

      <SignedIn>
        {user && (
          <div className="space-y-4">
            <p className="text-lg">Hello, <span className="font-semibold">{user.name || user.email}</span>!</p>
            <p className="text-sm muted">Role: <span className="font-medium">{user.role}</span></p>
            <div className="flex gap-4 justify-center mt-6">
              <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
              {user.role === 'admin' && (
                <Link to="/admin/listings" className="btn btn-secondary">Admin Dashboard</Link>
              )}
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
