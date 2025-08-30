import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ManageJobsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#hero" className="hover:text-blue-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-blue-400 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#categories" className="hover:text-blue-400 transition-colors">Categories</a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
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

      {/* Seeker Tabs Nav */}
      <nav className="bg-[linear-gradient(135deg,#0B1022_0%,#0D0D15_100%)] text-white shadow-sm border-b border-black/5 sticky top-16 z-40">
        <div className="max-w-full px-6 sm:px-24 py-3 md:h-14 flex items-center">
          <div className="flex items-center justify-between sm:justify-normal sm:gap-4 w-full">
            {[
              { key: "dashboard", label: "Dashboard", path: "/job-seeker-dashboard" },
              { key: "manage", label: "Manage Jobs", path: "/jobs" },
              { key: "reviews", label: "Reviews", path: "/reviews" },
              { key: "profile", label: "My Profile", path: "/profile" },
            ].map((tab) => (
              <div key={tab.key} className="flex items-center">
                <Link
                  to={tab.path}
                  className={`text-sm sm:text-md font-semibold px-4 py-2 rounded-full transition-colors ${
                    location.pathname.startsWith(tab.path)
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-full px-6 sm:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Applications */}
          <section className="bg-white border rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">My Applications</h2>
            <div className="border rounded-lg divide-y">
              {/* TODO: Replace with real data from applications API */}
              <div className="p-6 text-center text-gray-600">
                No applications yet. Apply to jobs and they will appear here with status updates.
              </div>
            </div>
          </section>

          {/* Statistics */}
          <aside className="bg-white border rounded-2xl p-6">
            <h3 className="text-md font-semibold mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total applications</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Shortlisted</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Interviews</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Offers</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ManageJobsPage;
