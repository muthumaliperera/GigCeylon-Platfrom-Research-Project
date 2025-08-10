import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TalentJobDetails: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== "talent_connector") {
    return <div className="p-8">Redirecting...</div>;
  }

  // Placeholder mock details; in future, fetch by jobId
  const mockJob = {
    id: jobId || "-",
    title: "Paper Mark Helper",
    status: "active" as "active" | "expired",
    applicants: 12,
    postedOn: "2025-08-05",
    budget: "Rs. 500-1000 per hour",
    location: "Colombo",
    description:
      "As experts are passionate about delivering accurate data, and do essential manager work for students...",
    tags: ["Education", "Helper", "Tutoring"],
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <div className="text-xl font-bold">GigCeylon</div>
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
              <span className="text-gray-900 font-medium">{mockJob.title}</span>
            </li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{mockJob.title}</h1>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-md shadow ${
                mockJob.status === "active"
                  ? "bg-[#64F272] text-gray-900"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {mockJob.status === "active" ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>
          <div className="text-gray-600">Posted on {mockJob.postedOn}</div>
        </div>

        <div className="bg-white border rounded-2xl p-6 mb-6">
          <div className="text-accent font-semibold text-lg mb-2">
            {mockJob.budget}
          </div>
          <div className="text-gray-600 mb-3">Location: {mockJob.location}</div>
          <p className="text-gray-700 mb-4">{mockJob.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {mockJob.tags.map((t) => (
              <span key={t} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
                {t}
              </span>
            ))}
          </div>
          <div className="text-gray-600">Applicants: {mockJob.applicants}</div>
        </div>

        <div className="flex flex-wrap gap-3">
          {mockJob.status === "active" ? (
            <>
              <button
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                onClick={() => navigate("/create-job", { state: { editJobId: mockJob.id } })}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => navigate(`/talent/jobs/${mockJob.id}/candidates`)}
              >
                View Candidates
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => navigate(`/talent/jobs/${mockJob.id}/candidates`)}
              >
                View Candidates
              </button>
              <button
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                onClick={() => navigate("/create-job", { state: { editJobId: mockJob.id, repost: true } })}
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
      </main>
    </div>
  );
};

export default TalentJobDetails;
