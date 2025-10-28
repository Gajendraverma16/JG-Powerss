// src/pages/logout/logout.jsx
import { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function Logout() {
  const { logout } = useAuth();
  useEffect(() => { logout(); }, [logout]);
  return null; // or a loader/spinner while redirecting
}
