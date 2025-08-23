import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  JOB_TYPES,
  JobFormData,
  jobService,
  PAYMENT_TYPES,
  SRI_LANKAN_CITIES,
  URGENCY_LEVELS,
} from "../../services/jobService";
import {
  TemplateCategoryDto,
  templateService,
  TemplateType,
} from "../../services/templateService";
import { authService } from "../../services/authService";

// Lightweight auto-resize textarea with forwarded ref
const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ onChange, style, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  };
  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={setRefs}
      onChange={(e) => {
        onChange?.(e);
        // defer to next frame for accurate scrollHeight after value set
        requestAnimationFrame(resize);
      }}
      style={{
        overflow: "hidden",
        minHeight: style?.minHeight ?? "96px",
        maxHeight: "none",
        ...style,
      }}
    />
  );
});

// Removed token highlighter and placeholder insertions; using a proper toolbar instead

const CreateJobForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as { editJobId?: string; resubmit?: boolean } | undefined) || undefined;
  const editJobId = locationState?.editJobId;
  const isResubmit = Boolean(locationState?.resubmit);
  const isEdit = Boolean(editJobId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Removed textarea ref and snippet insertion helpers

  

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    category: "tutoring",
    description: "",
    location: "",
    specificArea: "",
    completionDeadline: "",
    paymentType: "cash",
    paymentAmount: 0,
    basicRequirements: "",
    preferredContactMethod: "email",
    urgency: "not_urgent",
    additionalNotes: "",
    jobType: "",
  });

  // TipTap editor for description only (initialized after formData is defined)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // keep only what we need: bold + bullet list + basic text
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        orderedList: false,
        heading: false,
        horizontalRule: false,
        // leave bulletList, listItem, history, cursors as defaults (enabled)
      }),
    ],
    // Load existing HTML content directly so formatting is preserved
    content: formData.description || "",
    onUpdate: ({ editor }) => {
      // Store exact HTML so preview and saved content match the editor
      const html = editor.getHTML();
      setFormData((prev) => ({ ...prev, description: html }));
    },
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[160px] w-full px-4 py-3 border border-gray-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent prose prose-sm",
      },
    },
  });

  // Keep editor in sync when external state updates description (e.g., editing existing job)
  useEffect(() => {
    if (!editor) return;
    const current = formData.description || "";
    if (editor.getHTML() !== current) {
      editor.commands.setContent(current, { emitUpdate: false });
    }
  }, [editor, formData.description]);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmFairPayment, setConfirmFairPayment] = useState(false);
  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  // Large-screen section toggle
  const [activeSection, setActiveSection] = useState<
    "basic" | "location" | "payment" | "contact"
  >("basic");

  // Templates-driven fields
  const [templateCategories, setTemplateCategories] = useState<
    TemplateCategoryDto[]
  >([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const selectedCategory = useMemo(
    () => templateCategories.find((c) => c._id === selectedCategoryId),
    [templateCategories, selectedCategoryId]
  );
  // Job selection derived from selected category
  const [selectedJob, setSelectedJob] = useState("");
  const [customJob, setCustomJob] = useState("");
  // Requirements multi-select with add-your-own
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>(
    []
  );
  const [customRequirement, setCustomRequirement] = useState("");
  const [reqSelect, setReqSelect] = useState("");
  const [isReqOpen, setIsReqOpen] = useState(false);
  // Preferred contact faux-select
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactChips, setContactChips] = useState<
    { type: "email" | "phone" | "whatsapp"; value: string }[]
  >([]);
  // Title select-like dropdown control
  const [isTitleOpen, setIsTitleOpen] = useState(false);
  const titleSuggestions = useMemo(() => {
    const list = selectedCategory?.jobs || [];
    const q = (customJob || "").toLowerCase();
    if (!q) return list;
    return list.filter((j) => j.toLowerCase().includes(q));
  }, [selectedCategory, customJob]);

  // Close title dropdown on outside click
  useEffect(() => {
    if (!isTitleOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#job-title-select-root")) setIsTitleOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [isTitleOpen]);

  // Close requirements dropdown on outside click
  useEffect(() => {
    if (!isReqOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#req-select-root")) setIsReqOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsReqOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [isReqOpen]);

  // Close preferred contact dropdown on outside click / escape
  useEffect(() => {
    if (!isContactOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#contact-select-root")) setIsContactOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsContactOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [isContactOpen]);

  // Remove: additionalNotes is separate; do not auto-append contact details

  // (Debug helpers removed for production cleanliness)

  // Prefill when editing
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isEdit || !editJobId) return;
      try {
        const j = await jobService.getJobById(editJobId);
        if (cancelled) return;
        setFormData({
          title: j.title || "",
          category: j.category || "",
          description: j.description || "",
          location: j.location || "",
          specificArea: j.specificArea || "",
          completionDeadline: (j.completionDeadline || "").slice(0, 10),
          paymentType: j.paymentType || "cash",
          paymentAmount: j.paymentAmount ?? 0,
          basicRequirements: j.basicRequirements || "",
          preferredContactMethod: j.preferredContactMethod || "email",
          urgency: j.urgency || "not_urgent",
          additionalNotes: j.additionalNotes || "",
          jobType: (j as any).jobType || "",
        });
        // Prefill contact chips from arrays if available
        const emails = (j as any).contactEmails as string[] | undefined;
        const phones = (j as any).contactPhones as string[] | undefined;
        const whatsapps = (j as any).contactWhatsapps as string[] | undefined;
        const chips: { type: "email" | "phone" | "whatsapp"; value: string }[] =
          [];
        (emails || []).forEach((v) => chips.push({ type: "email", value: v }));
        (phones || []).forEach((v) => chips.push({ type: "phone", value: v }));
        (whatsapps || []).forEach((v) =>
          chips.push({ type: "whatsapp", value: v })
        );
        setContactChips(chips);
      } catch (e) {
        console.error("Failed to prefill job form", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editJobId]);

  // Load template categories when jobType changes
  useEffect(() => {
    const load = async () => {
      setTemplateCategories([]);
      setSelectedCategoryId("");
      setSelectedJob("");
      setCustomJob("");
      setSelectedRequirements([]);
      setCustomRequirement("");
      if (!formData.jobType) return;
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const data = await templateService.list(
          formData.jobType as TemplateType
        );
        setTemplateCategories(data);
      } catch (e: any) {
        setTemplatesError(
          e?.response?.data?.message || "Failed to load templates"
        );
      } finally {
        setTemplatesLoading(false);
      }
    };
    load();
  }, [formData.jobType]);

  // When category changes, sync formData.category and reset job/requirements
  useEffect(() => {
    if (selectedCategory) {
      setFormData((prev) => ({ ...prev, category: selectedCategory.name }));
    } else {
      setFormData((prev) => ({ ...prev, category: "" }));
    }
    setSelectedJob("");
    setCustomJob("");
    setSelectedRequirements([]);
    setCustomRequirement("");
  }, [selectedCategoryId]);

  // Keep title in sync with selected/custom job (user still can edit title directly)
  useEffect(() => {
    if (customJob.trim()) {
      setFormData((prev) => ({ ...prev, title: customJob.trim() }));
    } else if (selectedJob) {
      setFormData((prev) => ({ ...prev, title: selectedJob }));
    }
  }, [selectedJob, customJob]);

  // Map selected requirements into basicRequirements (comma-separated)
  useEffect(() => {
    const text = selectedRequirements.join(", ");
    setFormData((prev) => ({ ...prev, basicRequirements: text }));
  }, [selectedRequirements]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next: any = {
        ...prev,
        [name]: name === "paymentAmount" ? Number(value) : value,
      };
      // If switching to Remote/Online, clear specificArea as it does not apply
      if (name === "location" && value === "remote") {
        next.specificArea = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agreedToTerms || !confirmFairPayment) {
      setError("Please accept the terms and confirm fair payment");
      return;
    }

    // Minimal submission trace
    // console.debug("Submitting job", formData);

    setIsLoading(true);

    // Validate token before attempting to post or update a job
    const stillValid = await authService.validateToken();
    if (!stillValid) {
      setIsLoading(false);
      setError("Your session expired. Please log in again.");
      navigate('/login', { state: { from: location.pathname, message: 'Session expired. Please log in.' }, replace: true });
      return;
    }

    // Build payload including contact arrays from chips
    const payload = {
      ...formData,
      contactEmails: contactChips
        .filter((c) => c.type === "email")
        .map((c) => c.value),
      contactPhones: contactChips
        .filter((c) => c.type === "phone")
        .map((c) => c.value),
      contactWhatsapps: contactChips
        .filter((c) => c.type === "whatsapp")
        .map((c) => c.value),
    } as any;

    // If this is an edit of a previously rejected job (resubmission),
    // force approvalStatus back to pending and clear any previous rejection reason.
    if (isEdit && isResubmit) {
      payload.approvalStatus = "pending";
      payload.rejectedReason = null;
    }

    try {
      if (isEdit && editJobId) {
        const result = await jobService.updateJob(editJobId, payload);
        setSuccess(isResubmit ? "Job resubmitted for approval" : "Job updated successfully");
        // After resubmission, take user to dashboard so it appears under Pending jobs
        if (isResubmit) {
          navigate("/talent-connector-dashboard", {
            state: { message: "Job sent for admin approval" },
            replace: true,
          });
        } else {
          navigate(`/talent/jobs/${result._id}`, {
            state: { message: "Job updated successfully" },
            replace: true,
          });
        }
      } else {
        const result = await jobService.createJob(payload);
        setSuccess("Job created successfully");
        navigate("/talent-connector-dashboard", {
          state: { message: "Job created successfully" },
          replace: true,
        });
      }
    } catch (err: any) {
      // console.error("Error creating job", err);

      if (err.response?.status === 401) {
        setError("Your session expired. Please log in again.");
        navigate('/login', { state: { from: location.pathname, message: 'Session expired. Please log in.' }, replace: true });
      } else if (Array.isArray(err.response?.data?.message)) {
        setError(err.response.data.message.join(", "));
      } else {
        setError(err.response?.data?.message || "Failed to create job posting");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Set minimum date to tomorrow
  const minDate = formatDateForInput(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      {/* Landing page header reused */}
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4 fixed top-0 inset-x-0 z-40">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#hero" className="hover:text-blue-400 transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-blue-400 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#categories" className="hover:text-blue-400 transition-colors">
              Categories
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <img
                    src={
                      user.profileImageUrl ||
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%23e5e7eb"/><circle cx="64" cy="50" r="22" fill="%239ca3af"/><path d="M20 112c8-20 26-32 44-32s36 12 44 32" fill="%239ca3af"/></svg>'
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                  <span>
                    Hi, {user.firstName} {user.lastName}
                  </span>
                </div>
                <Link
                  to={
                    user.role === "job_seeker"
                      ? "/job-seeker-dashboard"
                      : user.role === "talent_connector"
                        ? "/talent-connector-dashboard"
                        : user.role === "admin"
                          ? "/admin-dashboard"
                          : "/dashboard"
                  }
                  className="border border-white text-white px-5 py-2 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </>
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

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Page content */}
      <div className="">
        <div className="">
          <div className="">
            <div className="">
              {/* Title area with actions (matches design) */}
              <div className="mb-0 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white py-6 w-full px-6 sm:px-24 sticky top-20 z-30">
                <div className="lg:text-start">
                  <h1 className="text-xl  font-bold text-gray-900 tracking-tight">
                    {isEdit ? "Update Job Post" : "Post a New Job"}
                  </h1>
                  <p className="mt-1 text-sm sm:text-base text-gray-600">
                    {isEdit
                      ? "Make changes to your existing job post."
                      : "Fill in the details below to post your job. "}
                    <span className="ml-1">
                      Note: Preview your job post before it goes live. You can
                      make changes if needed.
                    </span>
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Preview Job
                  </button>
                  <button
                    type="submit"
                    form="create-job-form"
                    disabled={
                      isLoading || !agreedToTerms || !confirmFairPayment
                    }
                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? isEdit
                        ? "Updating..."
                        : "Posting Job..."
                      : isEdit
                        ? "Update Job"
                        : "Create Job"}
                  </button>
                </div>
              </div>

              {/* Layout wrapper: sidebar (lg) + form content */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-0 w-full px-6 sm:px-24 mt-6">
                {/* Sidebar (only on large screens) */}
                <aside className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-28 ">
                    <button
                      type="button"
                      onClick={() => setActiveSection("basic")}
                      className={`block w-full text-left px-4 mb-3 py-3 rounded-xl ${activeSection === "basic" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      1. Basic Job Information
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("location")}
                      className={`block w-full text-left px-4 mb-3 py-3 rounded-xl ${activeSection === "location" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      2. Location & Timing
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("payment")}
                      className={`block w-full text-left px-4 mb-3 py-3 rounded-xl ${activeSection === "payment" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      3. Payment & Requirements
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("contact")}
                      className={`block w-full text-left px-4 mb-3 py-3 rounded-xl ${activeSection === "contact" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      4. Contact & Additional Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="block w-full px-4 py-3 rounded-xl bg-accent text-center text-white"
                    >
                      Preview Job
                    </button>
                  </div>
                </aside>

                {/* Right content: the original form */}
                <div className="lg:col-span-4">
                  <form
                    id="create-job-form"
                    onSubmit={handleSubmit}
                    className="text-start space-y-0"
                  >
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                      </div>
                    )}
                    {/* actions are now in the header and sidebar (Preview) to avoid duplication */}

                    {/* Basic Job Information */}
                    <div
                      id="basic"
                      className={`p-6 bg-white rounded-xl block ${activeSection === "basic" ? "lg:block" : "lg:hidden"}`}
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Basic Job Information
                      </h2>

                      <div className="space-y-4 ">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                          {/*type*/}
                          <div className="w-full">
                            <label
                              htmlFor="jobType"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Job Type *
                            </label>
                            <select
                              id="jobType"
                              name="jobType"
                              required
                              value={formData.jobType || ""}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select job type</option>
                              {JOB_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/*category (template-driven)*/}
                          <div className="w-full">
                            <label
                              htmlFor="category"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Job Category *
                            </label>
                            <select
                              id="category"
                              name="category"
                              required
                              disabled={!formData.jobType || templatesLoading}
                              value={selectedCategoryId}
                              onChange={(e) =>
                                setSelectedCategoryId(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                              <option value="">
                                {templatesLoading
                                  ? "Loading categories..."
                                  : "Select a category"}
                              </option>
                              {templateCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            {templatesError && (
                              <p className="text-sm text-red-600 mt-1">
                                {templatesError}
                              </p>
                            )}
                            {!formData.jobType && (
                              <p className="text-sm text-gray-500 mt-1">
                                Select a Job Type first to load categories
                              </p>
                            )}
                          </div>
                          {/* Job Title faux-select with dropdown content */}
                          <div
                            className="w-full lg:col-span-2"
                            id="job-title-select-root"
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Job Title *
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsTitleOpen((s) => !s)}
                              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white text-left"
                            >
                              <span
                                className={
                                  formData.title
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }
                              >
                                {formData.title || "Select or Type"}
                              </span>
                              <svg
                                className="w-4 h-4 text-gray-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0l-4.24-4.24a.75.75 0 01.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            {isTitleOpen && (
                              <div className="relative">
                                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
                                  <div className="p-2 border-b bg-white">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={customJob}
                                        onChange={(e) =>
                                          setCustomJob(e.target.value)
                                        }
                                        placeholder="Type Title"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const v = customJob.trim();
                                          if (!v) return;
                                          setFormData((prev) => ({
                                            ...prev,
                                            title: v,
                                          }));
                                          setSelectedJob(v);
                                          setIsTitleOpen(false);
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-lg"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                  <div className="max-h-60 overflow-auto">
                                    {titleSuggestions.length > 0 ? (
                                      titleSuggestions.map((j) => (
                                        <button
                                          key={j}
                                          type="button"
                                          onClick={() => {
                                            setSelectedJob(j);
                                            setCustomJob(j);
                                            setFormData((prev) => ({
                                              ...prev,
                                              title: j,
                                            }));
                                            setIsTitleOpen(false);
                                          }}
                                          className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                                        >
                                          {j}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-4 py-3 text-sm text-gray-500">
                                        No suggestions
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Keep it simple and clear
                            </p>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Job Description *
                          </label>
                          {/* Toolbar: Bold + Bulleted List only */}
                          <div className="w-full">
                            <div className="flex items-center gap-2 mb-2 border border-gray-300 rounded-t-xl bg-gray-50 p-2 w-fit">
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                disabled={!editor?.can().chain().focus().toggleBold().run()}
                                className={`px-2 py-1 text-sm rounded border ${editor?.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}
                                aria-label="Bold"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                className={`px-2 py-1 text-sm rounded border ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'}`}
                                aria-label="Bulleted list"
                              >
                                •
                              </button>
                            </div>
                            <EditorContent editor={editor} />
                            {/* Keep required validation via a visually hidden textarea bound to state (HTML) */}
                            <textarea
                              id="description"
                              name="description"
                              required
                              readOnly
                              value={formData.description}
                              className="absolute -left-[9999px] w-px h-px opacity-0 pointer-events-none"
                              aria-hidden="true"
                              tabIndex={-1}
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Explain the task clearly so anyone can understand
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location & Timing */}
                    <div
                      id="location"
                      className={`p-6 bg-white rounded-xl block ${activeSection === "location" ? "lg:block" : "lg:hidden"}`}
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Location & Timing
                      </h2>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="w-full">
                          <label
                            htmlFor="location"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Location *
                          </label>
                          <select
                            id="location"
                            name="location"
                            required
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select location</option>
                            <option value="remote">Remote / Online</option>
                            {SRI_LANKAN_CITIES.map((city) => (
                              <option key={city.value} value={city.value}>
                                {city.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="specificArea"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Specific Area
                          </label>
                          <input
                            type="text"
                            id="specificArea"
                            name="specificArea"
                            value={formData.specificArea}
                            onChange={handleChange}
                            placeholder={formData.location === 'remote' ? 'N/A for remote' : 'e.g., Colombo 05, Kandy City'}
                            disabled={formData.location === 'remote'}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.location === 'remote' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="completionDeadline"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Post Deadline
                          </label>
                          <input
                            type="date"
                            id="completionDeadline"
                            name="completionDeadline"
                            min={minDate}
                            value={formData.completionDeadline}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment & Requirements */}
                    <div
                      id="payment"
                      className={`p-6 bg-white rounded-xl block ${activeSection === "payment" ? "lg:block" : "lg:hidden"}`}
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Payment & Requirements
                      </h2>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="w-full">
                          <label
                            htmlFor="paymentType"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Payment type
                          </label>
                          <select
                            id="paymentType"
                            name="paymentType"
                            required
                            value={formData.paymentType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select payment type</option>
                            {PAYMENT_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="paymentAmount"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Payment Amount (Rs.) *
                          </label>
                          <input
                            type="number"
                            id="paymentAmount"
                            name="paymentAmount"
                            required
                            min="0"
                            value={formData.paymentAmount}
                            onChange={handleChange}
                            placeholder="e.g., 500"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Enter amount in Sri Lankan Rupees
                          </p>
                        </div>

                        <div className="w-full lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Basic Requirements*
                          </label>
                          {/* Single field behaving like a dropdown */}
                          <div className="relative" id="req-select-root">
                            <button
                              type="button"
                              disabled={!selectedCategory}
                              onClick={() => setIsReqOpen((s) => !s)}
                              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white text-left disabled:bg-gray-100"
                            >
                              <span
                                className={
                                  selectedRequirements.length
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }
                              >
                                {selectedRequirements.length
                                  ? `${selectedRequirements.length} selected`
                                  : "Select from list"}
                              </span>
                              <svg
                                className="w-4 h-4 text-gray-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0l-4.24-4.24a.75.75 0 01.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>

                            {isReqOpen && (
                              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
                                <div className="p-2 border-b bg-white">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={customRequirement}
                                      onChange={(e) =>
                                        setCustomRequirement(e.target.value)
                                      }
                                      placeholder="Type your own requirement"
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const v = customRequirement.trim();
                                        if (!v) return;
                                        if (!selectedRequirements.includes(v)) {
                                          setSelectedRequirements((prev) => [
                                            ...prev,
                                            v,
                                          ]);
                                        }
                                        setCustomRequirement("");
                                      }}
                                      className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                                      disabled={!customRequirement.trim()}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-auto">
                                  {(selectedCategory?.requirements || []).map(
                                    (r) => {
                                      const checked =
                                        selectedRequirements.includes(r);
                                      return (
                                        <label
                                          key={r}
                                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                if (!checked)
                                                  setSelectedRequirements(
                                                    (prev) => [...prev, r]
                                                  );
                                              } else {
                                                setSelectedRequirements(
                                                  (prev) =>
                                                    prev.filter((x) => x !== r)
                                                );
                                              }
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <span className="text-sm text-gray-800">
                                            {r}
                                          </span>
                                        </label>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {selectedRequirements.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedRequirements.map((req) => (
                                <span
                                  key={req}
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                  <span>{req}</span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${req}`}
                                    className="text-gray-500 hover:text-red-600"
                                    onClick={() =>
                                      setSelectedRequirements((prev) =>
                                        prev.filter((x) => x !== req)
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Pick from the list or add your own.
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* Contact & Additional Info */}
                    <div
                      id="contact"
                      className={`p-6 bg-white rounded-xl block ${activeSection === "contact" ? "lg:block" : "lg:hidden"}`}
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Contact & Additional Info
                      </h2>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Preferred Contact Method - full width block before urgency */}
                        <div
                          className="w-full lg:col-span-2"
                          id="contact-select-root"
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preferred Contact Method *
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsContactOpen((s) => !s)}
                            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white text-left"
                            aria-haspopup="listbox"
                            aria-expanded={isContactOpen}
                          >
                            <span className="text-gray-900">Select</span>
                            <svg
                              className="w-4 h-4 text-gray-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0l-4.24-4.24a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {isContactOpen && (
                            <div className="relative">
                              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
                                <div className="p-3 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="email"
                                      placeholder="Add Email"
                                      value={contactEmail}
                                      onChange={(e) =>
                                        setContactEmail(e.target.value)
                                      }
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const v = contactEmail.trim();
                                        if (!v) return;
                                        setContactChips((prev) => [
                                          ...prev,
                                          { type: "email", value: v },
                                        ]);
                                        setContactEmail("");
                                      }}
                                      className="px-4 py-2 bg-[#0E1B33] text-white rounded-lg"
                                    >
                                      Add
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="tel"
                                      placeholder="Add Phone"
                                      value={contactPhone}
                                      onChange={(e) =>
                                        setContactPhone(e.target.value)
                                      }
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const v = contactPhone.trim();
                                        if (!v) return;
                                        setContactChips((prev) => [
                                          ...prev,
                                          { type: "phone", value: v },
                                        ]);
                                        setContactPhone("");
                                      }}
                                      className="px-4 py-2 bg-[#0E1B33] text-white rounded-lg"
                                    >
                                      Add
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Add Whatsapp"
                                      value={contactWhatsapp}
                                      onChange={(e) =>
                                        setContactWhatsapp(e.target.value)
                                      }
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const v = contactWhatsapp.trim();
                                        if (!v) return;
                                        setContactChips((prev) => [
                                          ...prev,
                                          { type: "whatsapp", value: v },
                                        ]);
                                        setContactWhatsapp("");
                                      }}
                                      className="px-4 py-2 bg-[#0E1B33] text-white rounded-lg"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Chips under the field */}
                          {contactChips.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {contactChips.map((c, idx) => (
                                <span
                                  key={`${c.type}-${idx}`}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
                                >
                                  {c.type === "email"
                                    ? "Email"
                                    : c.type === "phone"
                                      ? "Phone"
                                      : "WhatsApp"}
                                  : {c.value}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setContactChips((prev) =>
                                        prev.filter((_, i) => i !== idx)
                                      )
                                    }
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="urgency"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            How Urgent? *
                          </label>
                          <select
                            id="urgency"
                            name="urgency"
                            required
                            value={formData.urgency}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select urgency</option>
                            {URGENCY_LEVELS.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full lg:col-span-2">
                          <label
                            htmlFor="additionalNotes"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Additional Notes
                          </label>
                          <AutoResizeTextarea
                            id="additionalNotes"
                            name="additionalNotes"
                            value={formData.additionalNotes}
                            onChange={handleChange}
                            placeholder="Any other important information..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4 pt-6">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="terms"
                          className="ml-3 text-sm text-gray-700"
                        >
                          I agree to the platform terms and conditions *
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="fairPayment"
                          checked={confirmFairPayment}
                          onChange={(e) =>
                            setConfirmFairPayment(e.target.checked)
                          }
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="fairPayment"
                          className="ml-3 text-sm text-gray-700"
                        >
                          I confirm this is fair payment for the work required *
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-blue-800">
                        📝 <strong>Note:</strong> Use the Preview button to see
                        how your job post will look before you publish. You can
                        still make changes if needed.
                      </p>
                    </div>

                    {/* mobile actions removed to prevent duplication with header */}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Preview Job Post</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto text-start">
              <div>
                <h4 className="text-xl font-bold">
                  {formData.title || "Untitled Job"}
                </h4>
                <p className="text-sm text-gray-600">
                  {formData.category || "No category"} •{" "}
                  {formData.jobType || "Type not set"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {formData.location || "-"}{" "}
                    {formData.specificArea ? `• ${formData.specificArea}` : ""}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Post Deadline</p>
                  <p className="font-medium">
                    {formData.completionDeadline || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="font-medium">
                    {formData.paymentType || "-"}{" "}
                    {formData.paymentAmount
                      ? `• Rs. ${formData.paymentAmount}`
                      : ""}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Urgency</p>
                  <p className="font-medium">{formData.urgency || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                {formData.description ? (
                  <div
                    className="prose prose-sm max-w-none rich-content"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                ) : (
                  <p className="text-gray-500">No description provided.</p>
                )}
              </div>
              {formData.basicRequirements && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Requirements</p>
                  <p>{formData.basicRequirements}</p>
                </div>
              )}
              {formData.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <p>{formData.additionalNotes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="submit"
                form="create-job-form"
                disabled={isLoading || !agreedToTerms || !confirmFairPayment}
                className="px-6 py-2 bg-primary text-white rounded-xl disabled:opacity-50"
              >
                {isEdit
                  ? isLoading
                    ? "Updating..."
                    : "Update Job"
                  : isLoading
                    ? "Posting..."
                    : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateJobForm;
