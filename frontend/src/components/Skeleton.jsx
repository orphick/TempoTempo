export function Skeleton({
  width = "100%",
  height = "16px",
  radius = "8px",
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <Skeleton height="160px" radius="0" />
      <div
        style={{
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Skeleton width="60px" height="12px" />
        <Skeleton width="80%" height="16px" />
        <Skeleton width="50%" height="14px" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px",
          }}
        >
          <Skeleton width="70px" height="20px" />
          <Skeleton width="80px" height="32px" radius="8px" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div style={{ padding: "40px 28px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        <Skeleton width="40px" height="14px" />
        <Skeleton width="8px" height="14px" />
        <Skeleton width="60px" height="14px" />
        <Skeleton width="8px" height="14px" />
        <Skeleton width="80px" height="14px" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "40px",
          marginBottom: "32px",
        }}
      >
        <Skeleton height="400px" radius="24px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Skeleton width="80px" height="24px" />
          <Skeleton width="90%" height="36px" />
          <Skeleton width="100%" height="60px" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <Skeleton height="70px" radius="10px" />
            <Skeleton height="70px" radius="10px" />
            <Skeleton height="70px" radius="10px" />
          </div>
          <Skeleton height="120px" radius="16px" style={{ marginTop: "8px" }} />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ count = 8 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
