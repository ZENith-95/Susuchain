import { useApp } from "../context/AppContext";

const Settings = () => {
  const { user, theme, toggleTheme, logout } = useApp();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and settings</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-white">{user?.walletType === "#plug" ? "P" : "II"}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.walletType === "#plug" ? "Plug Wallet" : "Internet Identity"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.principal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                theme === "dark" ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Display Language</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors">
              <option value="en">English</option>
              <option value="tw" disabled>
                Twi (Coming Soon)
              </option>
              <option value="ga" disabled>
                Ga (Coming Soon)
              </option>
            </select>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your wallet provides built-in security</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-red-50 dark:bg-red-900 rounded-xl border border-red-200 dark:border-red-700 p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">Disconnect Wallet</h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            This will disconnect your wallet and log you out of SusuChain.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Disconnect & Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;