import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  applicationService,
  type ApplicationDTO,
} from "../../services/applicationService";
import { jobService, type Job } from "../../services/jobService";

const ManageJobsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  const [activeTab, setActiveTab] = useState<
    "all" | "shortlisted" | "confirmed" | "completed" | "rejected"
  >("all");
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [jobsData, setJobsData] = useState<Record<string, Job>>({});
  const [selectedApp, setSelectedApp] = useState<ApplicationDTO | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setAppsError(null);
        setAppsLoading(true);
        const list = await applicationService.myApplications();
        if (!stop) {
          setApplications(list);

          // Fetch job details for each application
          const jobIds = Array.from(new Set(list.map((app) => app.jobId)));
          const jobsMap: Record<string, Job> = {};

          await Promise.all(
            jobIds.map(async (jobId) => {
              try {
                const job = await jobService.getJobById(jobId);
                jobsMap[jobId] = job;
              } catch (error) {
                console.error(`Failed to fetch job ${jobId}:`, error);
              }
            })
          );

          if (!stop) setJobsData(jobsMap);
        }
      } catch (e: any) {
        if (!stop)
          setAppsError(
            e?.response?.data?.message || "Failed to load applications"
          );
      } finally {
        if (!stop) setAppsLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const normalize = (s: string) => {
    const x = (s || "").toLowerCase();
    if (x.includes("short")) return "shortlisted" as const;
    if (x.includes("approv") || x.includes("confirm"))
      return "confirmed" as const;
    if (x.includes("complet")) return "completed" as const;
    if (x.includes("reject")) return "rejected" as const;
    return "applied" as const;
  };

  const counts = useMemo(() => {
    const base = {
      all: applications.length,
      shortlisted: 0,
      confirmed: 0,
      completed: 0,
      rejected: 0,
    } as const;
    const m: any = { ...base };
    applications.forEach((a) => {
      const st = normalize(a.status);
      if (st in m) m[st] += 1;
    });
    return m as {
      all: number;
      shortlisted: number;
      confirmed: number;
      completed: number;
      rejected: number;
    };
  }, [applications]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return applications;
    return applications.filter((a) => normalize(a.status) === activeTab);
  }, [applications, activeTab]);

  // Check if offer is expired (24 hours after shortlisted)
  const isOfferExpired = (app: ApplicationDTO) => {
    if (normalize(app.status) !== "shortlisted" || !app.updatedAt) return false;
    const shortlistedTime = new Date(app.updatedAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - shortlistedTime) / (1000 * 60 * 60);
    return hoursElapsed >= 24;
  };

  // Get time remaining for shortlisted offers
  const getTimeRemaining = (app: ApplicationDTO) => {
    if (normalize(app.status) !== "shortlisted" || !app.updatedAt) return null;
    const shortlistedTime = new Date(app.updatedAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - shortlistedTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursElapsed);

    if (hoursRemaining <= 0) return "Expired";
    if (hoursRemaining < 1)
      return `${Math.ceil(hoursRemaining * 60)} minutes remaining`;
    return `${Math.ceil(hoursRemaining)} hours remaining`;
  };

  // Handle job card click to open modal
  const handleJobCardClick = (app: ApplicationDTO) => {
    setSelectedApp(app);
    setShowJobModal(true);
  };

  // Handle confirm job offer
  const handleConfirmOffer = async (appId: string) => {
    try {
      setActingId(appId);
      const res = await applicationService.confirmBySeeker(appId);
      setApplications((prev) => prev.map((x) => (x._id === appId ? res : x)));
      setShowJobModal(false);
    } catch (e) {
      console.error("Failed to confirm offer:", e);
    } finally {
      setActingId(null);
    }
  };

  // Handle reject job offer
  const handleRejectOffer = async (appId: string) => {
    try {
      setActingId(appId);
      const res = await applicationService.reject(appId);
      setApplications((prev) => prev.map((x) => (x._id === appId ? res : x)));
      setShowJobModal(false);
    } catch (e) {
      console.error("Failed to reject offer:", e);
    } finally {
      setActingId(null);
    }
  };

  // Handle complete job
  const handleCompleteJob = async (appId: string) => {
    // Will keep a copy for rollback in case API fails
    let rollbackState: ApplicationDTO | null = null;
    try {
      setActingId(appId);
      // 1) Optimistically update UI immediately
      console.debug("[complete] click for app", appId);
      setApplications((prev) => {
        const current = prev.find((x) => x._id === appId) || null;
        rollbackState = current ? { ...current } : null;
        console.debug("[complete] before optimistic:", current);
        return prev.map((x) =>
          x._id === appId
            ? ({ ...x, completedBySeeker: true } as ApplicationDTO)
            : x
        );
      });
      setSelectedApp((prev) =>
        prev && prev._id === appId
          ? ({ ...prev, completedBySeeker: true } as ApplicationDTO)
          : prev
      );

      // 2) Call API
      const res = await applicationService.completeBySeeker(appId);
      console.debug("[complete] API response:", res);

      // 3) Merge server response onto existing item (preserve fields)
      setApplications((prev) =>
        prev.map((x) =>
          x._id === appId
            ? ({
                ...x,
                ...(res ? (res as Partial<ApplicationDTO>) : {}),
                completedBySeeker: true,
                completedByConnector: !!(res && res.completedByConnector),
              } as ApplicationDTO)
            : x
        )
      );
      setSelectedApp((prev) =>
        prev && prev._id === appId
          ? ({
              ...prev,
              ...(res ? (res as Partial<ApplicationDTO>) : {}),
              completedBySeeker: true,
              completedByConnector: !!(res && res.completedByConnector),
            } as ApplicationDTO)
          : prev
      );
    } catch (e) {
      console.error("Failed to complete job:", e);
      // Rollback optimistic update if needed
      setApplications((prev) =>
        prev.map((x) =>
          x._id === appId && rollbackState ? rollbackState : x
        )
      );
      setSelectedApp((prev) =>
        prev && prev._id === appId && rollbackState ? rollbackState : prev
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      {/* Top Header */}
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

      {/* Seeker Tabs Nav */}
      <nav className="bg-[linear-gradient(135deg,#0B1022_0%,#0D0D15_100%)] text-white shadow-sm border-b border-black/5 sticky top-16 z-40">
        <div className="max-w-full px-6 sm:px-24 py-3 md:h-14 flex items-center">
          <div className="flex items-center justify-between sm:justify-normal sm:gap-4 w-full">
            {[
              {
                key: "dashboard",
                label: "Dashboard",
                path: "/job-seeker-dashboard",
              },
              { key: "manage", label: "Manage Jobs", path: "/jobs" },
              { key: "reviews", label: "Reviews", path: "/reviews" },
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

      {/* Content */}
      <main className="max-w-full px-6 sm:px-24 py-8 space-y-6">
        {/* Statistics on top */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Applications", value: counts.all },
            { label: "Shortlisted", value: counts.shortlisted },
            { label: "Confirmed", value: counts.confirmed },
            { label: "Completed", value: counts.completed },
            { label: "Rejected", value: counts.rejected },
          ].map((s, idx) => (
            <div key={idx} className="bg-white border rounded-2xl p-5">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <section className="bg-white border rounded-2xl">
          <div className="px-4 pt-4 border-b">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Applied", count: counts.all },
                {
                  key: "shortlisted",
                  label: "Shortlisted",
                  count: counts.shortlisted,
                },
                {
                  key: "confirmed",
                  label: "Confirmed",
                  count: counts.confirmed,
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: counts.completed,
                },
                { key: "rejected", label: "Rejected", count: counts.rejected },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    activeTab === t.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {appsLoading && (
              <div className="text-sm text-gray-500">
                Loading applications...
              </div>
            )}
            {appsError && (
              <div className="text-sm text-red-600">{appsError}</div>
            )}
            {!appsLoading && !appsError && (
              <div className="grid gap-4">
                {filtered.map((a) => {
                  const job = jobsData[a.jobId];
                  const timeRemaining = getTimeRemaining(a);
                  const isExpired = isOfferExpired(a);

                  return (
                    <div
                      key={a._id}
                      className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleJobCardClick(a)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {job?.title || "Loading job details..."}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                normalize(a.status) === "shortlisted"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : normalize(a.status) === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : normalize(a.status) === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : normalize(a.status) === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {normalize(a.status)}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600 text-start">
                            <p>
                              <span className="font-medium">
                                Talent Connector:
                              </span>{" "}
                              {job?.employerId
                                ? `${job.employerId.firstName} ${job.employerId.lastName}`
                                : "Loading..."}
                            </p>
                            <p>
                              <span className="font-medium">Applied:</span>{" "}
                              {new Date(a.createdAt || "").toLocaleDateString()}
                            </p>
                            {normalize(a.status) === "shortlisted" &&
                              a.updatedAt && (
                                <p>
                                  <span className="font-medium">
                                    Shortlisted:
                                  </span>{" "}
                                  {new Date(a.updatedAt).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(a.updatedAt).toLocaleTimeString()}
                                </p>
                              )}
                          </div>

                          {/* Expiry notice for shortlisted offers */}
                          {normalize(a.status) === "shortlisted" && (
                            <div
                              className={`mt-3 p-3 rounded-md ${isExpired ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-yellow-500"}`}
                                ></div>
                                <span
                                  className={`text-sm font-medium ${isExpired ? "text-red-800" : "text-yellow-800"}`}
                                >
                                  {isExpired
                                    ? "Offer Expired"
                                    : `${timeRemaining} to respond`}
                                </span>
                              </div>
                              <p
                                className={`text-sm text-start mt-1 ${isExpired ? "text-red-600" : "text-yellow-700"}`}
                              >
                                {isExpired
                                  ? "This offer has expired after 24 hours."
                                  : "This offer will expire if you don't respond within 24 hours."}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {normalize(a.status) === "shortlisted" &&
                            !isExpired && (
                              <>
                                <button
                                  disabled={actingId === a._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmOffer(a._id);
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  {actingId === a._id
                                    ? "Confirming..."
                                    : "Confirm Offer"}
                                </button>
                                <button
                                  disabled={actingId === a._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectOffer(a._id);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                  {actingId === a._id
                                    ? "Rejecting..."
                                    : "Reject Offer"}
                                </button>
                              </>
                            )}
                          {normalize(a.status) === "confirmed" && (
                            <div className="flex flex-col gap-2">
                              {!a.completedBySeeker && (
                                <button
                                  disabled={actingId === a._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteJob(a._id);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {actingId === a._id
                                    ? "Marking..."
                                    : "Mark as Completed"}
                                </button>
                              )}
                              {a.completedBySeeker &&
                                !a.completedByConnector && (
                                  <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    You have marked this job as completed.
                                    Waiting for talent connector to confirm
                                    completion, or system will automatically
                                    complete after 24hrs.
                                  </div>
                                )}
                              {a.completedByConnector &&
                                !a.completedBySeeker && (
                                  <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    Talent connector has marked this job as
                                    completed. Please confirm completion to
                                    complete this job, or system will
                                    automatically mark it as completed after
                                    24hrs.
                                  </div>
                                )}
                            </div>
                          )}
                          <button
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJobCardClick(a);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No applications found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Job Overview Modal */}
      {showJobModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[80vw] h-[75vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Job Overview
              </h2>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const job = jobsData[selectedApp.jobId];
                const timeRemaining = getTimeRemaining(selectedApp);
                const isExpired = isOfferExpired(selectedApp);

                return (
                  <div className="space-y-6">
                    {/* Job Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">
                        {job?.title || "Loading job details..."}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Talent Connector:
                          </span>
                          <p className="text-gray-900">
                            {job?.employerId
                              ? `${job.employerId.firstName} ${job.employerId.lastName}`
                              : "Loading..."}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Category:
                          </span>
                          <p className="text-gray-900">
                            {job?.category || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Budget:
                          </span>
                          <p className="text-gray-900">
                            ${job?.paymentAmount || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              normalize(selectedApp.status) === "shortlisted"
                                ? "bg-yellow-100 text-yellow-800"
                                : normalize(selectedApp.status) === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : normalize(selectedApp.status) === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : normalize(selectedApp.status) ===
                                        "completed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {normalize(selectedApp.status)}
                          </span>
                        </div>
                      </div>

                      {job?.description && (
                        <div className="mt-4">
                          <span className="font-medium text-gray-700">
                            Description:
                          </span>
                          <p className="text-gray-900 mt-1">
                            {job.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Application Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">
                        Application Timeline
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Applied:</span>
                          <span className="text-gray-900">
                            {new Date(
                              selectedApp.createdAt || ""
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              selectedApp.createdAt || ""
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        {normalize(selectedApp.status) === "shortlisted" &&
                          selectedApp.updatedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">
                                Shortlisted:
                              </span>
                              <span className="text-gray-900">
                                {new Date(
                                  selectedApp.updatedAt
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  selectedApp.updatedAt
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Expiry Notice for Shortlisted */}
                    {normalize(selectedApp.status) === "shortlisted" && (
                      <div
                        className={`p-4 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${isExpired ? "bg-red-500" : "bg-yellow-500"}`}
                          ></div>
                          <h4
                            className={`font-semibold ${isExpired ? "text-red-800" : "text-yellow-800"}`}
                          >
                            {isExpired
                              ? "Offer Expired"
                              : "Time Sensitive Offer"}
                          </h4>
                        </div>
                        <p
                          className={`text-sm ${isExpired ? "text-red-700" : "text-yellow-700"}`}
                        >
                          {isExpired
                            ? "This offer has expired after 24 hours. You may no longer be able to accept it."
                            : `You have ${timeRemaining} to respond to this offer. If you don't respond within 24 hours of being shortlisted, the offer will automatically expire.`}
                        </p>
                      </div>
                    )}

                    {/* Your Application Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Your Application</h4>
                      <div className="space-y-3 text-sm">
                        {selectedApp.name && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Name:
                            </span>
                            <p className="text-gray-900">{selectedApp.name}</p>
                          </div>
                        )}
                        {selectedApp.email && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Email:
                            </span>
                            <p className="text-gray-900">{selectedApp.email}</p>
                          </div>
                        )}
                        {selectedApp.phone && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Phone:
                            </span>
                            <p className="text-gray-900">{selectedApp.phone}</p>
                          </div>
                        )}
                        {selectedApp.bio && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Bio:
                            </span>
                            <p className="text-gray-900">{selectedApp.bio}</p>
                          </div>
                        )}
                        {selectedApp.skills &&
                          selectedApp.skills.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Skills:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedApp.skills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {selectedApp.services &&
                          selectedApp.services.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Services:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedApp.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowJobModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>

              {normalize(selectedApp.status) === "shortlisted" &&
                !isOfferExpired(selectedApp) && (
                  <>
                    <button
                      disabled={actingId === selectedApp._id}
                      onClick={() => handleRejectOffer(selectedApp._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {actingId === selectedApp._id
                        ? "Rejecting..."
                        : "Reject Job Offer"}
                    </button>
                    <button
                      disabled={actingId === selectedApp._id}
                      onClick={() => handleConfirmOffer(selectedApp._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {actingId === selectedApp._id
                        ? "Confirming..."
                        : "Confirm Job Offer"}
                    </button>
                  </>
                )}

              {normalize(selectedApp.status) === "confirmed" && (
                <div className="flex flex-col gap-2">
                  {!selectedApp.completedBySeeker && (
                    <button
                      disabled={actingId === selectedApp._id}
                      onClick={() => handleCompleteJob(selectedApp._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actingId === selectedApp._id
                        ? "Marking..."
                        : "Mark as Completed"}
                    </button>
                  )}
                  {selectedApp.completedBySeeker &&
                    !selectedApp.completedByConnector && (
                      <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                        You have marked this job as completed. Waiting for
                        talent connector to confirm completion, or system will
                        automatically complete after 24hrs.
                      </div>
                    )}
                  {selectedApp.completedByConnector &&
                    !selectedApp.completedBySeeker && (
                      <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                        Talent connector has marked this job as completed.
                        Please confirm completion to complete this job, or
                        system will automatically mark it as completed after
                        24hrs.
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobsPage;
