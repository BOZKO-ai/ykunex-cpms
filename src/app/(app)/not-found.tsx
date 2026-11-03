import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h1>Not found</h1>
      <p className="muted">That record doesn&rsquo;t exist or the link is wrong.</p>
      <Link href="/" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
