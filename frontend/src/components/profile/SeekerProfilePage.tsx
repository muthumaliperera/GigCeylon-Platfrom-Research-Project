import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profileService, Rate } from "../../services/profileService";

const currencyLabel = "LKR";

const SeekerProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [amount, setAmount] = useState<number>(0);
  const [unit, setUnit] = useState<Rate["unit"]>("hour");
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [bio, setBio] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<any>(null);
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editSnapshot, setEditSnapshot] = useState<any>(null);
  const defaultAvatar =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%23e5e7eb"/><circle cx="64" cy="50" r="22" fill="%239ca3af"/><path d="M20 112c8-20 26-32 44-32s36 12 44 32" fill="%239ca3af"/></svg>';

  const isJobSeeker = useMemo(() => user?.role === "job_seeker", [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const me = await profileService.getMyProfile();
        if (cancelled) return;
        const rate: Rate | undefined = me?.rate || me?.seeker?.rate;
        if (rate) {
          setAmount(rate.amount || 0);
          setUnit(rate.unit);
        }
        // Initialize seeker profile fields
        setJobTitles(
          Array.isArray(me?.jobTitles)
            ? me.jobTitles
            : Array.isArray(me?.seeker?.jobTitles)
            ? me.seeker.jobTitles
            : []
        );
        setBio(me?.bio || me?.seeker?.bio || "");
        setServices(
          Array.isArray(me?.services)
            ? me.services
            : Array.isArray(me?.seeker?.services)
            ? me.seeker.services
            : []
        );
        setSkills(
          Array.isArray(me?.skills)
            ? me.skills
            : Array.isArray(me?.seeker?.skills)
            ? me.seeker.skills
            : []
        );
        setLanguages(me?.languages || null);
        setWorkingHours(me?.seeker?.workingHours || null);
      } catch (e: any) {
        console.error("Failed to load my profile", e);
        if (!cancelled) setError(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await profileService.putMyProfile({
        rate: { amount: Number(amount) || 0, unit, currency: "LKR" },
        bio,
        services,
        skills,
        jobTitles,
      });
      setSuccess("Profile rate saved successfully.");
      setIsEditing(false);
    } catch (e: any) {
      console.error("Failed to save profile rate", e);
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  if (!isJobSeeker) {
    return (
      <div className="min-h-screen bg-[#F3F8F9] pt-16">
        <div className="max-w-full px-6 sm:px-24 py-8">
          <div className="bg-white border rounded-xl p-6">Only job seekers can edit seeker profile details.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      {/* Top Header (copied from JobSeekerDashboard) */}
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

      {/* Seeker Tabs Nav (copied from JobSeekerDashboard) */}
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

      {/* Account-style banner */}
      <div className="mb-4 flex items-center flex-col md:flex-row gap-2 md:justify-between px-6 sm:px-24 bg-[linear-gradient(135deg,#8750E9_0%,#6925E3_100%)] py-8">
        {/* left */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-col items-center justify-center">
            <img
              src={(user as any)?.profileImageUrl || defaultAvatar}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border"
            />
          </div>
          <div className="grid grid-cols-1 md:text-start">
            <div className="w-full text-2xl px-1 text-white font-semibold tracking-tight">
              {`${(user?.firstName || "").trim()} ${(user?.lastName || "").trim()}`.trim() || "Anonymous"}
            </div>
            <div className="w-full px-1 text-white/90 text-md">
              {user?.email || "you@example.com"}
            </div>
          </div>
        </div>
        {/* right actions */}
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              className="px-4 py-2 text-white rounded-lg border hover:bg-gray-50 text-sm hover:text-primary"
              onClick={() => {
                setEditSnapshot({
                  amount,
                  unit,
                  jobTitles: [...jobTitles],
                  bio,
                  services: [...services],
                  skills: [...skills],
                });
                setIsEditing(true);
              }}
            >
              Update Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={save}
                className={`px-4 py-2 rounded text-white ${saving ? "bg-gray-500" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  if (editSnapshot) {
                    setAmount(editSnapshot.amount);
                    setUnit(editSnapshot.unit);
                    setJobTitles(editSnapshot.jobTitles);
                    setBio(editSnapshot.bio);
                    setServices(editSnapshot.services);
                    setSkills(editSnapshot.skills);
                  }
                  setIsEditing(false);
                  setError("");
                }}
                className="px-4 py-2 rounded border bg-white text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-full px-6 sm:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: read-only quick facts */}
          <aside className="bg-white border rounded-2xl p-6 order-2 lg:order-1">
            <h3 className="text-md font-semibold mb-4">Overview</h3>
            <div className="space-y-4 text-sm text-gray-800">
              <div>
                <div className="text-gray-500">Working Hours</div>
                <div className="font-medium">
                  {workingHours ? (
                    <span>{JSON.stringify(workingHours)}</span>
                  ) : (
                    <span className="text-gray-500">Not set</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Rate</div>
                <div className="font-medium">{amount || 0} {currencyLabel}/{unit}</div>
              </div>
              <div>
                <div className="text-gray-500">Languages</div>
                <div className="font-medium">
                  {languages ? (
                    <span>{JSON.stringify(languages)}</span>
                  ) : (
                    <span className="text-gray-500">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Panel: read-only vs edit form */}
          <section className="bg-white border rounded-2xl p-6 lg:col-span-2 order-1 lg:order-2">
            {/* Job Titles */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Job Title</h2>
              {!isEditing ? (
                <div className="text-gray-800">
                  {jobTitles.length ? jobTitles.join(" | ") : <span className="text-gray-500">Not specified</span>}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Comma separated titles e.g., UI/UX designer, Mobile App Designer"
                  className="w-full border rounded px-3 py-2"
                  value={jobTitles.join(", ")}
                  onChange={(e) => setJobTitles(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                />
              )}
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Bio</h3>
              {!isEditing ? (
                <p className="text-gray-800 whitespace-pre-line">{bio || <span className="text-gray-500">No bio yet</span>}</p>
              ) : (
                <textarea
                  rows={5}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Tell employers about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              )}
            </div>

            {/* Services */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Services</h3>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {services.length ? services.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm border">{s}</span>
                  )) : <span className="text-gray-500">No services listed</span>}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Comma separated services"
                  className="w-full border rounded px-3 py-2"
                  value={services.join(", ")}
                  onChange={(e) => setServices(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                />
              )}
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Skills</h3>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {skills.length ? skills.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm border">{s}</span>
                  )) : <span className="text-gray-500">No skills listed</span>}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Comma separated skills"
                  className="w-full border rounded px-3 py-2"
                  value={skills.join(", ")}
                  onChange={(e) => setSkills(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                />
              )}
            </div>

            {/* Rate editor when editing */}
            {isEditing && (
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount ({currencyLabel})</label>
                  <input
                    type="number"
                    min={0}
                    className="border rounded px-3 py-2 w-48"
                    value={Number.isFinite(amount) ? amount : 0}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rate unit</label>
                  <select
                    className="border rounded px-3 py-2 w-48"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Rate["unit"])}
                  >
                    <option value="hour">Hourly</option>
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
            )}
            {success && (
              <div className="mt-4 p-3 rounded bg-green-50 text-green-700 border border-green-200 text-sm">{success}</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default SeekerProfilePage;
