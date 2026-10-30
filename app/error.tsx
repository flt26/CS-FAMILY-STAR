'use client';

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="void">
      <p className="dot" aria-hidden="true">
        ERR
      </p>
      <h1 className="cond">The printer jammed</h1>
      <p>
        Something broke while printing this page. It’s on us, not you.{' '}
        <span className="void__ar" lang="ar" dir="rtl">
          حصلت مشكلة، جرب تاني
        </span>
      </p>
      <button className="key key--chalk" type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
