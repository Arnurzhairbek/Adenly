export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-2xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-white/70 mb-6 max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

