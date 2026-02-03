import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState(
    searchParams.get("email") || ""
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      // No token in URL, show instructions
      setSuccess(false);
      return;
    }

    // Token found, verify it
    const verify = async () => {
      setLoading(true);
      try {
        await verifyEmail(token);
        setSuccess(true);
        setError("");
        // Redirect to login after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Verification failed. Please try again."
        );
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, navigate, verifyEmail]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail) {
      setError("Please enter your email address");
      return;
    }

    setResendLoading(true);
    setError("");
    
    try {
      await authApi.resendVerificationEmail(resendEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000); // Hide after 5 seconds
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to resend verification email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              Verifying Email...
            </h1>
            <p className="text-gray-600 mt-2">
              Please wait while we verify your email
            </p>
          </div>
        )}

        {success && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now log in to
              your account.
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}

        {!loading && !success && !searchParams.get("token") && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 mb-6">
              A verification link has been sent to your email address. Please
              check your inbox and click on the link to verify your account.
            </p>

            {resendSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-semibold">✓ Email sent!</p>
                <p>Check your inbox for the verification link.</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-3">Didn't get an email?</p>
              <p className="mb-4">
                Check your spam folder or enter your email below to resend the
                verification link.
              </p>

              <form onSubmit={handleResendVerification} className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-blue-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>
          </div>
        )}

        {!loading && !success && error && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-red-600 mb-6">{error}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
              <p className="font-semibold mb-3">Want to try again?</p>
              <form onSubmit={handleResendVerification} className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-blue-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="block w-full bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
              <Link
                to="/signup"
                className="block w-full bg-red-50 text-red-600 px-6 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
