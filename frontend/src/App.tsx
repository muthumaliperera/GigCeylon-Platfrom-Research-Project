import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import React from "react";
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import AdminDashboard from "./components/AdminDashboard";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import CreateJobForm from "./components/jobs/CreateJobForm";
import TalentJobCandidates from "./components/jobs/TalentJobCandidates";
import TalentJobDetails from "./components/jobs/TalentJobDetails";
import JobSeekerDashboard from "./components/JobSeekerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TalentConnectorDashboard from "./components/TalentConnectorDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
// AdminUsersPage consolidated into AdminDashboard
import WhoAreWe from "./components/WhoAreWe";
import { Job, jobService } from "./services/jobService";

// Simple reveal-on-scroll wrapper
const Reveal: React.FC<{
  delay?: number;
  className?: string;
  children: React.ReactNode;
}> = ({ delay = 0, className = "", children }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transform transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Landing page component
const LandingPage: React.FC = () => {
  const { user } = useAuth();
  // Update these filenames to match images you've added in /public
  const heroImages = [
    "/onlinetutor.png",
    "/graphicdesigner.png",
    "/studentpapermarker.png",
    "/deliveryrider.png",
    "/cleaner.png",
    "/salesman.png",
  ];
  // Scroll-triggered reveal states
  const [badgeVisible, setBadgeVisible] = React.useState(false);
  const [stripVisible, setStripVisible] = React.useState(false);
  const [headlineVisible, setHeadlineVisible] = React.useState(false);
  const [paraVisible, setParaVisible] = React.useState(false);
  const [ctasVisible, setCtasVisible] = React.useState(false);

  const badgeRef = React.useRef<HTMLDivElement | null>(null);
  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const headlineRef = React.useRef<HTMLHeadingElement | null>(null);
  const paraRef = React.useRef<HTMLParagraphElement | null>(null);
  const ctasRef = React.useRef<HTMLDivElement | null>(null);

  // Recent jobs (live)
  const [recentJobs, setRecentJobs] = React.useState<Job[]>([]);
  const [jobsError, setJobsError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch all jobs (any status) across all pages
        const first = await jobService.getAllJobs(1, 50);
        if (cancelled) return;
        let all: Job[] = first.jobs || [];
        const totalPages = first.pages || 1;
        if (totalPages > 1) {
          const restPromises: Promise<
            import("./services/jobService").JobsResponse
          >[] = [];
          for (let p = 2; p <= totalPages; p++) {
            restPromises.push(jobService.getAllJobs(p, 50));
          }
          const rest = await Promise.all(restPromises);
          for (const r of rest) all = all.concat(r.jobs || []);
        }
        setRecentJobs(all);
      } catch (e) {
        console.error("Failed to load recent jobs", e);
        if (!cancelled) setJobsError("Failed to load recent jobs");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const postedAgo = (iso?: string) => {
    if (!iso) return "Posted recently";
    const created = new Date(iso).getTime();
    const now = Date.now();
    const days = Math.max(
      0,
      Math.floor((now - created) / (1000 * 60 * 60 * 24))
    );
    if (days === 0) return "Posted today";
    if (days === 1) return "Posted 1 day ago";
    return `Posted ${days} days ago`;
  };

  // Testimonial slider data
  const slides = [
    {
      // matches the provided design (tutor/student)
      textTop:
        "As a university student, I struggle with education expenses. This platform helps me",
      textHighlight: "find students who need mathematics and English tutoring,",
      textBottom: "connecting me with flexible income opportunities.",
      img: "/onlinetutor.png",
    },
    {
      textTop:
        "As a delivery rider, I fill my free slots with short gigs. The platform helps me",
      textHighlight: "discover nearby flexible tasks with fair hourly pay,",
      textBottom: "so I can increase my monthly income easily.",
      img: "/deliveryrider.png",
    },
    {
      textTop:
        "As a designer, I pick up small branding jobs between classes. It lets me",
      textHighlight: "build my portfolio while earning,",
      textBottom: "without long-term commitments.",
      img: "/graphicdesigner.png",
    },
  ];
  const [activeSlide, setActiveSlide] = React.useState(0);
  const prevSlide = () =>
    setActiveSlide((s) => (s - 1 + slides.length) % slides.length);
  const nextSlide = () => setActiveSlide((s) => (s + 1) % slides.length);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            switch (target) {
              case badgeRef.current:
                setBadgeVisible(true);
                break;
              case stripRef.current:
                setStripVisible(true);
                break;
              case headlineRef.current:
                setHeadlineVisible(true);
                break;
              case paraRef.current:
                setParaVisible(true);
                break;
              case ctasRef.current:
                setCtasVisible(true);
                break;
            }
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    const els = [
      badgeRef.current,
      stripRef.current,
      headlineRef.current,
      paraRef.current,
      ctasRef.current,
    ];
    els.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
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
      {/*Hero Section*/}
      <section className="bg-[linear-gradient(135deg,#0B1022_0%,#0D0D15_100%)] text-white  pt-10 pb-36">
        <div className="max-w-full mx-auto">
          {/* Badge */}
          <div className="w-full flex justify-center mb-6">
            <div
              ref={badgeRef}
              className={`inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 rounded-full text-sm transform transition-all duration-700 ease-out ${badgeVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
            >
              1st Sri Lankan Gig based job platform
            </div>
          </div>

          {/* Image strip */}
          <div ref={stripRef} className="w-full">
            <div className=" md:min-w-0 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {heroImages.map((src, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl overflow-hidden shadow ring-1 ring-white/10 transform transition-all duration-700 ease-out ${stripVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
                  style={{ transitionDelay: `${idx * 120}ms` }}
                >
                  <img
                    src={src}
                    alt={`hero ${idx + 1}`}
                    className="w-full h-40 sm:h-44 md:h-48 object-cover"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div className="mt-10 text-center px-6 sm:px-24">
            <h1
              ref={headlineRef}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight transform transition-all duration-700 ease-out ${headlineVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
              style={{ transitionDelay: `${100}ms` }}
            >
              Unlock your{" "}
              <span className="bg-gradient-to-r from-[#3265F2] to-[#7B5FF1] bg-clip-text text-transparent">
                Earning
              </span>{" "}
              Potential in Sri Lanka
            </h1>
            <p
              ref={paraRef}
              className={`text-gray-300 text-lg md:text-xl mt-4 transform transition-all duration-700 ease-out ${paraVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
              style={{ transitionDelay: `${200}ms` }}
            >
              Connect with{" "}
              <span className="text-accent font-semibold">
                flexible part-time opportunities
              </span>{" "}
              that fit your schedule and skills.
            </p>

            {/* CTAs */}
            <div
              ref={ctasRef}
              className={`mt-8 flex items-center justify-center gap-4 transform transition-all duration-700 ease-out ${ctasVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
              style={{ transitionDelay: `${280}ms` }}
            >
              {/* Show Get Started only if not logged in */}
              {!user && (
                <Link
                  to="/register"
                  className="bg-white text-primary px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
              )}
              <Link
                to="/who-are-we"
                className="border border-white text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* search section */}
      <section className="flex justify-center -mt-20 mb-16">
        <Reveal className="bg-gray-50 w-3/4 min-w-full md:min-w-0 py-12 rounded-2xl shadow-md">
          <h2 className="text-lg mb-8 text-gray-600 text-start px-6 sm:px-24">
            What are you looking for?
          </h2>
          <Reveal
            delay={80}
            className="flex justify-center md:flex-row gap-4 px-6 sm:px-24"
          >
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
          </Reveal>
        </Reveal>
      </section>
      {/* Job Listing */}
      <section className="py-12 bg-white">
        <div className="w-full min-w-full md:min-w-0 px-6 sm:px-24">
          <Reveal className="text-lg mb-4 text-gray-600 text-start">
            Recent Jobs
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobsError && (
              <div className="text-red-600 text-sm">{jobsError}</div>
            )}
            {recentJobs.map((job, idx) => {
              const employerName = job.employerId
                ? `${job.employerId.firstName} ${job.employerId.lastName}`
                : "";
              const payText = job.paymentAmount
                ? `Rs. ${job.paymentAmount.toLocaleString()} ${job.paymentType ? `(${job.paymentType})` : ""}`
                : "Payment not specified";

              // Dynamic status badge based on actual job status
              const getStatusBadge = (status: string) => {
                const statusLower = status.toLowerCase();
                switch (statusLower) {
                  case "active":
                    return {
                      bg: "bg-[#64F272]",
                      text: "text-gray-900",
                      label: "ACTIVE",
                    };
                  case "completed":
                    return {
                      bg: "bg-blue-500",
                      text: "text-white",
                      label: "COMPLETED",
                    };
                  case "cancelled":
                    return {
                      bg: "bg-red-500",
                      text: "text-white",
                      label: "CANCELLED",
                    };
                  case "paused":
                    return {
                      bg: "bg-yellow-500",
                      text: "text-white",
                      label: "PAUSED",
                    };
                  default:
                    return {
                      bg: "bg-[#64F272]",
                      text: "text-gray-900",
                      label: "ACTIVE",
                    };
                }
              };

              const statusBadge = getStatusBadge(job.status || "active");

              return (
                <Reveal
                  key={job._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative"
                  delay={idx * 120}
                >
                  <div>
                    <div className="w-full flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-violet-800 tracking-tight">
                          {job.title}
                        </h3>
                        <span
                          className={`${statusBadge.bg} ${statusBadge.text} px-2 py-1 rounded-md text-xs font-bold shadow-md`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className=" text-gray-400 hover:text-primary transition-colors">
                          <Bookmark className="w-7 h-7" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center text-yellow-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                      <span className="text-gray-600 text-md ml-2">
                        {employerName} • {job.location || "Sri Lanka"}
                      </span>
                    </div>
                    <div className="text-gray-800 font-semibold text-lg mb-2 text-start">
                      {payText}
                    </div>

                    <div className="flex gap-2">
                      {job.category && (
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-md">
                          {job.category.replace(/_/g, " ")}
                        </span>
                      )}
                      {job.urgency && job.urgency !== "not_urgent" && (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded text-md font-semibold">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-gray-500 text-md">
                        {postedAgo(job.createdAt)}
                      </div>
                      <button className=" bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
            {!jobsError && recentJobs.length === 0 && (
              <div className="text-gray-500 text-sm">
                No recent jobs available.
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Features section - Testimonial Slider */}
      <section className="py-16 bg-[linear-gradient(135deg,#031437_0%,#0F0F0F_100%)] text-white rounded-t-3xl">
        <div className="max-w-full mx-auto px-6 sm:px-24">
          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <Reveal className="order-2 md:order-1">
              <p className="text-2xl md:text-3xl lg:text-4xl leading-relaxed text-gray-200">
                {slides[activeSlide].textTop}{" "}
                <span className="text-[#7B5FF1] font-extrabold">
                  {slides[activeSlide].textHighlight}
                </span>{" "}
                {slides[activeSlide].textBottom}
              </p>
            </Reveal>

            {/* Image */}
            <Reveal
              delay={120}
              className="order-1 md:order-2 justify-self-center"
            >
              <img
                src={slides[activeSlide].img}
                alt="testimonial visual"
                className="w-full max-w-md rounded-2xl shadow-xl object-cover"
                loading="eager"
              />
            </Reveal>
          </div>
          {/* Controls at bottom (all sizes) */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={prevSlide}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={nextSlide}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-12 bg-white">
        <div className="max-w-full px-6 sm:px-24">
          <Reveal className="text-3xl font-semibold text-center mb-12 text-accent tracking-tight">
            Payment Plans
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Reveal
              className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start"
              delay={0}
            >
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
            </Reveal>
            {/* Standard Plan */}
            <Reveal
              className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start"
              delay={120}
            >
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
            </Reveal>
            {/* Professional Plan */}
            <Reveal
              className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col text-start"
              delay={240}
            >
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
            </Reveal>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-full mx-auto px-6 sm:px-24">
          <Reveal className="text-3xl font-semibold text-center mb-12 text-accent tracking-tight">
            Categories
          </Reveal>
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
            ].map((category, idx) => (
              <Reveal key={category} delay={idx * 70}>
                <button className="w-full text-center border border-accent bg-gradient-to-r from-[#7B5FF1] to-[#3265F2] bg-clip-text text-transparent py-3 px-4 rounded-xl hover:bg-purple-200 transition-colors text-lg font-semibold tracking-tight">
                  {category}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <Reveal delay={960}>
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-full px-6 sm:px-24 flex-col  text-center gap-2">
            <Reveal delay={1080}>
              <h2 className="text-4xl font-md mb-2">
                Are you ready to{" "}
                <span className="text-white text-5xl font-bold">
                  GET STARTED
                </span>
              </h2>
              <p className="text-4xl">
                with{" "}
                <span className="bg-gradient-to-r from-[#7B5FF1] to-[#3265F2] bg-clip-text text-transparent text-5xl font-bold">
                  FlexEra
                </span>
              </p>
            </Reveal>
            <Reveal delay={1100}>
              <button className="bg-accent hover:bg-purple-700 mt-12 px-8 py-3 rounded-xl font-semibold transition-colors">
                Get Started
              </button>
            </Reveal>
          </div>
        </section>

        <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
          <div className="max-w-full mx-auto px-6 sm:px-24">
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
                &copy; 2025 FlexEra. All rights reserved.
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
      </Reveal>
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
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/who-are-we" element={<WhoAreWe />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes - Role-based dashboards */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === "job_seeker" && <JobSeekerDashboard />}
            {user?.role === "talent_connector" && <TalentConnectorDashboard />}
            {user?.role === "admin" && <AdminDashboard />}
            {!user?.role && <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-seeker-dashboard"
        element={
          <ProtectedRoute allowedRoles={["job_seeker"]}>
            <JobSeekerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/talent-connector-dashboard"
        element={
          <ProtectedRoute allowedRoles={["talent_connector"]}>
            <TalentConnectorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-job"
        element={
          <ProtectedRoute allowedRoles={["talent_connector"]}>
            <CreateJobForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/talent/jobs/:jobId"
        element={
          <ProtectedRoute allowedRoles={["talent_connector"]}>
            <TalentJobDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/talent/jobs/:jobId/candidates"
        element={
          <ProtectedRoute allowedRoles={["talent_connector"]}>
            <TalentJobCandidates />
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

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Navigate to="/admin-dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="templates" element={<AdminDashboard />} />
      </Route>

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
