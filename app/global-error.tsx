'use client';

// Last resort when the root layout itself fails. It renders its own document
// without the app's stylesheet, so the few styles it needs are inline.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeContent: 'center',
          gap: 16,
          padding: 24,
          background: '#161412',
          color: '#f3efe6',
          font: '16px/1.5 ui-monospace, Menlo, Consolas, monospace',
          textAlign: 'center',
        }}
      >
        <title>The printer jammed · CS Family Star</title>
        <h1 style={{ margin: 0, fontSize: 28, textTransform: 'uppercase' }}>The printer jammed</h1>
        <p style={{ margin: 0 }}>
          Something broke while printing this page. It’s on us, not you.
          <br />
          <span lang="ar" dir="rtl">
            حصلت مشكلة، جرب تاني
          </span>
        </p>
        <button
          type="button"
          onClick={retry}
          style={{
            justifySelf: 'center',
            minHeight: 48,
            padding: '0 20px',
            border: 0,
            background: '#f3efe6',
            color: '#161412',
            font: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
