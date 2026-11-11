"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="shell page-space empty-state">
      <h1>We couldn’t load this page.</h1>
      <p>Please check that the database is running, then try again.</p>
      <button className="button mt-5" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
