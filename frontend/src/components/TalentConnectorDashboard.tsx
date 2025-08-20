import { Camera } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { jobService } from "../services/jobService";
import {
  profileCapabilities,
  profileService,
} from "../services/profileService";

const TalentConnectorDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(64);
  const navigate = useNavigate();
  const location = useLocation();

  // Measure header height early to avoid conditional hook execution
  useLayoutEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderH(headerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "my-jobs" | "applications" | "finances" | "account"
  >("dashboard");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bio, setBio] = useState<string>("");
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false); // kept for compatibility but controlled by isEditingProfile
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const defaultAvatar =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%23e5e7eb"/><circle cx="64" cy="50" r="22" fill="%239ca3af"/><path d="M20 112c8-20 26-32 44-32s36 12 44 32" fill="%239ca3af"/></svg>';

  useEffect(() => {
    // Initialize editable fields from user
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmailInput(user?.email ?? "");
    setBio(user?.bio ?? "");
    setProfileImage(user?.profileImageUrl ?? null);
  }, [user]);

  // Persist profile helper (called by Save Changes)
  const persistProfile = async (overrides?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    profileImageUrl?: string | null;
  }) => {
    try {
      const payload = {
        firstName: (overrides?.firstName ?? firstName) || undefined,
        lastName: (overrides?.lastName ?? lastName) || undefined,
        email: (overrides?.email ?? emailInput) || undefined,
        bio: (overrides?.bio ?? bio) || undefined,
        profileImageUrl:
          (overrides?.profileImageUrl ?? user?.profileImageUrl) || undefined,
      } as const;
      if (profileCapabilities.hasProfileEndpoint) {
        const updated = await profileService.updateProfile(payload);
        // Merge to ensure header gets latest fields even if backend omits some keys
        const next = {
          ...(user as any),
          ...updated,
          firstName:
            payload.firstName ?? updated.firstName ?? (user as any)?.firstName,
          lastName:
            payload.lastName ?? updated.lastName ?? (user as any)?.lastName,
          email: payload.email ?? updated.email ?? (user as any)?.email,
          bio: payload.bio ?? updated.bio ?? (user as any)?.bio,
          profileImageUrl:
            payload.profileImageUrl ??
            updated.profileImageUrl ??
            (user as any)?.profileImageUrl ??
            null,
        } as any;
        updateUser(next);
      } else if (profileCapabilities.devLocalAvatar) {
        updateUser({
          ...(user as any),
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          bio: payload.bio,
          profileImageUrl: payload.profileImageUrl,
        });
      } else {
        setSuccessMessage(
          "Profile endpoints are not configured. Set REACT_APP_PROFILE_UPDATE_PATH or enable REACT_APP_DEV_LOCAL_AVATAR."
        );
        setTimeout(() => setSuccessMessage(""), 4000);
        throw new Error("No profile endpoint and dev fallback disabled");
      }
      setSuccessMessage("Profile updated");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (e) {
      console.error("Persist profile failed", e);
      setSuccessMessage("Failed to update profile");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // TODO: Replace mock data with API data
  const [stats, setStats] = useState({
    totalSpendings: 0,
    totalJobsPosted: 0,
    activePosts: 0,
    totalApplicants: 0,
    totalHirings: 0,
  });

  // Removed hardcoded jobs; only show backend jobs
  // Real jobs fetched for current talent connector (merged with mock)
  const [myJobs, setMyJobs] = useState<
    {
      id: string;
      title: string;
      applicants: number;
      postedOn: string;
      status: "active" | "expired" | "deactivated";
    }[]
  >([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [confirmJobId, setConfirmJobId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmType, setConfirmType] = useState<
    "delete" | "deactivate" | "activate" | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    const fetchMyJobs = async () => {
      if (!user) return;
      try {
        setLoadingJobs(true);
        setJobsError(null);
        const resp = await jobService.getMyJobs(1, 20);
        if (cancelled) return;
        const mapped = (resp.jobs || []).map((j) => ({
          id: j._id,
          title: j.title,
          applicants: j.applicationsCount ?? 0,
          postedOn: (j.createdAt || new Date().toISOString()).slice(0, 10),
          status:
            j.status === "cancelled"
              ? ("deactivated" as const)
              : j.status === "completed"
                ? ("expired" as const)
                : ("active" as const),
        }));
        setMyJobs(mapped);
        // Compute real stats
        const totalJobsPosted = resp.total ?? mapped.length;
        const activePosts = (resp.jobs || []).filter(
          (j) => j.status === "active"
        ).length;
        const totalApplicants = (resp.jobs || []).reduce(
          (sum, j) => sum + (j.applicationsCount || 0),
          0
        );
        setStats((prev) => ({
          ...prev,
          totalJobsPosted,
          activePosts,
          totalApplicants,
        }));
      } catch (e: any) {
        console.error("Failed to load my jobs", e);
        setJobsError("Failed to load your jobs");
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    };
    fetchMyJobs();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Recompute stats whenever myJobs changes so dashboard stays in sync after activate/deactivate/delete
  useEffect(() => {
    const totalJobsPosted = myJobs.length;
    const activePosts = myJobs.filter((j) => j.status === "active").length;
    const totalApplicants = myJobs.reduce(
      (sum, j) => sum + (j.applicants || 0),
      0
    );
    setStats((prev) => ({
      ...prev,
      totalJobsPosted,
      activePosts,
      totalApplicants,
    }));
  }, [myJobs]);

  const combinedJobs = [...myJobs].sort(
    (a, b) => new Date(b.postedOn).getTime() - new Date(a.postedOn).getTime()
  );
  const activeJobs = combinedJobs.filter((j) => j.status === "active");

  const reviews = [
    {
      id: "r1",
      candidate: "N. Perera",
      comment: "Great experience!",
      rating: 5,
      jobTitle: "Part-time Barista",
      postedOn: "2025-08-09",
    },
    {
      id: "r2",
      candidate: "S. Silva",
      comment: "Clear communication.",
      rating: 4,
      jobTitle: "Retail Assistant (Weekend)",
      postedOn: "2025-08-07",
    },
  ];

  // Job filters for Job Management tab
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "deactivated"
  >("all");
  const filteredJobs =
    filter === "all"
      ? combinedJobs
      : combinedJobs.filter((j) => j.status === filter);

  const upcomingInterviews = [
    {
      id: "iv1",
      jobTitle: "Barista",
      candidate: "K. Jayasinghe",
      phone: "+94 77 123 4567",
      date: "2025-08-12 10:00",
    },
    {
      id: "iv2",
      jobTitle: "Retail Assistant",
      candidate: "M. Fernando",
      phone: "+94 76 987 6543",
      date: "2025-08-13 14:30",
    },
  ];

  // Mock finances data (replace with API data later)
  const subscriptionPayments = [
    { id: "s1", paidDate: "2025-07-01", amount: 2500, invoiceUrl: "#" },
    { id: "s2", paidDate: "2025-08-01", amount: 2500, invoiceUrl: "#" },
  ];

  const candidateSalaryPayments = [
    {
      id: "c1",
      paidDate: "2025-08-05",
      amount: 8000,
      name: "K. Jayasinghe",
      invoiceUrl: "#",
    },
    {
      id: "c2",
      paidDate: "2025-08-08",
      amount: 12000,
      name: "M. Fernando",
      invoiceUrl: "#",
    },
  ];

  const totalCandidateSpent = candidateSalaryPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

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

  // Sync tab from URL query (?tab=my-jobs)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") as
      | "dashboard"
      | "my-jobs"
      | "applications"
      | "finances"
      | "account"
      | null;
    if (
      tab &&
      ["dashboard", "my-jobs", "applications", "finances", "account"].includes(
        tab
      )
    ) {
      if (activeTab !== tab) setActiveTab(tab);
    }
  }, [location.search]);

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
    <div className="min-h-screen bg-white" style={{ paddingTop: headerH }}>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center"
      >
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>

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
                <div className="flex items-center space-x-3">
                  <img
                    src={user.profileImageUrl || defaultAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
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

      <nav
        className="bg-white shadow-sm border-b border-black/5 sticky z-40"
        style={{ top: headerH }}
      >
        <div className="max-w-full px-6 sm:px-24 py-3 md:h-14 flex items-center">
          <div className="flex w-full flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
            <div className="flex items-center justify-between flex-wrap gap-4 md:gap-12">
              {(
                [
                  { key: "dashboard", label: "Dashboard" },
                  { key: "my-jobs", label: "Job Management" },
                  { key: "finances", label: "Finances" },
                  { key: "account", label: "Account" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    // Update URL to persist current tab
                    const params = new URLSearchParams(location.search);
                    params.set("tab", t.key);
                    navigate(`${location.pathname}?${params.toString()}`, {
                      replace: true,
                    });
                  }}
                  className={`text-md font-semibold py-2 hover:text-gray-600 transition-colors ${
                    activeTab === t.key ? "text-accent" : ""
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="w-full md:w-auto">
              <Link to="/create-job" className="block w-full">
                <h3 className="w-full text-center text-md bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-accent transition-colors">
                  Post a Job
                </h3>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-full">
        <div>
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <div className="overflow-hidden">
            <div className=" bg-[#F3F8F9] max-w-full ">
              {activeTab === "dashboard" && (
                <>
                  {/* Quick Stats */}
                  <div className="px-6 sm:px-24 grid grid-cols-2 md:grid-cols-5 py-6 sm:py-8 gap-4 bg-slate-950">
                    <div className="bg-slate-900  rounded-xl  p-4  text-center">
                      <h4 className="text-xl font-bold text-slate-50">
                        LKR {stats.totalSpendings}
                      </h4>
                      <p className="text-slate-100">Total Spendings</p>
                    </div>
                    <div className="bg-slate-900  p-4 rounded-xl text-center">
                      <h4 className="text-xl font-bold text-slate-50">
                        {stats.totalJobsPosted}
                      </h4>
                      <p className="text-slate-100">Total Jobs Posted</p>
                    </div>
                    <div className="bg-slate-900  p-4 rounded-xl text-center">
                      <h4 className="text-xl font-bold text-slate-50">
                        {stats.activePosts}
                      </h4>
                      <p className="text-slate-100">Active Posts</p>
                    </div>
                    <div className="bg-slate-900  p-4 rounded-xl text-center">
                      <h4 className="text-xl font-bold text-slate-50">
                        {stats.totalApplicants}
                      </h4>
                      <p className="text-slate-100">Total Applicants</p>
                    </div>
                    <div className="bg-slate-900  p-4 rounded-xl text-center">
                      <h4 className="text-xl font-bold text-slate-50">
                        {stats.totalHirings}
                      </h4>
                      <p className="text-slate-100">Total Hirings</p>
                    </div>
                  </div>

                  {/* Upcoming Interviews */}
                  <div className="mt-4 w-full px-6 sm:px-24 bg-white py-8">
                    <h3 className="text-md text-center md:text-start font-semibold text-gray-900 mb-4">
                      Upcoming Interview Calls
                    </h3>
                    <div className="bg-white border rounded-xl divide-y">
                      {upcomingInterviews.map((iv) => (
                        <div
                          key={iv.id}
                          className="p-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-start"
                        >
                          <div>
                            <p className="text-sm text-gray-500">Job Title</p>
                            <p className="font-medium">{iv.jobTitle}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Candidate</p>
                            <p className="font-medium">{iv.candidate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{iv.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date/Time</p>
                            <p className="font-medium">{iv.date}</p>
                          </div>
                        </div>
                      ))}
                      {upcomingInterviews.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No upcoming interviews
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Active Job Posts */}
                  <div className="mt-4 w-full px-6 sm:px-24 bg-white py-8 ">
                    <h3 className="text-md text-center md:text-start font-semibold text-gray-900 mb-4">
                      Active Job Posts
                    </h3>
                    <div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {activeJobs.map((job) => (
                          <Link
                            to={`/talent/jobs/${job.id}`}
                            key={job.id}
                            className="block hover:bg-gray-50 border rounded-xl p-2"
                          >
                            <div className="p-2 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900 text-start">
                                  {job.title}
                                </p>
                                <p className="text-sm text-gray-500 text-start">
                                  Posted on {job.postedOn}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600">
                                Applicants: {job.applicants}
                              </div>
                            </div>
                          </Link>
                        ))}
                        {activeJobs.length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            No active jobs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="mt-4 w-full px-6 sm:px-24 bg-white py-8">
                    <h3 className="text-md text-center md:text-start font-semibold text-gray-900 mb-4">
                      Reviews from Job Seekers
                    </h3>
                    <div className="bg-white border rounded-xl divide-y">
                      {reviews.map((r) => (
                        <div key={r.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              {r.candidate}
                            </p>
                            <span className="text-yellow-500">
                              {"★".repeat(r.rating)}
                              {"☆".repeat(5 - r.rating)}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{r.comment}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Job: {r.jobTitle} • Posted on {r.postedOn}
                          </p>
                        </div>
                      ))}
                      {reviews.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No reviews yet
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "my-jobs" && (
                <div>
                  {/* Filters */}
                  <div className="flex gap-2 mb-4 px-6 sm:px-24 bg-white py-8">
                    {(
                      [
                        { key: "all", label: "All Jobs" },
                        { key: "active", label: "Active Jobs" },
                        { key: "expired", label: "Expired Jobs" },
                        { key: "deactivated", label: "Deactivated Jobs" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          filter === f.key
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1  gap-4 px-6 sm:px-24 bg-white py-8">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white border rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => navigate(`/talent/jobs/${job.id}`)}
                        >
                          <div className="flex items-center justify-between ">
                            <div className="flex gap-3">
                              <p className="font-medium text-lg tracking-tight text-gray-900 line-clamp-2">
                                {job.title}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                  job.status === "active"
                                    ? "bg-[#64F272] text-gray-900"
                                    : job.status === "deactivated"
                                      ? "bg-amber-200 text-amber-900"
                                      : "bg-gray-300 text-gray-700"
                                }`}
                              >
                                {job.status === "active"
                                  ? "ACTIVE"
                                  : job.status === "deactivated"
                                    ? "DEACTIVATED"
                                    : "EXPIRED"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.status === "active" ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/create-job", {
                                        state: { editJobId: job.id },
                                      });
                                    }}
                                    className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmJobId(job.id);
                                      setConfirmType("deactivate");
                                      setConfirmVisible(true);
                                    }}
                                    className="px-3 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm"
                                  >
                                    Deactivate
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmJobId(job.id);
                                      setConfirmType("delete");
                                      setConfirmVisible(true);
                                    }}
                                    className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmJobId(job.id);
                                      setConfirmType("activate");
                                      setConfirmVisible(true);
                                    }}
                                    className="px-3 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm"
                                  >
                                    Activate job
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/create-job", {
                                        state: {
                                          editJobId: job.id,
                                        },
                                      });
                                    }}
                                    className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmJobId(job.id);
                                      setConfirmType("delete");
                                      setConfirmVisible(true);
                                    }}
                                    className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-start text-gray-500 mt-1">
                            Posted on {job.postedOn}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <p className="text-md font-medium text-start text-gray-800">
                              Applicants: {job.applicants}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/talent/jobs/${job.id}/candidates`);
                              }}
                              className="px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-sm"
                            >
                              View Candidates
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredJobs.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No jobs found
                      </div>
                    )}
                  </div>
                  {/* Confirm Delete/Deactivate Modal */}
                  {confirmVisible && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {confirmType === "delete" &&
                            "Are you sure you want to delete this job?"}
                          {confirmType === "deactivate" &&
                            "Deactivate this job?"}
                          {confirmType === "activate" && "Activate this job?"}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {confirmType === "delete"
                            ? "By deleting this job you will delete all data relevant to this job."
                            : confirmType === "deactivate"
                              ? "This will pause applications and mark the job as deactivated."
                              : "This will make the job active again and visible to applicants."}
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                            disabled={confirmBusy}
                            onClick={() => {
                              setConfirmVisible(false);
                              setConfirmJobId(null);
                              setConfirmType(null);
                            }}
                          >
                            Cancel
                          </button>
                          {confirmType === "delete" && (
                            <button
                              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm disabled:opacity-50"
                              disabled={confirmBusy}
                              onClick={async () => {
                                if (!confirmJobId) return;
                                try {
                                  setConfirmBusy(true);
                                  const isValid =
                                    await authService.validateToken();
                                  if (!isValid) {
                                    setSuccessMessage(
                                      "Session expired. Please log in again."
                                    );
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                    navigate("/login");
                                    return;
                                  }
                                  await jobService.deleteJob(confirmJobId);
                                  setMyJobs((prev) =>
                                    prev.filter((j) => j.id !== confirmJobId)
                                  );
                                  setSuccessMessage("Job successfully deleted");
                                  setTimeout(() => setSuccessMessage(""), 3000);
                                } catch (e: any) {
                                  console.error("Delete failed", e);
                                  const status = e?.response?.status;
                                  if (status === 401) {
                                    setSuccessMessage(
                                      "Session expired. Please log in again."
                                    );
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                    navigate("/login");
                                  } else if (status === 404) {
                                    setSuccessMessage("Job not found.");
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                    // Optimistically remove from UI
                                    setMyJobs((prev) =>
                                      prev.filter((j) => j.id !== confirmJobId)
                                    );
                                  } else {
                                    setSuccessMessage("Update failed");
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                  }
                                } finally {
                                  setConfirmBusy(false);
                                  setConfirmVisible(false);
                                  setConfirmJobId(null);
                                  setConfirmType(null);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                          {(confirmType === "deactivate" ||
                            confirmType === "activate") && (
                            <button
                              className="px-4 py-2 rounded-lg border text-amber-700 border-amber-300 hover:bg-amber-50 text-sm disabled:opacity-50"
                              disabled={confirmBusy}
                              onClick={async () => {
                                if (!confirmJobId) return;
                                try {
                                  setConfirmBusy(true);
                                  const isValid =
                                    await authService.validateToken();
                                  if (!isValid) {
                                    setSuccessMessage(
                                      "Session expired. Please log in again."
                                    );
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                    navigate("/login");
                                    return;
                                  }
                                  const targetStatus =
                                    confirmType === "deactivate"
                                      ? "cancelled"
                                      : "active";
                                  const updated =
                                    await jobService.updateJobStatus(
                                      confirmJobId,
                                      targetStatus
                                    );
                                  const localStatus =
                                    updated.status === "cancelled"
                                      ? ("deactivated" as const)
                                      : updated.status === "completed"
                                        ? ("expired" as const)
                                        : ("active" as const);
                                  setMyJobs((prev) =>
                                    prev.map((j) =>
                                      j.id === confirmJobId
                                        ? { ...j, status: localStatus }
                                        : j
                                    )
                                  );
                                  setSuccessMessage(
                                    confirmType === "deactivate"
                                      ? "Job successfully deactivated"
                                      : "Job successfully activated"
                                  );
                                  setTimeout(() => setSuccessMessage(""), 3000);
                                } catch (e: any) {
                                  console.error("Status update failed", e);
                                  const status = e?.response?.status;
                                  if (status === 401) {
                                    setSuccessMessage(
                                      "Session expired. Please log in again."
                                    );
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                    navigate("/login");
                                  } else if (status === 403) {
                                    setSuccessMessage("Update failed");
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                  } else if (status === 404) {
                                    setSuccessMessage("Job not found.");
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                  } else {
                                    setSuccessMessage("Update failed");
                                    setTimeout(
                                      () => setSuccessMessage(""),
                                      3000
                                    );
                                  }
                                } finally {
                                  setConfirmBusy(false);
                                  setConfirmVisible(false);
                                  setConfirmJobId(null);
                                  setConfirmType(null);
                                }
                              }}
                            >
                              {confirmType === "deactivate"
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div>
                  <div className="mb-4 flex items-center justify-between mt-4 px-6 sm:px-24 bg-white py-8">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Account
                    </h3>
                    <div className="flex gap-2 ">
                      <button
                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setIsEditingProfile(true);
                          setIsEditingBio(true);
                        }}
                        disabled={isEditingProfile}
                      >
                        Update Profile
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={async () => {
                          let uploadedUrl: string | undefined = undefined;
                          let avatarError: unknown = undefined;
                          // 1) Try avatar upload if a new file was picked
                          if (profileFile) {
                            try {
                              const up =
                                await profileService.uploadAvatar(profileFile);
                              uploadedUrl = up.url;
                            } catch (err) {
                              avatarError = err;
                              console.error("Avatar upload failed", err);
                            }
                          }

                          // 2) Try to persist bio (and avatar url if available) regardless of avatar error
                          try {
                            // Avoid persisting temporary blob URLs unless dev fallback is enabled
                            const finalProfileUrl =
                              uploadedUrl ??
                              (profileCapabilities.devLocalAvatar
                                ? (profileImage ?? undefined)
                                : undefined) ??
                              user?.profileImageUrl ??
                              null;
                            await persistProfile({
                              bio,
                              profileImageUrl: finalProfileUrl,
                            });
                            // If avatar failed but bio saved, surface a useful message
                            if (avatarError) {
                              setSuccessMessage(
                                "Bio saved. Avatar not updated: configure REACT_APP_AVATAR_UPLOAD_PATH or enable REACT_APP_DEV_LOCAL_AVATAR."
                              );
                              setTimeout(() => setSuccessMessage(""), 4000);
                            }
                            setIsEditingProfile(false);
                            setIsEditingBio(false);
                            setProfileFile(null);
                          } catch (e) {
                            console.error("Save changes failed", e);
                            setSuccessMessage(
                              "Failed to save changes. Please try again."
                            );
                            setTimeout(() => setSuccessMessage(""), 3000);
                          }
                        }}
                        disabled={!isEditingProfile}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 px-6 sm:px-24 bg-white py-8">
                    {/* Profile Photo */}
                    <div className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                      <img
                        src={profileImage || defaultAvatar}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border"
                      />
                      {isEditingProfile && (
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer text-sm">
                          <Camera size={16} />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setProfileImage(url);
                                setProfileFile(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Name & Email */}
                    <div className="bg-white border rounded-xl p-4 lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Full Name
                          </label>
                          <div
                            className="w-full border rounded-lg px-3 py-2 text-gray-900 bg-gray-50 cursor-default select-text"
                            aria-readonly
                          >
                            {`${(firstName || "").trim()} ${(lastName || "").trim()}`.trim() ||
                              "Anonymous"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Email
                          </label>
                          <div
                            className="w-full border rounded-lg px-3 py-2 text-gray-900 bg-gray-50 cursor-default select-text"
                            aria-readonly
                          >
                            {emailInput || "you@example.com"}
                          </div>
                        </div>
                      </div>
                      {/* Name & Email are read-only per requirements */}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-4 px-6 sm:px-24 bg-white py-8 space-y-6">
                    <div className=" border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Bio
                        </h4>
                        {/* Add Bio button hidden until Update Profile */}
                      </div>
                      {!isEditingProfile ? (
                        <p className="text-gray-600">
                          {bio ? bio : "No bio added yet."}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Write something about you..."
                          />
                          {/* Bio saving is handled by Save Changes button above */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "finances" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6  w-full px-6 sm:px-24 bg-slate-950 py-8">
                    <div className="bg-accent shadow rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-slate-100">
                        Subscription Fee
                      </h4>
                      <p className="text-slate-200">Current plan: Basic</p>
                      <p className="text-slate-50 font-bold mt-1">LKR 0.00</p>
                    </div>
                    <div className="bg-slate-900 shadow rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-slate-100">
                        Candidate Payments
                      </h4>
                      <p className="text-slate-200">Total Spent to Date</p>
                      <p className="text-slate-50 font-bold mt-1">
                        LKR {totalCandidateSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Subscriptions Table */}
                  <div className="mt-4 px-6 sm:px-24 bg-white py-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Subscriptions
                    </h4>
                    <div className="overflow-x-auto bg-white border rounded-xl">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3">Paid date</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {subscriptionPayments.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{row.paidDate}</td>
                              <td className="px-4 py-3">
                                LKR {row.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={row.invoiceUrl}
                                  className="text-blue-600 hover:underline"
                                >
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                          {subscriptionPayments.length === 0 && (
                            <tr>
                              <td
                                className="px-4 py-3 text-center text-gray-500"
                                colSpan={3}
                              >
                                No subscriptions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Candidate Salary Table */}
                  <div className="mt-4 px-6 sm:px-24 bg-white py-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Candidate Salary
                    </h4>
                    <div className="overflow-x-auto bg-white border rounded-xl">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3">Paid date</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {candidateSalaryPayments.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{row.paidDate}</td>
                              <td className="px-4 py-3">
                                LKR {row.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">{row.name}</td>
                              <td className="px-4 py-3">
                                <a
                                  href={row.invoiceUrl}
                                  className="text-blue-600 hover:underline"
                                >
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                          {candidateSalaryPayments.length === 0 && (
                            <tr>
                              <td
                                className="px-4 py-3 text-center text-gray-500"
                                colSpan={4}
                              >
                                No salary payments found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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

export default TalentConnectorDashboard;
