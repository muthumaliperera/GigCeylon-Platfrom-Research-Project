import React from "react";
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Landing page component (temporary)
const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center text-white px-4">
        <h1 className="text-5xl font-bold mb-6">Welcome to GigCeylon</h1>
        <p className="text-xl mb-8">
          Sri Lanka's premier platform for part-time jobs
        </p>
        <div className="space-x-4">
          <Link
            to="/login"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

// Unauthorized page
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>

      <Link
        to="/dashboard"
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

// Main App component with routing
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Job Seeker routes (future) */}
      <Route
        path="/jobs"
        element={
          <ProtectedRoute allowedRoles={["job_seeker"]}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Jobs Page</h1>
              <p>Coming soon - Job search functionality</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Employer routes (future) */}
      <Route
        path="/post-job"
        element={
          <ProtectedRoute allowedRoles={["talent_connector"]}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Post Job</h1>
              <p>Coming soon - Job posting functionality</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Admin routes (future) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p>Coming soon - Admin functionality</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
