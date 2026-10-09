export default function LoadingSpinner({ size = "md", text = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} border-4 border-indigo-400 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="text-white/70">{text}</p>}
    </div>
  );
}

