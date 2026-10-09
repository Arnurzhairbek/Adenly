import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
        <div className="text-white text-xl">Жүктелуде...</div>
      </div>
    );
  }

  if (!user) {
    // preserve attempted location so Login can redirect back after success
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

