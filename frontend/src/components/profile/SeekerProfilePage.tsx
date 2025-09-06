import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profileService, Rate } from "../../services/profileService";
import { authService } from "../../services/authService";

const currencyLabel = "LKR";

const SeekerProfilePage: React.FC = () => {
  const { user, logout, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [amount, setAmount] = useState<number>(0);
  const [unit, setUnit] = useState<Rate["unit"]>("hour");
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobTitlesInput, setJobTitlesInput] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);
  const [servicesInput, setServicesInput] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState<string>("");
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const [languages, setLanguages] = useState<any>(null);
  const [langSinhala, setLangSinhala] = useState<number | "">("");
  const [langTamil, setLangTamil] = useState<number | "">("");
  const [langEnglish, setLangEnglish] = useState<number | "">("");
  type OtherLang = { name: string; level: number };
  const [otherLanguages, setOtherLanguages] = useState<OtherLang[]>([]);
  const [newOtherName, setNewOtherName] = useState<string>("");
  const [newOtherLevel, setNewOtherLevel] = useState<number | "">("");
  const [whAmount, setWhAmount] = useState<number | "">("");
  const [whUnit, setWhUnit] = useState<'day' | 'week' | 'month'>('day');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editSnapshot, setEditSnapshot] = useState<any>(null);
  
  // Document upload states
  const [documents, setDocuments] = useState<Array<{url: string; filename: string; type: string}>>([]);
  const [uploadingDocument, setUploadingDocument] = useState<boolean>(false);
  const [documentError, setDocumentError] = useState<string>("");
  
  // Image modal states
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>("");
  const [modalImageName, setModalImageName] = useState<string>("");
  const defaultAvatar =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%23e5e7eb"/><circle cx="64" cy="50" r="22" fill="%239ca3af"/><path d="M20 112c8-20 26-32 44-32s36 12 44 32" fill="%239ca3af"/></svg>';

  const isJobSeeker = useMemo(() => user?.role === "job_seeker", [user]);

  // Auto-grow bio textarea
  const autoResizeBio = () => {
    const el = bioRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isEditing) {
      autoResizeBio();
    }
  }, [bio, isEditing]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = (me: any) => {
      const rate: Rate | undefined = me?.rate || me?.seeker?.rate;
      if (rate) {
        setAmount(rate.amount || 0);
        setUnit(rate.unit);
      }
      // Initialize seeker profile fields
      const jt = Array.isArray(me?.jobTitles)
        ? me.jobTitles
        : Array.isArray(me?.seeker?.jobTitles)
        ? me.seeker.jobTitles
        : [];
      setJobTitles(jt);
      setJobTitlesInput(jt.join(", "));
      setBio(me?.bio || me?.seeker?.bio || "");
      const sv = Array.isArray(me?.services)
        ? me.services
        : Array.isArray(me?.seeker?.services)
        ? me.seeker.services
        : [];
      setServices(sv);
      // treat input as 'add new service' field (empty by default)
      setServicesInput("");
      const sk = Array.isArray(me?.skills)
        ? me.skills
        : Array.isArray(me?.seeker?.skills)
        ? me.seeker.skills
        : [];
      setSkills(sk);
      // treat input as 'add new skill' field (empty by default)
      setSkillsInput("");
      setLanguages(me?.languages || null);
      // Initialize language editor states
      const l = me?.languages || {};
      setLangSinhala(typeof l.sinhala === "number" ? l.sinhala : "");
      setLangTamil(typeof l.tamil === "number" ? l.tamil : "");
      setLangEnglish(typeof l.english === "number" ? l.english : "");
      setOtherLanguages(Array.isArray(l.other) ? l.other.map((x: any) => ({ name: String(x.name || ""), level: Number(x.level || 0) })) : []);
      const wh = me?.seeker?.workingHours || null;
      if (wh?.mode === 'single' && wh?.single?.start != null && wh?.single?.end != null) {
        const amt = Number(wh.single.start);
        if (!Number.isNaN(amt) && amt >= 0) setWhAmount(amt);
        const unitVal = String(wh.single.end);
        if (unitVal === 'day' || unitVal === 'week' || unitVal === 'month') setWhUnit(unitVal);
      } else {
        setWhAmount("");
      }
      
      // Initialize documents
      const docs = Array.isArray(me?.documents) ? me.documents : Array.isArray(me?.seeker?.documents) ? me.seeker.documents : [];
      setDocuments(docs);
    };

    (async () => {
      try {
        setLoading(true);
        setError("");
        // Prefer profile already loaded in AuthContext
        if (authProfile) {
          hydrate(authProfile);
          return;
        }
        // Fall back to fetching (profileService has caching and in-flight dedup)
        const me = await profileService.getMyProfile();
        if (cancelled) return;
        hydrate(me);
      } catch (e: any) {
        console.error("Failed to load my profile", e);
        if (!cancelled) {
          if (e?.response?.status === 401) {
            setError("Unauthorized. Please log in again.");
            navigate("/login");
          } else {
            setError(e?.message || "Failed to load profile");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, authProfile]);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validate token before attempting update to avoid 401s
      const isValid = await authService.validateToken();
      if (!isValid) {
        setError("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }

      // Parse job titles (still comma-separated)
      const parsedJobTitles = jobTitlesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // services and skills already maintained as arrays via tag inputs
      setJobTitles(parsedJobTitles);

      // Build languages payload conforming to backend schema
      const languagesPayload: any = {};
      const clamp = (n: number) => Math.max(0, Math.min(10, n));
      if (langSinhala !== "") languagesPayload.sinhala = clamp(Number(langSinhala));
      if (langTamil !== "") languagesPayload.tamil = clamp(Number(langTamil));
      if (langEnglish !== "") languagesPayload.english = clamp(Number(langEnglish));
      const otherSanitized = otherLanguages
        .map((o) => ({ name: String(o.name || "").trim(), level: clamp(Number(o.level || 0)) }))
        .filter((o) => o.name.length > 0);
      if (otherSanitized.length) languagesPayload.other = otherSanitized;

      // Save profile data (without documents)
      await profileService.putMyProfile({
        rate: { amount: Number(amount) || 0, unit, currency: "LKR" },
        bio,
        services: services,
        skills: skills,
        jobTitles: parsedJobTitles,
        languages: languagesPayload,
        workingHours:
          whAmount === "" || Number(whAmount) < 0
            ? undefined
            : {
                mode: "single",
                single: { start: String(whAmount), end: whUnit },
              },
      });

      // Save documents separately if any exist
      if (documents.length > 0) {
        await profileService.saveDocumentsToProfile(documents);
      }

      // Re-fetch to sync UI with backend-sanitized/normalized data
      const me = await profileService.getMyProfile();
      const newRate: Rate | undefined = me?.rate || me?.seeker?.rate;
      if (newRate) {
        setAmount(newRate.amount || 0);
        setUnit(newRate.unit);
      }
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
      // Re-parse working hours into local editor state
      const wh2 = me?.seeker?.workingHours || null;
      if (wh2?.mode === 'single' && wh2?.single?.start != null && wh2?.single?.end != null) {
        const amt2 = Number(wh2.single.start);
        setWhAmount(!Number.isNaN(amt2) && amt2 >= 0 ? amt2 : "");
        const unit2 = String(wh2.single.end);
        if (unit2 === 'day' || unit2 === 'week' || unit2 === 'month') setWhUnit(unit2 as any);
      } else {
        setWhAmount("");
      }
      
      // Re-sync documents from server response
      const docs2 = Array.isArray(me?.documents) ? me.documents : Array.isArray(me?.seeker?.documents) ? me.seeker.documents : [];
      setDocuments(docs2);

      setSuccess("Profile saved successfully.");
      setIsEditing(false);
    } catch (e: any) {
      console.error("Failed to save profile", e);
      // Show concise message for 401
      if (e?.response?.status === 401) {
        setError("Unauthorized. Please log in again.");
        navigate("/login");
      } else {
        setError(e?.message || "Failed to save");
      }
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

  // Document upload handlers
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setDocumentError('Please upload a PDF, Word document, or image file (JPG, PNG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setDocumentError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingDocument(true);
      setDocumentError('');
      
      const result = await profileService.uploadDocument(file, 'cv');
      
      // Add to documents list
      setDocuments(prev => [...prev, {
        url: result.url,
        filename: result.filename,
        type: result.type
      }]);
      
      setSuccess('Document uploaded successfully');
    } catch (error: any) {
      setDocumentError(error?.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const handleDocumentDelete = async (documentUrl: string) => {
    try {
      await profileService.deleteDocument(documentUrl);
      setDocuments(prev => prev.filter(doc => doc.url !== documentUrl));
      setSuccess('Document deleted successfully');
    } catch (error: any) {
      setDocumentError(error?.message || 'Failed to delete document');
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const isImageFile = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
  };

  const handleDocumentView = (doc: {url: string; filename: string; type: string}) => {
    if (isImageFile(doc.filename)) {
      setModalImageUrl(doc.url);
      setModalImageName(doc.filename);
      setShowImageModal(true);
    } else {
      // For PDFs and other documents, open in new tab
      const link = document.createElement('a');
      link.href = doc.url;
      link.target = '_blank';
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F8F9] pt-16">
        <div className="max-w-full px-6 sm:px-24 py-8">
          <div className="bg-white border rounded-xl p-6 text-gray-600">Loading profile...</div>
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
              { key: "finances", label: "Finances", path: "/finances" },
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
                  jobTitlesInput,
                  bio,
                  services: [...services],
                  servicesInput,
                  skills: [...skills],
                  skillsInput,
                  // languages snapshot
                  langSinhala,
                  langTamil,
                  langEnglish,
                  otherLanguages: JSON.parse(JSON.stringify(otherLanguages)),
                  // working hours snapshot
                  whAmount,
                  whUnit,
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
                    setJobTitlesInput(editSnapshot.jobTitlesInput);
                    setBio(editSnapshot.bio);
                    setServices(editSnapshot.services);
                    setServicesInput(editSnapshot.servicesInput);
                    setSkills(editSnapshot.skills);
                    setSkillsInput(editSnapshot.skillsInput);
                    // restore languages
                    setLangSinhala(editSnapshot.langSinhala);
                    setLangTamil(editSnapshot.langTamil);
                    setLangEnglish(editSnapshot.langEnglish);
                    setOtherLanguages(Array.isArray(editSnapshot.otherLanguages) ? editSnapshot.otherLanguages : []);
                    // restore working hours
                    setWhAmount(editSnapshot.whAmount);
                    setWhUnit(editSnapshot.whUnit || 'day');
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
                  {whAmount === "" ? (
                    <span className="text-gray-500">Not set</span>
                  ) : (
                    <span>{whAmount} per {whUnit}</span>
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
                  value={jobTitlesInput}
                  onChange={(e) => setJobTitlesInput(e.target.value)}
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
                  ref={bioRef}
                  rows={1}
                  className="w-full border rounded px-3 py-2 resize-none overflow-hidden"
                  placeholder="Tell employers about yourself..."
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    // grow as the user types
                    autoResizeBio();
                  }}
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
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {services.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-violet-100 text-gray-800 px-3 py-1 rounded-full">
                        {s}
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => setServices(services.filter((_, i) => i !== idx))}
                          aria-label={`Remove ${s}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {services.length === 0 && (
                      <span className="text-gray-500">No services added.</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a service (press Enter)"
                      className="flex-1 border rounded px-3 py-2"
                      value={servicesInput}
                      onChange={(e) => setServicesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && servicesInput.trim()) {
                          setServices([...services, servicesInput.trim()]);
                          setServicesInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded border hover:bg-gray-50"
                      onClick={() => {
                        if (servicesInput.trim()) {
                          setServices([...services, servicesInput.trim()]);
                          setServicesInput('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
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
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-violet-100 text-gray-800 px-3 py-1 rounded-full">
                        {s}
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                          aria-label={`Remove ${s}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-gray-500">No skills added.</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill (press Enter)"
                      className="flex-1 border rounded px-3 py-2"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillsInput.trim()) {
                          setSkills([...skills, skillsInput.trim()]);
                          setSkillsInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded border hover:bg-gray-50"
                      onClick={() => {
                        if (skillsInput.trim()) {
                          setSkills([...skills, skillsInput.trim()]);
                          setSkillsInput('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Languages</h3>
              {!isEditing ? (
                <div className="text-gray-800 text-sm space-y-1">
                  <div>
                    <span className="text-gray-500 mr-2">Sinhala:</span>
                    <span>{langSinhala === "" ? "Not set" : langSinhala}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Tamil:</span>
                    <span>{langTamil === "" ? "Not set" : langTamil}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">English:</span>
                    <span>{langEnglish === "" ? "Not set" : langEnglish}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Other:</span>
                    <span>{otherLanguages.length ? otherLanguages.map((o) => `${o.name}(${o.level})`).join(", ") : "None"}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sinhala (0-10)</label>
                      <input type="number" min={0} max={10} className="w-full border rounded px-3 py-2" value={langSinhala === "" ? "" : Number(langSinhala)} onChange={(e) => {
                        const v = e.target.value === "" ? "" : Math.max(0, Math.min(10, Number(e.target.value)));
                        setLangSinhala(v as any);
                      }} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tamil (0-10)</label>
                      <input type="number" min={0} max={10} className="w-full border rounded px-3 py-2" value={langTamil === "" ? "" : Number(langTamil)} onChange={(e) => {
                        const v = e.target.value === "" ? "" : Math.max(0, Math.min(10, Number(e.target.value)));
                        setLangTamil(v as any);
                      }} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">English (0-10)</label>
                      <input type="number" min={0} max={10} className="w-full border rounded px-3 py-2" value={langEnglish === "" ? "" : Number(langEnglish)} onChange={(e) => {
                        const v = e.target.value === "" ? "" : Math.max(0, Math.min(10, Number(e.target.value)));
                        setLangEnglish(v as any);
                      }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Other languages</div>
                    {otherLanguages.length === 0 && (
                      <div className="text-gray-500 text-sm mb-2">None</div>
                    )}
                    <div className="space-y-2">
                      {otherLanguages.map((o, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            value={o.name}
                            placeholder="Language"
                            onChange={(e) => {
                              const arr = [...otherLanguages];
                              arr[idx] = { ...arr[idx], name: e.target.value };
                              setOtherLanguages(arr);
                            }}
                          />
                          <input
                            type="number" min={0} max={10}
                            className="w-28 border rounded px-3 py-2"
                            value={o.level}
                            onChange={(e) => {
                              const arr = [...otherLanguages];
                              arr[idx] = { ...arr[idx], level: Math.max(0, Math.min(10, Number(e.target.value))) };
                              setOtherLanguages(arr);
                            }}
                          />
                          <button
                            type="button"
                            className="px-2 py-2 text-sm border rounded"
                            onClick={() => setOtherLanguages(otherLanguages.filter((_, i) => i !== idx))}
                          >Remove</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Add language</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="Language name" value={newOtherName} onChange={(e) => setNewOtherName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Level (0-10)</label>
                        <input type="number" min={0} max={10} className="w-28 border rounded px-3 py-2" value={newOtherLevel === "" ? "" : Number(newOtherLevel)} onChange={(e) => setNewOtherLevel(e.target.value === "" ? "" : Math.max(0, Math.min(10, Number(e.target.value))))} />
                      </div>
                      <button type="button" className="px-3 py-2 border rounded" onClick={() => {
                        const name = newOtherName.trim();
                        const level = newOtherLevel === "" ? null : Number(newOtherLevel);
                        if (name && level !== null) {
                          setOtherLanguages([...otherLanguages, { name, level }]);
                          setNewOtherName("");
                          setNewOtherLevel("");
                        }
                      }}>Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Working Hours */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Working Hours</h3>
              {!isEditing ? (
                <div className="text-gray-800">
                  {whAmount === "" ? (
                    <span className="text-gray-500">Not set</span>
                  ) : (
                    <span>{whAmount} hours per {whUnit}</span>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={whAmount}
                    onChange={(e) => setWhAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hours"
                    min="0"
                  />
                  <select
                    value={whUnit}
                    onChange={(e) => setWhUnit(e.target.value as 'day' | 'week' | 'month')}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">per Day</option>
                    <option value="week">per Week</option>
                    <option value="month">per Month</option>
                  </select>
                </div>
              )}
            </div>

            {/* Documents Upload */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Documents (CV, Certificates, etc.)</h3>
              
              {/* Upload Section */}
              {isEditing && (
                <div className="mb-4">
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploadingDocument}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, Word documents, JPG, PNG (max 5MB)
                  </p>
                  {uploadingDocument && (
                    <div className="flex items-center mt-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                  {documentError && (
                    <div className="text-red-600 text-sm mt-2">{documentError}</div>
                  )}
                </div>
              )}

              {/* Documents List */}
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getFileIcon(doc.filename)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDocumentView(doc)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleDocumentDelete(doc.url)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{modalImageName}</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <img
                  src={modalImageUrl}
                  alt={modalImageName}
                  className="max-w-full max-h-96 object-contain mx-auto"
                />
              </div>
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeekerProfilePage;
