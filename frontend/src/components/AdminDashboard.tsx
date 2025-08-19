import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  adminService,
  AdminUserItem,
  DashboardStats,
  Role,
} from "../services/adminService";
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
    jobs: { total: 0, active: 0, completed: 0 },
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string>("");

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
    "template"
  );

  // Label for current template tab (for header)
  const currentTemplateLabel = useMemo(() => {
    const found = templateTabs.find((t) => t.key === activeTemplateTab);
    return found?.label || "Templates";
  }, [templateTabs, activeTemplateTab]);

  const fetchDashboardStats = async () => {
    if (activeTab !== "dashboard") return;
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

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeRole, page, pageSize]);

  // Load templates when Jobs tab or template type changes
  useEffect(() => {
    if (activeTab === "jobs") {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeTemplateTab]);

  // Reset selection and inputs when switching template type
  useEffect(() => {
    setSelectedCategoryId("");
    setNewCategoryName("");
    setNewJobName("");
    setNewRequirement("");
  }, [activeTemplateTab]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
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
        <div className="max-w-full px-6 sm:px-24 h-14 flex items-center">
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
                    // Placeholder panel for Job Management
                    <div className="px-6 sm:px-24 py-6 bg-white mt-5">
                      <div className="border w-full border-indigo-100 rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-2">
                          Job Management
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Manage posted jobs, approvals, and statuses here.
                          (Coming soon)
                        </p>
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
    </div>
  );
};

export default AdminDashboard;
