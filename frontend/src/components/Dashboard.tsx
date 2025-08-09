import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
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

  const getDashboardTitle = () => {
    switch (user?.role) {
      case "job_seeker":
        return "Job Seeker Dashboard";
      case "talent_connector":
        return "Employer Dashboard";
      case "admin":
        return "Admin Dashboard";
      default:
        return "Dashboard";
    }
  };
  if (!user) {
    return <div>Redirecting...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                <Link
                  to="/"
                  className="text-xl font-semibold hover:text-blue-600 transition-colors"
                >
                  GigCeylon
                </Link>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {getDashboardTitle()}
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
                  <p className="text-blue-700">Role: {user?.role}</p>
                </div>

                {user?.role === "job_seeker" && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900">
                        Jobs
                      </h3>
                      <p className="text-green-700">
                        Search and apply for part-time jobs
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900">
                        Applications
                      </h3>
                      <p className="text-purple-700">
                        Track your job applications
                      </p>
                    </div>
                  </>
                )}

                {user?.role === "talent_connector" && (
                  <>
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
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900">
                        Applications
                      </h3>
                      <p className="text-purple-700">
                        Review candidate applications
                      </p>
                    </div>
                  </>
                )}

                {user?.role === "admin" && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900">
                        Users
                      </h3>
                      <p className="text-green-700">Manage platform users</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900">
                        Analytics
                      </h3>
                      <p className="text-purple-700">
                        View platform statistics
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Available Jobs Section for Job Seekers */}
              {user?.role === "job_seeker" && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Available Opportunities
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500 mb-4">
                      Browse available part-time jobs in Sri Lanka
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Browse Jobs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
