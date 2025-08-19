import React, { useEffect, useMemo, useState } from "react";
import { Star, ArrowLeft, DollarSign, CreditCard, Briefcase, Tag, FileText, ListChecks, Info, Mail, Phone as PhoneIcon, MessageCircle, MapPin } from "lucide-react";
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
    const status = job.status === "completed" || job.status === "cancelled" ? "expired" : "active";
    const budgetLabel = job.paymentAmount != null
      ? `LKR ${job.paymentAmount?.toLocaleString()}${job.paymentType ? ` (${job.paymentType})` : ""}`
      : "Payment not specified";
    const location = job.specificArea ? `${job.location} • ${job.specificArea}` : job.location;
    const tags = [job.category, job.paymentType].filter(Boolean) as string[];

    // Days active since createdAt
    const msPerDay = 1000 * 60 * 60 * 24;
    const createdMs = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();
    const daysActive = Math.max(0, Math.floor((Date.now() - createdMs) / msPerDay));

    // Days remaining until completionDeadline (ceil so partial day counts as 1)
    const deadlineMs = job.completionDeadline ? new Date(job.completionDeadline).getTime() : null;
    const daysRemaining = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / msPerDay)) : null;

    return { postedOn, applicants, status, budgetLabel, location, tags, daysActive, daysRemaining };
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

        {/* Top banner */}
        <div className="rounded-b-2xl bg-[linear-gradient(135deg,#7B5FF1_0%,#3265F2_100%)] text-white p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-white/90 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white">Save</button>
              <button className="px-4 py-1.5 rounded-lg bg-white text-primary font-semibold">Apply</button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">{job?.title ?? "Job"}</h1>
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
            <div className="text-white/90 text-sm">{(view?.daysActive ?? 0) === 0 ? "Posted today" : `Posted ${view?.daysActive} day${(view?.daysActive ?? 0) > 1 ? "s" : ""} ago`}</div>
          </div>
        </div>

        {/* Quick pill badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          {job?.urgency === "urgent" && (
            <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
              Urgent
            </span>
          )}
          {view?.location && (
            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              <MapPin className="w-4 h-4" /> {view.location}
            </span>
          )}
          {job?.specificArea && (
            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              Specific area
            </span>
          )}
          {view?.daysRemaining != null && (
            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{view.daysRemaining} days remaining</span>
          )}
          <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{view?.applicants ?? 0} applied</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main details */}
          <section className="lg:col-span-2">
            <div className="bg-white border rounded-2xl p-6 mb-6">
              {/* Key facts list */}
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Payment Amount:</span>
                  <span className="text-gray-700">{view?.budgetLabel ?? "-"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Payment Type:</span>
                  <span className="text-gray-700">{job?.paymentType || "-"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Job Type:</span>
                  <span className="text-gray-700">{job?.jobType || "-"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Job Category:</span>
                  <span className="text-gray-700">{job?.category || "-"}</span>
                </li>
              </ul>

              {/* Description */}
              <div className="mt-6">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" /> Job Description
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{job?.description}</p>
              </div>

              {/* Requirements */}
              <div className="mt-6">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-gray-700" /> Requirements
                </div>
                <ul className="list-disc pl-6 text-gray-700">
                  {(job?.basicRequirements || "")
                    .split(/\r?\n|,/) // allow comma or newline separated
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                    .map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                </ul>
              </div>

              {/* Additional Info */}
              {job?.whatYouProvide && (
                <div className="mt-6">
                  <div className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-gray-700" /> Additional Information
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.whatYouProvide}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="mt-6">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-gray-700" /> Contact Information
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["email", "phone", "whatsapp"] as const).map((m) => (
                    <span
                      key={m}
                      className={`${job?.preferredContactMethod === m ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-700"} inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm`}
                    >
                      {m === "email" && <Mail className="w-4 h-4" />}
                      {m === "phone" && <PhoneIcon className="w-4 h-4" />}
                      {m === "whatsapp" && <MessageCircle className="w-4 h-4" />}
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {(view?.tags ?? []).map((t) => (
                  <span key={t} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">{t}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Right: poster and recent jobs */}
          <aside className="lg:col-span-1">
            <PosterAndRecent employerId={job?.employerId?._id} currentJobId={job?._id} job={job} />
          </aside>
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

// Right sidebar component: poster info + recent jobs by poster
const PosterAndRecent: React.FC<{
  employerId?: string;
  currentJobId?: string;
  job: Job | null;
}> = ({ employerId, currentJobId, job }) => {
  const [recent, setRecent] = useState<Job[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await jobService.getAllJobs(1, 20);
        if (cancelled) return;
        const list = (resp.jobs || [])
          .filter((j) => j.employerId?._id === employerId && j._id !== currentJobId)
          .sort((a, b) => {
            const ams = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bms = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bms - ams;
          });
        setRecent(list);
      } catch (e) {
        // silent fail; sidebar is optional
      }
    })();
    return () => { cancelled = true; };
  }, [employerId, currentJobId]);

  const posterName = job?.employerId ? `${job.employerId.firstName} ${job.employerId.lastName}` : "";
  const posterEmail = job?.employerId?.email ?? "";

  const getStatusBadge = (status: string) => {
    const lower = (status || "active").toLowerCase();
    switch (lower) {
      case "active":
        return { bg: "bg-[#64F272]", text: "text-gray-900", label: "ACTIVE" };
      case "completed":
        return { bg: "bg-blue-500", text: "text-white", label: "COMPLETED" };
      case "cancelled":
        return { bg: "bg-red-500", text: "text-white", label: "CANCELLED" };
      case "paused":
        return { bg: "bg-yellow-500", text: "text-white", label: "PAUSED" };
      default:
        return { bg: "bg-[#64F272]", text: "text-gray-900", label: "ACTIVE" };
    }
  };

  const postedAgo = (iso?: string) => {
    if (!iso) return "Posted recently";
    const created = new Date(iso).getTime();
    const now = Date.now();
    const days = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    if (days === 0) return "Posted today";
    if (days === 1) return "Posted 1 day ago";
    return `Posted ${days} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-2xl p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-3" />
        <div className="font-semibold">{posterName || "Job Poster"}</div>
        {posterEmail && <div className="text-sm text-gray-600">{posterEmail}</div>}
        <div className="mt-2 text-yellow-500">★★★★★</div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-900">Recent jobs by Poster</div>
        </div>
        <div className="space-y-4">
          {recent.slice(0, 2).map((j) => {
            const status = getStatusBadge(j.status || "active");
            const employerName = j.employerId ? `${j.employerId.firstName} ${j.employerId.lastName}` : "";
            const payText = j.paymentAmount
              ? `Rs. ${j.paymentAmount.toLocaleString()} ${j.paymentType ? `(${j.paymentType})` : ""}`
              : "Payment not specified";
            return (
              <Link key={j._id} to={`/talent/jobs/${j._id}`} className="block border border-gray-200 rounded-2xl p-4 shadow-sm hover:bg-gray-50">
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-violet-800 tracking-tight line-clamp-1">{j.title}</h3>
                    <span className={`${status.bg} ${status.text} px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-yellow-500 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-gray-600 text-xs ml-2">
                    {employerName} • {j.location || "Sri Lanka"}
                  </span>
                </div>
                <div className="text-gray-800 font-semibold text-sm mb-2 text-start">{payText}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-gray-500 text-xs">{postedAgo(j.createdAt)}</div>
                  <span className="inline-block text-[10px] text-gray-600">
                    {(j.category || "").replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            );
          })}
          {recent.length === 0 && (
            <div className="text-sm text-gray-500">No recent jobs</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentJobDetails;
