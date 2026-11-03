import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-wrap" id="main">
      <div className="card login-card">
        <h1>Page not found</h1>
        <p className="muted">That page doesn&rsquo;t exist, or the record was removed.</p>
        <Link href="/" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
