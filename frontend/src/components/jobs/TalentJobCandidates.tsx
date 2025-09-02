import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { jobService, Job } from "../../services/jobService";

const TalentJobCandidates: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);
      } catch (err) {
        setError('Failed to load job details');
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  if (!user || user.role !== "talent_connector") {
    return <div className="p-8">Redirecting...</div>;
  }

  // Placeholder applicants
  const applicants = [
    { id: "a1", name: "K. Jayasinghe", status: "Applied", date: "2025-08-09" },
    {
      id: "a2",
      name: "M. Fernando",
      status: "Shortlisted",
      date: "2025-08-08",
    },
    {
      id: "a3",
      name: "S. Silva",
      status: "Interview Scheduled",
      date: "2025-08-10",
    },
    { id: "a4", name: "Kushi Silva", status: "Applied", date: "2025-08-11" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <Link
            to="/talent-connector-dashboard"
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
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
              <h1 className="text-2xl font-bold text-gray-900">Candidates for {job?.title || 'this job'}</h1>
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
                          const updated = await jobService.updateJobStatus(jobId, "expired");
                          setJob(updated);
                          try {
                            localStorage.setItem("closedJobId", jobId);
                          } catch {}
                        } catch (e) {
                          console.error("Failed to close applications", e);
                          alert("Failed to close applications. Please try again.");
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
                      {/* Re-open button if deadline not passed */}
                      {(() => {
                        const deadline = job?.completionDeadline ? new Date(job.completionDeadline).getTime() : 0;
                        const now = Date.now();
                        const canReopen = deadline > now;
                        if (!canReopen) return null;
                        return (
                          <button
                            disabled={updating}
                            onClick={async () => {
                              if (!jobId) return;
                              try {
                                setUpdating(true);
                                const updated = await jobService.updateJobStatus(jobId, "active");
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

        <div className="bg-white border rounded-2xl divide-y">
          {applicants.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-start">{a.name}</p>
                <p className="text-sm text-gray-500 text-start">
                  Applied on {a.date}
                </p>
              </div>
              <div className="text-sm">
                <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  {a.status}
                </span>
              </div>
            </div>
          ))}
          {applicants.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No candidates yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TalentJobCandidates;
