'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#fafafa' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Application Error</h2>
        <p style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
          {error.message}
        </p>
        {error.stack && (
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {error.stack}
          </pre>
        )}
        <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Try Again
        </button>
      </body>
    </html>
  );
}
