import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="void">
      <title>Not on the menu · CS Family Star</title>
      <p className="dot" aria-hidden="true">
        404
      </p>
      <h1 className="cond">Not on the menu</h1>
      <p>
        That page isn’t on our menu. The link may be missing a letter.{' '}
        <span className="void__ar" lang="ar" dir="rtl">
          الصفحة دي مش عندنا
        </span>
      </p>
      <Link className="key key--chalk" href="/">
        Back to the menu
      </Link>
    </div>
  );
}
