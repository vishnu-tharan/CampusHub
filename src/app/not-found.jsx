import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell page-space empty-state">
      <p className="eyebrow">404</p>
      <h1>This page wandered off.</h1>
      <p>There are still plenty of things to discover.</p>
      <Link href="/events" className="button mt-5">
        Back to events
      </Link>
    </div>
  );
}
