import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';

export const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
};
