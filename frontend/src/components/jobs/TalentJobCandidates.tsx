import React from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TalentJobCandidates: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();

  if (!user || user.role !== "talent_connector") {
    return <div className="p-8">Redirecting...</div>;
  }

  // Placeholder applicants
  const applicants = [
    { id: "a1", name: "K. Jayasinghe", status: "Applied", date: "2025-08-09" },
    { id: "a2", name: "M. Fernando", status: "Shortlisted", date: "2025-08-08" },
    { id: "a3", name: "S. Silva", status: "Interview Scheduled", date: "2025-08-10" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <div className="text-xl font-bold">GigCeylon</div>
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
              <Link to={`/talent/jobs/${jobId}`} className="text-blue-600 hover:underline">Job Overview</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">Candidates</span>
            </li>
          </ol>
        </nav>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Candidates for Job #{jobId}</h1>
        </div>

        <div className="bg-white border rounded-2xl divide-y">
          {applicants.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-start">{a.name}</p>
                <p className="text-sm text-gray-500 text-start">Applied on {a.date}</p>
              </div>
              <div className="text-sm">
                <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">{a.status}</span>
              </div>
            </div>
          ))}
          {applicants.length === 0 && (
            <div className="p-4 text-center text-gray-500">No candidates yet</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TalentJobCandidates;
