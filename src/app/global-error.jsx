"use client";
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: 40 }}>
        <h1>CampusHub is temporarily unavailable.</h1>
        <p>
          Check your database connection and environment settings, then try
          again.
        </p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
