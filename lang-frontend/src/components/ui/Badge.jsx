import { memo } from "react";

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-neutral-100 text-neutral-700 border border-neutral-300",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    info: "bg-brand-50 text-brand-700 border border-brand-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default memo(Badge);

