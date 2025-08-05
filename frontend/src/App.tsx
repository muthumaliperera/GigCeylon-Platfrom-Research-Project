import { Check, MapPin, Search, Star } from "lucide-react";
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

// Landing page component
const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">GigCeylon</div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Dashboard
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Manage Jobs
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Reviews
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs">W</span>
              </div>
              <span>Welcome</span>
            </div>
            <span className="text-sm">5,134</span>
          </div>
        </div>
      </header>
      {/*Hero Section*/}
      <section className="bg-[linear-gradient(135deg,#031437_0%,#0F0F0F_100%)] text-white px-24 pt-8 pb-24">
        <div className="h-[32rem] flex text-left">
          <div className=" flex items-center w-full lg:w-1/2">
            <div className="max-w-xl w-full  gap-16">
              <div>
                <div className="inline-block bg-slate-800 text-blue-400 px-4 py-2 rounded-full text-md mb-6">
                  1st Sri Lankan Gig based job platform
                </div>
                <h1 className="text-6xl font-bold mb-6">
                  Unlock your{" "}
                  <span className="bg-gradient-to-r from-[#3265F2] to-[#7B5FF1] bg-clip-text text-transparent">
                    Earning{" "}
                  </span>
                  Potential in Sri Lanka
                </h1>
                <p className="text-gray-300 text-xl mb-8">
                  Connect with{" "}
                  <span className="bg-gradient-to-r from-[#7B5FF1] to-[#3265F2] bg-clip-text text-transparent text-2xl font-semibold">
                    flexible part-time opportunities
                  </span>{" "}
                  that fit your schedule and skills.
                </p>
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className="border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:w-1/2 relative">
            <div
              className="w-full h-9/10 bg-cover bg-center bg-no-repeat rounded-2xl"
              style={{
                backgroundImage: `url('./bg1.jpg')`,
              }}
            ></div>
          </div>
        </div>
      </section>
      {/* search section */}
      <section className="flex justify-center -mt-8 mb-16">
        <div className="bg-gray-50 w-3/4 min-w-full md:min-w-0 py-12 rounded-2xl shadow-md">
          <h2 className="text-lg mb-8 text-gray-600 text-start px-24">
            What are you looking for?
          </h2>
          <div className="flex justify-center md:flex-row gap-4 px-24">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select className="pl-10 pr-8 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                <option>Location</option>
                <option>Colombo</option>
                <option>Kandy</option>
                <option>Galle</option>
              </select>
            </div>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors">
              Search
            </button>
          </div>
        </div>
      </section>
      {/* Job Listing */}
      <section className="py-12 bg-white">
        <div className="w-full min-w-full md:min-w-0 px-24">
          <h2 className="text-lg mb-4 text-gray-600 text-start">Recent Jobs</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">Paper Mark Helper</h3>
                    <span className="bg-[#64F272] text-gray-900 px-2 py-1 rounded-md text-xs font-bold shadow-md">
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center text-yellow-500 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-gray-600 text-md ml-2">
                      Saman Perera • 2000LKR Spent • Colombo
                    </span>
                  </div>
                  <div className="text-accent font-semibold text-lg mb-2 text-start">
                    Rs. 500-1000 per hour
                  </div>
                  <p className="text-gray-600 text-md mb-4 text-start">
                    As experts are passionate about delivering accurate data,
                    and do essential manager lor student ul bibore et bibore
                    magna aliqua. Up enord ad minim veniam, quis national
                    exercitation olones bibore run esl qiure eu qui commodo
                    consequat.
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Education
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Helper
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Tutoring
                    </span>
                  </div>
                  <div className="text-gray-500 text-md mt-3 text-start">
                    Posted 2 days ago
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <div className="w-6 h-6 border border-gray-300 rounded"></div>
                </button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">Paper Mark Helper</h3>
                    <span className="bg-[#64F272] text-gray-900 px-2 py-1 rounded-md text-xs font-bold shadow-md">
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center text-yellow-500 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-gray-600 text-md ml-2">
                      Saman Perera • 2000LKR Spent • Colombo
                    </span>
                  </div>
                  <div className="text-accent font-semibold text-lg mb-2 text-start">
                    Rs. 500-1000 per hour
                  </div>
                  <p className="text-gray-600 text-md mb-4 text-start">
                    As experts are passionate about delivering accurate data,
                    and do essential manager lor student ul bibore et bibore
                    magna aliqua. Up enord ad minim veniam, quis national
                    exercitation olones bibore run esl qiure eu qui commodo
                    consequat.
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Education
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Helper
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                      Tutoring
                    </span>
                  </div>
                  <div className="text-gray-500 text-md mt-3 text-start">
                    Posted 2 days ago
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <div className="w-6 h-6 border border-gray-300 rounded"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features section */}
      <section className="py-12 bg-[linear-gradient(135deg,#031437_0%,#0F0F0F_100%)] text-white rounded-t-3xl">
        <div className="max-full mx-auto px-24">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-center md:text-start">
              Turn Your
              <span className="text-accent">FREE TIME</span> into
              <br />
              Real <span className="text-accent">INCOME</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Post Jobs Instantly
                </h3>
                <p className="text-gray-300">
                  Quick job posting for employers. Get applications from
                  verified Sri Lankan job seekers within hours. Set fair wages
                  and connect with motivated workers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Flexible Payments
                </h3>
                <p className="text-gray-300">
                  Choose daily, weekly, or monthly payments. Bank transfer, ez
                  Cash, or cash in hand. Fair wages starting from Rs. 500 per
                  hour.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Find Real Opportunities
                </h3>
                <p className="text-gray-300">
                  No fake listings. Every employer is verified. Find part-time
                  work that matches your skills, schedule, and location.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Support</h3>
                <p className="text-gray-300">
                  Resume help, dispute resolution, and career guidance. 24/7
                  support in Sinhala, Tamil, and English.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-12 bg-white">
        <div className="max-w-full px-24">
          <h2 className="text-3xl font-semibold text-center mb-12 text-accent tracking-tight">
            Payment Plans
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-base inline-block mb-4 w-fit">
                Free Plan
              </div>
              <h3 className="text-4xl bg-gradient-to-r from-[#3265F2] to-[#7B5FF1] bg-clip-text text-transparent font-bold mb-2 tracking-tight">
                FREE
              </h3>
              <p className="text-gray-900 mb-6 font-medium">Basic Freelancer</p>
              <button className="w-full bg-accent text-white py-3 rounded-xl font-semibold mb-6">
                Your Current Plan
              </button>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    Create basic profile with 3 talents
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    5% commission on all completed jobs
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">AI job recommendation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">Standard search ranking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">No profile verification badge</span>
                </li>
                <li className="flex items-center gap-2 text-red-500">
                  <span className="w-5 h-5 text-center">×</span>
                  <span className="text-md">
                    Limited to 10 job applications per week
                  </span>
                </li>
              </ul>
            </div>
            {/* Standard Plan */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-base inline-block mb-4 w-fit">
                Standard Plan
              </div>
              <h3 className="text-4xl bg-gradient-to-r from-[#3265F2] to-[#7B5FF1] bg-clip-text text-transparent font-bold mb-2 tracking-tight">
                LKR 500
              </h3>
              <p className="text-gray-900 mb-6 font-medium">
                Verified Professional
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    Create profile with 10 talents
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    3% commission on all completed jobs
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">AI job recommendation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">2 x Boost search ranking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">Profile verification badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    Unlimited job applications per week
                  </span>
                </li>
              </ul>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold">
                Get Started
              </button>
            </div>
            {/* Professional Plan */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-base inline-block mb-4 w-fit">
                Professional Plan
              </div>
              <h3 className="text-4xl bg-gradient-to-r from-[#3265F2] to-[#7B5FF1] bg-clip-text text-transparent font-bold mb-2 tracking-tight">
                LKR 1800
              </h3>
              <p className="text-gray-900 mb-6 font-medium">Elite Freelancer</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    Create profile with unlimited talents
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    3% commission on all completed jobs
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">AI job recommendation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">5 x Boost search ranking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">
                    Unlimited job applications per week
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-md">Profile verification badge</span>
                </li>
              </ul>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {/* Footer */}
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
