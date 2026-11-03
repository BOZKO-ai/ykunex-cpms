"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card" role="alert">
      <h1>Something went wrong</h1>
      <p className="muted">The page couldn&rsquo;t be loaded. Your data is safe. Try again, or go back to the dashboard.</p>
      <div className="actions">
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <a className="btn btn-ghost" href="/">
          Dashboard
        </a>
      </div>
    </div>
  );
}
