import { ChevronDown, MapPin, Search as SearchIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  applicationService,
  type ApplicationDTO,
} from "../services/applicationService";
import { Job, jobService } from "../services/jobService";

const JobSeekerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [successMessage, setSuccessMessage] = useState("");
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string>("");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedJobs: 0,
    appliedJobs: 0,
  });

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

  // Redirect if user is not a job seeker
  useEffect(() => {
    if (user && user.role !== "job_seeker") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch recent jobs (same as landing page)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const first = await jobService.getAllJobs(1, 50);
        if (cancelled) return;
        let all: Job[] = first.jobs || [];
        const totalPages = first.pages || 1;
        if (totalPages > 1) {
          const restPromises: Promise<
            import("../services/jobService").JobsResponse
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

  // Load my applications and compute earnings and counts
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user) return;
        const apps = await applicationService.myApplications();
        if (cancelled) return;
        const appliedJobs = apps.length;
        // Determine completed apps
        const isCompleted = (a: ApplicationDTO) => {
          const st = (a.status || "").toString().toLowerCase();
          if (st.includes("complete")) return true;
          const sk = !!(a.completedBySeeker || a.completedBySeekerAt);
          const ck = !!(a.completedByConnector || a.completedByConnectorAt);
          return sk && ck;
        };
        const completed = apps.filter(isCompleted);
        const completedJobs = completed.length;
        // Fetch unique job details for completed apps to get paymentAmount
        const jobIds = Array.from(new Set(completed.map((a) => a.jobId)));
        const jobs = await Promise.all(
          jobIds.map((jid) =>
            jobService
              .getJobById(jid)
              .then((j) => j)
              .catch(() => null)
          )
        );
        const paymentMap = new Map<string, number>();
        for (const j of jobs)
          if (j) paymentMap.set(j._id, Number((j as any).paymentAmount || 0));
        let totalEarnings = 0;
        for (const a of completed) {
          const amt = paymentMap.get(a.jobId) || 0;
          totalEarnings += amt;
        }
        if (!cancelled) setStats({ totalEarnings, completedJobs, appliedJobs });
      } catch (e) {
        // Keep prior values on error
        console.error("Failed to compute seeker stats", e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const postedAgo = (iso?: string) => {
    if (!iso) return "Posted recently";
    const createdMs = new Date(iso).getTime();
    const nowMs = Date.now();
    const days = Math.max(
      0,
      Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24))
    );
    if (days === 0) return "Posted today";
    if (days === 1) return "Posted a day ago";
    if (days < 7) return `Posted ${days} days ago`;
    const d = new Date(createdMs);
    return `Posted on ${d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })}`;
  };

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

  if (!user || user.role !== "job_seeker") {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 lg:px-12  xl:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#hero" className="hover:text-blue-400 transition-colors">
              Home
            </a>
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

      <nav className="bg-[linear-gradient(135deg,#0B1022_0%,#0D0D15_100%)] text-white shadow-sm border-b border-black/5 sticky top-16 z-40">
        <div className="max-w-full px-6 lg:px-12  xl:px-24 py-3 md:h-14 flex items-center">
          <div className="flex items-center justify-between sm:justify-normal sm:gap-4 w-full">
            {[
              {
                key: "dashboard",
                label: "Dashboard",
                path: "/job-seeker-dashboard",
              },
              { key: "manage", label: "Manage Jobs", path: "/jobs" },
              { key: "finances", label: "Finances", path: "/finances" },
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

      <main>
        <div>
          {/* statistics */}
          <div className="bg-[linear-gradient(180deg,#0B1022_0%,#0F1B2E_100%)] rounded-b-2xl shadow mb-6 px-6 lg:px-12  xl:px-24 sm:pt-6 pt-4 pb-24">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 shadow border">
                <div className="text-sm text-gray-600">Total Earnings</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalEarnings} LKR
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow border">
                <div className="text-sm text-gray-600">Completed Jobs</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                  {stats.completedJobs}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow border">
                <div className="text-sm text-gray-600">Applied Jobs</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                  {stats.appliedJobs}
                </div>
              </div>
              <div className="rounded-xl p-4 shadow text-white bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-900/80">Feedbacks</div>
                    <div className="text-2xl sm:text-3xl font-bold mt-1">3</div>
                  </div>
                  <span className="text-xl">↗</span>
                </div>
              </div>
              <div className="rounded-xl p-4 shadow text-white bg-gradient-to-r from-[#7B5FF1] to-[#3265F2]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/80">Membership Plan</div>
                    <div className="text-2xl sm:text-3xl font-bold">Free</div>
                  </div>
                  <button className="bg-white/90 text-primary px-3 py-1 rounded-full text-sm font-semibold hover:bg-white">
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar Block */}
          <div className="px-6 lg:px-12  xl:px-24  -mt-16">
            <div className="bg-white rounded-2xl shadow-md border p-4 sm:p-6 mb-6">
              <p className="text-gray-600 mb-4 text-start text-sm">
                Find your next gig opportunity in Sri Lanka. Search, explore,
                and apply for jobs that match your skills and flexibility.
              </p>
              <div className="flex flex-col md:flex-row items-stretch gap-3">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search job"
                    className="w-full   pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative w-full xl:w-auto">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select className="w-full xl:w-auto pl-10 pr-8 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option>Location</option>
                    <option>Colombo</option>
                    <option>Kandy</option>
                    <option>Galle</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
                <div className="relative w-full xl:w-auto">
                  <select className="w-full xl:w-auto pl-4 pr-8 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option>Category</option>
                    <option>Tutoring</option>
                    <option>Retail & Sales</option>
                    <option>Delivery Services</option>
                    <option>Event Support</option>
                    <option>Hospitality</option>
                    <option>Digital Services</option>
                    <option>Household Services</option>
                    <option>Creative Work</option>
                    <option>Administrative Support</option>
                    <option>Seasonal Work</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
                <div className="relative w-full xl:w-auto">
                  <select className="w-full xl:w-auto pl-4 pr-8 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option>Rate</option>
                    <option>Hourly</option>
                    <option>Fixed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
                <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {/**AI Recommendations */}
          <div className="px-6 lg:px-12  xl:px-24 mb-6">
            <div>
              <p>AI Recommendations just for you</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobSeekerDashboard;
