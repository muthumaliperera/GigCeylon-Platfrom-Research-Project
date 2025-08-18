import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JobFormData, jobService } from "../../services/jobService";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { api } from "../../services/api";

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    category: "", // category comes from admin-defined templates
    location: "",
    specificArea: "",
    expectedDuration: "",
    completionDeadline: "",
    paymentType: "cash", // Default to first valid enum value
    paymentAmount: 0,
    basicRequirements: "",
    whatYouProvide: "",
    preferredContactMethod: "email", // Default to first valid enum value
    urgency: "not_urgent", // Default to first valid enum value
    additionalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debug: Check authentication state on component mount
  useEffect(() => {
    console.log('PostJob Component - User state:', user);
    console.log('PostJob Component - Token in localStorage:', localStorage.getItem('token'));
    console.log('PostJob Component - User in localStorage:', localStorage.getItem('user'));
    
    if (!user) {
      console.warn('PostJob Component - No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check basic authentication and debug token
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value (first 50 chars):', token ? token.substring(0, 50) + '...' : 'null');
    console.log('User exists:', !!user);
    console.log('User details:', user);
    
    if (!token || !user) {
      setError("Please ensure you are logged in to post a job.");
      return;
    }

    // Test authentication with a simple API call first
    try {
      console.log('Testing authentication with /auth/debug...');
      const testResponse = await api.get('/auth/debug');
      console.log('Auth test successful:', testResponse.data);
    } catch (authError: any) {
      console.error('Auth test failed:', authError.response?.data);
      if (authError.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        // Clear invalid credentials
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
    }

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }
    if (!formData.completionDeadline) {
      setError("Completion deadline is required");
      return;
    }

    // Debug token before API call
    console.log('About to create job - Token exists:', !!token);
    console.log('About to create job - User exists:', !!user);

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const createdJob = await jobService.createJob(formData);
      // console.debug("Job created", createdJob);

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        category: "",
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

      setSuccess("Job created successfully");
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err: any) {
      // console.error("Error creating job", err);

      // Better error message handling
      let errorMessage = "Failed to create job";
      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
        // Clear invalid token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid form data. Please check all fields.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "paymentAmount" ? Number(value) : value,
    }));
  };

  return (
    <div>
      {/* Debug button removed */}
      {error && (
        <div style={{ marginBottom: "10px", color: "#b91c1c" }}>{error}</div>
      )}
      {success && (
        <div style={{ marginBottom: "10px", color: "#065f46" }}>{success}</div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default PostJob;
