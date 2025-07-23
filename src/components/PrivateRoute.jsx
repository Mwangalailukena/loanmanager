// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null; // or a loading spinner

  return currentUser ? children : <Navigate to="/login" replace />;
}

