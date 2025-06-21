import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, showToast } = useApp();
  const [loading, setLoading] = useState("");

  const handlePlugLogin = async () => {
    setLoading("plug");
    try {
      await login("plug");
      navigate("/dashboard");
    } catch (error: any) {
      showToast(`Failed to connect with Plug Wallet: ${error.message}`, "error");
    } finally {
      setLoading("");
    }
  };

  const handleInternetIdentityLogin = async () => {
    setLoading("ii");
    try {
      await login("internetIdentity");
      navigate("/dashboard");
    } catch (error: any) {
      showToast(`Failed to connect with Internet Identity: ${error.message}`, "error");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">SusuChain</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect your wallet to get started</p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {/* Plug Wallet */}
          <button
            onClick={handlePlugLogin}
            disabled={loading === "plug"}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading === "plug" ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            )}
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {loading === "plug" ? "Connecting..." : "Connect with Plug Wallet"}
            </span>
          </button>

          {/* Internet Identity */}
          <button
            onClick={handleInternetIdentityLogin}
            disabled={loading === "ii"}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading === "ii" ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-7-5z" />
                </svg>
              </div>
            )}
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {loading === "ii" ? "Connecting..." : "Connect with Internet Identity"}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By connecting, you agree to our{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Background Animation */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;