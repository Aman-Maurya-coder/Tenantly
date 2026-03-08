import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.jsx';
import api from '../lib/api.js';

const DASHBOARD_SOURCES = [
  {
    key: 'listings',
    endpoint: '/listings/stats',
    href: '/admin/listings',
    title: 'Listings',
    description: 'Inventory publishing, review flow, and live availability.',
  },
  {
    key: 'visits',
    endpoint: '/visits/stats',
    href: '/admin/visits',
    title: 'Visits',
    description: 'Requests, scheduling load, and tenant decisions.',
  },
  {
    key: 'moveIns',
    endpoint: '/move-in/stats',
    href: '/admin/move-ins',
    title: 'Move-Ins',
    description: 'Started versus completed onboarding submissions.',
  },
  {
    key: 'extensions',
    endpoint: '/extensions/stats',
    href: '/admin/extensions',
    title: 'Extensions',
    description: 'Pending workload and extension decision outcomes.',
  },
  {
    key: 'tickets',
    endpoint: '/support/stats',
    href: '/admin/tickets',
    title: 'Support',
    description: 'Open ticket load and first-response health.',
  },
];

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const responses = await Promise.all(
          DASHBOARD_SOURCES.map((source) => api.get(source.endpoint))
        );

        const groups = responses.map((response, index) => ({
          ...DASHBOARD_SOURCES[index],
          stats: response.data.data,
        }));

        setDashboard(groups);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load admin dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const listings = dashboard.find((group) => group.key === 'listings')?.stats;
  const visits = dashboard.find((group) => group.key === 'visits')?.stats;
  const moveIns = dashboard.find((group) => group.key === 'moveIns')?.stats;
  const extensions = dashboard.find((group) => group.key === 'extensions')?.stats;
  const tickets = dashboard.find((group) => group.key === 'tickets')?.stats;

  const overviewCards = [
    {
      label: 'Available listings',
      value: listings?.available ?? '—',
      hint: 'Published and not reserved',
      accent: 'success',
    },
    {
      label: 'Scheduled visits',
      value: visits?.scheduled ?? '—',
      hint: 'Visits awaiting attendance',
      accent: 'info',
    },
    {
      label: 'Completed move-ins',
      value: moveIns?.completed ?? '—',
      hint: 'Tenant submissions finished',
      accent: 'default',
    },
    {
      label: 'Pending extensions',
      value: extensions?.pending ?? '—',
      hint: 'Requests needing admin review',
      accent: 'warning',
    },
    {
      label: 'Unresolved tickets',
      value: tickets?.unresolved ?? '—',
      hint: 'Open, in progress, or reopened',
      accent: 'danger',
    },
  ];

  if (loading) {
    return <p className="muted">Loading dashboard...</p>;
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero surface-card">
        <div className="dashboard-hero-copy">
          <p className="section-eyebrow">Operations hub</p>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="dashboard-lead">
            Track inventory, visits, move-ins, extensions, and support from one route instead of treating listings as the default dashboard.
          </p>
          <div className="dashboard-actions">
            <Link to="/admin/listings" className="btn btn-primary">Manage listings</Link>
            <Link to="/admin/tickets" className="btn btn-secondary">Review support</Link>
          </div>
        </div>

        <div className="metric-grid metric-grid--overview">
          {overviewCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.hint}
              accent={card.accent}
            />
          ))}
        </div>
      </section>

      {error ? <p style={{ color: 'var(--color-error)' }}>{error}</p> : null}

      <section className="dashboard-section-grid" aria-label="Admin module summaries">
        {dashboard.map((group) => (
          <article key={group.key} className="surface-card dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="section-eyebrow">{group.title}</p>
                <h2 className="text-2xl font-bold">{group.stats.summary?.total ?? 0}</h2>
                <p className="muted">{group.description}</p>
              </div>
              <Link to={group.href} className="btn btn-secondary">Open {group.title}</Link>
            </div>

            <div className="metric-grid">
              {(group.stats.summary?.metrics || []).map((metric) => (
                <StatCard key={metric.key} label={metric.label} value={metric.value} />
              ))}
            </div>

            {group.key === 'tickets' && group.stats.avgFirstResponseMinutes !== null ? (
              <p className="metric-footnote">
                Average first response: {group.stats.avgFirstResponseMinutes} minutes
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}