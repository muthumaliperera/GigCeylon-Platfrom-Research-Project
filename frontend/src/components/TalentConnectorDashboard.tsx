import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TalentConnectorDashboard: React.FC = () => {
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

  // Redirect if user is not a talent connector
  useEffect(() => {
    if (user && user.role !== "talent_connector") {
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

  if (!user || user.role !== "talent_connector") {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">GigCeylon</div>
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-12">
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
                    to="/my-jobs"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    My Jobs
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/applications"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Applications
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/finances"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Finances
                  </Link>
                </h1>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  <Link
                    to="/account"
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    Account
                  </Link>
                </h1>
              </div>
            </div>
            <Link to="/create-job" className="block">
              <h3 className="text-lg bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-accent transition-colors">
                Post a Job
              </h3>
            </Link>
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
                Employer Dashboard
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
                  <p className="text-blue-700">Role: Talent Connector</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <Link to="/create-job" className="block">
                    <h3 className="text-lg font-semibold text-green-900">
                      Post Jobs
                    </h3>
                    <p className="text-green-700">
                      Create new job postings
                    </p>
                    <p className="text-green-600 text-sm mt-2 font-medium">
                      Click to post a job →
                    </p>
                  </Link>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                  <Link to="/applications" className="block">
                    <h3 className="text-lg font-semibold text-purple-900">
                      Applications
                    </h3>
                    <p className="text-purple-700">
                      Review candidate applications
                    </p>
                    <p className="text-purple-600 text-sm mt-2 font-medium">
                      View applications →
                    </p>
                  </Link>
                </div>
              </div>

              {/* Job Management Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Job Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Active Job Postings
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Manage your current job listings
                    </p>
                    <Link to="/my-jobs">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        View My Jobs
                      </button>
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Create New Job
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Post a new job opportunity
                    </p>
                    <Link to="/create-job">
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Post Job
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Stats Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h4 className="text-lg font-semibold text-blue-900">0</h4>
                    <p className="text-blue-700">Active Jobs</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <h4 className="text-lg font-semibold text-yellow-900">0</h4>
                    <p className="text-yellow-700">Applications Received</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h4 className="text-lg font-semibold text-green-900">0</h4>
                    <p className="text-green-700">Interviews Scheduled</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h4 className="text-lg font-semibold text-purple-900">0</h4>
                    <p className="text-purple-700">Hires Made</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-500 text-center">
                    No recent activity to display
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TalentConnectorDashboard;
