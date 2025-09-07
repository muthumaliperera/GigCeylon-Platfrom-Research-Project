import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WhoAreWe: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 lg:px-12  xl:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="hover:text-blue-400 transition-colors">
              Home
            </Link>
            <a
              href="#features"
              className="hover:text-blue-400 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="hover:text-blue-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#categories"
              className="hover:text-blue-400 transition-colors"
            >
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

      <main className="px-6 lg:px-12  xl:px-24 py-12 pt-24 ">
        {/* Back button */}
        <div className="mb-8 flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Page title */}
        <div className="text-center mb-12">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            Who are we?
          </h1>
        </div>

        {/* Content */}
        <div>
          <div>
            <p className=" md:text-md text-gray-700 leading-relaxed mb-8 text-start">
              We are{" "}
              <span className="font-semibold text-blue-600">FlexEra</span> — a
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Vision
                </h2>
                <p className="text-gray-700 leading-relaxed  text-start">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-700 leading-relaxed text-start">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            </div>

            <div className=" rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    For Job Seekers
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Discover flexible part-time opportunities that fit your
                    schedule and skills.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    For Employers
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Find qualified talent for your projects with ease and
                    efficiency.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    For Everyone
                  </h3>
                  <p className="text-gray-700 text-sm">
                    A trusted platform that ensures fair opportunities and
                    secure transactions.
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
                    className="bg-accent text-white px-8 py-3 rounded-full font-semibold hover:bg-violet-500 transition-colors"
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  to="/"
                  className="border border-primary text-primary px-8 py-3 rounded-full font-semibold hover:bg-primary hover:text-white transition-colors"
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
