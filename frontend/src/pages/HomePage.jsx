import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Search State
  const [searchParams, setSearchParams] = useState({
    location: '',
    budget: '',
    date: ''
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchParams.location) query.append('location', searchParams.location);
    if (searchParams.budget) query.append('budget', searchParams.budget);
    navigate(`/listings?${query.toString()}`);
  };

  return (
    <div className="home-shell space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="hero-shell reveal-up pt-12">
        <div className="grid md:grid-cols-2 gap-8 items-center page-container">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">Find Your Next Rental Home Without the Hassle</h1>
            <p className="text-xl text-muted">
              Browse verified listings, schedule visits, compare properties, and manage your move‑in — all in one place.
            </p>

            <form onSubmit={handleSearch} className="surface-card p-4 rounded-lg shadow-soft space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Koramangala" 
                    className="input w-full"
                    value={searchParams.location}
                    onChange={e => setSearchParams({...searchParams, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Budget Range</label>
                  <select 
                    className="select w-full"
                    value={searchParams.budget}
                    onChange={e => setSearchParams({...searchParams, budget: e.target.value})}
                  >
                    <option value="">Any</option>
                    <option value="10000">Up to ₹10k</option>
                    <option value="20000">Up to ₹20k</option>
                    <option value="50000">Up to ₹50k</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Move‑in Date</label>
                  <input 
                    type="date" 
                    className="input w-full" 
                    value={searchParams.date}
                    onChange={e => setSearchParams({...searchParams, date: e.target.value})}
                  />
                </div>
              </div>
              <button className="btn btn-primary w-full md:w-auto" type="submit">Search</button>
            </form>

            <div className="flex gap-4">
              <Link to="/listings" className="btn btn-primary">Browse Properties</Link>
              <Link to="/admin/listings" className="btn btn-secondary">List Your Property</Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img src="/illustrations/House searching-cuate.svg" alt="House Hunting" className="w-full max-w-md mx-auto" />
          </div>
        </div>
      </section>

      {/* 2. How It Works */}
      <section className="bg-white py-16">
        <div className="page-container space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted max-w-2xl mx-auto">Your journey to a new rental home, simplified into four easy steps.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center relative">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto">1</div>
              <h3 className="text-xl font-bold">Discover</h3>
              <p className="text-sm text-gray-600">Browse rental homes using filters like location, budget and move‑in date.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto">2</div>
              <h3 className="text-xl font-bold">Schedule Visit</h3>
              <p className="text-sm text-gray-600">Request property visits and track their status in real time.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto">3</div>
              <h3 className="text-xl font-bold">Compare Options</h3>
              <p className="text-sm text-gray-600">Shortlist and compare multiple properties side‑by‑side before deciding.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto">4</div>
              <h3 className="text-xl font-bold">Move In</h3>
              <p className="text-sm text-gray-600">Upload documents, confirm agreements, and complete inventory digitally.</p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
             <img src="/illustrations/Moving-rafiki.svg" alt="Moving in" className="w-full max-w-md mx-auto" />
          </div>
        </div>
      </section>

      {/* 3. Key Features */}
      <section className="page-container py-16 space-y-12">
        <h2 className="text-3xl font-bold text-center">Key Features</h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-blue-100 rounded flex items-center justify-center">🔍</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Smart Property Discovery</h3>
                <p className="text-muted">Search listings using location, budget range, amenities and move‑in timeline.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-purple-100 rounded flex items-center justify-center">📅</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Visit Scheduling</h3>
                <p className="text-muted">Track visit status: Requested → Scheduled → Visited → Decision.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-green-100 rounded flex items-center justify-center">⚖️</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Property Comparison</h3>
                <p className="text-muted">Compare multiple homes side‑by‑side to choose the best option.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-yellow-100 rounded flex items-center justify-center">📦</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Move‑in Management</h3>
                <p className="text-muted">Upload documents, confirm agreements, and complete inventory checklists digitally.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 bg-red-100 rounded flex items-center justify-center">🎧</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Support System</h3>
                <p className="text-muted">Raise support tickets and communicate with property managers through threaded messages.</p>
              </div>
            </div>
          </div>
          <div>
            <img src="/illustrations/Contact us-pana.svg" alt="Support and Features" className="w-full" />
          </div>
        </div>
      </section>

      {/* 4. Property Preview Section */}
      <section className="bg-indigo-50 py-16">
        <div className="page-container flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold">Stunning Property Previews</h2>
            <p className="text-lg text-gray-700">Find exactly what you're looking for with our detailed property cards showcasing everything you need to know upfront.</p>
            <ul className="space-y-2 list-disc list-inside ml-4 text-gray-600 font-medium">
              <li>High-quality Images</li>
              <li>Clear Location & Pricing</li>
              <li>Availability Dates</li>
              <li>Listed Amenities</li>
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-sm">
            <div className="bg-white rounded-xl shadow-strong overflow-hidden transform transition hover:scale-105">
              <img src="/lotus-design-n-print-WDUtNbot6Qw-unsplash.jpg" alt="Property Preview" className="w-full h-48 object-cover" />
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-xl">Modern 2BHK Apartment</h3>
                <p className="text-sm text-gray-500">📍 Koramangala, Bangalore</p>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-bold text-lg text-indigo-700">₹28,000<span className="text-sm text-gray-500 font-normal">/month</span></span>
                </div>
                <p className="text-sm font-medium">Available from Aug 1</p>
                <p className="text-sm text-gray-500">Amenities: WiFi • Parking • Furnished</p>
                <button className="btn btn-primary w-full mt-2" type="button">View details</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Use This Platform */}
      <section className="page-container py-16 text-center space-y-12">
        <h2 className="text-3xl font-bold">Why Use This Platform</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 bg-white shadow-soft rounded-lg space-y-3">
            <div className="text-4xl">✅</div>
            <h3 className="font-bold text-lg">Verified Listings</h3>
            <p className="text-sm text-gray-600">All properties are reviewed before publishing.</p>
          </div>
          <div className="p-6 bg-white shadow-soft rounded-lg space-y-3">
            <div className="text-4xl">📱</div>
            <h3 className="font-bold text-lg">Transparent Process</h3>
            <p className="text-sm text-gray-600">Track visit requests and property decisions from one dashboard.</p>
          </div>
          <div className="p-6 bg-white shadow-soft rounded-lg space-y-3">
            <div className="text-4xl">⚡</div>
            <h3 className="font-bold text-lg">All‑in‑One Move‑In</h3>
            <p className="text-sm text-gray-600">Documents, agreements and inventory handled digitally.</p>
          </div>
          <div className="p-6 bg-white shadow-soft rounded-lg space-y-3">
            <div className="text-4xl">🤝</div>
            <h3 className="font-bold text-lg">Tenant Support</h3>
            <p className="text-sm text-gray-600">Dedicated support ticket system for quick issue resolution.</p>
          </div>
        </div>
      </section>

      {/* 6. Call To Action */}
      <section className="py-20 text-center space-y-8 bg-indigo-900 text-white rounded-xl mx-4 lg:mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold">Ready to Find Your Next Home?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/listings" className="btn bg-white text-indigo-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded shadow-md">Browse Available Properties</Link>
          <Link to="/admin/listings" className="btn bg-indigo-700 text-white border border-indigo-500 hover:bg-indigo-600 px-8 py-3 text-lg font-semibold rounded shadow-md">List Your Property</Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t pt-10 mt-16 page-container text-sm text-gray-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-lg">Tenantly</h4>
            <p>Your one stop rental destination.</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/listings" className="hover:underline">Browse Properties</Link></li>
              <li><a href="#" className="hover:underline">How It Works</a></li>
              <li><a href="#" className="hover:underline">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">About</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
              <li><a href="#" className="hover:underline">Support</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 text-center text-xs">
          &copy; {new Date().getFullYear()} Tenantly. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
