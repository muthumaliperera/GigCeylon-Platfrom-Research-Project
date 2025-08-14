import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { jobService, type Job } from "../../services/jobService";

const TalentJobDetails: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();


  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await jobService.getJobById(jobId);
        if (!cancelled) setJob(data);
      } catch (e: any) {
        console.error("Failed to load job", e);
        if (!cancelled) setError("Failed to load job");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const view = useMemo(() => {
    if (!job) return null;
    const postedOn = (job.createdAt || "").slice(0, 10);
    const applicants = job.applicationsCount ?? 0;
    const status = (job.status === "completed" || job.status === "cancelled") ? "expired" : "active";
    const budgetLabel = job.paymentType === "cash"
      ? `LKR ${job.paymentAmount?.toLocaleString()}`
      : job.paymentType === "online"
        ? `Online • LKR ${job.paymentAmount?.toLocaleString()}`
        : `Cash/Online • LKR ${job.paymentAmount?.toLocaleString()}`;
    const location = job.specificArea ? `${job.location} • ${job.specificArea}` : job.location;
    const tags = [job.category, job.urgency, job.paymentType].filter(Boolean) as string[];
    return { postedOn, applicants, status, budgetLabel, location, tags };
  }, [job]);

  // Guard after all hooks are declared to avoid conditional hook calls
  if (!user || user.role !== "talent_connector") {
    return <div className="p-8">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <span>
              Hi, {user.firstName} {user.lastName}
            </span>
            <Link
              to="/talent-connector-dashboard"
              className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-full px-6 sm:px-24 py-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600 mb-4">
          <ol className="list-none p-0 inline-flex gap-1">
            <li>
              <Link to="/talent-connector-dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/talent-connector-dashboard?tab=my-jobs" className="text-blue-600 hover:underline">Job Management</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">{job?.title ?? "Job"}</span>
            </li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{job?.title ?? "Job"}</h1>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-md shadow ${
                (view?.status ?? "active") === "active"
                  ? "bg-[#64F272] text-gray-900"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {(view?.status ?? "active") === "active" ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>
          <div className="text-gray-600">Posted on {view?.postedOn ?? "-"}</div>
        </div>

        <div className="bg-white border rounded-2xl p-6 mb-6">
          <div className="text-accent font-semibold text-lg mb-2">
            {view?.budgetLabel ?? "-"}
          </div>
          <div className="text-gray-600 mb-3">Location: {view?.location ?? "-"}</div>
          <p className="text-gray-700 mb-4">{job?.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm text-gray-700">
            <div><span className="font-medium">Category:</span> {job?.category}</div>
            <div><span className="font-medium">Expected Duration:</span> {job?.expectedDuration}</div>
            <div><span className="font-medium">Deadline:</span> {job?.completionDeadline?.slice(0,10)}</div>
            <div><span className="font-medium">Payment Type:</span> {job?.paymentType}</div>
            <div><span className="font-medium">Payment Amount:</span> LKR {job?.paymentAmount?.toLocaleString?.()}</div>
            <div><span className="font-medium">Preferred Contact:</span> {job?.preferredContactMethod}</div>
            <div><span className="font-medium">Urgency:</span> {job?.urgency}</div>
          </div>
          <div className="mb-4">
            <div className="font-medium mb-1">Basic Requirements</div>
            <div className="text-gray-700 whitespace-pre-wrap">{job?.basicRequirements}</div>
          </div>
          <div className="mb-4">
            <div className="font-medium mb-1">What You Provide</div>
            <div className="text-gray-700 whitespace-pre-wrap">{job?.whatYouProvide}</div>
          </div>
          {job?.additionalNotes && (
            <div className="mb-4">
              <div className="font-medium mb-1">Additional Notes</div>
              <div className="text-gray-700 whitespace-pre-wrap">{job.additionalNotes}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {(view?.tags ?? []).map((t) => (
              <span key={t} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
                {t}
              </span>
            ))}
          </div>
          <div className="text-gray-600">Applicants: {view?.applicants ?? 0}</div>
        </div>

        <div className="flex flex-wrap gap-3">
          {(view?.status ?? "active") === "active" ? (
            <>
              <button
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                onClick={() => navigate("/create-job", { state: { editJobId: job?._id } })}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => navigate(`/talent/jobs/${job?._id}/candidates`)}
              >
                View Candidates
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => navigate(`/talent/jobs/${job?._id}/candidates`)}
              >
                View Candidates
              </button>
              <button
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                onClick={() => navigate("/create-job", { state: { editJobId: job?._id, repost: true } })}
              >
                Edit & Repost
              </button>
              <button
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                onClick={() => {
                  if (window.confirm("Delete this job?")) {
                    navigate("/talent-connector-dashboard", { state: { message: "Job deleted" } });
                  }
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>

        {loading && <div className="mt-4 text-sm text-gray-500">Loading job...</div>}
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </main>
    </div>
  );
};

export default TalentJobDetails;
