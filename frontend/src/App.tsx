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
  {
    /*}
  if (user) {
    return <Navigate to="/dashboard" replace />;*/
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
            {/*
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs">W</span>
              </div>
              <span>Welcome</span>
            </div>
            <span className="text-sm">5,134</span>
            <Link
              to="/register"
              className="border border-white text-white px-5 py-2 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors text-sm"
            >
              Sign Up
            </Link>*/}
            {user ? (
              // Show user greeting and dashboard link when logged in
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  Hi, <span className="font-semibold">{user?.firstName} </span>
                </span>
                <Link
                  to="/dashboard"
                  className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              // Show sign up button when not logged in
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
                  {!user && (
                    <>
                      <Link
                        to="/login"
                        className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Sign In
                      </Link>

                      <Link
                        to="/register"
                        className="border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
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
      <section className="pt-12 pb-16 bg-white">
        <div className="w-full min-w-full md:min-w-0 px-24">
          <h2 className="text-lg mb-4 text-gray-600 text-start">Recent Jobs</h2>
          <div className="flex flex-col gap-8">
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
      <section className="py-16">
        <div className="max-w-full mx-auto px-24">
          <h2 className="text-3xl font-semibold text-center mb-12 text-accent tracking-tight">
            Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "Tutoring",
              "Retail & Sales",
              "Delivery Services",
              "Event Support",
              "Hospitality",
              "Digital Services",
              "Household Services",
              "Creative Work",
              "Administrative Support",
              "Seasonal Work",
            ].map((category) => (
              <button
                key={category}
                className="border border-accent bg-gradient-to-r from-[#7B5FF1] to-[#3265F2] bg-clip-text text-transparent py-3 px-4 rounded-xl hover:bg-purple-200 transition-colors text-lg font-semibold tracking-tight"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-full px-24 flex-col  text-center gap-2">
          <div>
            <h2 className="text-4xl font-md mb-2">
              Are you ready to{" "}
              <span className="text-white text-5xl font-bold">GET STARTED</span>
            </h2>
            <p className="text-4xl">
              with{" "}
              <span className="bg-gradient-to-r from-[#7B5FF1] to-[#3265F2] bg-clip-text text-transparent text-5xl font-bold">
                GigCeylon
              </span>
            </p>
          </div>
          <button className="bg-accent hover:bg-purple-700 mt-12 px-8 py-3 rounded-xl font-semibold transition-colors">
            Get Started
          </button>
        </div>
      </section>
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-full mx-auto px-24">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Mission & Vision
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a href="#" className="hover:text-white">
                    Find Gigs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a href="#" className="hover:text-white">
                    Post a Job
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Find Talent
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Customer Support</h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a href="#" className="hover:text-white">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How-to Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2025 GigCeylon. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
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
