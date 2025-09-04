import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  applicationService,
  type ApplicationDTO,
  type ApplicationStatus,
} from "../../services/applicationService";
import { Job, jobService } from "../../services/jobService";

const TalentJobCandidates: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "shortlisted" | "confirmed" | "rejected" | "completed"
  >("all");
  const [apps, setApps] = useState<ApplicationDTO[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApplicationDTO | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);
      } catch (err) {
        setError("Failed to load job details");
        console.error("Error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // Load applications
  useEffect(() => {
    const run = async () => {
      if (!jobId) return;
      try {
        setAppsError(null);
        setAppsLoading(true);
        const list = await applicationService.listForJob(jobId);
        setApps(list);
      } catch (e: any) {
        setAppsError(
          e?.response?.data?.message || "Failed to load applications"
        );
      } finally {
        setAppsLoading(false);
      }
    };
    run();
  }, [jobId]);

  // Normalize any free-text to canonical statuses
  const normalize = (s?: string) => {
    const x = (s || "applied").toLowerCase();
    if (x.includes("short")) return "shortlisted" as const;
    if (x.includes("confirm")) return "confirmed" as const;
    if (x.includes("reject")) return "rejected" as const;
    if (x.includes("complete")) return "completed" as const;
    return "applied" as const;
  };

  const counts = useMemo(() => {
    const base = {
      all: apps.length,
      shortlisted: 0,
      confirmed: 0,
      rejected: 0,
      completed: 0,
    } as const;
    const m: any = { ...base };
    apps.forEach((a) => {
      const st = normalize(a.status);
      if (st in m) m[st] += 1;
    });
    return m as {
      all: number;
      shortlisted: number;
      confirmed: number;
      rejected: number;
      completed: number;
    };
  }, [apps]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return apps;
    return apps.filter((a) => normalize(a.status) === activeTab);
  }, [activeTab, apps]);

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <Link
            to={
              user?.role === "admin"
                ? "/admin-dashboard"
                : "/talent-connector-dashboard"
            }
            className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-full px-6 sm:px-24 py-8">
        {!user ||
        (user.role !== "talent_connector" && user.role !== "admin") ? (
          <div className="p-8">Redirecting...</div>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-primary mb-6 text-sm font-medium"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Job Overview
            </button>
            <div className="mb-6">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Candidates for {job?.title || "this job"}
                  </h1>
                  <p className="text-sm text-gray-500">Job ID: {jobId}</p>
                  {user?.role === "talent_connector" && job && (
                    <div className="mt-3">
                      {job.status === "active" ? (
                        <button
                          disabled={updating}
                          onClick={async () => {
                            if (!jobId) return;
                            try {
                              setUpdating(true);
                              const updated = await jobService.updateJobStatus(
                                jobId,
                                "expired"
                              );
                              setJob(updated);
                              try {
                                localStorage.setItem("closedJobId", jobId);
                              } catch {}
                            } catch (e) {
                              console.error("Failed to close applications", e);
                              alert(
                                "Failed to close applications. Please try again."
                              );
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                        >
                          {updating ? "Closing..." : "Close applications"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 font-medium">
                            Job applications closed!
                          </div>
                          {/* Re-open button if deadline not passed and job not completed */}
                          {(() => {
                            const deadline = job?.completionDeadline
                              ? new Date(job.completionDeadline).getTime()
                              : 0;
                            const now = Date.now();
                            const canReopen = deadline > now && job?.status !== "completed";
                            if (!canReopen) return null;
                            return (
                              <button
                                disabled={updating}
                                onClick={async () => {
                                  if (!jobId) return;
                                  try {
                                    setUpdating(true);
                                    const updated =
                                      await jobService.updateJobStatus(
                                        jobId,
                                        "active"
                                      );
                                    setJob(updated);
                                    try {
                                      const cid =
                                        localStorage.getItem("closedJobId");
                                      if (cid === jobId)
                                        localStorage.removeItem("closedJobId");
                                    } catch {}
                                  } catch (e) {
                                    console.error(
                                      "Failed to re-open applications",
                                      e
                                    );
                                    alert(
                                      "Failed to re-open applications. Please try again."
                                    );
                                  } finally {
                                    setUpdating(false);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                              >
                                {updating
                                  ? "Re-opening..."
                                  : "Re-open applications"}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white border rounded-2xl mb-4">
              <div className="px-4 pt-4 pb-3 border-b">
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
                      key: "rejected",
                      label: "Rejected",
                      count: counts.rejected,
                    },
                    {
                      key: "completed",
                      label: "Completed",
                      count: counts.completed,
                    },
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
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {appsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading applications...</p>
                </div>
              ) : appsError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{appsError}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No applications found for this filter.
                  </p>
                </div>
              ) : (
                filtered.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelected(app)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {app.name || "Anonymous"}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              normalize(app.status) === "shortlisted"
                                ? "bg-yellow-100 text-yellow-800"
                                : normalize(app.status) === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : normalize(app.status) === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : normalize(app.status) === "completed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {normalize(app.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <p>{app.email}</p>
                          {app.phone && <p>{app.phone}</p>}
                        </div>
                        {app.createdAt && (
                          <p className="text-xs text-gray-500">
                            Applied{" "}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {user?.role === "talent_connector" && (
                          <>
                            {normalize(app.status) === "applied" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    (async () => {
                                      try {
                                        setActing(true);
                                        await applicationService.shortlist(
                                          app._id
                                        );
                                        const updated = apps.map((x) =>
                                          x._id === app._id
                                            ? {
                                                ...x,
                                                status:
                                                  "shortlisted" as ApplicationStatus,
                                              }
                                            : x
                                        );
                                        setApps(updated);
                                      } finally {
                                        setActing(false);
                                      }
                                    })();
                                  }}
                                  disabled={acting}
                                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    (async () => {
                                      try {
                                        setActing(true);
                                        await applicationService.reject(
                                          app._id
                                        );
                                        const updated = apps.map((x) =>
                                          x._id === app._id
                                            ? {
                                                ...x,
                                                status:
                                                  "rejected" as ApplicationStatus,
                                              }
                                            : x
                                        );
                                        setApps(updated);
                                      } finally {
                                        setActing(false);
                                      }
                                    })();
                                  }}
                                  disabled={acting}
                                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {normalize(app.status) === "shortlisted" && (
                              <div className="px-3 py-1 text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 rounded">
                                Waiting for candidate confirmation
                              </div>
                            )}
                            {normalize(app.status) === "confirmed" && (
                              <div className="flex flex-col gap-1">
                                {!app.completedByConnector && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      (async () => {
                                        try {
                                          setActing(true);
                                          const updated = await applicationService.completeByConnector(app._id);
                                          setApps(prev => prev.map(x => x._id === app._id ? updated : x));
                                        } finally {
                                          setActing(false);
                                        }
                                      })();
                                    }}
                                    disabled={acting}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {acting ? "Marking..." : "Mark Completed"}
                                  </button>
                                )}
                                {app.completedByConnector && !app.completedBySeeker && (
                                  <div className="px-2 py-1 text-xs bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    Waiting for candidate confirmation
                                  </div>
                                )}
                                {app.completedBySeeker && !app.completedByConnector && (
                                  <div className="px-2 py-1 text-xs bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    Candidate marked completed
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setSelected(app)}
                          className="px-3 py-1 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Candidate details modal */}
            {selected && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSelected(null)}
                />
                <div
                  className="relative bg-white w-[80vw] h-[75vh] rounded-2xl shadow-xl border flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0">
                    <div className="font-semibold">Candidate details</div>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setSelected(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-3 text-start overflow-y-auto flex-1">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">{selected.name || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{selected.email || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{selected.phone || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Bio</div>
                      <div className="whitespace-pre-line">
                        {selected.bio || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {(selected.skills || []).map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                          >
                            {s}
                          </span>
                        ))}
                        {(!selected.skills || selected.skills.length === 0) && (
                          <span className="text-gray-700">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Services</div>
                      <div className="flex flex-wrap gap-2">
                        {(selected.services || []).map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                          >
                            {s}
                          </span>
                        ))}
                        {(!selected.services ||
                          selected.services.length === 0) && (
                          <span className="text-gray-700">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Other info</div>
                      <div className="whitespace-pre-line">
                        {selected.otherInfo || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
                    <div>
                      <span
                        className={`px-2 py-1 rounded-md text-gray-700 ${
                          normalize(selected.status) === "shortlisted"
                            ? "bg-yellow-100"
                            : normalize(selected.status) === "confirmed"
                              ? "bg-green-100"
                              : normalize(selected.status) === "rejected"
                                ? "bg-red-100"
                                : normalize(selected.status) === "completed"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                        }`}
                      >
                        {normalize(selected.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.role === "talent_connector" && (
                        <>
                          {normalize(selected.status) === "applied" && (
                            <>
                              <button
                                disabled={acting}
                                onClick={async () => {
                                  try {
                                    setActing(true);
                                    await applicationService.shortlist(
                                      selected._id
                                    );
                                    const updated = apps.map((x) =>
                                      x._id === selected._id
                                        ? {
                                            ...x,
                                            status:
                                              "shortlisted" as ApplicationStatus,
                                          }
                                        : x
                                    );
                                    setApps(updated as ApplicationDTO[]);
                                    setSelected({
                                      ...selected,
                                      status:
                                        "shortlisted" as ApplicationStatus,
                                    });
                                  } finally {
                                    setActing(false);
                                  }
                                }}
                                className="px-3 py-1.5 rounded border text-base hover:bg-gray-50"
                              >
                                Shortlist
                              </button>
                              <button
                                disabled={acting}
                                onClick={async () => {
                                  try {
                                    setActing(true);
                                    await applicationService.reject(
                                      selected._id
                                    );
                                    const updated = apps.map((x) =>
                                      x._id === selected._id
                                        ? {
                                            ...x,
                                            status:
                                              "rejected" as ApplicationStatus,
                                          }
                                        : x
                                    );
                                    setApps(updated as ApplicationDTO[]);
                                    setSelected({
                                      ...selected,
                                      status: "rejected" as ApplicationStatus,
                                    });
                                  } finally {
                                    setActing(false);
                                  }
                                }}
                                className="px-3 py-1.5 rounded border text-base hover:bg-gray-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {normalize(selected.status) === "shortlisted" && (
                            <div className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-800 border border-yellow-200 rounded">
                              Waiting for candidate confirmation for this offer
                            </div>
                          )}
                          {normalize(selected.status) === "confirmed" && (
                            <div className="flex flex-col gap-2">
                              {!selected.completedByConnector && (
                                <button
                                  disabled={acting}
                                  onClick={async () => {
                                    try {
                                      setActing(true);
                                      const updated = await applicationService.completeByConnector(
                                        selected._id
                                      );
                                      setApps(prev => prev.map(x => x._id === selected._id ? updated : x));
                                      setSelected(updated);
                                    } finally {
                                      setActing(false);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded border text-base hover:bg-gray-50"
                                >
                                  {acting ? "Marking..." : "Mark as Completed"}
                                </button>
                              )}
                              {selected.completedByConnector && !selected.completedBySeeker && (
                                <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                  You have marked this job as completed. Waiting for {selected.name || "candidate"} to confirm completion, or system will automatically complete after 24hrs.
                                </div>
                              )}
                              {selected.completedBySeeker && !selected.completedByConnector && (
                                <div className="px-3 py-2 text-sm bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                  {selected.name || "Candidate"} has marked this job as completed. Please confirm completion to complete this job, or system will automatically mark it as completed after 24hrs.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      {user?.role === "admin" && (
                        <span className="text-xs text-gray-500">Read-only</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
export default TalentJobCandidates;
