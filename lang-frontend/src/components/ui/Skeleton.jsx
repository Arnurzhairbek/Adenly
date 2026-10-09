export default function Skeleton({ variant = "card", className = "" }) {
  if (variant === "card") {
    return (
      <div className={`bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 animate-pulse ${className}`}>
        <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-5/6"></div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-16 h-16 bg-white/20 rounded-full"></div>
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-12 h-12 bg-white/20 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`h-4 bg-white/20 rounded animate-pulse ${className}`}></div>
  );
}

export function SkeletonCard() {
  return <Skeleton variant="card" />;
}

export function SkeletonText({ lines = 2, className = "" }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className="mb-2" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}

