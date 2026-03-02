import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useUser } from '../context/UserContext.jsx';

export default function HomePage() {
  const { user } = useUser();

  return (
    <div className="text-center mt-16 text-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Tenantly</h1>
      <p className="text-gray-500 mb-8">Rental Listings & Move-in Platform</p>

      <SignedOut>
        <div className="flex gap-4 justify-center">
          <Link to="/sign-in" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Sign In</Link>
          <Link to="/sign-up" className="border border-blue-600 text-blue-400 px-6 py-2 rounded hover:bg-blue-950">Sign Up</Link>
        </div>
      </SignedOut>

      <SignedIn>
        {user && (
          <div className="space-y-4">
            <p className="text-lg">Hello, <span className="font-semibold">{user.name || user.email}</span>!</p>
            <p className="text-sm text-gray-500">Role: <span className="font-medium">{user.role}</span></p>
            <div className="flex gap-4 justify-center mt-6">
              <Link to="/listings" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Browse Listings</Link>
              {user.role === 'admin' && (
                <Link to="/admin/listings" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Admin Dashboard</Link>
              )}
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
