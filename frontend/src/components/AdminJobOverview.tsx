import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobService, Job } from "../services/jobService";
import { adminService } from "../services/adminService";

const AdminJobOverview: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = React.useState<Job | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionBusy, setActionBusy] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [showCandidates, setShowCandidates] = React.useState(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState<null | {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    bio?: string;
    skills?: string[];
    services?: string[];
    joinedAt?: string;
  }>(null);

  // Placeholder candidates; replace with API results when available
  const candidates = React.useMemo(
    () => [
      { id: 'c1', name: 'Ann Dias', email: 'ann@example.com', status: 'applied', appliedAt: '2025-09-01', skills: ['Cleaning', 'Cooking'] },
      { id: 'c2', name: 'Kasun Perera', email: 'kasun@example.com', status: 'shortlisted', appliedAt: '2025-09-02', skills: ['Driving'] },
      { id: 'c3', name: 'Nimali Silva', email: 'nimali@example.com', status: 'confirmed', appliedAt: '2025-09-03', skills: ['Tutoring'] },
    ],
    []
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!jobId) return;
      setLoading(true);
      setError("");
      try {
        const data = await jobService.getJobById(jobId);
        if (!cancelled) setJob(data);
      } catch (e: any) {
        if (!cancelled) {
          if (e?.response?.status === 401) {
            navigate('/login', { state: { from: `/admin/jobs/${jobId}`, message: 'Session expired. Please log in.' }, replace: true });
          } else {
            setError(e?.response?.data?.message || "Failed to load job");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (!user || user.role !== "admin") {
    return <div className="p-6">Unauthorized</div>;
  }

  const approve = async () => {
    if (!jobId) return;
    try {
      setActionBusy(true);
      await adminService.approveJob(jobId);
      // After approval, go back to jobs list (Pending tab will refresh there)
      navigate("/admin/jobs");
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        navigate('/login', { state: { from: `/admin/jobs/${jobId}`, message: 'Session expired. Please log in.' }, replace: true });
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
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        navigate('/login', { state: { from: `/admin/jobs/${jobId}`, message: 'Session expired. Please log in.' }, replace: true });
      } else {
        setError(e?.response?.data?.message || "Failed to reject job");
      }
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <div className="text-sm">Admin</div>
        </div>
      </header>

      <main className="max-w-full px-6 sm:px-24 pt-6">
        <div className="mb-4">
          <Link to="/admin/jobs" className="text-blue-600 hover:underline">
            ← Back to Jobs
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {loading ? (
          <div className="p-6 bg-white rounded-xl border">Loading...</div>
        ) : !job ? (
          <div className="p-6 bg-white rounded-xl border">Job not found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {job.status}
                </span>
              </div>
              <div className="text-gray-700 whitespace-pre-line mb-4">
                {job.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium">{job.category}</div>
                </div>
                <div>
                  <div className="text-gray-500">Location</div>
                  <div className="font-medium">{job.location}</div>
                </div>
                <div>
                  <div className="text-gray-500">Deadline</div>
                  <div className="font-medium">
                    {job.completionDeadline
                      ? new Date(job.completionDeadline).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Payment</div>
                  <div className="font-medium">
                    {job.paymentAmount
                      ? `Rs. ${job.paymentAmount.toLocaleString()}${job.paymentType ? ` (${job.paymentType})` : ""}`
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Urgency</div>
                  <div className="font-medium">{job.urgency || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Active</div>
                  <div className="font-medium">{job.isActive ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Approval Status</div>
                  <div className="font-medium">{job.approvalStatus || "pending"}</div>
                </div>
                {job.rejectedReason && (
                  <div className="md:col-span-2">
                    <div className="text-gray-500">Rejected Reason</div>
                    <div className="font-medium">{job.rejectedReason}</div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="text-gray-500 text-sm mb-1">Requirements</div>
                <div className="text-gray-800 whitespace-pre-line">
                  {job.basicRequirements || "-"}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-gray-500 text-sm mb-1">Additional Notes</div>
                <div className="text-gray-800 whitespace-pre-line">
                  {job.additionalNotes || "-"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 h-fit">
              <div className="mb-4">
                <div className="text-gray-500 text-sm">Employer</div>
                <div className="font-medium">
                  {job.employerId
                    ? `${job.employerId.firstName} ${job.employerId.lastName}`
                    : "-"}
                </div>
                <div className="text-sm text-gray-600">{job.employerId?.email}</div>
              </div>
              <div className="mb-4">
                <div className="text-gray-500 text-sm">Contact method</div>
                <div className="font-medium">{job.preferredContactMethod || "-"}</div>
              </div>

              <button
                onClick={() => setShowCandidates(true)}
                className="mb-4 w-full px-4 py-2 rounded border text-slate-700 hover:bg-gray-50"
              >
                View Candidates
              </button>

              <div className="flex flex-col gap-2">
                <button
                  disabled={actionBusy}
                  onClick={approve}
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                >
                  {actionBusy ? "Processing..." : "Approve"}
                </button>
                <div className="border rounded p-3">
                  <label className="text-sm text-gray-600">Reject reason (optional)</label>
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
                    className="mt-2 px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                  >
                    {actionBusy ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Candidates Modal */}
      {showCandidates && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCandidates(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-semibold">Candidates</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowCandidates(false)}>✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto divide-y">
              {candidates.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-600">Status: {c.status} · Applied on {c.appliedAt}</div>
                    <div className="text-xs text-gray-600">{c.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCandidate({ id: c.id, name: c.name, email: c.email, skills: c.skills })}
                      className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="p-6 text-center text-gray-500">No candidates yet.</div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button className="px-4 py-2 rounded bg-slate-900 text-white" onClick={() => setShowCandidates(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Public Profile Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCandidate(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-semibold">{selectedCandidate.name} — Public Profile</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelectedCandidate(null)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-gray-500 text-sm">Email</div>
                <div className="font-medium">{selectedCandidate.email || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedCandidate.skills || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{s}</span>
                  ))}
                  {(selectedCandidate.skills || []).length === 0 && <span className="text-gray-700">-</span>}
                </div>
              </div>
              {selectedCandidate.bio && (
                <div>
                  <div className="text-gray-500 text-sm">Bio</div>
                  <div className="text-gray-800 whitespace-pre-line">{selectedCandidate.bio}</div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button className="px-4 py-2 rounded bg-slate-900 text-white" onClick={() => setSelectedCandidate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobOverview;
