import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="void">
      <p className="dot" aria-hidden="true">
        404
      </p>
      <h1 className="cond">Not on the menu</h1>
      <p>
        That ticket doesn’t exist. Maybe the spot closed, or the link lost a letter on the way.{' '}
        <span lang="ar" dir="rtl">
          المكان ده مش عندنا
        </span>
      </p>
      <Link className="key key--chalk" href="/">
        Back to the menu
      </Link>
    </div>
  );
}
