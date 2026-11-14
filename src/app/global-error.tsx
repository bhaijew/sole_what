'use client';

import React from 'react';

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

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
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: '#ef444420', color: '#ef4444', marginBottom: '1.5rem' }}>
            <AlertIcon className="w-12 h-12" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ef4444' }}>Fatal Error</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try reloading the application.
          </p>
          <button
            onClick={() => reset()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <RotateIcon />
            <span>Reload Application</span>
          </button>
          {error?.digest && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>
              Digest ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
