import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  applicationService,
  type ApplicationDTO,
} from "../../services/applicationService";
import { Job, jobService } from "../../services/jobService";
import { websocketService } from "../../services/websocketService";

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

  // WebSocket connection with polling fallback
  useEffect(() => {
    if (!jobId) return;

    // Establish WebSocket connection
    const socket = websocketService.connect();
    let fallbackInterval: NodeJS.Timeout | null = null;

    // Room join and real-time updates
    websocketService.joinJob(jobId);

    const handleApplicationUpdate = (updatedApp: ApplicationDTO) => {
      setApps((prev) =>
        prev.map((app) => (app._id === updatedApp._id ? updatedApp : app))
      );
    };
    websocketService.onApplicationUpdate(handleApplicationUpdate);

    // Polling control helpers
    const startPolling = () => {
      if (fallbackInterval) return;
      fallbackInterval = setInterval(async () => {
        try {
          const list = await applicationService.listForJob(jobId);
          setApps(list);
        } catch (_) {
          // ignore transient errors
        }
      }, 10000); // 10s fallback polling only while disconnected
    };
    const stopPolling = () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };

    // Initial state: if not connected yet, start polling; if connected, ensure stopped
    if (socket && (socket as any).connected) {
      stopPolling();
    } else {
      startPolling();
    }

    // React to socket connect/disconnect to toggle polling precisely
    const onConnect = () => {
      stopPolling();
    };
    const onDisconnect = () => {
      startPolling();
    };
    if (socket) {
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
    }

    return () => {
      websocketService.offApplicationUpdate(handleApplicationUpdate);
      websocketService.leaveJob(jobId);
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      }
      stopPolling();
    };
  }, [jobId]);

  // Keep selected candidate in sync with latest list updates
  useEffect(() => {
    if (!selected) return;
    const latest = apps.find((a) => a._id === selected._id);
    if (latest) setSelected(latest);
  }, [apps, selected]);

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

  // Early return for unauthorized users to simplify JSX and avoid nested ternaries
  if (!user || (user.role !== "talent_connector" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F3F8F9]">
        <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
          <div className="max-w-full mx-auto flex items-center justify-between">
            <Link to="/">
              <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
            </Link>
            <Link
              to={user?.role === "admin" ? "/admin-dashboard" : "/talent-connector-dashboard"}
              className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
            >
              Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-full px-6 sm:px-24 py-8">
          <div className="p-8">Redirecting...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <Link
            to={user?.role === "admin" ? "/admin-dashboard" : "/talent-connector-dashboard"}
            className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-full px-6 sm:px-24 py-8">
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
                                const updated = await jobService.updateJobStatus(
                                  jobId,
                                  "active"
                                );
                                setJob(updated);
                                try {
                                  const cid = localStorage.getItem("closedJobId");
                                  if (cid === jobId) localStorage.removeItem("closedJobId");
                                } catch {}
                              } catch (e) {
                                console.error("Failed to re-open applications", e);
                                alert("Failed to re-open applications. Please try again.");
                              } finally {
                                setUpdating(false);
                              }
                            }}
                            className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {updating ? "Re-opening..." : "Re-open applications"}
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
                { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
                { key: "confirmed", label: "Confirmed", count: counts.confirmed },
                { key: "rejected", label: "Rejected", count: counts.rejected },
                { key: "completed", label: "Completed", count: counts.completed },
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
                    className={`ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full ${
                      activeTab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                    }`}
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
              <p className="text-gray-500">No applications found for this filter.</p>
            </div>
          ) : (
            <>
              {filtered.map((app) => (
                <div
                  key={app._id}
                  className="bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelected(app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{app.name || "Anonymous"}</h3>
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
                      {(() => {
                        let dbg = false;
                        try {
                          dbg = localStorage.getItem("debugFlags") === "1";
                        } catch {}
                        if (!dbg) return null;
                        const sk = !!(app.completedBySeeker || app.completedBySeekerAt);
                        const ck = !!(app.completedByConnector || app.completedByConnectorAt);
                        return (
                          <div className="text-[10px] text-gray-500">
                            dbg cbs:{String(!!app.completedBySeeker)} cbc:{String(!!app.completedByConnector)} cbsAt:{String(!!app.completedBySeekerAt)} cbcAt:{String(!!app.completedByConnectorAt)} sk:{String(sk)} ck:{String(ck)}
                          </div>
                        );
                      })()}
                      {normalize(app.status) === "confirmed" && (
                        <div className="flex flex-col gap-2">
                          {/* Compute derived flags to handle APIs that only return *_at fields */}
                          {(() => {
                            const seekerMarked = !!(app.completedBySeeker || app.completedBySeekerAt);
                            const connectorMarked = !!(app.completedByConnector || app.completedByConnectorAt);
                            return (
                              <>
                                {/* Primary action button */}
                                {!connectorMarked && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      (async () => {
                                        try {
                                          setActing(true);
                                          const updated = await applicationService.completeByConnector(app._id);
                                          const patched = {
                                            ...updated,
                                            completedByConnector: updated.completedByConnector ?? true,
                                            completedBySeeker: !!updated.completedBySeeker,
                                          } as ApplicationDTO;
                                          setApps((prev) => prev.map((x) => (x._id === app._id ? patched : x)));
                                        } finally {
                                          setActing(false);
                                        }
                                      })();
                                    }}
                                    disabled={acting}
                                    className={`px-3 py-1 text-xs rounded text-white disabled:opacity-50 ${
                                      seekerMarked ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                  >
                                    {acting
                                      ? seekerMarked
                                        ? "Confirming..."
                                        : "Marking..."
                                      : seekerMarked
                                        ? "Confirm Completion"
                                        : "Mark as Completed"}
                                  </button>
                                )}

                                {/* Informational notices under the button */}
                                {connectorMarked && !seekerMarked && (
                                  <div className="px-2 py-1 text-xs bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    You have marked this job as completed. Waiting for {app.name || "candidate"} to confirm completion, or the system will automatically complete after 5 minutes.
                                  </div>
                                )}
                                {seekerMarked && !connectorMarked && (
                                  <div className="px-2 py-1 text-xs bg-orange-50 text-orange-800 border border-orange-200 rounded">
                                    {(app.name || "Candidate")} has marked this job as completed. Please confirm completion to complete this job, or the system will automatically mark it as completed after 5 minutes.
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    {/* Actions column */}
                    <div className="flex flex-col gap-2 ml-4 min-w-[180px]">
                      {/* Applied: shortlist/reject */}
                      {normalize(app.status) === "applied" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              (async () => {
                                try {
                                  setActing(true);
                                  const updated = await applicationService.shortlist(app._id);
                                  setApps((prev) => prev.map((x) => (x._id === app._id ? updated : x)));
                                } finally {
                                  setActing(false);
                                }
                              })();
                            }}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-md bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {acting ? "Shortlisting..." : "Shortlist"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              (async () => {
                                try {
                                  setActing(true);
                                  const updated = await applicationService.reject(app._id);
                                  setApps((prev) => prev.map((x) => (x._id === app._id ? updated : x)));
                                } finally {
                                  setActing(false);
                                }
                              })();
                            }}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            {acting ? "Rejecting..." : "Reject"}
                          </button>
                        </>
                      )}
                      {/* Shortlisted: no actions for connector - only seekers can confirm/reject */}
                      {/* Confirmed: keep complete/confirm UI above; add View button below */}
                      {/* Universal View Details */}
                      <button
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(app);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {/* Details Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-lg w-[90vw] max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Candidate Details</h2>
                <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="p-4 space-y-2 text-sm text-gray-800">
                <div><span className="font-medium">Name:</span> {selected.name || 'Anonymous'}</div>
                {selected.email && (<div><span className="font-medium">Email:</span> {selected.email}</div>)}
                {selected.phone && (<div><span className="font-medium">Phone:</span> {selected.phone}</div>)}
                {selected.bio && (
                  <div>
                    <span className="font-medium">Bio:</span>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selected.bio}</p>
                  </div>
                )}
                {Array.isArray(selected.skills) && selected.skills.length > 0 && (
                  <div>
                    <span className="font-medium">Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selected.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(selected.services) && selected.services.length > 0 && (
                  <div>
                    <span className="font-medium">Services:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selected.services.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.otherInfo && (
                  <div>
                    <span className="font-medium">Other Info:</span>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selected.otherInfo}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t text-right">
                <button className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default TalentJobCandidates;
