import { Camera } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { jobService } from "../services/jobService";
import { applicationService, type ApplicationDTO } from "../services/applicationService";
import {
  profileCapabilities,
  profileService,
} from "../services/profileService";

const TalentConnectorDashboard: React.FC = () => {
  const { user, logout, updateUser, profile: globalProfile, refreshProfile } = useAuth();
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
  const bioTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false); // kept for compatibility but controlled by isEditingProfile
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  // Snapshot to restore values when cancelling edit mode
  const editSnapshotRef = useRef<null | {
    bio: string;
    servicesLookingFor: string[];
    skillsLookingFor: string[];
    langSinhala: number;
    langTamil: number;
    langEnglish: number;
    profileImage: string | null;
  }>(null);
  // Connector profile fields (per backend profile.schema.ts)
  const [servicesLookingFor, setServicesLookingFor] = useState<string[]>([]);
  const [skillsLookingFor, setSkillsLookingFor] = useState<string[]>([]);
  const [newService, setNewService] = useState<string>("");
  const [newSkill, setNewSkill] = useState<string>("");
  // Languages (0-10)
  const [langSinhala, setLangSinhala] = useState<number>(0);
  const [langTamil, setLangTamil] = useState<number>(0);
  const [langEnglish, setLangEnglish] = useState<number>(0);
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
    setProfileImage(user?.profileImageUrl ?? null);
  }, [user]);

  // Auto-size bio textarea when editing
  useEffect(() => {
    if (!isEditingProfile) return;
    const el = bioTextareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [bio, isEditingProfile]);

  // Load structured profile from backend so data persists across refresh/login
  useEffect(() => {
    // Single refresh only when we have a user and no global profile yet
    if (!user) return;
    if (!globalProfile) {
      refreshProfile?.();
    }
  }, [user, globalProfile, refreshProfile]);

  // Also hydrate view state from global profile when available/updated
  useEffect(() => {
    const prof = globalProfile;
    if (!prof) return;
    if (prof.languages) {
      setLangSinhala(Number(prof.languages.sinhala ?? 0));
      setLangTamil(Number(prof.languages.tamil ?? 0));
      setLangEnglish(Number(prof.languages.english ?? 0));
    }
    if (prof.connector) {
      if (typeof prof.connector.bio === "string") setBio(prof.connector.bio);
      setServicesLookingFor(
        Array.isArray(prof.connector.servicesLookingFor)
          ? prof.connector.servicesLookingFor
          : []
      );
      setSkillsLookingFor(
        Array.isArray(prof.connector.skillsLookingFor)
          ? prof.connector.skillsLookingFor
          : []
      );
    }
    if (prof.profilePhotoUrl) {
      setProfileImage(prof.profilePhotoUrl);
      if (user?.profileImageUrl !== prof.profilePhotoUrl) {
        updateUser({ ...(user as any), profileImageUrl: prof.profilePhotoUrl } as any);
      }
    }
  }, [globalProfile]);

  // Ensure profile is refreshed when Account tab becomes active (e.g., after page refresh)
  useEffect(() => {
    if (user && activeTab === "account") {
      refreshProfile?.();
    }
  }, [user, activeTab]);

  // Persist profile helper (called by Save Changes)
  const persistProfile = async (overrides?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    profileImageUrl?: string | null;
    suppressToast?: boolean;
  }) => {
    try {
      const payload = {
        firstName: (overrides?.firstName ?? firstName) || undefined,
        lastName: (overrides?.lastName ?? lastName) || undefined,
        email: (overrides?.email ?? emailInput) || undefined,
        // Backend expects connector bio under `connectorBio`
        connectorBio: (overrides?.bio ?? bio) || undefined,
        // Include connector arrays so they persist with the lightweight PATCH too
        servicesLookingFor: servicesLookingFor,
        skillsLookingFor: skillsLookingFor,
        profileImageUrl:
          (overrides?.profileImageUrl ?? user?.profileImageUrl) || undefined,
      } as const;
      if (profileCapabilities.hasProfileEndpoint) {
        const updated = await profileService.updateProfile(payload as any);
        // Merge to ensure header gets latest fields even if backend omits some keys
        const next = {
          ...(user as any),
          ...updated,
          firstName:
            payload.firstName ?? updated.firstName ?? (user as any)?.firstName,
          lastName:
            payload.lastName ?? updated.lastName ?? (user as any)?.lastName,
          email: payload.email ?? updated.email ?? (user as any)?.email,
          // Keep existing `user.bio` field as-is; connector bio lives in profile document
          bio: (user as any)?.bio,
          profileImageUrl:
            payload.profileImageUrl ??
            updated.profileImageUrl ??
            (user as any)?.profileImageUrl ??
            null,
        } as any;
        updateUser(next);
      } else if (profileCapabilities.devLocalAvatar) {
        // Dev/local fallback: update Auth user locally so header/avatar persist across refresh
        const next = {
          ...(user as any),
          firstName: payload.firstName ?? (user as any)?.firstName,
          lastName: payload.lastName ?? (user as any)?.lastName,
          email: payload.email ?? (user as any)?.email,
          // Do not overwrite auth.user.bio from connector bio in dev fallback either
          bio: (user as any)?.bio,
          profileImageUrl:
            payload.profileImageUrl ?? (user as any)?.profileImageUrl ?? null,
        } as any;
        updateUser(next);
      } else {
        if (!overrides?.suppressToast) {
          setSuccessMessage(
            "Profile endpoints are not configured. Set REACT_APP_PROFILE_UPDATE_PATH or enable REACT_APP_DEV_LOCAL_AVATAR."
          );
          setTimeout(() => setSuccessMessage(""), 4000);
        }
        throw new Error("No profile endpoint and dev fallback disabled");
      }
      if (!overrides?.suppressToast) {
        setSuccessMessage("Profile updated");
        setTimeout(() => setSuccessMessage(""), 2500);
      }
    } catch (e) {
      console.error("Persist profile failed", e);
      if (overrides?.suppressToast) {
        // bubble up so caller can decide what to display
        throw e;
      } else {
        setSuccessMessage("Failed to update profile");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
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
  // Detailed spendings report entries derived from completed applications
  const [spendingsReport, setSpendingsReport] = useState<
    { id: string; datePaid: string; jobId: string; jobTitle: string; candidateName: string; amount: number }[]
  >([]);
  const [showSpendingsReport, setShowSpendingsReport] = useState(false);
  const printSpendingsReport = () => {
    try {
      const total = spendingsReport.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const rowsHtml = spendingsReport
        .map(
          (r) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(r.datePaid).toLocaleString()}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${r.jobTitle}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${r.candidateName}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">LKR ${r.amount}</td>
            </tr>`
        )
        .join("");
      const html = `
        <html>
          <head>
            <title>Spendings Report</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 24px; color: #111827; }
              h1 { font-size: 20px; margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              thead th { background: #F9FAFB; text-align: left; border-bottom: 1px solid #E5E7EB; padding: 8px; }
              tbody td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
              tfoot td { padding: 10px 8px; font-weight: 600; border-top: 2px solid #111827; }
            </style>
          </head>
          <body>
            <h1>Spendings Report</h1>
            <table>
              <thead>
                <tr>
                  <th>Date Paid</th>
                  <th>Job Title</th>
                  <th>Candidate Name</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:right;">Total</td>
                  <td style="text-align:right;">LKR ${total}</td>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>`;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Wait a tick to ensure content renders before print
      setTimeout(() => {
        w.print();
        w.close();
      }, 150);
    } catch {}
  };

  // Removed hardcoded jobs; only show backend jobs
  // Real jobs fetched for current talent connector (merged with mock)
  const [myJobs, setMyJobs] = useState<
    {
      id: string;
      title: string;
      paymentAmount?: number;
      applicants: number;
      postedOn: string;
      status: "active" | "expired" | "deactivated" | "pending" | "rejected" | "closed" | "completed";
      approvalStatus?: "pending" | "approved" | "rejected";
      rejectedReason?: string;
    }[]
  >([]);
  // Derive list UI status from backend job fields in a single place
  const deriveJobListStatus = (
    j: any
  ): "active" | "expired" | "deactivated" | "pending" | "rejected" | "closed" | "completed" => {
    const approval = (j?.approvalStatus ?? "").toString().toLowerCase();
    if (approval === "pending") return "pending";
    if (approval === "rejected") return "rejected";
    const s = (j?.status ?? "").toString().toLowerCase();
    const manuallyClosed = Boolean((j as any)?.manuallyClosed);
    if (s === "cancelled") return manuallyClosed ? "closed" : "deactivated";
    if (s === "completed") return "completed";
    if (s === "expired") return manuallyClosed ? "closed" : "expired";
    return "active";
  };
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
          paymentAmount: (j as any)?.paymentAmount,
          applicants: j.applicationsCount ?? 0,
          postedOn: (j.createdAt || new Date().toISOString()).slice(0, 10),
          approvalStatus: (j.approvalStatus as any)
            ?.toString?.()
            .toLowerCase() as any,
          rejectedReason: (j as any).rejectedReason,
          status: deriveJobListStatus(j),
        }));
        setMyJobs(mapped);
        // Compute real stats
        const totalJobsPosted = resp.total ?? mapped.length;
        const activePosts = (resp.jobs || []).filter(
          (j) => j.status === "active" && j.approvalStatus === "approved"
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

  // Compute dynamic spendings and hirings based on completed applications per job
  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      try {
        // For each job, fetch its applications and count completed ones
        const jobs = myJobs;
        if (!jobs || jobs.length === 0) {
          if (!cancelled) {
            setStats((prev) => ({ ...prev, totalSpendings: 0, totalHirings: 0 }));
            setSpendingsReport([]);
          }
          return;
        }
        const lists = await Promise.all(
          jobs.map((j) =>
            applicationService
              .listForJob(j.id)
              .then((apps) => ({ jobId: j.id, apps }))
              .catch(() => ({ jobId: j.id, apps: [] as ApplicationDTO[] }))
          )
        );
        let totalHires = 0;
        let totalSpend = 0;
        const paymentMap = new Map<string, number>();
        for (const j of jobs) paymentMap.set(j.id, Number(j.paymentAmount || 0));
        const titleMap = new Map<string, string>();
        for (const j of jobs) titleMap.set(j.id, j.title);
        const isCompleted = (a: ApplicationDTO) => {
          const st = (a.status || "").toString().toLowerCase();
          if (st.includes("complete")) return true;
          // Consider completed when both sides have marked or timestamps exist
          const seekerMarked = !!(a.completedBySeeker || a.completedBySeekerAt);
          const connectorMarked = !!(a.completedByConnector || a.completedByConnectorAt);
          return seekerMarked && connectorMarked;
        };
        const reportRows: { id: string; datePaid: string; jobId: string; jobTitle: string; candidateName: string; amount: number }[] = [];
        for (const { jobId, apps } of lists) {
          const completedApps = apps.filter(isCompleted);
          const hires = completedApps.length;
          totalHires += hires;
          const amt = paymentMap.get(jobId) || 0;
          totalSpend += hires * amt;
          const jobTitle = titleMap.get(jobId) || "Untitled";
          for (const a of completedApps) {
            const datePaid = (a.completedByConnectorAt || a.completedBySeekerAt || a.updatedAt || new Date().toISOString());
            reportRows.push({
              id: a._id,
              datePaid,
              jobId,
              jobTitle,
              candidateName: a.name || a.email || "Candidate",
              amount: amt,
            });
          }
        }
        if (!cancelled) {
          setStats((prev) => ({ ...prev, totalSpendings: totalSpend, totalHirings: totalHires }));
          // Sort newest first
          setSpendingsReport(reportRows.sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()));
        }
      } catch (_) {
        if (!cancelled) {
          // keep previous values on error
        }
      }
    };
    compute();
    return () => {
      cancelled = true;
    };
  }, [myJobs]);

  const combinedJobs = [...myJobs].sort(
    (a, b) => new Date(b.postedOn).getTime() - new Date(a.postedOn).getTime()
  );
  const activeJobs = combinedJobs.filter(
    (j) => j.status === "active" && j.approvalStatus === "approved"
  );
  const pendingJobs = combinedJobs.filter(
    (j) => j.approvalStatus === "pending"
  );
  const rejectedJobs = combinedJobs.filter(
    (j) => j.approvalStatus === "rejected"
  );
  // recent jobs: show last 6 jobs, regardless of status
  const recentJobs = combinedJobs.slice(0, 6);

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
            <div className="flex items-center justify-between text-sm md:text-base flex-wrap gap-4 md:gap-12">
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
                      <button
                        className="mt-2 text-xs underline text-slate-200 hover:text-white"
                        onClick={() => setShowSpendingsReport(true)}
                      >
                        View Report
                      </button>
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

                  {/* Recent Job Status (combined view) */}
                  <div className="mt-4 w-full px-6 sm:px-24 bg-white py-8 ">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <h3 className="text-md text-center md:text-start font-semibold text-gray-900">
                        Recent Job Status
                      </h3>
                      <button
                        onClick={() => {
                          setActiveTab("my-jobs");
                          const params = new URLSearchParams(location.search);
                          params.set("tab", "my-jobs");
                          navigate(
                            `${location.pathname}?${params.toString()}`,
                            {
                              replace: true,
                            }
                          );
                        }}
                        className="self-center md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-slate-900 text-white hover:bg-slate-800"
                      >
                        View all jobs
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
                      {recentJobs.map((job) => {
                        // Badge logic aligned with job list
                        const isPending = job.approvalStatus === "pending";
                        const isRejected = job.approvalStatus === "rejected";
                        const badgeClass = isPending
                          ? "bg-amber-200 text-amber-900"
                          : isRejected
                            ? "bg-red-200 text-red-900"
                            : job.status === "active"
                              ? "bg-[#64F272] text-gray-900"
                              : job.status === "deactivated"
                                ? "bg-amber-200 text-amber-900"
                                : job.status === "closed"
                                  ? "bg-yellow-200 text-yellow-900"
                                  : job.status === "completed"
                                    ? "bg-blue-200 text-blue-900"
                                    : "bg-gray-300 text-gray-700"; // expired or other
                        const badgeLabel = isPending
                          ? "Pending"
                          : isRejected
                            ? "Rejected"
                            : job.status === "active"
                              ? "Active"
                              : job.status === "deactivated"
                                ? "Deactivated"
                                : job.status === "closed"
                                  ? "Closed"
                                  : job.status === "completed"
                                    ? "Completed"
                                    : "Expired";
                        return (
                          <Link
                            to={`/talent/jobs/${job.id}`}
                            key={job.id}
                            className="block hover:bg-gray-50 border rounded-xl p-2"
                          >
                            <div className="p-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sm text-gray-900 text-start line-clamp-2">
                                  {job.title}
                                </p>
                                <span
                                  className={`text-[10px] font-bold px-2 py-1 rounded-md ${badgeClass}`}
                                >
                                  {badgeLabel}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <p className="text-sm text-gray-500 text-start">
                                  Posted on {job.postedOn}
                                </p>
                                {job.status === "active" &&
                                  job.approvalStatus === "approved" && (
                                    <div className="text-xs text-gray-600">
                                      Applicants: {job.applicants}
                                    </div>
                                  )}
                              </div>
                              {job.approvalStatus === "pending" && (
                                <p className=" text-gray-500 mt-1  font-medium text-sm">
                                  Awaiting admin approval
                                </p>
                              )}
                              {job.approvalStatus === "rejected" && (
                                <p className="text-sm text-red-600 mt-1 font-medium">
                                  {`Rejected: ${job.rejectedReason?.trim() || "No reason provided"}`}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                      {recentJobs.length === 0 && (
                        <div className="p-4 text-center text-gray-500 col-span-full">
                          No jobs to display
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reviews removed */}
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
                          <div className="flex flex-col md:flex-row items-center justify-between ">
                            <div className="flex gap-3">
                              <p className="font-medium text-md md:text-lg tracking-tight text-start text-gray-900 line-clamp-2">
                                {job.title}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                  job.status === "active"
                                    ? "bg-[#64F272] text-gray-900"
                                    : job.status === "deactivated"
                                      ? "bg-amber-200 text-amber-900"
                                      : job.status === "rejected"
                                        ? "bg-red-200 text-red-900"
                                        : job.status === "pending"
                                          ? "bg-amber-200 text-amber-900"
                                          : job.status === "closed"
                                            ? "bg-yellow-200 text-yellow-900"
                                            : job.status === "completed"
                                              ? "bg-blue-200 text-blue-900"
                                              : "bg-gray-300 text-gray-700"
                                }`}
                              >
                                {job.status === "active"
                                  ? "ACTIVE"
                                  : job.status === "deactivated"
                                    ? "DEACTIVATED"
                                    : job.status === "rejected"
                                      ? "REJECTED"
                                      : job.status === "pending"
                                        ? "PENDING"
                                        : job.status === "closed"
                                          ? "CLOSED"
                                          : job.status === "completed"
                                            ? "COMPLETED"
                                            : "EXPIRED"}
                              </span>
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
                                  const localStatus = deriveJobListStatus(updated);
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
                  <div className="mb-4 flex items-center flex-col md:flex-row gap-2 md:justify-between px-6 sm:px-24 bg-[linear-gradient(135deg,#8750E9_0%,#6925E3_100%)] py-8">
                    {/**left */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      {/* Profile Photo */}
                      <div className="flex flex-col  items-center justify-center mb-1">
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
                                  // Create a small, persistent data URL to avoid localStorage quota issues
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const img = new Image();
                                    img.onload = () => {
                                      const maxSize = 256; // px
                                      let { width, height } = img;
                                      if (width > height) {
                                        if (width > maxSize) {
                                          height = Math.round(
                                            (height * maxSize) / width
                                          );
                                          width = maxSize;
                                        }
                                      } else {
                                        if (height > maxSize) {
                                          width = Math.round(
                                            (width * maxSize) / height
                                          );
                                          height = maxSize;
                                        }
                                      }
                                      const canvas =
                                        document.createElement("canvas");
                                      canvas.width = width;
                                      canvas.height = height;
                                      const ctx = canvas.getContext("2d");
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, width, height);
                                        const dataUrl = canvas.toDataURL(
                                          "image/jpeg",
                                          0.7
                                        );
                                        setProfileImage(dataUrl);
                                      }
                                    };
                                    img.src = reader.result as string;
                                  };
                                  reader.readAsDataURL(file);
                                  setProfileFile(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Name & Email */}
                      <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:text-start">
                          <div
                            className="w-full text-2xl  px-3 text-white font-semibold tracking-tight cursor-default select-text"
                            aria-readonly
                          >
                            {`${(firstName || "").trim()} ${(lastName || "").trim()}`.trim() ||
                              "Anonymous"}
                          </div>

                          <div
                            className="w-full px-3 text-white text-md cursor-default select-text"
                            aria-readonly
                          >
                            {emailInput || "you@example.com"}
                          </div>
                        </div>
                        {/* Name & Email are read-only per requirements */}
                      </div>
                    </div>
                    {/*right*/}
                    <div className="flex gap-2 ">
                      {!isEditingProfile ? (
                        <button
                          className="px-4 py-2 text-white rounded-lg border hover:bg-gray-50 text-sm hover:text-primary"
                          onClick={() => {
                            // Take a snapshot of current values before entering edit mode
                            editSnapshotRef.current = {
                              bio,
                              servicesLookingFor: [...servicesLookingFor],
                              skillsLookingFor: [...skillsLookingFor],
                              langSinhala,
                              langTamil,
                              langEnglish,
                              profileImage,
                            };
                            setIsEditingProfile(true);
                            setIsEditingBio(true);
                          }}
                        >
                          Update Profile
                        </button>
                      ) : (
                        <>
                          <button
                            className="px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              // Restore from snapshot and exit edit mode
                              const snap = editSnapshotRef.current;
                              if (snap) {
                                setBio(snap.bio);
                                setServicesLookingFor([
                                  ...snap.servicesLookingFor,
                                ]);
                                setSkillsLookingFor([...snap.skillsLookingFor]);
                                setLangSinhala(snap.langSinhala);
                                setLangTamil(snap.langTamil);
                                setLangEnglish(snap.langEnglish);
                                setProfileImage(snap.profileImage);
                              }
                              setProfileFile(null);
                              setIsEditingProfile(false);
                              setIsEditingBio(false);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg bg-white text-primary hover:bg-violet-50 text-sm"
                            onClick={async () => {
                              let uploadedUrl: string | undefined = undefined;
                              let avatarError: unknown = undefined;
                              // 1) Try avatar upload if a new file was picked
                              if (profileFile) {
                                try {
                                  const up =
                                    await profileService.uploadAvatar(
                                      profileFile
                                    );
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
                                // Update lightweight user header fields if configured
                                try {
                                  await persistProfile({
                                    bio,
                                    profileImageUrl: finalProfileUrl,
                                    suppressToast: true,
                                  });
                                } catch (e) {
                                  // Do not abort; we will still persist via /profile below
                                  console.warn(
                                    "Lightweight profile PATCH failed, continuing with /profile PUT",
                                    e
                                  );
                                }
                                // Update structured profile (connector + languages) to backend
                                try {
                                  const savedProfile =
                                    await profileService.putMyProfile({
                                      // do not send fullName/email/role; backend owns those
                                      languages: {
                                        sinhala: Number.isFinite(langSinhala)
                                          ? langSinhala
                                          : 0,
                                        tamil: Number.isFinite(langTamil)
                                          ? langTamil
                                          : 0,
                                        english: Number.isFinite(langEnglish)
                                          ? langEnglish
                                          : 0,
                                      },
                                      // Connector fields are FLAT in UpdateProfileDto
                                      connectorBio: bio || undefined,
                                      servicesLookingFor: servicesLookingFor,
                                      skillsLookingFor: skillsLookingFor,
                                      // keep profile document's photo in sync as well
                                      profilePhotoUrl: uploadedUrl ?? undefined,
                                    });
                                  // Apply fresh values from backend so UI updates immediately without refresh
                                  try {
                                    if (savedProfile?.languages) {
                                      setLangSinhala(
                                        Number(
                                          savedProfile.languages.sinhala ?? 0
                                        )
                                      );
                                      setLangTamil(
                                        Number(
                                          savedProfile.languages.tamil ?? 0
                                        )
                                      );
                                      setLangEnglish(
                                        Number(
                                          savedProfile.languages.english ?? 0
                                        )
                                      );
                                    }
                                    if (savedProfile?.connector) {
                                      if (
                                        typeof savedProfile.connector.bio ===
                                        "string"
                                      )
                                        setBio(savedProfile.connector.bio);
                                      setServicesLookingFor(
                                        Array.isArray(
                                          savedProfile.connector
                                            .servicesLookingFor
                                        )
                                          ? savedProfile.connector
                                              .servicesLookingFor
                                          : []
                                      );
                                      setSkillsLookingFor(
                                        Array.isArray(
                                          savedProfile.connector
                                            .skillsLookingFor
                                        )
                                          ? savedProfile.connector
                                              .skillsLookingFor
                                          : []
                                      );
                                    }
                                  } catch (_) {
                                    // ignore mapping errors
                                  }

                                  // Ensure header avatar persists across refresh even if user PATCH is unavailable
                                  const persistedUrl =
                                    // Prefer smaller resized data URL when in dev fallback
                                    (profileCapabilities.devLocalAvatar &&
                                    profileImage
                                      ? profileImage
                                      : undefined) ??
                                    uploadedUrl ??
                                    null;
                                  if (persistedUrl) {
                                    updateUser({
                                      ...(user as any),
                                      profileImageUrl: persistedUrl,
                                    } as any);
                                    setProfileImage(persistedUrl);
                                  }
                                  setSuccessMessage(
                                    "Profile updated successfully"
                                  );
                                  setTimeout(() => setSuccessMessage(""), 2500);
                                  // Refresh global profile so the rest of the app sees the latest data
                                  refreshProfile?.();
                                } catch (e) {
                                  console.error("PUT /profile failed", e);
                                  // surface a non-blocking message
                                  setSuccessMessage(
                                    "Saved basic profile; failed saving structured fields."
                                  );
                                  setTimeout(() => setSuccessMessage(""), 3000);
                                }
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
                          >
                            Save Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-4 px-6 sm:px-24 text-start bg-white py-8 space-y-6">
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
                            ref={bioTextareaRef}
                            rows={1}
                            className="w-full border rounded-lg px-3 py-2 overflow-hidden resize-none"
                            style={{ height: "auto" }}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Write something about you..."
                          />
                          {/* Bio saving is handled by Save Changes button above */}
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    <div className="border rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Languages
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            label: "Sinhala",
                            val: langSinhala,
                            set: setLangSinhala,
                          },
                          { label: "Tamil", val: langTamil, set: setLangTamil },
                          {
                            label: "English",
                            val: langEnglish,
                            set: setLangEnglish,
                          },
                        ].map((row) => (
                          <div key={row.label} className="space-y-1">
                            <label className="block text-sm text-gray-600">
                              {row.label} (0-10)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={1}
                              disabled={!isEditingProfile}
                              value={row.val}
                              onChange={(e) =>
                                row.set(
                                  Math.max(
                                    0,
                                    Math.min(10, Number(e.target.value) || 0)
                                  )
                                )
                              }
                              className="w-full bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Services Looking For */}
                    <div className="border rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Services Looking For
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {servicesLookingFor.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 bg-violet-100 text-gray-800 px-4 py-2 rounded-full  "
                          >
                            {s}
                            {isEditingProfile && (
                              <button
                                onClick={() =>
                                  setServicesLookingFor(
                                    servicesLookingFor.filter(
                                      (_, i) => i !== idx
                                    )
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                                aria-label={`Remove ${s}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {servicesLookingFor.length === 0 && (
                          <span className="text-gray-500">
                            No services added.
                          </span>
                        )}
                      </div>
                      {isEditingProfile && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newService.trim()) {
                                setServicesLookingFor([
                                  ...servicesLookingFor,
                                  newService.trim(),
                                ]);
                                setNewService("");
                              }
                            }}
                            placeholder="Add a service (press Enter)"
                            className="flex-1 border rounded-lg px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newService.trim()) {
                                setServicesLookingFor([
                                  ...servicesLookingFor,
                                  newService.trim(),
                                ]);
                                setNewService("");
                              }
                            }}
                            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Skills Looking For */}
                    <div className="border rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Skills Looking For
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {skillsLookingFor.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 bg-violet-100 text-gray-800 px-4 py-2 rounded-full  "
                          >
                            {s}
                            {isEditingProfile && (
                              <button
                                onClick={() =>
                                  setSkillsLookingFor(
                                    skillsLookingFor.filter((_, i) => i !== idx)
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                                aria-label={`Remove ${s}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {skillsLookingFor.length === 0 && (
                          <span className="text-gray-500">
                            No skills added.
                          </span>
                        )}
                      </div>
                      {isEditingProfile && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newSkill.trim()) {
                                setSkillsLookingFor([
                                  ...skillsLookingFor,
                                  newSkill.trim(),
                                ]);
                                setNewSkill("");
                              }
                            }}
                            placeholder="Add a skill (press Enter)"
                            className="flex-1 border rounded-lg px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSkill.trim()) {
                                setSkillsLookingFor([
                                  ...skillsLookingFor,
                                  newSkill.trim(),
                                ]);
                                setNewSkill("");
                              }
                            }}
                            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                          >
                            Add
                          </button>
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

      {/* Spendings Report Modal */}
      {showSpendingsReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSpendingsReport(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Spendings Report</h3>
              <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={() => setShowSpendingsReport(false)}>×</button>
            </div>
            <div className="p-4 overflow-auto">
              {spendingsReport.length === 0 ? (
                <div className="text-gray-500 text-sm">No spendings recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">Date Paid</th>
                        <th className="px-3 py-2 text-left border-b">Job Title</th>
                        <th className="px-3 py-2 text-left border-b">Candidate Name</th>
                        <th className="px-3 py-2 text-right border-b">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spendingsReport.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border-b">{new Date(row.datePaid).toLocaleString()}</td>
                          <td className="px-3 py-2 border-b">{row.jobTitle}</td>
                          <td className="px-3 py-2 border-b">{row.candidateName}</td>
                          <td className="px-3 py-2 border-b text-right">LKR {row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="px-3 py-2 border-t font-semibold" colSpan={3}>
                          Total
                        </td>
                        <td className="px-3 py-2 border-t text-right font-semibold">
                          LKR {spendingsReport.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-between">
              <button className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => setShowSpendingsReport(false)}>Close</button>
              <button className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800" onClick={printSpendingsReport}>Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentConnectorDashboard;
