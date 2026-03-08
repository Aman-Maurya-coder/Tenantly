export default function StatCard({ label, value, hint, accent = 'default' }) {
  return (
    <article className={`metric-card metric-card--${accent}`}>
      <p className="metric-value">{value}</p>
      <p className="metric-label">{label}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </article>
  );
}