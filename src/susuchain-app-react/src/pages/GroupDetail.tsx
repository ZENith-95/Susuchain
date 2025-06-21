import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Principal } from "@dfinity/principal";

const GroupDetail = () => {
  const { id } = useParams();
  const { user, showToast, backendActor } = useApp();
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean | string>(true);
  const [showPaystack, setShowPaystack] = useState(false);

  const fetchGroupData = useCallback(async () => {
    if (!backendActor || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await backendActor.getGroup(id);

      if ("ok" in result) {
        setGroupData(result.ok);
      } else {
        showToast(`Error fetching group data: ${(result as any).err}`, "error");
        setGroupData(null);
      }
    } catch (error: any) {
      showToast(`Failed to fetch group data: ${error.message}`, "error");
      setGroupData(null);
    } finally {
      setLoading(false);
    }
  }, [id, showToast, user]); // Removed backendActor from dependencies for now

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleContribute = async () => {
    if (!groupData || !backendActor || !user) {
      showToast("Backend actor not initialized or user not logged in.", "error");
      return;
    }
    setShowPaystack(true);
  };

  const handleConfirmContribution = async () => {
    if (!backendActor) {
      showToast("Backend actor not initialized. Please log in.", "error");
      return;
    }
    setLoading("contribute");
    try {
      const result = await backendActor.contribute({
        groupId: groupData.id,
        amount: BigInt(groupData.contributionAmount),
        paymentMethod: { mobileMoney: { mtn: null } }, // Assuming MTN for now, will be dynamic later
        reference: [], // Use empty array for null optional
      });

      if ("ok" in result) {
        showToast("Contribution successful!", "success");
        setShowPaystack(false);
        fetchGroupData(); // Refresh group data
      } else {
        showToast(`Contribution failed: ${(result as any).err}`, "error");
      }
    } catch (error: any) {
      showToast(`Contribution failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setShowPaystack(false);
    }
  };

  const handleWithdraw = async () => {
    if (!groupData || !backendActor || !user) {
      showToast("Backend actor not initialized or user not logged in.", "error");
      return;
    }

    setLoading("withdraw");
    try {
      const result = await backendActor.withdrawPayout(groupData.id);

      if ("ok" in result) {
        showToast("Withdrawal successful!", "success");
        fetchGroupData(); // Refresh group data
      } else {
        showToast(`Withdrawal failed: ${(result as any).err}`, "error");
      }
    } catch (error: any) {
      showToast(`Withdrawal failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading === true) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300 py-10">
        <p>Group not found or an error occurred.</p>
      </div>
    );
  }

  const currentUserMember = groupData.members.find((m: any) => user && Principal.fromText(m.userId.toText()).toText() === user.id.toText());
  const isAdmin = user && Principal.fromText(groupData.admin.toText()).toText() === user.id.toText();
  const canContribute = currentUserMember && Object.keys(currentUserMember.contributionStatus)[0] === "pending";
  const canWithdraw = currentUserMember && !currentUserMember.hasReceivedPayout && currentUserMember.payoutOrder === groupData.currentCycle;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{groupData.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{groupData.description}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400">Group ID</span>
            <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{groupData.id}</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Current Progress</h3>
            <p className="text-indigo-100">
              Cycle {Number(groupData.currentCycle)} of {Number(groupData.totalCycles)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">₵{Number(groupData.contributionAmount) * groupData.members.length}</p>
            <p className="text-indigo-100 text-sm">Total Pool</p>
          </div>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Number(groupData.currentCycle) / Number(groupData.totalCycles)) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members & Payout Schedule</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {groupData.members.map((member: any) => {
                const isCurrentUser = user && Principal.fromText(member.userId.toText()).toText() === user.id.toText();
                const memberStatus = member.contributionStatus;
                // const hasReceivedPayout = member.hasReceivedPayout; // This is used in canWithdraw logic, so keep it.

                const statusColorClass =
                  Object.keys(memberStatus)[0] === "paid"
                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                    : Object.keys(memberStatus)[0] === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                      : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400";

                const statusText =
                  Object.keys(memberStatus)[0] === "paid"
                    ? "Contributed"
                    : Object.keys(memberStatus)[0] === "pending"
                      ? "Pending"
                      : "Overdue";

                return (
                  <div key={member.userId.toText()} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColorClass}`}>
                        {Object.keys(memberStatus)[0] === "paid" ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{Number(member.payoutOrder)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.userId.toText().slice(0, 8)}...
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                          {user && Principal.fromText(groupData.admin.toText()).toText() === user.id.toText() && (
                            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Payout:{" "}
                          {member.payoutDate && member.payoutDate[0]
                            ? new Date(Number(member.payoutDate[0]) / 1_000_000).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}
                      >
                        {statusText}
                      </span>
                      {member.hasReceivedPayout && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          Payout Received
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-3">
              {canContribute && (
                <button
                  onClick={handleContribute}
                  disabled={loading === "contribute"}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loading === "contribute" ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Contribute ₵{Number(groupData.contributionAmount)}
                    </>
                  )}
                </button>
              )}

              {canWithdraw && (
                <button
                  onClick={handleWithdraw}
                  disabled={loading === "withdraw"}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loading === "withdraw" ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      Withdraw ₵{Number(groupData.contributionAmount) * groupData.members.length}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Group Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Members</span>
                <span className="font-medium text-gray-900 dark:text-white">{groupData.members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Contribution</span>
                <span className="font-medium text-gray-900 dark:text-white">₵{Number(groupData.contributionAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Frequency</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {Object.keys(groupData.frequency)[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Next Payout</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(Number(groupData.nextPayoutDate) / 1_000_000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Panel */}
          {isAdmin && (
            <div className="bg-amber-50 dark:bg-amber-900 rounded-xl border border-amber-200 dark:border-amber-700 p-6">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Admin Panel
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm">
                  Manage Members
                </button>
                <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm">
                  View Reports
                </button>
                <button
                  onClick={async () => {
                    if (!backendActor) {
                      showToast("Backend actor not initialized. Please log in.", "error");
                      return;
                    }
                    setLoading("advanceCycle");
                    try {
                      const result = await backendActor.advanceGroupCycle(groupData.id);
                      if ("ok" in result) {
                        showToast("Group cycle advanced!", "success");
                        fetchGroupData();
                      } else {
                        const errorMsg = Object.values(result.err)[0];
                        showToast(`Failed to advance cycle: ${errorMsg}`, "error");
                      }
                    } catch (error: any) {
                      showToast(`Failed to advance cycle: ${error.message}`, "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading === "advanceCycle"}
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center justify-center"
                >
                  {loading === "advanceCycle" ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Advance Cycle"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paystack Modal */}
      {showPaystack && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Make Contribution</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You're about to contribute ₵{Number(groupData.contributionAmount)} to {groupData.name}.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaystack(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmContribution}
                disabled={loading === "contribute"}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                {loading === "contribute" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Confirm Contribution"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;