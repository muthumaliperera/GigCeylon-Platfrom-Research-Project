import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CONTACT_METHODS,
  DURATION_OPTIONS,
  JOB_CATEGORIES,
  JobFormData,
  jobService,
  PAYMENT_TYPES,
  SRI_LANKAN_CITIES,
  URGENCY_LEVELS,
} from "../../services/jobService";

const CreateJobForm: React.FC = () => {
  const navigate = useNavigate();
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
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmFairPayment, setConfirmFairPayment] = useState(false);

  // (Debug helpers removed for production cleanliness)

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
      const result = await jobService.createJob(formData);
      // console.debug("Job created", result);
      setSuccess("Job created successfully");
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Post a New Job
              </h1>
              <p className="mt-2 text-gray-600">
                Fill in the details below to post your job on our platform
              </p>
            </div>
            {/* Debug button removed */}

            <form onSubmit={handleSubmit} className="space-y-8">
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

              {/* Basic Job Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Basic Job Information
                </h2>

                <div className="space-y-4">
                  <div>
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
                      onChange={handleChange}
                      placeholder="e.g., Paper Marking Assistant, Data Entry Helper"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Keep it simple and clear
                    </p>
                  </div>

                  <div>
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
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {JOB_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
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
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Location & Timing
                </h2>

                <div className="space-y-4">
                  <div>
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

                  <div>
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

                  <div>
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
                        <option key={duration.value} value={duration.value}>
                          {duration.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
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
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Payment & Requirements
                </h2>

                <div className="space-y-4">
                  <div>
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

                  <div>
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

                  <div>
                    <label
                      htmlFor="basicRequirements"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Basic Requirements
                    </label>
                    <textarea
                      id="basicRequirements"
                      name="basicRequirements"
                      required
                      rows={3}
                      value={formData.basicRequirements}
                      onChange={handleChange}
                      placeholder="e.g., Good English skills, Attention to detail, Must have own transport..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      What skills or qualifications are needed? Keep it simple
                    </p>
                  </div>

                  <div>
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
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact & Additional Info
                </h2>

                <div className="space-y-4">
                  <div>
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

                  <div>
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

                  <div>
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
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                    I agree to the platform terms and conditions *
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="fairPayment"
                    checked={confirmFairPayment}
                    onChange={(e) => setConfirmFairPayment(e.target.checked)}
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
                  📝 <strong>Note:</strong> After submitting, you'll be able to
                  preview your job post before it goes live. You can make
                  changes if needed.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !agreedToTerms || !confirmFairPayment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Posting Job..." : "Post My Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobForm;
