import { ArrowLeft, CheckCircle, Eye, Target } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Reusable checklist with green check icons
const CheckList: React.FC<{ items: string[]; className?: string }> = ({
  items,
  className,
}) => (
  <ul
    className={`mt-3 space-y-2 text-gray-700 text-lg text-start ${className ?? ""}`}
  >
    {items.map((text, idx) => (
      <li key={idx} className="flex items-start gap-2">
        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
        <span>{text}</span>
      </li>
    ))}
  </ul>
);

const WhoAreWe: React.FC = () => {
  const { user } = useAuth();

  const seekerPoints = [
    "Verified part-time positions across diverse categories",
    "Flexible scheduling that respects your commitments",
    "Secure payment processing and transparent terms",
    "Skills-based matching to find work you'll enjoy",
    "Protection against scams through our verification system",
  ];

  const employerPoints = [
    "Access to a pool of motivated, skill-verified candidates",
    "Streamlined hiring process with application management",
    "Quality assurance through our user verification system",
    "Cost-effective solutions for project-based and part-time needs",
    "Trusted platform for secure transactions",
  ];

  const everyonePoints = [
    "Comprehensive verification system for all users",
    "Real-time support and dispute resolution",
    "Community-driven ratings and reviews",
    "Mobile-friendly platform accessible across Sri Lanka",
    "Commitment to fair wages and ethical work practices",
  ];

  return (
    <div className="bg-[#F3F8F9] ">
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

      <main className="">
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
        <div className="bg-white px-6 lg:px-12  xl:px-24 py-12 pt-12 ">
          <div className="text-center">
            <h1 className="text-4xl  font-bold text-gray-900 mb-3">
              Who are we?
            </h1>
          </div>
          <p className=" text-lg text-gray-800 leading-relaxed mb-8 text-start">
            We are{" "}
            <span className="font-semibold text-accent text-xl">FlexEra</span> —
            a dedicated platform connecting Sri Lankans with verified part-time
            job opportunities that fit their schedules and skills. Born from
            recognizing the critical gap in Sri Lanka's digital job market,
            we're bridging the divide between those seeking flexible work and
            those offering meaningful opportunities.
          </p>
          <div className="">
            <p className="text-lg text-gray-800 mb-6">
              Ready to start your journey with FlexEra?
            </p>
            <div className="flex  sm:flex-row gap-4 justify-center text-center">
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

        {/* Content */}
        <div className=" pt-12 ">
          <div>
            <div className="grid md:grid-cols-2 gap-8 mb-8 px-6 lg:px-12  xl:px-24">
              <div>
                <div className="flex justify-center mb-2">
                  <div className="">
                    <Eye className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Our Vision
                </h2>
                <p className="text-gray-700 leading-relaxed  text-start text-lg">
                  To transform Sri Lanka's employment landscape by creating an
                  inclusive gig economy that respects cultural values while
                  providing secure, flexible income opportunities for all. We
                  envision a future where students can afford their education,
                  parents can balance family responsibilities with work, and
                  anyone seeking additional income can find trustworthy,
                  verified opportunities that match their skills and
                  availability.
                </p>
              </div>

              <div>
                <div className="flex justify-center mb-2">
                  <div className="">
                    <Target className="w-12 h-12 text-rose-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Our Mission
                </h2>
                <p className="text-gray-700 leading-relaxed text-start text-lg">
                  To empower Sri Lankans through technology by providing a
                  secure, user-friendly platform that connects job seekers with
                  verified part-time employment opportunities. We're committed
                  to reducing poverty, supporting economic growth, and fostering
                  a culture where flexible work is recognized as a valuable
                  contribution to both individual prosperity and national
                  development.
                </p>
              </div>
            </div>

            <div className="  p-6 mt-12 bg-white px-6 lg:px-12  xl:px-24">
              <h2 className="text-2xl font-bold text-primary mb-4">
                What We Offer
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border p-6 rounded-xl bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                    For Job Seekers
                  </h3>
                  <p className="text-gray-700 text-lg mb-2">
                    Discover opportunities that work with your life, not against
                    it.
                  </p>
                  <CheckList items={seekerPoints} />
                </div>
                <div className="border p-6 rounded-xl bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                    For Employers
                  </h3>
                  <p className="text-gray-700 text-lg mb-2">
                    Find qualified talent for your projects with ease and
                    efficiency.
                  </p>
                  <CheckList items={employerPoints} />
                </div>
                <div className="border p-6 rounded-xl bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                    For Everyone
                  </h3>
                  <p className="text-gray-700 text-lg mb-2">
                    A trusted platform that ensures fair opportunities and
                    secure transactions.
                  </p>
                  <CheckList items={everyonePoints} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhoAreWe;
