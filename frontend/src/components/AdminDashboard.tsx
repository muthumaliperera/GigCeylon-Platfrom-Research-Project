import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AdminJobItem,
  adminService,
  AdminUserItem,
  ApprovalTab,
  ApprovedFilter,
  DashboardStats,
  PaymentPlan,
  PlanAudience,
  PlanInterval,
  ReviewItem,
  Role,
} from "../services/adminService";
import { Job, jobService } from "../services/jobService";
import {
  TemplateCategoryDto,
  templateService,
  TemplateType,
} from "../services/templateService";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "jobs" | "plans" | "reviews" | "finance"
  >("dashboard");

  // Sync tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin/users")) setActiveTab("users");
    else if (path.includes("/admin/jobs")) setActiveTab("jobs");
    else if (path.includes("/admin/plans")) setActiveTab("plans");
    else if (path.includes("/admin/reviews")) setActiveTab("reviews");
    else if (path.includes("/admin/finance")) setActiveTab("finance");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  // When switching into the Jobs tab from top navigation, ensure default view
  useEffect(() => {
    if (activeTab === "jobs") {
      setJobsSubTab("management");
      setJobsMgmtTab("pending");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Admin Users state (consolidated from AdminUsersPage)
  const roleTabs: { key: Role; label: string }[] = [
    { key: "job_seeker", label: "Job Seekers" },
    { key: "talent_connector", label: "Talent Connectors" },
  ];
  const [activeRole, setActiveRole] = useState<Role>("job_seeker");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    users: { total: 0, jobSeekers: 0, talentConnectors: 0 },
    jobs: { total: 0, active: 0, completed: 0, pendingApproval: 0 },
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string>("");

  // Payment Plans state
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string>("");
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [createPlanData, setCreatePlanData] = useState<{
    name: string;
    price: string; // keep as string for input; cast to number on submit
    interval: PlanInterval;
    audience: PlanAudience;
    subHeader: string;
    featuresText: string; // textarea, split by new lines to array
  }>({
    name: "",
    price: "",
    interval: "monthly",
    audience: "both",
    subHeader: "",
    featuresText: "",
  });
  const [planIsFree, setPlanIsFree] = useState(false);
  // Edit plan state
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string>("");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [editPlanData, setEditPlanData] = useState<{
    name: string;
    price: string;
    interval: PlanInterval;
    audience: PlanAudience;
    subHeader: string;
    featuresText: string;
  }>({
    name: "",
    price: "",
    interval: "monthly",
    audience: "both",
    subHeader: "",
    featuresText: "",
  });
  const [editPlanIsFree, setEditPlanIsFree] = useState(false);

  // Jobs Template Management state
  const templateTabs: { key: TemplateType; label: string }[] = [
    { key: "micro", label: "Micro jobs" },
    { key: "small_scale", label: "Small Scale job" },
    { key: "professional_part_time", label: "Professional Part Time" },
  ];
  const [activeTemplateTab, setActiveTemplateTab] =
    useState<TemplateType>("micro");
  const [templates, setTemplates] = useState<TemplateCategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string>("");
  const selectedCategory = useMemo(
    () => templates.find((c) => c._id === selectedCategoryId) || null,
    [templates, selectedCategoryId]
  );
  // Inputs for inline add actions in template manager
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newJobName, setNewJobName] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  // Delete confirmation modal state for template categories
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  // Delete confirmation for jobs and requirements
  const [confirmRemoveJob, setConfirmRemoveJob] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const [removingJob, setRemovingJob] = useState(false);
  const [confirmRemoveRequirement, setConfirmRemoveRequirement] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [removingRequirement, setRemovingRequirement] = useState(false);
  // Jobs sub-tabs (Job Management | Job Post Template Management)
  const [jobsSubTab, setJobsSubTab] = useState<"management" | "template">(
    "management"
  );
  // Job Management main tab groups
  const [jobsMgmtTab, setJobsMgmtTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  // Jobs Approved filtering tabs
  const [approvedFilter, setApprovedFilter] = useState<
    "all" | "active" | "expired" | "deactivated"
  >("all");

  // Jobs management data state
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string>("");
  const [jobs, setJobs] = useState<AdminJobItem[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(10);
  const jobsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(jobsTotal / jobsPageSize)),
    [jobsTotal, jobsPageSize]
  );
  // Approve/Reject actions
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string>("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize, setReviewsPageSize] = useState(10);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const reviewsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(reviewsTotal / reviewsPageSize)),
    [reviewsTotal, reviewsPageSize]
  );

  // Fetch reviews
  const fetchReviews = async () => {
    if (activeTab !== "reviews") return;
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const res = await adminService.listReviews({
        search: reviewsSearch,
        page: reviewsPage,
        pageSize: reviewsPageSize,
      });
      setReviews(res.items || []);
      setReviewsTotal(res.total || 0);
    } catch (e: any) {
      setReviewsError(e?.response?.data?.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [reviewsPage, reviewsPageSize]);

  // Job Overview Modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobModalLoading, setJobModalLoading] = useState(false);
  const [jobModalError, setJobModalError] = useState<string>("");

  // Label for current template tab (for header)
  const currentTemplateLabel = useMemo(() => {
    const found = templateTabs.find((t) => t.key === activeTemplateTab);
    return found?.label || "Templates";
  }, [templateTabs, activeTemplateTab]);

  const fetchDashboardStats = async (force = false) => {
    if (!force && activeTab !== "dashboard") return;
    setStatsLoading(true);
    setStatsError("");
    try {
      const stats = await adminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (e: any) {
      setStatsError(
        e?.response?.data?.message || "Failed to load dashboard stats"
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!(activeTab === "jobs" && jobsSubTab === "management")) return;
    setJobsLoading(true);
    setJobsError("");
    try {
      const params: {
        approval: ApprovalTab;
        filter?: ApprovedFilter;
        page?: number;
        pageSize?: number;
      } = {
        approval: jobsMgmtTab,
        page: jobsPage,
        pageSize: jobsPageSize,
      } as any;
      if (jobsMgmtTab === "approved") params.filter = approvedFilter;
      const res = await adminService.listJobs(params);
      setJobs(res.items || []);
      setJobsTotal(res.total || 0);
    } catch (e: any) {
      setJobsError(e?.response?.data?.message || "Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (activeTab !== "users") return; // avoid unnecessary calls when not on users page
    setLoading(true);
    setError("");
    try {
      const res = await adminService.listUsers({
        role: activeRole,
        search,
        page,
        pageSize,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (activeTab !== "jobs") return;
    setTemplatesLoading(true);
    setTemplatesError("");
    try {
      const data = await templateService.list(activeTemplateTab);
      setTemplates(data);
      // Keep previous selection if still present, else select first
      if (!data.find((c) => c._id === selectedCategoryId)) {
        setSelectedCategoryId(data[0]?._id || "");
      }
    } catch (e: any) {
      setTemplatesError(
        e?.response?.data?.message || "Failed to load job post templates"
      );
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (activeTab !== "plans") return;
    setPlansLoading(true);
    setPlansError("");
    try {
      const data = await adminService.listPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setPlansError(e?.response?.data?.message || "Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  // Open edit plan modal
  const openEditPlan = (p: PaymentPlan) => {
    setEditingPlanId(p._id);
    setEditPlanIsFree(p.price === 0);
    setEditPlanData({
      name: p.name,
      price: String(p.price),
      interval: p.interval,
      audience: p.audience,
      subHeader: p.subHeader || "",
      featuresText: (p.features || []).join("\n"),
    });
    setShowEditPlan(true);
  };

  const togglePlanActive = async (p: PaymentPlan) => {
    try {
      setPlansError("");
      await adminService.updatePlan(p._id, { isActive: !p.isActive });
      await fetchPlans();
    } catch (e: any) {
      setPlansError(
        e?.response?.data?.message || "Failed to update plan status"
      );
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeRole, page, pageSize]);

  // Load templates when Jobs tab or template type changes
  useEffect(() => {
    if (activeTab === "jobs") {
      fetchTemplates();
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeTemplateTab]);

  // Load plans when switching to plans tab
  useEffect(() => {
    if (activeTab === "plans") {
      fetchPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load reviews when switching to reviews tab
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Reset selection and inputs when switching template type
  useEffect(() => {
    setSelectedCategoryId("");
    setNewCategoryName("");
    setNewJobName("");
    setNewRequirement("");
  }, [activeTemplateTab]);

  // Refetch jobs when management tab or filters/pagination change
  useEffect(() => {
    if (activeTab === "jobs" && jobsSubTab === "management") {
      setJobsPage(1); // reset page when switching tabs/filters
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsSubTab, jobsMgmtTab, approvedFilter]);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsPage, jobsPageSize]);

  const onApprove = async (id: string) => {
    try {
      setActionBusy(true);
      await adminService.approveJob(id);
      await fetchJobs();
      // Refresh stats so pending count updates immediately
      await fetchDashboardStats(true);
      // If in modal, close after action
      if (showJobModal) setShowJobModal(false);
    } catch (e: any) {
      setJobsError(e?.response?.data?.message || "Failed to approve job");
    } finally {
      setActionBusy(false);
    }
  };

  const onRejectOpen = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const onRejectConfirm = async () => {
    if (!rejectingId) return;
    try {
      setActionBusy(true);
      await adminService.rejectJob(rejectingId, rejectReason || "");
      setRejectingId(null);
      setRejectReason("");
      await fetchJobs();
      // Refresh stats so pending count updates immediately
      await fetchDashboardStats(true);
      if (showJobModal) setShowJobModal(false);
    } catch (e: any) {
      setJobsError(e?.response?.data?.message || "Failed to reject job");
    } finally {
      setActionBusy(false);
    }
  };

  // Open Job Overview modal and fetch job details
  const openJobModal = async (id: string) => {
    setSelectedJobId(id);
    setShowJobModal(true);
    setSelectedJob(null);
    setJobModalLoading(true);
    setJobModalError("");
    try {
      const data = await jobService.getJobById(id);
      setSelectedJob(data);
      // preset rejecting id for modal reject flow
      setRejectingId(id);
      setRejectReason("");
    } catch (e: any) {
      setJobModalError(e?.response?.data?.message || "Failed to load job");
    } finally {
      setJobModalLoading(false);
    }
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setSelectedJobId(null);
    setSelectedJob(null);
    setJobModalError("");
    setRejectingId(null);
    setRejectReason("");
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const onReviewsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewsPage(1);
    fetchReviews();
  };

  const submitCreate = async () => {
    setCreating(true);
    setError("");
    try {
      await adminService.createUser({ ...createData, role: activeRole });
      setShowCreate(false);
      setCreateData({ firstName: "", lastName: "", email: "", password: "" });
      fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await adminService.toggleActive(id);
      fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update user");
    }
  };

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

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
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

  if (!user || user.role !== "admin") {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
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

      <nav className="bg-white shadow-sm border-b border-black/5 sticky top-16 z-40">
        <div className="max-w-full px-6 sm:px-24 py-3 md:h-14 flex items-center">
          <div className="flex items-center justify-between sm:justify-normal sm:gap-8 w-full">
            {[
              {
                key: "dashboard",
                label: "Dashboard",
                path: "/admin-dashboard",
              },
              { key: "users", label: "Users", path: "/admin/users" },
              { key: "jobs", label: "Jobs", path: "/admin/jobs" },
              { key: "plans", label: "Payment Plans", path: "/admin/plans" },
              { key: "reviews", label: "Reviews", path: "/admin/reviews" },
              { key: "finance", label: "Finance", path: "/admin/finance" },
            ].map((tab) => (
              <div key={tab.key} className="flex items-center">
                <Link
                  to={tab.path}
                  className={`text-md font-semibold px-3 py-2 rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  {tab.label}
                </Link>
              </div>
            ))}
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
              {/* Conditional admin content: Users page vs Dashboard */}
              {activeTab === "users" ? (
                // Admin Users page content
                <div>
                  <div className="px-6 sm:px-24 pt-6 pb-3 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      {roleTabs.map((tab) => (
                        <button
                          key={tab.key}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            activeRole === tab.key
                              ? "bg-accent text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                          onClick={() => {
                            setActiveRole(tab.key);
                            setPage(1);
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <form onSubmit={onSearch} className="mb-2 w-1/2">
                        <div className="flex gap-2">
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email"
                            className="flex-1 border rounded-full px-4 py-2 "
                          />
                        </div>
                      </form>
                      <button
                        className="bg-primary text-white px-4 py-2 rounded-full hover:bg-gray-800"
                        onClick={() => setShowCreate(true)}
                      >
                        + Create{" "}
                        {activeRole === "job_seeker"
                          ? "Job Seeker"
                          : "Talent Connector"}
                      </button>
                    </div>

                    {error && (
                      <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* user table */}
                  <div className="px-6 sm:px-24 py-6 bg-white overflow-x-auto mt-5">
                    <div className="border  w-fit sm:w-full border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                      <table className="min-w-full divide-y  divide-indigo-100">
                        <thead className="bg-indigo-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Date Registered
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Email
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-indigo-100">
                          {loading ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-6 text-center text-gray-500"
                              >
                                Loading...
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-6 text-center text-gray-500"
                              >
                                No users found
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u._id}>
                                <td className="px-4 py-2 whitespace-nowrap text-start text-sm text-gray-700">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-start text-gray-700">
                                  {u.firstName} {u.lastName}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-start text-gray-700">
                                  {u.email}
                                </td>

                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      className="px-3 py-1 rounded bg-gray-100 text-gray-700"
                                      disabled
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => toggleActive(u._id)}
                                      className={`px-3 py-1 rounded ${u.isActive ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
                                    >
                                      {u.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 px-6 sm:px-24">
                    <div className="text-sm text-gray-600">Total: {total}</div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm">
                        Page {page} / {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {showCreate && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                          Create{" "}
                          {activeRole === "job_seeker"
                            ? "Job Seeker"
                            : "Talent Connector"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            value={createData.firstName}
                            onChange={(e) =>
                              setCreateData({
                                ...createData,
                                firstName: e.target.value,
                              })
                            }
                            placeholder="First name"
                            className="border rounded px-3 py-2"
                          />
                          <input
                            value={createData.lastName}
                            onChange={(e) =>
                              setCreateData({
                                ...createData,
                                lastName: e.target.value,
                              })
                            }
                            placeholder="Last name"
                            className="border rounded px-3 py-2"
                          />
                          <input
                            value={createData.email}
                            onChange={(e) =>
                              setCreateData({
                                ...createData,
                                email: e.target.value,
                              })
                            }
                            placeholder="Email"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />
                          <input
                            value={createData.password}
                            type="password"
                            onChange={(e) =>
                              setCreateData({
                                ...createData,
                                password: e.target.value,
                              })
                            }
                            placeholder="Password"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-100"
                            onClick={() => setShowCreate(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                            disabled={creating}
                            onClick={submitCreate}
                          >
                            {creating ? "Creating..." : "Create"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === "jobs" ? (
                // Jobs > Job Post Template Management
                <div>
                  {/* Jobs sub-tabs */}
                  <div className="px-6 sm:px-24 pt-6 pb-3 bg-white">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <button
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          jobsSubTab === "management"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => setJobsSubTab("management")}
                      >
                        Job Management
                      </button>
                      <button
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          jobsSubTab === "template"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => setJobsSubTab("template")}
                      >
                        Job Post Template Management
                      </button>
                    </div>
                  </div>

                  {jobsSubTab === "management" ? (
                    // Job Management with main tab groups
                    <div className="px-6 sm:px-24 py-6 bg-white mt-5">
                      <div>
                        {/* Main tab groups */}
                        <div>
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <button
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                jobsMgmtTab === "pending"
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              onClick={() => setJobsMgmtTab("pending")}
                            >
                              Pending Approval
                            </button>
                            <button
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                jobsMgmtTab === "approved"
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              onClick={() => setJobsMgmtTab("approved")}
                            >
                              Jobs Approved
                            </button>
                            <button
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                jobsMgmtTab === "rejected"
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              onClick={() => setJobsMgmtTab("rejected")}
                            >
                              Rejected Jobs
                            </button>
                          </div>
                        </div>

                        {/* Panels */}
                        <div>
                          {jobsMgmtTab === "pending" ? (
                            <div className="border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                              <div className="">
                                {jobsError && (
                                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                                    {jobsError}
                                  </div>
                                )}
                                {jobsLoading ? (
                                  <div className="p-6 text-center text-gray-500">
                                    Loading...
                                  </div>
                                ) : jobs.length === 0 ? (
                                  <div className="p-6 text-center text-gray-500">
                                    No pending jobs
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-indigo-100 text-start">
                                      <thead className="bg-indigo-100">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Created
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Title
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Employer
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Deadline
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-indigo-100">
                                        {jobs.map((j) => (
                                          <tr
                                            key={j._id}
                                            onClick={() => openJobModal(j._id)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                          >
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.createdAt
                                                ? new Date(
                                                    j.createdAt
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.title}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {typeof j.employerId === "object"
                                                ? `${j.employerId?.firstName || ""} ${j.employerId?.lastName || ""}`.trim()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.completionDeadline
                                                ? new Date(
                                                    j.completionDeadline
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 p-4">
                                  <div className="text-sm text-gray-600">
                                    Total: {jobsTotal}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={jobsPage <= 1}
                                      onClick={() =>
                                        setJobsPage((p) => Math.max(1, p - 1))
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Prev
                                    </button>
                                    <span className="text-sm">
                                      Page {jobsPage} / {jobsTotalPages}
                                    </span>
                                    <button
                                      disabled={jobsPage >= jobsTotalPages}
                                      onClick={() =>
                                        setJobsPage((p) =>
                                          Math.min(jobsTotalPages, p + 1)
                                        )
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : jobsMgmtTab === "approved" ? (
                            <div className="border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                              <div>
                                {jobsError && (
                                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                                    {jobsError}
                                  </div>
                                )}
                                {jobsLoading ? (
                                  <div className="p-6 text-center text-gray-500">
                                    Loading...
                                  </div>
                                ) : jobs.length === 0 ? (
                                  <div className="p-6 text-center text-gray-500">
                                    No jobs found
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-indigo-100 text-start">
                                      <thead className="bg-indigo-100">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Created
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Title
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Employer
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Status
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Deadline
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-indigo-100">
                                        {jobs.map((j) => (
                                          <tr
                                            key={j._id}
                                            onClick={() => openJobModal(j._id)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                          >
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.createdAt
                                                ? new Date(
                                                    j.createdAt
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.title}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {typeof j.employerId === "object"
                                                ? `${j.employerId?.firstName || ""} ${j.employerId?.lastName || ""}`.trim()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.status}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.completionDeadline
                                                ? new Date(
                                                    j.completionDeadline
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 p-4">
                                  <div className="text-sm text-gray-600">
                                    Total: {jobsTotal}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={jobsPage <= 1}
                                      onClick={() =>
                                        setJobsPage((p) => Math.max(1, p - 1))
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Prev
                                    </button>
                                    <span className="text-sm">
                                      Page {jobsPage} / {jobsTotalPages}
                                    </span>
                                    <button
                                      disabled={jobsPage >= jobsTotalPages}
                                      onClick={() =>
                                        setJobsPage((p) =>
                                          Math.min(jobsTotalPages, p + 1)
                                        )
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                              <div className="">
                                {jobsError && (
                                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                                    {jobsError}
                                  </div>
                                )}
                                {jobsLoading ? (
                                  <div className="p-6 text-center text-gray-500">
                                    Loading...
                                  </div>
                                ) : jobs.length === 0 ? (
                                  <div className="p-6 text-center text-gray-500">
                                    No rejected jobs
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto text-start">
                                    <table className="min-w-full divide-y divide-indigo-100">
                                      <thead className="bg-indigo-100">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Created
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Title
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Employer
                                          </th>
                                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                            Reason
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-indigo-100">
                                        {jobs.map((j) => (
                                          <tr
                                            key={j._id}
                                            onClick={() => openJobModal(j._id)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                          >
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.createdAt
                                                ? new Date(
                                                    j.createdAt
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.title}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {typeof j.employerId === "object"
                                                ? `${j.employerId?.firstName || ""} ${j.employerId?.lastName || ""}`.trim()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                              {j.rejectedReason || "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 p-4">
                                  <div className="text-sm text-gray-600">
                                    Total: {jobsTotal}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={jobsPage <= 1}
                                      onClick={() =>
                                        setJobsPage((p) => Math.max(1, p - 1))
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Prev
                                    </button>
                                    <span className="text-sm">
                                      Page {jobsPage} / {jobsTotalPages}
                                    </span>
                                    <button
                                      disabled={jobsPage >= jobsTotalPages}
                                      onClick={() =>
                                        setJobsPage((p) =>
                                          Math.min(jobsTotalPages, p + 1)
                                        )
                                      }
                                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-6 sm:px-24 pt-6 pb-3 bg-white">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          {templateTabs.map((tab) => (
                            <button
                              key={tab.key}
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                activeTemplateTab === tab.key
                                  ? "bg-accent text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              onClick={() => setActiveTemplateTab(tab.key)}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <div className="text-center md:text-left mb-3">
                          <h3 className="text-base font-semibold text-gray-900">
                            {currentTemplateLabel} Template
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Manage categories, common jobs, and requirements.
                          </p>
                        </div>

                        {templatesError && (
                          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {templatesError}
                          </div>
                        )}

                        {/* Search (non-functional placeholder for now) */}
                        <div className="flex items-center justify-end">
                          <div className="mb-2 w-full md:w-1/3">
                            <div className="flex gap-2">
                              <input
                                placeholder="Search job post templates"
                                className="flex-1 border rounded-full px-4 py-2"
                              />
                              <button className="px-4 py-2 rounded-full bg-black text-white">
                                Search
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3-column template manager */}
                      <div className="px-6 sm:px-24 py-6 bg-white overflow-x-auto mt-5">
                        <div className="border w-full border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-indigo-100">
                            {/* Categories */}
                            <div className="p-4">
                              <div className="mb-3">
                                <h4 className="font-semibold mb-2">
                                  Categories
                                </h4>
                                <div className="flex gap-2">
                                  <input
                                    value={newCategoryName}
                                    onChange={(e) =>
                                      setNewCategoryName(e.target.value)
                                    }
                                    placeholder="New category name"
                                    className="flex-1 border rounded-full px-3 py-2"
                                  />
                                  <button
                                    className="px-4 py-2 rounded-full bg-indigo-600 text-white disabled:opacity-50"
                                    disabled={
                                      !newCategoryName.trim() ||
                                      templatesLoading
                                    }
                                    onClick={async () => {
                                      const name = newCategoryName.trim();
                                      if (!name) return;
                                      try {
                                        await templateService.createCategory(
                                          activeTemplateTab,
                                          name
                                        );
                                        setNewCategoryName("");
                                        fetchTemplates();
                                      } catch (e: any) {
                                        setTemplatesError(
                                          e?.response?.data?.message ||
                                            "Failed to create category"
                                        );
                                      }
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                              {templatesLoading ? (
                                <div className="text-gray-500">Loading...</div>
                              ) : templates.length === 0 ? (
                                <div className="text-gray-500">
                                  No categories
                                </div>
                              ) : (
                                <ul className="space-y-1">
                                  {templates.map((cat) => (
                                    <li key={cat._id}>
                                      <button
                                        className={`w-full text-left px-3 py-2 rounded ${
                                          selectedCategoryId === cat._id
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "hover:bg-gray-50"
                                        }`}
                                        onClick={() =>
                                          setSelectedCategoryId(cat._id)
                                        }
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{cat.name}</span>
                                          <button
                                            title="Delete category"
                                            className="text-red-600 text-xs hover:underline"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              setConfirmDeleteCategory({
                                                id: cat._id,
                                                name: cat.name,
                                              });
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Jobs */}
                            <div className="p-4">
                              <div className="mb-3">
                                <h4 className="font-semibold mb-2">Jobs</h4>
                                <div className="flex gap-2">
                                  <input
                                    value={newJobName}
                                    onChange={(e) =>
                                      setNewJobName(e.target.value)
                                    }
                                    placeholder="Add new job"
                                    className="flex-1 border rounded-full px-3 py-2"
                                    disabled={!selectedCategory}
                                  />
                                  <button
                                    className="px-4 py-2 rounded-full bg-indigo-600 text-white disabled:opacity-50"
                                    disabled={
                                      !selectedCategory ||
                                      !newJobName.trim() ||
                                      templatesLoading
                                    }
                                    onClick={async () => {
                                      if (!selectedCategory) return;
                                      const name = newJobName.trim();
                                      if (!name) return;
                                      try {
                                        await templateService.addJob(
                                          selectedCategory._id,
                                          name
                                        );
                                        setNewJobName("");
                                        fetchTemplates();
                                      } catch (e: any) {
                                        setTemplatesError(
                                          e?.response?.data?.message ||
                                            "Failed to add job"
                                        );
                                      }
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                              {!selectedCategory ? (
                                <div className="text-gray-500">
                                  Select a category to view jobs
                                </div>
                              ) : selectedCategory.jobs.length === 0 ? (
                                <div className="text-gray-500">No jobs</div>
                              ) : (
                                <ul className="space-y-1">
                                  {selectedCategory.jobs.map((j, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50"
                                    >
                                      <span>{j}</span>
                                      <button
                                        className="text-red-600 text-xs hover:underline"
                                        onClick={() =>
                                          setConfirmRemoveJob({
                                            index: idx,
                                            name: j,
                                          })
                                        }
                                      >
                                        Remove
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Requirements */}
                            <div className="p-4">
                              <div className="mb-3">
                                <h4 className="font-semibold mb-2">
                                  Requirements
                                </h4>
                                <div className="flex gap-2">
                                  <input
                                    value={newRequirement}
                                    onChange={(e) =>
                                      setNewRequirement(e.target.value)
                                    }
                                    placeholder="Add new requirement"
                                    className="flex-1 border rounded-full px-3 py-2"
                                    disabled={!selectedCategory}
                                  />
                                  <button
                                    className="px-4 py-2 rounded-full bg-indigo-600 text-white disabled:opacity-50"
                                    disabled={
                                      !selectedCategory ||
                                      !newRequirement.trim() ||
                                      templatesLoading
                                    }
                                    onClick={async () => {
                                      if (!selectedCategory) return;
                                      const text = newRequirement.trim();
                                      if (!text) return;
                                      try {
                                        await templateService.addRequirement(
                                          selectedCategory._id,
                                          text
                                        );
                                        setNewRequirement("");
                                        fetchTemplates();
                                      } catch (e: any) {
                                        setTemplatesError(
                                          e?.response?.data?.message ||
                                            "Failed to add requirement"
                                        );
                                      }
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                              {!selectedCategory ? (
                                <div className="text-gray-500">
                                  Select a category to view requirements
                                </div>
                              ) : selectedCategory.requirements.length === 0 ? (
                                <div className="text-gray-500">
                                  No requirements
                                </div>
                              ) : (
                                <ul className="space-y-1">
                                  {selectedCategory.requirements.map(
                                    (r, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50"
                                      >
                                        <span>{r}</span>
                                        <button
                                          className="text-red-600 text-xs hover:underline"
                                          onClick={() =>
                                            setConfirmRemoveRequirement({
                                              index: idx,
                                              text: r,
                                            })
                                          }
                                        >
                                          Remove
                                        </button>
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Delete Category Confirmation Modal */}
                      {confirmDeleteCategory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                            <h4 className="text-lg font-semibold mb-2">
                              Delete category
                            </h4>
                            <p className="text-sm text-gray-700 mb-4">
                              Are you sure you want to delete category "
                              {confirmDeleteCategory.name}"? This action cannot
                              be undone.
                            </p>
                            <div className="flex justify-end gap-2">
                              <button
                                className="px-4 py-2 rounded bg-gray-100"
                                onClick={() => setConfirmDeleteCategory(null)}
                                disabled={deletingCategory}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                                disabled={deletingCategory}
                                onClick={async () => {
                                  if (!confirmDeleteCategory) return;
                                  setDeletingCategory(true);
                                  setTemplatesError("");
                                  try {
                                    await templateService.deleteCategory(
                                      confirmDeleteCategory.id
                                    );
                                    setConfirmDeleteCategory(null);
                                    fetchTemplates();
                                  } catch (err: any) {
                                    setTemplatesError(
                                      err?.response?.data?.message ||
                                        "Failed to delete category"
                                    );
                                  } finally {
                                    setDeletingCategory(false);
                                  }
                                }}
                              >
                                {deletingCategory ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Remove Job Confirmation Modal */}
                      {confirmRemoveJob && selectedCategory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                            <h4 className="text-lg font-semibold mb-2">
                              Remove job
                            </h4>
                            <p className="text-sm text-gray-700 mb-4">
                              Remove job "{confirmRemoveJob.name}" from category
                              "{selectedCategory.name}"?
                            </p>
                            <div className="flex justify-end gap-2">
                              <button
                                className="px-4 py-2 rounded bg-gray-100"
                                onClick={() => setConfirmRemoveJob(null)}
                                disabled={removingJob}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                                disabled={removingJob}
                                onClick={async () => {
                                  if (!selectedCategory || !confirmRemoveJob)
                                    return;
                                  setRemovingJob(true);
                                  setTemplatesError("");
                                  try {
                                    await templateService.removeJob(
                                      selectedCategory._id,
                                      confirmRemoveJob.index
                                    );
                                    setConfirmRemoveJob(null);
                                    fetchTemplates();
                                  } catch (err: any) {
                                    setTemplatesError(
                                      err?.response?.data?.message ||
                                        "Failed to remove job"
                                    );
                                  } finally {
                                    setRemovingJob(false);
                                  }
                                }}
                              >
                                {removingJob ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Remove Requirement Confirmation Modal */}
                      {confirmRemoveRequirement && selectedCategory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                            <h4 className="text-lg font-semibold mb-2">
                              Remove requirement
                            </h4>
                            <p className="text-sm text-gray-700 mb-4">
                              Remove requirement "
                              {confirmRemoveRequirement.text}" from category "
                              {selectedCategory.name}"?
                            </p>
                            <div className="flex justify-end gap-2">
                              <button
                                className="px-4 py-2 rounded bg-gray-100"
                                onClick={() =>
                                  setConfirmRemoveRequirement(null)
                                }
                                disabled={removingRequirement}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                                disabled={removingRequirement}
                                onClick={async () => {
                                  if (
                                    !selectedCategory ||
                                    !confirmRemoveRequirement
                                  )
                                    return;
                                  setRemovingRequirement(true);
                                  setTemplatesError("");
                                  try {
                                    await templateService.removeRequirement(
                                      selectedCategory._id,
                                      confirmRemoveRequirement.index
                                    );
                                    setConfirmRemoveRequirement(null);
                                    fetchTemplates();
                                  } catch (err: any) {
                                    setTemplatesError(
                                      err?.response?.data?.message ||
                                        "Failed to remove requirement"
                                    );
                                  } finally {
                                    setRemovingRequirement(false);
                                  }
                                }}
                              >
                                {removingRequirement ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : activeTab === "reviews" ? (
                // Reviews Management
                <div>
                  <div className="px-6 sm:px-24 pt-6 pb-3 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Reviews
                        </h3>
                        <p className="text-sm text-gray-600">
                          Browse and search user reviews across jobs.
                        </p>
                      </div>
                      <form
                        onSubmit={onReviewsSearch}
                        className="mb-2 w-full sm:w-1/2 md:w-1/3"
                      >
                        <div className="flex gap-2">
                          <input
                            value={reviewsSearch}
                            onChange={(e) => setReviewsSearch(e.target.value)}
                            placeholder="Search by text, reviewer, reviewee, or job"
                            className="flex-1 border rounded-full px-4 py-2"
                          />
                          <button className="px-4 py-2 rounded-full bg-black text-white">
                            Search
                          </button>
                        </div>
                      </form>
                    </div>
                    {reviewsError && (
                      <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {reviewsError}
                      </div>
                    )}
                  </div>

                  <div className="px-6 sm:px-24 py-6 bg-white overflow-x-auto mt-5">
                    <div className="border w-fit sm:w-full border-indigo-100 rounded-xl shadow-sm overflow-hidden">
                      <table className="min-w-full divide-y divide-indigo-100">
                        <thead className="bg-indigo-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Created
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Rating
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Comment
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Reviewer
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Reviewee
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              Job
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-indigo-100">
                          {reviewsLoading ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-6 text-center text-gray-500"
                              >
                                Loading...
                              </td>
                            </tr>
                          ) : reviews.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-6 text-center text-gray-500"
                              >
                                No reviews found
                              </td>
                            </tr>
                          ) : (
                            reviews.map((r) => (
                              <tr key={r._id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {r.createdAt
                                    ? new Date(r.createdAt).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {r.rating}/5
                                </td>
                                <td
                                  className="px-4 py-2 text-sm text-gray-700 max-w-md truncate"
                                  title={r.comment || ""}
                                >
                                  {r.comment || "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {typeof r.reviewer === "object"
                                    ? `${r.reviewer?.firstName || ""} ${r.reviewer?.lastName || ""}`.trim() ||
                                      r.reviewer?.email ||
                                      "-"
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {typeof r.reviewee === "object"
                                    ? `${r.reviewee?.firstName || ""} ${r.reviewee?.lastName || ""}`.trim() ||
                                      r.reviewee?.email ||
                                      "-"
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {typeof r.jobId === "object"
                                    ? r.jobId?.title || "-"
                                    : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Total: {reviewsTotal}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={reviewsPage <= 1}
                          onClick={() =>
                            setReviewsPage((p) => Math.max(1, p - 1))
                          }
                          className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <span className="text-sm">
                          Page {reviewsPage} / {reviewsTotalPages}
                        </span>
                        <button
                          disabled={reviewsPage >= reviewsTotalPages}
                          onClick={() =>
                            setReviewsPage((p) =>
                              Math.min(reviewsTotalPages, p + 1)
                            )
                          }
                          className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "plans" ? (
                // Payment Plans
                <div>
                  <div className="px-6 sm:px-24 pt-6 pb-3 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Payment Plans
                        </h3>
                        <p className="text-sm text-gray-600">
                          Create and manage subscription plans.
                        </p>
                      </div>
                      <button
                        className="bg-primary text-white px-4 py-2 rounded-full hover:bg-gray-800"
                        onClick={() => setShowCreatePlan(true)}
                      >
                        + Create
                      </button>
                    </div>
                    {plansError && (
                      <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {plansError}
                      </div>
                    )}
                  </div>

                  <div className="px-6 sm:px-24 py-6 bg-white overflow-x-auto mt-5">
                    {plansLoading ? (
                      <div className="p-6 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No plans found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((p) => {
                          const priceLabel =
                            p.price === 0
                              ? "Free"
                              : `Rs. ${p.price.toLocaleString()}${p.interval === "monthly" ? "/mo" : "/yr"}`;
                          return (
                            <div
                              key={p._id}
                              className="border border-indigo-100 rounded-xl shadow-sm p-4 flex flex-col"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {p.name}
                                  </h4>
                                  {p.subHeader && (
                                    <p className="text-sm text-gray-600 mt-0.5">
                                      {p.subHeader}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                >
                                  {p.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div className="mt-3 text-primary text-xl font-bold">
                                {priceLabel}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                Audience: {p.audience}
                              </div>
                              <div className="mt-3">
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {p.features.slice(0, 6).map((f, idx) => (
                                    <li key={idx}>{f}</li>
                                  ))}
                                  {p.features.length > 6 && (
                                    <li className="text-gray-500">
                                      + {p.features.length - 6} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button
                                  className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                                  onClick={() => openEditPlan(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`px-3 py-1 rounded text-sm ${p.isActive ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-green-600 text-white hover:bg-green-700"}`}
                                  onClick={() => togglePlanActive(p)}
                                >
                                  {p.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {showCreatePlan && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                          Create Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Plan Name */}
                          <input
                            value={createPlanData.name}
                            onChange={(e) =>
                              setCreatePlanData({
                                ...createPlanData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Plan Name"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />

                          {/* Amount: Free or typed amount */}
                          <div className="flex items-center gap-3 md:col-span-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={planIsFree}
                                onChange={(e) => {
                                  setPlanIsFree(e.target.checked);
                                  if (e.target.checked) {
                                    setCreatePlanData({
                                      ...createPlanData,
                                      price: "0",
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">
                                Free
                              </span>
                            </label>
                            <input
                              value={createPlanData.price}
                              onChange={(e) =>
                                setCreatePlanData({
                                  ...createPlanData,
                                  price: e.target.value,
                                })
                              }
                              placeholder="Amount (LKR)"
                              className="border rounded px-3 py-2 flex-1"
                              disabled={planIsFree}
                              inputMode="numeric"
                            />
                          </div>

                          {/* Interval */}
                          <select
                            value={createPlanData.interval}
                            onChange={(e) =>
                              setCreatePlanData({
                                ...createPlanData,
                                interval: e.target.value as PlanInterval,
                              })
                            }
                            className="border rounded px-3 py-2"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>

                          {/* Audience */}
                          <select
                            value={createPlanData.audience}
                            onChange={(e) =>
                              setCreatePlanData({
                                ...createPlanData,
                                audience: e.target.value as PlanAudience,
                              })
                            }
                            className="border rounded px-3 py-2"
                          >
                            <option value="both">Both</option>
                            <option value="job_seeker">Job Seeker</option>
                            <option value="talent_connector">
                              Talent Connector
                            </option>
                          </select>

                          {/* Sub header */}
                          <input
                            value={createPlanData.subHeader}
                            onChange={(e) =>
                              setCreatePlanData({
                                ...createPlanData,
                                subHeader: e.target.value,
                              })
                            }
                            placeholder="Sub header"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />

                          {/* Requirements */}
                          <textarea
                            value={createPlanData.featuresText}
                            onChange={(e) =>
                              setCreatePlanData({
                                ...createPlanData,
                                featuresText: e.target.value,
                              })
                            }
                            placeholder="Requirements (one per line)"
                            className="border rounded px-3 py-2 md:col-span-2"
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-100"
                            onClick={() => setShowCreatePlan(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                            disabled={creatingPlan}
                            onClick={async () => {
                              setPlansError("");
                              setCreatingPlan(true);
                              try {
                                const priceNum = planIsFree
                                  ? 0
                                  : Number(createPlanData.price);
                                if (!createPlanData.name.trim()) {
                                  throw new Error("Please enter a plan name");
                                }
                                if (
                                  !planIsFree &&
                                  (isNaN(priceNum) || priceNum < 0)
                                ) {
                                  throw new Error(
                                    "Please enter a valid amount or mark as Free"
                                  );
                                }
                                const features = createPlanData.featuresText
                                  .split(/\r?\n/)
                                  .map((l) => l.trim())
                                  .filter(Boolean);
                                await adminService.createPlan({
                                  name: createPlanData.name.trim(),
                                  price: priceNum,
                                  interval: createPlanData.interval,
                                  audience: createPlanData.audience,
                                  subHeader:
                                    createPlanData.subHeader?.trim() ||
                                    undefined,
                                  features,
                                });
                                setShowCreatePlan(false);
                                setCreatePlanData({
                                  name: "",
                                  price: "",
                                  interval: "monthly",
                                  audience: "both",
                                  subHeader: "",
                                  featuresText: "",
                                });
                                setPlanIsFree(false);
                                fetchPlans();
                              } catch (e: any) {
                                setPlansError(
                                  e?.response?.data?.message ||
                                    e.message ||
                                    "Failed to create plan"
                                );
                              } finally {
                                setCreatingPlan(false);
                              }
                            }}
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {showEditPlan && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                          Update Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Plan Name */}
                          <input
                            value={editPlanData.name}
                            onChange={(e) =>
                              setEditPlanData({
                                ...editPlanData,
                                name: e.target.value,
                              })
                            }
                            placeholder="Plan Name"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />

                          {/* Amount: Free or typed amount */}
                          <div className="flex items-center gap-3 md:col-span-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editPlanIsFree}
                                onChange={(e) => {
                                  setEditPlanIsFree(e.target.checked);
                                  if (e.target.checked) {
                                    setEditPlanData({
                                      ...editPlanData,
                                      price: "0",
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">
                                Free
                              </span>
                            </label>
                            <input
                              value={editPlanData.price}
                              onChange={(e) =>
                                setEditPlanData({
                                  ...editPlanData,
                                  price: e.target.value,
                                })
                              }
                              placeholder="Amount (LKR)"
                              className="border rounded px-3 py-2 flex-1"
                              disabled={editPlanIsFree}
                              inputMode="numeric"
                            />
                          </div>

                          {/* Interval */}
                          <select
                            value={editPlanData.interval}
                            onChange={(e) =>
                              setEditPlanData({
                                ...editPlanData,
                                interval: e.target.value as PlanInterval,
                              })
                            }
                            className="border rounded px-3 py-2"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>

                          {/* Audience */}
                          <select
                            value={editPlanData.audience}
                            onChange={(e) =>
                              setEditPlanData({
                                ...editPlanData,
                                audience: e.target.value as PlanAudience,
                              })
                            }
                            className="border rounded px-3 py-2"
                          >
                            <option value="both">Both</option>
                            <option value="job_seeker">Job Seeker</option>
                            <option value="talent_connector">
                              Talent Connector
                            </option>
                          </select>

                          {/* Sub header */}
                          <input
                            value={editPlanData.subHeader}
                            onChange={(e) =>
                              setEditPlanData({
                                ...editPlanData,
                                subHeader: e.target.value,
                              })
                            }
                            placeholder="Sub header"
                            className="border rounded px-3 py-2 md:col-span-2"
                          />

                          {/* Requirements */}
                          <textarea
                            value={editPlanData.featuresText}
                            onChange={(e) =>
                              setEditPlanData({
                                ...editPlanData,
                                featuresText: e.target.value,
                              })
                            }
                            placeholder="Requirements (one per line)"
                            className="border rounded px-3 py-2 md:col-span-2"
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-100"
                            onClick={() => setShowEditPlan(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                            disabled={updatingPlan}
                            onClick={async () => {
                              setPlansError("");
                              setUpdatingPlan(true);
                              try {
                                const priceNum = editPlanIsFree
                                  ? 0
                                  : Number(editPlanData.price);
                                if (!editPlanData.name.trim()) {
                                  throw new Error("Please enter a plan name");
                                }
                                if (
                                  !editPlanIsFree &&
                                  (isNaN(priceNum) || priceNum < 0)
                                ) {
                                  throw new Error(
                                    "Please enter a valid amount or mark as Free"
                                  );
                                }
                                const features = editPlanData.featuresText
                                  .split(/\r?\n/)
                                  .map((l) => l.trim())
                                  .filter(Boolean);
                                await adminService.updatePlan(editingPlanId, {
                                  name: editPlanData.name.trim(),
                                  price: priceNum,
                                  interval: editPlanData.interval,
                                  audience: editPlanData.audience,
                                  subHeader:
                                    editPlanData.subHeader?.trim() || undefined,
                                  features,
                                });
                                setShowEditPlan(false);
                                setEditingPlanId("");
                                fetchPlans();
                              } catch (e: any) {
                                setPlansError(
                                  e?.response?.data?.message ||
                                    e.message ||
                                    "Failed to update plan"
                                );
                              } finally {
                                setUpdatingPlan(false);
                              }
                            }}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Dashboard content
                <div className=" overflow-hidden">
                  <div>
                    {/* Latest Insights */}
                    <div className=" px-6 sm:px-24  py-6 sm:py-8 gap-4 w-full ">
                      <h3 className="text-md text-center md:text-start font-semibold text-gray-900 mb-4">
                        Latest Insights
                      </h3>
                      {statsError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                          {statsError}
                        </div>
                      )}
                      <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                          {/* total users*/}
                          <div className=" rounded-xl bg-white w-full sm:w-1/2">
                            <div className="bg-teal-600 p-4 rounded-xl flex items-center  text-center text-white gap-4">
                              <div className="text-sm">Total Users</div>
                              <div className="text-2xl font-bold ">
                                {statsLoading
                                  ? "..."
                                  : dashboardStats.users.total}
                              </div>
                            </div>
                            <div className="flex w-full gap-4">
                              <div className=" p-4 rounded-xl  text-center w-full text-primary">
                                <div className="text-2xl font-bold ">
                                  {statsLoading
                                    ? "..."
                                    : dashboardStats.users.jobSeekers}
                                </div>
                                <div className="text-sm">Total Seekers</div>
                              </div>
                              <div className="p-4 rounded-xl text-primary text-center w-full">
                                <div className="text-2xl font-bold ">
                                  {statsLoading
                                    ? "..."
                                    : dashboardStats.users.talentConnectors}
                                </div>
                                <div className=" text-sm">
                                  Total Talent Connectors
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* jobs*/}
                          <div className=" rounded-xl bg-white w-full sm:w-1/2">
                            <div className="bg-green-600 p-4 rounded-xl flex items-center  text-center text-white gap-4">
                              <div className="text-sm">Total Jobs</div>
                              <div className="text-2xl font-bold ">
                                {statsLoading
                                  ? "..."
                                  : dashboardStats.jobs.total}
                              </div>
                            </div>
                            <div className="flex w-full gap-4">
                              <div className=" p-4 rounded-xl  text-center w-full text-primary">
                                <div className="text-2xl font-bold ">
                                  {statsLoading
                                    ? "..."
                                    : dashboardStats.jobs.active}
                                </div>
                                <div className="text-sm">Active Jobs</div>
                              </div>
                              <div className="p-4 rounded-xl text-primary text-center w-full">
                                <div className="text-2xl font-bold ">
                                  {statsLoading
                                    ? "..."
                                    : dashboardStats.jobs.completed}
                                </div>
                                <div className=" text-sm">Completed Jobs</div>
                              </div>
                              <div className="p-4 rounded-xl text-primary text-center w-full">
                                <div className="text-2xl font-bold ">
                                  {statsLoading
                                    ? "..."
                                    : dashboardStats.jobs.pendingApproval}
                                </div>
                                <div className=" text-sm">Pending Approval</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* total revenue*/}
                        <div className=" rounded-xl bg-white w-full">
                          <div className="bg-purple-900 p-4 rounded-xl flex items-center  text-center text-white gap-4">
                            <div className="text-sm">Total Revenue</div>
                            <div className="text-2xl font-bold ">0</div>
                          </div>
                          <div className="flex w-full gap-4">
                            <div className=" p-4 rounded-xl  text-center w-full text-primary">
                              <div className="text-2xl font-bold ">0</div>
                              <div className="text-sm">Today Income</div>
                            </div>
                            <div className="p-4 rounded-xl text-primary text-center w-full">
                              <div className="text-2xl font-bold ">0</div>
                              <div className=" text-sm">
                                Job Seeker Subscriptions
                              </div>
                            </div>
                            <div className="p-4 rounded-xl text-primary text-center w-full">
                              <div className="text-2xl font-bold ">0</div>
                              <div className=" text-sm">
                                Talent Connector Subscriptions
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Needed */}
                    <div className="mt-4 mb-4 px-6 sm:px-24  py-6 sm:py-8 gap-">
                      <h3 className="text-md text-center md:text-start font-semibold text-gray-900 mb-4">
                        Action Needed
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                        <div className=" rounded-xl bg-white w-full ">
                          <div className="bg-red-500  p-4 rounded-xl  text-center text-white text-md font-medium">
                            Reports
                          </div>
                          <div className="flex w-full gap-4">
                            <div className=" p-4 rounded-xl  text-center w-full text-primary">
                              <div className="text-2xl font-bold ">0</div>
                              <div className="text-sm">Reported Jobs</div>
                            </div>
                            <div className="p-4 rounded-xl text-primary text-center w-full">
                              <div className="text-2xl font-bold ">0</div>
                              <div className=" text-sm">Completed Jobs</div>
                            </div>
                          </div>
                        </div>
                        <div className=" rounded-xl bg-white w-full ">
                          <div className="bg-yellow-600  p-4 rounded-xl  text-center text-white text-md font-medium">
                            Pending Approvals
                          </div>
                          <div className="flex w-full gap-4">
                            <div className=" p-4 rounded-xl  text-center w-full text-primary">
                              <div className="text-2xl font-bold ">0</div>
                              <div className="text-sm">Pending Payment</div>
                            </div>
                            <div className="p-4 rounded-xl text-primary text-center w-full">
                              <div className="text-2xl font-bold ">0</div>
                              <div className=" text-sm">Pending Reviews</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/*job modal */}
      {showJobModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeJobModal}
        >
          <div
            className="bg-white w-full max-w-[95vw] lg:w-[1200px] lg:h-[600px] h-[500px] rounded-xl shadow-xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold tracking-tighter">
                Job Overview
              </h3>
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={closeJobModal}
              >
                ✕
              </button>
            </div>

            {jobModalError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {jobModalError}
              </div>
            )}

            {jobModalLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : !selectedJob ? (
              <div className="p-6 text-center text-gray-500">Job not found</div>
            ) : (
              <div className="">
                <div>
                  <div className="mb-3 p-2 rounded-xl bg-[linear-gradient(135deg,#8750E9_0%,#6925E3_100%)]">
                    <div className="text-xl mb-1 font-semibold text-white tracking-tight">
                      {selectedJob.title}
                    </div>
                    <div className="text-sm text-white">
                      Created{" "}
                      {selectedJob.createdAt
                        ? new Date(selectedJob.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                  <div className="grid gird-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      {/* talent connector info */}
                      <div className="border rounded-xl p-4 mb-4">
                        <div className="text-gray-500 text-sm">
                          Talent Connector
                        </div>
                        <div className="font-medium">
                          {selectedJob.employerId
                            ? `${selectedJob.employerId.firstName} ${selectedJob.employerId.lastName}`
                            : "-"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedJob.employerId?.email}
                        </div>
                      </div>

                      {/* Actions -  only for pending */}
                      {jobsMgmtTab === "pending" &&
                        (selectedJob.approvalStatus === "pending" ||
                          !selectedJob.approvalStatus) && (
                          <div className="rounded-xl p-4 bg-violet-50">
                            <button
                              disabled={actionBusy}
                              onClick={() =>
                                selectedJobId && onApprove(selectedJobId)
                              }
                              className="w-full mb-3 px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
                            >
                              {actionBusy ? "Processing..." : "Approve"}
                            </button>

                            <div className="bg-white rounded-lg p-3">
                              <label className="text-sm text-gray-600">
                                Reject reason
                              </label>
                              <textarea
                                className="mt-1 w-full border rounded-lg p-2 text-sm"
                                rows={3}
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                placeholder="Tell reject reason to talent connector"
                              />
                              <button
                                disabled={actionBusy}
                                onClick={onRejectConfirm}
                                className="mt-2 w-full px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
                              >
                                {actionBusy ? "Processing..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>{" "}
                    <div className="md:col-span-2 ">
                      {selectedJob.description ? (
                        <div
                          className="prose prose-sm tiptap mb-6 text-start text-gray-800"
                          // The job form stores exact HTML from TipTap; render it to match formatting
                          dangerouslySetInnerHTML={{
                            __html: selectedJob.description,
                          }}
                        />
                      ) : (
                        <div className="text-gray-500 mb-4">No description</div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm text-start mt-8">
                        <div>
                          <div className="text-gray-500">Category</div>
                          <div className="font-medium">
                            {selectedJob.category}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Location</div>
                          <div className="font-medium">
                            {selectedJob.location}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Deadline</div>
                          <div className="font-medium">
                            {selectedJob.completionDeadline
                              ? new Date(
                                  selectedJob.completionDeadline
                                ).toLocaleDateString()
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Payment</div>
                          <div className="font-medium">
                            {selectedJob.paymentAmount
                              ? `Rs. ${selectedJob.paymentAmount.toLocaleString()}${selectedJob.paymentType ? ` (${selectedJob.paymentType})` : ""}`
                              : "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Urgency</div>
                          <div className="font-medium">
                            {selectedJob.urgency || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Active</div>
                          <div className="font-medium">
                            {selectedJob.isActive ? "Yes" : "No"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Approval Status</div>
                          <div className="font-medium">
                            {selectedJob.approvalStatus || "pending"}
                          </div>
                        </div>
                        {selectedJob.rejectedReason && (
                          <div className="md:col-span-2">
                            <div className="text-gray-500">Rejected Reason</div>
                            <div className="font-medium">
                              {selectedJob.rejectedReason}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-8 text-start">
                        <div className="text-gray-500 text-sm mb-1">
                          Requirements
                        </div>
                        <div className="text-gray-800 whitespace-pre-line">
                          {selectedJob.basicRequirements || "-"}
                        </div>
                      </div>
                      <div className="mt-8 text-start">
                        <div className="text-gray-500 text-sm mb-1">
                          Additional Notes
                        </div>
                        <div className="text-gray-800 whitespace-pre-line">
                          {selectedJob.additionalNotes || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
