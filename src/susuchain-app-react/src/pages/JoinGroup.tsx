import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";


const JoinGroup = () => {
  const navigate = useNavigate();
  const { showToast, backendActor } = useApp();
  const [groupCode, setGroupCode] = useState("");
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSearch = async () => {
    if (!groupCode.trim()) return;
    if (!backendActor) {
      showToast("Backend actor not initialized. Please log in.", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await backendActor.getGroup(groupCode.trim());

      if ("ok" in result) {
        setGroupInfo(result.ok);
      } else {
        showToast(`Group not found: ${(result as any).err}`, "error");
        setGroupInfo(null);
      }
    } catch (error: any) {
      showToast(`Failed to search group: ${error.message}`, "error");
      setGroupInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!backendActor) {
      showToast("Backend actor not initialized. Please log in.", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await backendActor.joinGroup({ groupCode: groupCode.trim() });

      if ("ok" in result) {
        showToast("Successfully joined group!", "success");
        navigate("/dashboard");
      } else {
        showToast(`Failed to join group: ${(result as any).err}`, "error");
      }
    } catch (error: any) {
      showToast(`Failed to join group: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join a Group</h1>
        <p className="text-gray-600 dark:text-gray-300">Enter a group code to join an existing susu group</p>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex space-x-3">
          <input
            type="text"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            placeholder="Enter group code (e.g., SG123ABC)"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
            maxLength={8}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !groupCode.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Group Info */}
      {groupInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{groupInfo.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{groupInfo.description}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {groupInfo.members.length}/{Number(groupInfo.maxMembers)} members
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Group Code</span>
                <p className="font-semibold text-gray-900 dark:text-white">{groupInfo.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Admin</span>
                <p className="font-semibold text-gray-900 dark:text-white">{groupInfo.admin.toText()}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Contribution Amount</span>
                <p className="font-semibold text-gray-900 dark:text-white">₵{Number(groupInfo.contributionAmount)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Frequency</span>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {Object.keys(groupInfo.frequency)[0]}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={groupInfo.members.length >= Number(groupInfo.maxMembers)}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {groupInfo.members.length >= Number(groupInfo.maxMembers) ? "Group Full" : "Join Group"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Join Group Confirmation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to join "{groupInfo?.name}"? You'll be required to make ₵
              {Number(groupInfo?.contributionAmount)} contributions {Object.keys(groupInfo?.frequency || {})[0]}.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Join Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;