
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
// import { Principal } from "@dfinity/principal"; // Not directly used in this file

const CreateGroup = () => {
  const navigate = useNavigate();
  const { showToast, backendActor } = useApp();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    groupName: "",
    description: "",
    maxMembers: "",
    contributionAmount: "",
    frequency: "weekly",
    startDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmCreate = async () => {
    if (!backendActor) {
      showToast("Backend actor not initialized. Please log in.", "error");
      return;
    }

    setLoading(true);
    try {
      const startDate = BigInt(new Date(formData.startDate).getTime() * 1_000_000); // Convert to nanoseconds
      const frequencyMap = {
        daily: { daily: null },
        weekly: { weekly: null },
        monthly: { monthly: null },
      };
      const result = await backendActor.createGroup({
        name: formData.groupName,
        description: formData.description,
        maxMembers: BigInt(formData.maxMembers),
        contributionAmount: BigInt(formData.contributionAmount),
        frequency: frequencyMap[formData.frequency as keyof typeof frequencyMap],
        startDate: startDate,
      });

      if ("ok" in result) {
        showToast("Group created successfully!", "success");
        navigate("/dashboard");
      } else {
        showToast(`Failed to create group: ${(result as any).err}`, "error");
      }
    } catch (error: any) {
      showToast(`Failed to create group: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Group</h1>
        <p className="text-gray-600 dark:text-gray-300">Set up a new susu group for you and your community</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name</label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="e.g., Family Savings Group"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="A brief description of your group"
            ></textarea>
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Members</label>
            <input
              type="number"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              required
              min="2"
              max="20"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="e.g., 10"
            />
          </div>

          {/* Contribution Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contribution Amount (₵)
            </label>
            <input
              type="number"
              name="contributionAmount"
              value={formData.contributionAmount}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="50.00"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contribution Frequency
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["daily", "weekly", "monthly"].map((freq) => (
                <label key={freq} className="cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value={freq}
                    checked={formData.frequency === freq}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`p-3 text-center rounded-lg border-2 transition-colors ${
                      formData.frequency === freq
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="font-medium capitalize">{freq}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 font-medium"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Group Creation</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Group Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Description:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Max Members:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.maxMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Contribution:</span>
                <span className="font-medium text-gray-900 dark:text-white">₵{formData.contributionAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Frequency:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{formData.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Start Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.startDate}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;