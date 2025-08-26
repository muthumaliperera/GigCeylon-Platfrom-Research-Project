import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  Info,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  Phone as PhoneIcon,
  Star,
  Tag,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import { jobService, type Job } from "../../services/jobService";

const TalentJobDetails: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
    // status for UI badge: include admin approval status and backend 'expired'
    const status: "active" | "expired" | "pending" | "rejected" =
      (job as any).approvalStatus === "pending"
        ? "pending"
        : (job as any).approvalStatus === "rejected"
          ? "rejected"
          : job.status === "expired" ||
              job.status === "completed" ||
              job.status === "cancelled"
            ? "expired"
            : "active";
    const budgetLabel =
      job.paymentAmount != null
        ? `LKR ${job.paymentAmount?.toLocaleString()}${job.paymentType ? ` (${job.paymentType})` : ""}`
        : "Payment not specified";
    const location = job.specificArea
      ? `${job.location} • ${job.specificArea}`
      : job.location;
    const tags = [job.category, job.paymentType].filter(Boolean) as string[];

    // Days active since createdAt
    const msPerDay = 1000 * 60 * 60 * 24;
    const createdMs = job.createdAt
      ? new Date(job.createdAt).getTime()
      : Date.now();
    const daysActive = Math.max(
      0,
      Math.floor((Date.now() - createdMs) / msPerDay)
    );

    // Days remaining until completionDeadline (ceil so partial day counts as 1)
    const deadlineMs = job.completionDeadline
      ? new Date(job.completionDeadline).getTime()
      : null;
    const daysRemaining = deadlineMs
      ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / msPerDay))
      : null;

    return {
      postedOn,
      applicants,
      status,
      budgetLabel,
      location,
      tags,
      daysActive,
      daysRemaining,
    };
  }, [job]);

  // Render description as HTML (generated from TipTap)
  const renderRichDescription = (html?: string) => {
    if (!html) return null;
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 rich-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  // Page is viewable publicly; actions will handle auth as needed.

  const approve = async () => {
    if (!jobId) return;
    try {
      setActionBusy(true);
      await adminService.approveJob(jobId);
      navigate("/admin/jobs");
    } catch (e: any) {
      if (e?.response?.status === 401) {
        navigate("/login", {
          state: {
            from: `/admin/jobs/${jobId}`,
            message: "Session expired. Please log in.",
          },
          replace: true,
        });
      } else {
        setError(e?.response?.data?.message || "Failed to approve job");
      }
    } finally {
      setActionBusy(false);
    }
  };

  const reject = async () => {
    if (!jobId) return;
    try {
      setActionBusy(true);
      await adminService.rejectJob(jobId, rejectReason || "");
      navigate("/admin/jobs");
    } catch (e: any) {
      if (e?.response?.status === 401) {
        navigate("/login", {
          state: {
            from: `/admin/jobs/${jobId}`,
            message: "Session expired. Please log in.",
          },
          replace: true,
        });
      } else {
        setError(e?.response?.data?.message || "Failed to reject job");
      }
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="sticky top-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto flex items-center justify-between w-full">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span>
                  Hi, {user.firstName} {user.lastName}
                </span>
                <Link
                  to={
                    user.role === "job_seeker"
                      ? "/job-seeker-dashboard"
                      : user.role === "talent_connector"
                        ? "/talent-connector-dashboard"
                        : "/admin-dashboard"
                  }
                  className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="border border-white text-white px-4 py-1 rounded-full text-sm hover:bg-white hover:text-primary"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-full ">
        {/* Breadcrumbs */}
        {/*
        <nav
          aria-label="Breadcrumb"
          className="text-sm text-gray-600 mb-4 px-6 sm:px-24 py-8"
        >
          <ol className="list-none p-0 inline-flex gap-1">
            <li>
              <Link
                to="/talent-connector-dashboard"
                className="text-blue-600 hover:underline"
              >
                Dashboard
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                to="/talent-connector-dashboard?tab=my-jobs"
                className="text-blue-600 hover:underline"
              >
                Job Management
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">
                {job?.title ?? "Job"}
              </span>
            </li>
          </ol>
        </nav>*/}

        {/* Top banner */}
        <div className="sticky top-16 z-40 rounded-b-2xl bg-[linear-gradient(135deg,#8750E9_0%,#6925E3_100%)] text-white  mb-4 px-6 sm:px-24 py-6 text-start ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-white/90 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {!user ? (
                <>
                  <button
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                    onClick={() => navigate("/login")}
                  >
                    Save
                  </button>
                  <button
                    className="px-4 py-1.5 rounded-lg bg-white text-primary font-semibold"
                    onClick={() => navigate("/login")}
                  >
                    Apply
                  </button>
                </>
              ) : user.role === "job_seeker" ? (
                <>
                  <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                    Save
                  </button>
                  <button className="px-4 py-1.5 rounded-lg bg-white text-primary font-semibold">
                    Apply
                  </button>
                </>
              ) : user.role === "talent_connector" ? (
                <>
                  {view?.status === "rejected" ? (
                    <button
                      className="px-4 py-1.5 rounded-lg bg-white text-primary font-semibold"
                      onClick={() =>
                        navigate("/create-job", {
                          state: { editJobId: job?._id, resubmit: true },
                        })
                      }
                    >
                      Edit & Post Again
                    </button>
                  ) : view?.status !== "pending" ? (
                    <>
                      <button
                        className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                        onClick={() =>
                          navigate("/create-job", {
                            state: { editJobId: job?._id },
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="px-4 py-1.5 rounded-lg bg-white text-primary font-semibold"
                        onClick={() =>
                          navigate(`/talent/jobs/${job?._id}/candidates`)
                        }
                      >
                        View Candidates
                      </button>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-md md:text-2xl font-bold">
                {job?.title ?? "Job"}
              </h1>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md shadow ${
                  view?.status === "active"
                    ? "bg-[#64F272] text-gray-900"
                    : view?.status === "pending"
                      ? "bg-amber-200 text-amber-900"
                      : view?.status === "rejected"
                        ? "bg-red-200 text-red-900"
                        : "bg-gray-300 text-gray-700"
                }`}
              >
                {view?.status === "active"
                  ? "ACTIVE"
                  : view?.status === "pending"
                    ? "PENDING"
                    : view?.status === "rejected"
                      ? "REJECTED"
                      : "EXPIRED"}
              </span>
            </div>
            <div className="text-white/90 text-sm text-start">
              {(view?.daysActive ?? 0) === 0
                ? "Posted today"
                : `Posted ${view?.daysActive} day${(view?.daysActive ?? 0) > 1 ? "s" : ""} ago`}
            </div>
          </div>
        </div>
        {view?.status === "rejected" && (job as any)?.rejectedReason && (
          <div className="px-6 sm:px-24 mt-3">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <span className="font-semibold">Rejected Reason: </span>
              {(job as any).rejectedReason}
            </div>
          </div>
        )}
        {/* Quick pill badges row */}
        <div className="flex flex-wrap items-center gap-2 my-4 text-sm px-6 sm:px-24">
          {job?.urgency === "urgent" && (
            <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
              Urgent
            </span>
          )}
          {view?.location && (
            <span className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1 rounded-full">
              <MapPin className="w-4 h-4" /> {view.location}
            </span>
          )}
          {job?.specificArea && (
            <span className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1 rounded-full">
              Specific area
            </span>
          )}
          {view?.daysRemaining != null && (
            <span className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1 rounded-full">
              {view.daysRemaining} days remaining
            </span>
          )}
          <span className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1 rounded-full">
            {view?.applicants ?? 0} applied
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 sm:px-24">
          {/* Left: main details */}
          <section className="lg:col-span-2">
            <div className="bg-white  rounded-2xl p-4 mb-6">
              {/* Key facts list */}
              <ul className="space-y-3 text-gray-800 text-sm">
                <li className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Payment Amount:</span>
                  <span className="text-gray-700">
                    {view?.budgetLabel ?? "-"}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Payment Type:</span>
                  <span className="text-gray-700">
                    {job?.paymentType || "-"}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Job Type:</span>
                  <span className="text-gray-700">{job?.jobType || "-"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Job Category:</span>
                  <span className="text-gray-700">{job?.category || "-"}</span>
                </li>
              </ul>

              {/* Description */}
              <div className="mt-6 text-sm text-start">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-700" /> Job Description
                </div>
                {renderRichDescription(job?.description)}
              </div>

              {/* Requirements */}
              <div className="mt-6 text-sm text-start">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-gray-700" /> Requirements
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
              {job?.additionalNotes && (
                <div className="mt-6 text-sm text-start">
                  <div className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-700" /> Additional
                    Information
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.additionalNotes}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="mt-6 text-sm text-start">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-700" /> Contact
                  Information
                </div>
                {(() => {
                  const emails = (job as any)?.contactEmails as
                    | string[]
                    | undefined;
                  const phones = (job as any)?.contactPhones as
                    | string[]
                    | undefined;
                  const whatsapps = (job as any)?.contactWhatsapps as
                    | string[]
                    | undefined;
                  const hasAny =
                    (emails && emails.length) ||
                    (phones && phones.length) ||
                    (whatsapps && whatsapps.length);
                  if (!hasAny)
                    return (
                      <div className="text-gray-600">
                        No contact details provided.
                      </div>
                    );
                  return (
                    <div className="space-y-2">
                      {!!(emails && emails.length) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            <Mail className="w-4 h-4" /> Email
                          </span>
                          <span className="text-gray-700">
                            {emails.join(", ")}
                          </span>
                        </div>
                      )}
                      {!!(phones && phones.length) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            <PhoneIcon className="w-4 h-4" /> Phone
                          </span>
                          <span className="text-gray-700">
                            {phones.join(", ")}
                          </span>
                        </div>
                      )}
                      {!!(whatsapps && whatsapps.length) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                          </span>
                          <span className="text-gray-700">
                            {whatsapps.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {(view?.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right: poster and recent jobs */}
          <aside className="lg:col-span-1">
            {/* Admin approval actions for pending jobs */}
            {user?.role === "admin" && view?.status === "pending" && (
              <div className="bg-white border rounded-2xl p-4 mb-4">
                <div className="font-semibold text-gray-900 mb-2">
                  Approval Actions
                </div>
                <button
                  disabled={actionBusy}
                  onClick={approve}
                  className="w-full px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                >
                  {actionBusy ? "Processing..." : "Approve"}
                </button>
                <div className="mt-3 border rounded p-3">
                  <label className="text-sm text-gray-600">
                    Reject reason (optional)
                  </label>
                  <textarea
                    className="mt-1 w-full border rounded p-2 text-sm"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason to show to employer"
                  />
                  <button
                    disabled={actionBusy}
                    onClick={reject}
                    className="mt-2 w-full px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                  >
                    {actionBusy ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            )}

            <PosterAndRecent
              employerId={job?.employerId?._id}
              currentJobId={job?._id}
              job={job}
            />
          </aside>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-500">Loading job...</div>
        )}
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
          .filter(
            (j) => j.employerId?._id === employerId && j._id !== currentJobId
          )
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
    return () => {
      cancelled = true;
    };
  }, [employerId, currentJobId]);

  const posterName = job?.employerId
    ? `${job.employerId.firstName} ${job.employerId.lastName}`
    : "";
  const posterEmail = job?.employerId?.email ?? "";

  const getStatusBadge = (status: string) => {
    const lower = (status || "active").toLowerCase();
    switch (lower) {
      case "active":
        return { bg: "bg-[#64F272]", text: "text-gray-900", label: "ACTIVE" };
      case "expired":
        return { bg: "bg-gray-300", text: "text-gray-800", label: "EXPIRED" };
      case "completed":
        return { bg: "bg-blue-500", text: "text-white", label: "COMPLETED" };
      case "cancelled":
        return { bg: "bg-red-500", text: "text-white", label: "CANCELLED" };
      default:
        return { bg: "bg-[#64F272]", text: "text-gray-900", label: "ACTIVE" };
    }
  };

  const postedAgo = (iso?: string) => {
    if (!iso) return "Posted recently";
    const createdMs = new Date(iso).getTime();
    const nowMs = Date.now();
    const days = Math.max(
      0,
      Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24))
    );
    if (days === 0) return "Posted today";
    if (days === 1) return "Posted a day ago";
    if (days < 7) return `Posted ${days} days ago`;
    const d = new Date(createdMs);
    return `Posted on ${d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-2xl p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-3" />
        <div className="font-semibold">{posterName || "Job Poster"}</div>
        {posterEmail && (
          <div className="text-sm text-gray-600">{posterEmail}</div>
        )}
        <div className="mt-2 text-yellow-500">★★★★★</div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-900">
            Recent jobs by Poster
          </div>
        </div>
        <div className="space-y-4">
          {recent.slice(0, 2).map((j) => {
            const status = getStatusBadge(j.status || "active");
            const employerName = j.employerId
              ? `${j.employerId.firstName} ${j.employerId.lastName}`
              : "";
            const payText = j.paymentAmount
              ? `Rs. ${j.paymentAmount.toLocaleString()} ${j.paymentType ? `(${j.paymentType})` : ""}`
              : "Payment not specified";
            return (
              <Link
                key={j._id}
                to={`/talent/jobs/${j._id}`}
                className="block border border-gray-200 rounded-2xl p-4 shadow-sm hover:bg-gray-50"
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-violet-800 tracking-tight line-clamp-1">
                      {j.title}
                    </h3>
                    <span
                      className={`${status.bg} ${status.text} px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md`}
                    >
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
                <div className="text-gray-800 font-semibold text-sm mb-2 text-start">
                  {payText}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-gray-500 text-xs">
                    {postedAgo(j.createdAt)}
                  </div>
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
