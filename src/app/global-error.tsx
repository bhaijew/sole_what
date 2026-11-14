'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <div style={{ maxWidth: '480px', width: '90%', padding: '2rem', textAlign: 'center', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ef4444' }}>System Notice</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            An unexpected error occurred.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1.25rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
