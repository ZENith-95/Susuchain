

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";

const PersonalSavings = () => {
  const { user, showToast, balance, setBalance, backendActor } = useApp();
  const [loading, setLoading] = useState<boolean | string>(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);

  const fetchSavingsData = useCallback(async () => {
    if (!backendActor || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userProfileResult = await backendActor.getUser();
      if ("ok" in userProfileResult) {
        setBalance(Number(userProfileResult.ok.balance));
      } else {
        showToast(`Error fetching user balance: ${userProfileResult.err}`, "error");
      }

      const transactionsResult = await backendActor.getUserTransactions();
      if ("ok" in transactionsResult) {
        setTransactions(transactionsResult.ok);
        const deposits = transactionsResult.ok.filter((tx: any) => Object.keys(tx.transactionType)[0] === "deposit");
        const withdrawals = transactionsResult.ok.filter((tx: any) => Object.keys(tx.transactionType)[0] === "withdraw");
        setTotalDeposits(deposits.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0));
        setTotalWithdrawals(withdrawals.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0));
      } else {
        showToast(`Error fetching transactions: ${transactionsResult.err}`, "error");
      }
    } catch (error: any) {
      showToast(`Failed to fetch savings data: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [user, setBalance, showToast, backendActor]);

  useEffect(() => {
    fetchSavingsData();
  }, [fetchSavingsData]);

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0 || !backendActor) {
      showToast("Invalid amount or backend actor not initialized.", "error");
      return;
    }

    setLoading("deposit");
    try {
      const result = await backendActor.deposit({
        amount: BigInt(Number.parseFloat(depositAmount)),
        paymentMethod: { mobileMoney: { mtn: null } }, // Assuming MTN for now, will be dynamic later
        reference: [], // Use empty array for null optional
      });

      if ("ok" in result) {
        showToast(`₵${depositAmount} deposited successfully!`, "success");
        fetchSavingsData(); // Refresh data
        setShowDepositModal(false);
        setDepositAmount("");
      } else {
        showToast(`Deposit failed: ${(result as any).err}`, "error");
      }
    } catch (error: any) {
      showToast(`Deposit failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0 || Number.parseFloat(withdrawAmount) > balance || !backendActor) {
      showToast("Invalid amount or backend actor not initialized.", "error");
      return;
    }

    setLoading("withdraw");
    try {
      const result = await backendActor.withdraw({
        amount: BigInt(Number.parseFloat(withdrawAmount)),
        paymentMethod: { mobileMoney: { mtn: null } }, // Assuming MTN for now, will be dynamic later
        // reference: [], // WithdrawRequest does not have a reference field in the backend
      });

      if ("ok" in result) {
        showToast(`₵${withdrawAmount} withdrawn successfully!`, "success");
        fetchSavingsData(); // Refresh data
        setShowWithdrawModal(false);
        setWithdrawAmount("");
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Personal Savings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your personal savings wallet</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium mb-2">Available Balance</p>
            <p className="text-4xl font-bold">₵{balance.toFixed(2)}</p>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
          </div>
        </div>
        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-xl py-3 px-4 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">Deposit</span>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance <= 0}
            className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl py-3 px-4 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span className="font-medium">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₵{totalDeposits.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₵{totalWithdrawals.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.length > 0 ? (
              transactions.map((transaction: any) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        Object.keys(transaction.transactionType)[0] === "deposit"
                          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {Object.keys(transaction.transactionType)[0] === "deposit" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {Object.keys(transaction.transactionType)[0]}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Object.keys(transaction.method)[0] === "mobileMoney"
                          ? `Mobile Money (${Object.keys(transaction.method.mobileMoney)[0]})`
                          : Object.keys(transaction.method)[0] === "bankTransfer"
                            ? "Bank Transfer"
                            : "Crypto"}{" "}
                        • {new Date(Number(transaction.timestamp) / 1_000_000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        Object.keys(transaction.transactionType)[0] === "deposit"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {Object.keys(transaction.transactionType)[0] === "deposit" ? "+" : "-"}₵
                      {Number(transaction.amount).toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        Object.keys(transaction.status)[0] === "completed"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {Object.keys(transaction.status)[0]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transactions yet.</p>
            )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deposit Money</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (₵)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDepositModal(false)}
                disabled={loading === "deposit"}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={loading === "deposit" || !depositAmount || Number.parseFloat(depositAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading === "deposit" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Deposit via Mobile Money"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Withdraw Money</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (₵)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={balance}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter amount"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available balance: ₵{balance.toFixed(2)}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={loading === "withdraw"}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={
                  loading === "withdraw" ||
                  !withdrawAmount ||
                  Number.parseFloat(withdrawAmount) <= 0 ||
                  Number.parseFloat(withdrawAmount) > balance
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading === "withdraw" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Withdraw to Mobile Money"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSavings;