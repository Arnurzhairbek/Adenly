import { memo } from "react";

function Card({ children, className = "", hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br from-slate-800/60 to-purple-900/40 backdrop-blur-md rounded-2xl p-6
        border border-purple-500/20 shadow-lg
        transition-all duration-200 ease-out
        ${hover ? "hover:shadow-xl hover:border-purple-500/40 hover:-translate-y-0.5 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default memo(Card);

