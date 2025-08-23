import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const WhoAreWe: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-20">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="hover:text-blue-400 transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-blue-400 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#categories" className="hover:text-blue-400 transition-colors">
              Categories
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <img
                    src={
                      user.profileImageUrl ||
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%23e5e7eb"/><circle cx="64" cy="50" r="22" fill="%239ca3af"/><path d="M20 112c8-20 26-32 44-32s36 12 44 32" fill="%239ca3af"/></svg>'
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                  <span>
                    Hi, {user.firstName} {user.lastName}
                  </span>
                </div>
                <Link
                  to={
                    user.role === "job_seeker"
                      ? "/job-seeker-dashboard"
                      : user.role === "talent_connector"
                        ? "/talent-connector-dashboard"
                        : user.role === "admin"
                          ? "/admin-dashboard"
                          : "/dashboard"
                  }
                  className="border border-white text-white px-5 py-2 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </>
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

      <main className="max-w-4xl mx-auto px-6 sm:px-24 py-12">
        {/* Back button */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Page title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Who are we?
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              We are <span className="font-semibold text-blue-600">FlexEra</span> — a platform connecting people in Sri Lanka with flexible part-time opportunities. Our mission is to 
              empower individuals to unlock new income streams and for businesses to easily find the right talent for the right time.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-700 leading-relaxed">
                  To become Sri Lanka's leading platform for flexible work opportunities, 
                  creating a thriving ecosystem where talent meets opportunity seamlessly.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  To bridge the gap between skilled individuals seeking flexible work 
                  and businesses needing reliable talent, fostering economic growth 
                  and personal empowerment across Sri Lanka.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Job Seekers</h3>
                  <p className="text-gray-700 text-sm">
                    Discover flexible part-time opportunities that fit your schedule and skills.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Employers</h3>
                  <p className="text-gray-700 text-sm">
                    Find qualified talent for your projects with ease and efficiency.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Everyone</h3>
                  <p className="text-gray-700 text-sm">
                    A trusted platform that ensures fair opportunities and secure transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-700 mb-6">
                Ready to start your journey with FlexEra?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user && (
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  to="/"
                  className="border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                >
                  Explore Opportunities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhoAreWe;
