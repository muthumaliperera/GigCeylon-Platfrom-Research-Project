import { Calendar, DollarSign, Download, FileText, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EarningRecord,
  financialService,
  PaymentRecord,
} from "../services/financialService";

const FinancesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"earnings" | "payments">(
    "earnings"
  );
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role !== "job_seeker") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadFinancialData = async () => {
      setLoading(true);
      try {
        // Fetch real earnings data from completed jobs
        const earningsData = await financialService.getEarnings();
        // For payments, still use mock data until backend endpoint is ready
        const paymentsData = financialService.getMockPayments();

        setEarnings(earningsData);
        setPayments(paymentsData);
      } catch (error) {
        console.error("Failed to load financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadFinancialData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} LKR`;
  };

  if (!user || user.role !== "job_seeker") {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F9] pt-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 sm:px-24 h-16 flex items-center">
        <div className="max-w-full mx-auto w-full flex items-center justify-between">
          <Link to="/">
            <img src="/dark.png" alt="FlexEra" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#hero" className="hover:text-blue-400 transition-colors">
              Home
            </a>
            <a
              href="#features"
              className="hover:text-blue-400 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="hover:text-blue-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#categories"
              className="hover:text-blue-400 transition-colors"
            >
              Categories
            </a>
          </nav>
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
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[linear-gradient(135deg,#0B1022_0%,#0D0D15_100%)] text-white shadow-sm border-b border-black/5 sticky top-16 z-40">
        <div className="max-w-full px-6 sm:px-24 py-3 md:h-14 flex items-center">
          <div className="flex items-center justify-between sm:justify-normal sm:gap-4 w-full">
            {[
              {
                key: "dashboard",
                label: "Dashboard",
                path: "/job-seeker-dashboard",
              },
              { key: "manage", label: "Manage Jobs", path: "/jobs" },
              { key: "finances", label: "Finances", path: "/finances" },
              { key: "profile", label: "My Profile", path: "/profile" },
            ].map((tab) => (
              <div key={tab.key} className="flex items-center">
                <Link
                  to={tab.path}
                  className={`text-sm sm:text-md font-semibold px-4 py-2 rounded-full transition-colors ${
                    window.location.pathname.startsWith(tab.path)
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

      {/* Main Content */}
      <main className="">
        <div className="">
          {/* Tab Navigation */}
          <div className=" px-6 sm:px-24 py-8 ">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab("earnings")}
                className={`py-2 px-4 rounded-full font-medium text-sm ${
                  activeTab === "earnings"
                    ? "bg-primary  text-white"
                    : "bg-white  text-primary hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Earnings</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-2 px-4 rounded-full text-sm ${
                  activeTab === "payments"
                    ? "bg-primary  text-white"
                    : "bg-white  text-primary hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Payments</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex justify-center items-center ">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Earnings Tab */}
              {activeTab === "earnings" && (
                <div className="bg-white px-6 sm:px-24 py-6  mb-6">
                  {earnings.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No earnings yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Complete jobs to start earning money
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-xl">
                      <table className="min-w-full divide-y  divide-gray-200 text-start">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Date Received</span>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Job Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>Talent Connector</span>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>Amount</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {earnings.map((earning) => (
                            <tr key={earning._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(earning.dateReceived)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {earning.jobTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {earning.talentConnectorName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                {formatCurrency(earning.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Subscription Payments
                    </h2>
                    <p className="text-gray-600">
                      Your subscription payment history
                    </p>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No payments yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Your subscription payments will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Payment Date</span>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>Amount</span>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Invoice
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.paymentDescription}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.invoiceUrl ? (
                                  <button
                                    onClick={() =>
                                      window.open(payment.invoiceUrl, "_blank")
                                    }
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancesPage;
