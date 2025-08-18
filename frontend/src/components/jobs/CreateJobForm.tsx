import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  CONTACT_METHODS,
  DURATION_OPTIONS,
  JOB_TYPES,
  JobFormData,
  jobService,
  PAYMENT_TYPES,
  SRI_LANKAN_CITIES,
  URGENCY_LEVELS,
} from "../../services/jobService";
import {
  templateService,
  TemplateCategoryDto,
  TemplateType,
} from "../../services/templateService";

const CreateJobForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { editJobId?: string } };
  const editJobId = location.state?.editJobId;
  const isEdit = Boolean(editJobId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    category: "tutoring",
    description: "",
    location: "",
    specificArea: "",
    expectedDuration: "",
    completionDeadline: "",
    paymentType: "cash",
    paymentAmount: 0,
    basicRequirements: "",
    whatYouProvide: "",
    preferredContactMethod: "email",
    urgency: "not_urgent",
    additionalNotes: "",
    jobType: "",
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmFairPayment, setConfirmFairPayment] = useState(false);

  // Large-screen section toggle
  const [activeSection, setActiveSection] = useState<
    "basic" | "location" | "payment" | "contact"
  >("basic");

  // Templates-driven fields
  const [templateCategories, setTemplateCategories] = useState<TemplateCategoryDto[]>([]);
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
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [customRequirement, setCustomRequirement] = useState("");

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
          expectedDuration: j.expectedDuration || "",
          completionDeadline: (j.completionDeadline || "").slice(0, 10),
          paymentType: j.paymentType || "cash",
          paymentAmount: j.paymentAmount ?? 0,
          basicRequirements: j.basicRequirements || "",
          whatYouProvide: j.whatYouProvide || "",
          preferredContactMethod: j.preferredContactMethod || "email",
          urgency: j.urgency || "not_urgent",
          additionalNotes: j.additionalNotes || "",
          jobType: (j as any).jobType || "",
        });
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
        const data = await templateService.list(formData.jobType as TemplateType);
        setTemplateCategories(data);
      } catch (e: any) {
        setTemplatesError(e?.response?.data?.message || "Failed to load templates");
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "paymentAmount" ? Number(value) : value,
    }));
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

    try {
      if (isEdit && editJobId) {
        const result = await jobService.updateJob(editJobId, formData);
        setSuccess("Job updated successfully");
        navigate(`/talent/jobs/${result._id}`, {
          state: { message: "Job updated successfully" },
          replace: true,
        });
      } else {
        const result = await jobService.createJob(formData);
        setSuccess("Job created successfully");
        navigate("/talent-connector-dashboard", {
          state: { message: "Job created successfully" },
          replace: true,
        });
      }
    } catch (err: any) {
      // console.error("Error creating job", err);

      if (err.response?.status === 401) {
        setError("Unable to post job. Please try again.");
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
      <header className="bg-slate-900 text-white px-6 sm:px-24 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Home
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              About
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Help
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

      {/* Page content */}
      <div className="py-6 w-full px-6 sm:px-24">
        <div className="">
          <div className="">
            <div className="">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEdit ? "Update job post" : "Post a New Job"}
                </h1>
                <p className="mt-2 text-gray-600">
                  {isEdit
                    ? "Make changes to your existing job post."
                    : "Fill in the details below to post your job on our platform"}
                </p>
              </div>

              {/* Top action bar for small/medium screens */}
              <div className="flex lg:hidden justify-end gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-job-form"
                  disabled={isLoading || !agreedToTerms || !confirmFairPayment}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Posting Job..." : "Post My Job"}
                </button>
              </div>

              {/* Layout wrapper: sidebar (lg) + form content */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Sidebar (only on large screens) */}
                <aside className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-6 space-y-3 ">
                    <button
                      type="button"
                      onClick={() => setActiveSection("basic")}
                      className={`block w-full text-left px-4 py-3 rounded-xl ${activeSection === "basic" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      1. Basic Job Information
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("location")}
                      className={`block w-full text-left px-4 py-3 rounded-xl ${activeSection === "location" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      2. Location & Timing
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("payment")}
                      className={`block w-full text-left px-4 py-3 rounded-xl ${activeSection === "payment" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      3. Payment & Requirements
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection("contact")}
                      className={`block w-full text-left px-4 py-3 rounded-xl ${activeSection === "contact" ? "bg-primary font-semibold text-white" : "bg-white hover:text-gray-600"}`}
                    >
                      4. Contact & Additional Info
                    </button>
                  </div>
                </aside>

                {/* Right content: the original form */}
                <div className="lg:col-span-4">
                  <form
                    id="create-job-form"
                    onSubmit={handleSubmit}
                    className="space-y-8 text-start"
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
                    {/* Sticky action bar (large screens) */}
                    <div className="hidden lg:flex justify-end gap-4 sticky top-0 z-10 bg-white/80 backdrop-blur p-3 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isLoading || !agreedToTerms || !confirmFairPayment
                        }
                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Posting Job..." : "Post My Job"}
                      </button>
                    </div>

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
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                              <option value="">{templatesLoading ? "Loading categories..." : "Select a category"}</option>
                              {templateCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            {templatesError && (
                              <p className="text-sm text-red-600 mt-1">{templatesError}</p>
                            )}
                            {!formData.jobType && (
                              <p className="text-sm text-gray-500 mt-1">Select a Job Type first to load categories</p>
                            )}
                          </div>
                          {/*job (from category) + title (custom override)*/}
                          <div className="w-full">
                            <label
                              htmlFor="jobFromCategory"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Job (from category)
                            </label>
                            <select
                              id="jobFromCategory"
                              disabled={!selectedCategory}
                              value={selectedJob}
                              onChange={(e) => setSelectedJob(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                              <option value="">Select a job</option>
                              {selectedCategory?.jobs?.map((j) => (
                                <option key={j} value={j}>{j}</option>
                              ))}
                            </select>
                            <p className="text-sm text-gray-500 mt-1">Or type your own title below</p>
                          </div>
                          <div className="w-full lg:col-span-2">
                            <label
                              htmlFor="title"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Job Title *
                            </label>
                            <input
                              type="text"
                              id="title"
                              name="title"
                              required
                              value={formData.title}
                              onChange={(e) => {
                                setCustomJob(e.target.value);
                                handleChange(e);
                              }}
                              placeholder="e.g., Paper Marking Assistant, Data Entry Helper"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">Keep it simple and clear</p>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Job Description *
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what needs to be done in simple terms..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
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

                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
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
                            required
                            value={formData.specificArea}
                            onChange={handleChange}
                            placeholder="e.g., Colombo 05, Kandy City"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Optional: Be more specific about the location
                          </p>
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="expectedDuration"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Expected Duration *
                          </label>
                          <select
                            id="expectedDuration"
                            name="expectedDuration"
                            required
                            value={formData.expectedDuration}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select duration</option>
                            {DURATION_OPTIONS.map((duration) => (
                              <option
                                key={duration.value}
                                value={duration.value}
                              >
                                {duration.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full">
                          <label
                            htmlFor="completionDeadline"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Completion Deadline
                          </label>
                          <input
                            type="date"
                            id="completionDeadline"
                            name="completionDeadline"
                            required
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
                            Requirements
                          </label>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <select
                              multiple
                              size={Math.min(6, (selectedCategory?.requirements?.length || 0) + 1)}
                              disabled={!selectedCategory}
                              value={selectedRequirements}
                              onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                                setSelectedRequirements(options);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                              {(selectedCategory?.requirements || []).map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customRequirement}
                                  onChange={(e) => setCustomRequirement(e.target.value)}
                                  placeholder="Add custom requirement"
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const v = customRequirement.trim();
                                    if (!v) return;
                                    if (!selectedRequirements.includes(v)) {
                                      setSelectedRequirements((prev) => [...prev, v]);
                                    }
                                    setCustomRequirement("");
                                  }}
                                  className="px-4 py-2 bg-primary text-white rounded-xl disabled:opacity-50"
                                  disabled={!customRequirement.trim()}
                                >
                                  Add
                                </button>
                              </div>
                              {selectedRequirements.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selectedRequirements.map((req) => (
                                    <span key={req} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                      {req}
                                      <button
                                        type="button"
                                        className="text-red-600"
                                        onClick={() => setSelectedRequirements((prev) => prev.filter((x) => x !== req))}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Select multiple requirements or add your own. We'll include them in your job post.
                          </p>
                        </div>

                        <div className="w-full lg:col-span-2">
                          <label
                            htmlFor="whatYouProvide"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            What You'll Provide
                          </label>
                          <textarea
                            id="whatYouProvide"
                            name="whatYouProvide"
                            required
                            rows={3}
                            value={formData.whatYouProvide}
                            onChange={handleChange}
                            placeholder="e.g., All materials, instructions, transport allowance..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            What will you give to help complete the job?
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
                        <div className="w-full">
                          <label
                            htmlFor="preferredContactMethod"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Preferred Contact Method *
                          </label>
                          <select
                            id="preferredContactMethod"
                            name="preferredContactMethod"
                            required
                            value={formData.preferredContactMethod}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select method</option>
                            {CONTACT_METHODS.map((method) => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
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
                          <textarea
                            id="additionalNotes"
                            name="additionalNotes"
                            rows={3}
                            value={formData.additionalNotes}
                            onChange={handleChange}
                            placeholder="Any other important information..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
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
                        📝 <strong>Note:</strong> After submitting, you'll be
                        able to preview your job post before it goes live. You
                        can make changes if needed.
                      </p>
                    </div>

                    {/* Bottom action bar (small/medium screens) */}
                    <div className="flex lg:hidden justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isLoading || !agreedToTerms || !confirmFairPayment
                        }
                        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Posting Job..." : "Post My Job"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobForm;
