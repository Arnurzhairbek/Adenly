import { memo } from "react";

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 hover:border-purple-500 shadow-sm font-semibold",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl font-semibold",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl font-semibold",
    warning: "bg-violet-400 hover:bg-violet-500 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200",
    ghost: "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-400 shadow-sm font-semibold",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl
        font-semibold
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-soft
        active:scale-[0.97]
        transform
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Жүктелуде...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default memo(Button);

