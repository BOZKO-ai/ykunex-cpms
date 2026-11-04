import { PageHeader, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <PageHeader title="Dashboard" subtitle="Loading your workspace..." />
      
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton width="40%" height="0.75rem" style={{ marginBottom: "0.75rem" }} />
            <Skeleton width="80%" height="1.5rem" />
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <Skeleton width="30%" height="1.25rem" style={{ marginBottom: "1.5rem" }} />
          <Skeleton height="200px" />
        </div>
        <div className="card">
          <Skeleton width="30%" height="1.25rem" style={{ marginBottom: "1.5rem" }} />
          <Skeleton height="200px" />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <Skeleton width="40%" height="1.25rem" style={{ marginBottom: "1.5rem" }} />
          <div className="items">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="item-row">
                <Skeleton height="2rem" />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <Skeleton width="40%" height="1.25rem" style={{ marginBottom: "1.5rem" }} />
          <div className="items">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="item-row">
                <Skeleton height="2rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
