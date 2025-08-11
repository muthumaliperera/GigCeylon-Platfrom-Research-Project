import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [successMessage, setSuccessMessage] = useState("");

  // Check for success message from job creation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location.state]);

  // Watch for user changes and redirect when user becomes null
  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      // Force navigation as a backup
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      navigate("/");
    }
  };

  if (!user || user.role !== "admin") {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <div className="text-xl font-bold">GigCeylon</div>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Home
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              About
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Help
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <span className="text-white">
                    Welcome, {user?.firstName} {user?.lastName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/register"
                className="border border-white text-white px-5 py-2 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors text-sm"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="max-w-full px-24">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 py-3 md:py-0">
            <div className="flex items-center flex-wrap gap-4 md:gap-12">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin-dashboard"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/users"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Users
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/jobs"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Jobs
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/payment-plans"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Payment Plans
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/reviews"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Reviews
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/finance"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Finance
                  </Link>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

              {/* Latest Insights */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Latest Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-blue-700 text-sm">Total Users</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-blue-700 text-sm">Total Seekers</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-blue-700 text-sm">Total Talent Connectors</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-green-900">0</div>
                    <div className="text-green-700 text-sm">Active Jobs</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-green-900">0</div>
                    <div className="text-green-700 text-sm">Completed Jobs</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-purple-900">LKR 0</div>
                    <div className="text-purple-700 text-sm">Total Revenue</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                  <div className="bg-purple-50 p-4 rounded text-center md:col-span-6 lg:col-span-2">
                    <div className="text-2xl font-bold text-purple-900">LKR 0</div>
                    <div className="text-purple-700 text-sm">Today Income</div>
                  </div>
                </div>
              </div>

              {/* Action Needed */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Action Needed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-2xl font-bold text-yellow-900">0</div>
                    <div className="text-yellow-700 text-sm">Reported Jobs</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded">
                    <div className="text-2xl font-bold text-indigo-900">0</div>
                    <div className="text-indigo-700 text-sm">Pending Payment Approvals</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-2xl font-bold text-red-900">0</div>
                    <div className="text-red-700 text-sm">Reported Users</div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded">
                    <div className="text-2xl font-bold text-teal-900">0</div>
                    <div className="text-teal-700 text-sm">Pending Reviews for Approve</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
