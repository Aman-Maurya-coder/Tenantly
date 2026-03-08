import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import ListingsPage from './pages/ListingsPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import MyVisitsPage from './pages/MyVisitsPage.jsx';
import ShortlistPage from './pages/ShortlistPage.jsx';
import MyMoveInsPage from './pages/MyMoveInsPage.jsx';
import MoveInDetailPage from './pages/MoveInDetailPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import MyExtensionsPage from './pages/MyExtensionsPage.jsx';
import AdminListingsPage from './pages/AdminListingsPage.jsx';
import AdminVisitsPage from './pages/AdminVisitsPage.jsx';
import AdminMoveInsPage from './pages/AdminMoveInsPage.jsx';
import AdminTicketsPage from './pages/AdminTicketsPage.jsx';
import AdminExtensionsPage from './pages/AdminExtensionsPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';

function Protected({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="sign-in/*" element={<SignInPage />} />
        <Route path="sign-up/*" element={<SignUpPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />

        {/* Tenant - protected */}
        <Route path="visits" element={<Protected><MyVisitsPage /></Protected>} />
        <Route path="shortlist" element={<Protected><ShortlistPage /></Protected>} />
        <Route path="move-ins" element={<Protected><MyMoveInsPage /></Protected>} />
        <Route path="move-in/:id" element={<Protected><MoveInDetailPage /></Protected>} />
        <Route path="tickets" element={<Protected><MyTicketsPage /></Protected>} />
        <Route path="ticket/:id" element={<Protected><TicketDetailPage /></Protected>} />
        <Route path="extensions" element={<Protected><MyExtensionsPage /></Protected>} />

        {/* Admin - protected */}
        <Route path="admin/dashboard" element={<Protected><AdminDashboardPage /></Protected>} />
        <Route path="admin/listings" element={<Protected><AdminListingsPage /></Protected>} />
        <Route path="admin/visits" element={<Protected><AdminVisitsPage /></Protected>} />
        <Route path="admin/move-ins" element={<Protected><AdminMoveInsPage /></Protected>} />
        <Route path="admin/tickets" element={<Protected><AdminTicketsPage /></Protected>} />
        <Route path="admin/extensions" element={<Protected><AdminExtensionsPage /></Protected>} />
      </Route>
    </Routes>
  );
}

export default App;
