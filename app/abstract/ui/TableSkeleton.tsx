type Props = {
  rows?: number;
  cols?: number;
};

export default function TableSkeleton({ rows = 5, cols = 5 }: Props) {
  const shimmer =
    "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-card-hover) 50%, var(--bg-surface) 75%)";

  return (
    <div style={{ padding: 24 }}>
      {/* title skeleton */}
      <div
        style={{
          height: 28,
          width: 240,
          borderRadius: 6,
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 16,
          width: 380,
          borderRadius: 6,
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          marginBottom: 28,
        }}
      />

      {/* stat cards skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card border border-border"
            style={{
              height: 90,
              borderRadius: 12,
              background: shimmer,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* table skeleton */}
      <div
        className="bg-card border border-border"
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        {Array.from({ length: rows }).map((_, ri) => (
          <div
            key={ri}
            style={{
              display: "flex",
              gap: 16,
              padding: "14px 18px",
              borderBottom: ri < rows - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            {Array.from({ length: cols }).map((_, ci) => (
              <div
                key={ci}
                style={{
                  flex: ci === 0 ? 2 : ci === cols - 1 ? 1 : 1,
                  height: 14,
                  borderRadius: 4,
                  background: shimmer,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  animationDelay: `${(ri * cols + ci) * 0.05}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
