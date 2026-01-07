export default function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>

      <div className="glass-panel" style={{ padding: '4rem', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          1ummah
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Connect across borders. The open source platform for everyone.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary">
            Get Started
          </button>
          <button className="glass-panel" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
            Learn More
          </button>
        </div>
      </div>

    </div>
  );
}
