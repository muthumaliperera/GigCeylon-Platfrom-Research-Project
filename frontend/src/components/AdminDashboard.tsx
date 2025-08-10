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
                    to="/dashboard"
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
                    to="/admin/analytics"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Analytics
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/admin/settings"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Settings
                  </Link>
                </h1>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Link to="/admin/reports" className="block w-full">
                <h3 className="w-full text-center text-lg bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-accent transition-colors">
                  Generate Report
                </h3>
              </Link>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Admin Dashboard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Profile
                  </h3>
                  <p className="text-blue-700">
                    Name: {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-blue-700">Email: {user?.email}</p>
                  <p className="text-blue-700">Role: Administrator</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <Link to="/admin/users" className="block">
                    <h3 className="text-lg font-semibold text-green-900">
                      User Management
                    </h3>
                    <p className="text-green-700">
                      Manage platform users
                    </p>
                    <p className="text-green-600 text-sm mt-2 font-medium">
                      Manage users →
                    </p>
                  </Link>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                  <Link to="/admin/analytics" className="block">
                    <h3 className="text-lg font-semibold text-purple-900">
                      Analytics
                    </h3>
                    <p className="text-purple-700">
                      View platform statistics
                    </p>
                    <p className="text-purple-600 text-sm mt-2 font-medium">
                      View analytics →
                    </p>
                  </Link>
                </div>
              </div>

              {/* Platform Overview Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Platform Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-bold text-blue-900">0</h4>
                    <p className="text-blue-700">Total Users</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-bold text-green-900">0</h4>
                    <p className="text-green-700">Active Jobs</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-bold text-yellow-900">0</h4>
                    <p className="text-yellow-700">Applications</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-bold text-purple-900">0</h4>
                    <p className="text-purple-700">Successful Hires</p>
                  </div>
                </div>
              </div>

              {/* Management Tools Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Management Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      User Management
                    </h4>
                    <p className="text-gray-600 mb-4">
                      View, edit, and manage user accounts
                    </p>
                    <Link to="/admin/users">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Manage Users
                      </button>
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Job Moderation
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Review and moderate job postings
                    </p>
                    <Link to="/admin/jobs">
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Moderate Jobs
                      </button>
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      System Settings
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Configure platform settings
                    </p>
                    <Link to="/admin/settings">
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Settings
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Platform Activity
                </h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-blue-500">
                      <div>
                        <p className="font-medium text-gray-900">System Status</p>
                        <p className="text-sm text-gray-600">All systems operational</p>
                      </div>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                    <div className="text-center text-gray-500 py-4">
                      <p>No recent activity to display</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Link to="/admin/reports">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                      Generate Report
                    </button>
                  </Link>
                  <Link to="/admin/backup">
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Backup Data
                    </button>
                  </Link>
                  <Link to="/admin/maintenance">
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                      Maintenance Mode
                    </button>
                  </Link>
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
