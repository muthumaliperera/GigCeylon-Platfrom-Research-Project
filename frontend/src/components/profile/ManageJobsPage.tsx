import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { applicationService, type ApplicationDTO } from "../../services/applicationService";

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

  const [activeTab, setActiveTab] = useState<"all" | "applied" | "shortlisted" | "confirmed" | "completed" | "rejected">("all");
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setAppsError(null); setAppsLoading(true);
        const list = await applicationService.myApplications();
        if (!stop) setApplications(list);
      } catch (e: any) {
        if (!stop) setAppsError(e?.response?.data?.message || 'Failed to load applications');
      } finally {
        if (!stop) setAppsLoading(false);
      }
    })();
    return () => { stop = true; };
  }, []);

  const normalize = (s: string) => {
    const x = (s || '').toLowerCase();
    if (x.includes("short")) return "shortlisted" as const;
    if (x.includes("approv") || x.includes("confirm")) return "confirmed" as const;
    if (x.includes("complet")) return "completed" as const;
    if (x.includes("reject")) return "rejected" as const;
    return "applied" as const;
  };

  const counts = useMemo(() => {
    const base = { all: applications.length, applied: 0, shortlisted: 0, confirmed: 0, completed: 0, rejected: 0 } as const;
    const m: any = { ...base };
    applications.forEach((a) => { const st = normalize(a.status); if (st in m) m[st] += 1; });
    return m as { all: number; applied: number; shortlisted: number; confirmed: number; completed: number; rejected: number };
  }, [applications]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return applications;
    return applications.filter(a => normalize(a.status) === activeTab);
  }, [applications, activeTab]);

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#hero" className="hover:text-blue-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-blue-400 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#categories" className="hover:text-blue-400 transition-colors">Categories</a>
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
              { key: "dashboard", label: "Dashboard", path: "/job-seeker-dashboard" },
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
            { label: "Applied", value: counts.applied },
            { label: "Shortlisted", value: counts.shortlisted },
            { label: "Confirmed", value: counts.confirmed },
            { label: "Completed", value: counts.completed },
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
                { key: "all", label: "All", count: counts.all },
                { key: "applied", label: "Applied", count: counts.applied },
                { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
                { key: "confirmed", label: "Confirmed", count: counts.confirmed },
                { key: "completed", label: "Completed", count: counts.completed },
                { key: "rejected", label: "Rejected", count: counts.rejected },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    activeTab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                  <span className={`ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {appsLoading && <div className="text-sm text-gray-500">Loading applications...</div>}
            {appsError && <div className="text-sm text-red-600">{appsError}</div>}
            {!appsLoading && !appsError && (
              <div className="bg-white border rounded-2xl divide-y">
                {filtered.map((a) => (
                  <div key={a._id} className="p-4 flex items-center justify-between">
                    <div className="text-start">
                      <div className="font-medium text-gray-900">{a.name || 'Your application'}</div>
                      <div className="text-xs text-gray-500">Job: {a.jobId}</div>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-md text-gray-700 ${
                          normalize(a.status) === 'shortlisted' ? 'bg-yellow-100' :
                          normalize(a.status) === 'confirmed' ? 'bg-green-100' :
                          normalize(a.status) === 'rejected' ? 'bg-red-100' :
                          normalize(a.status) === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {normalize(a.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {normalize(a.status) === 'shortlisted' && (
                        <button
                          disabled={actingId === a._id}
                          onClick={async ()=>{
                            try{ setActingId(a._id); const res = await applicationService.confirmBySeeker(a._id); setApplications(prev => prev.map(x=> x._id===a._id? res : x)); }
                            catch(e){}
                            finally{ setActingId(null);} }
                          }
                          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                        >
                          {actingId===a._id? 'Confirming...' : 'Confirm offer'}
                        </button>
                      )}
                      {normalize(a.status) === 'confirmed' && (
                        <button
                          disabled={actingId === a._id}
                          onClick={async ()=>{
                            try{ setActingId(a._id); const res = await applicationService.completeBySeeker(a._id); setApplications(prev => prev.map(x=> x._id===a._id? res : x)); }
                            catch(e){}
                            finally{ setActingId(null);} }
                          }
                          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                        >
                          {actingId===a._id? 'Saving...' : 'Mark completed'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-4 text-center text-gray-500">No applications</div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManageJobsPage;
