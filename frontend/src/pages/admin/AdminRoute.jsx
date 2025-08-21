// src/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_AUTH_ADMIN } from "../../graphql/query/user.query.js";

export default function AdminRoute({ children }) {
  const { data, loading } = useQuery(GET_AUTH_ADMIN, {
    fetchPolicy: "network-only",
  });
  if (loading) return null; // or a spinner
  if (!data?.authAdmin) return <Navigate to="/" replace />;
  if (data.authAdmin.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}
