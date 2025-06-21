import { Link } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";


const Dashboard = () => {

  const { user, showToast, setBalance, setGroups, backendActor } = useApp();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean | string>(true);

  const fetchDashboardData = useCallback(async () => {
    if (!backendActor || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await backendActor.getDashboard();

      if ("ok" in result) {
        setDashboardData(result.ok);
        setBalance(Number(result.ok.totalBalance));
        setGroups(result.ok.activeGroups);
      } else {
        showToast(`Error fetching dashboard data: ${result.err}`, "error");
        setDashboardData(null);
      }
    } catch (error: any) {
      showToast(`Failed to fetch dashboard data: ${error.message}`, "error");
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [user, setBalance, setGroups, showToast, backendActor]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = [
    {
      title: "Join a Group",
      description: "Enter a group code to join existing susu group",
      icon: "join",
      href: "/join-group",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Create a Group",
      description: "Start a new susu group with friends",
      icon: "create",
      href: "/create-group",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "My Groups",
      description: "Manage your active susu groups",
      icon: "groups",
      href: "/dashboard", // This should ideally link to a "My Groups" page or filter dashboard
      color: "from-green-500 to-teal-600",
    },
    {
      title: "Personal Wallet",
      description: "Manage your personal savings",
      icon: "wallet",
      href: "/savings",
      color: "from-orange-500 to-red-600",
    },
  ];

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      join: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      create: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      groups: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      wallet: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300 py-10">
        <p>Could not load dashboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back!</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connected with {user?.walletType === "#plug" ? "Plug Wallet" : "Internet Identity"}
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
            <p className="text-3xl font-bold">₵{Number(dashboardData.totalBalance).toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upcoming Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Activities</h2>
        <div className="space-y-3">
          {dashboardData.upcomingActivities.length > 0 ? (
            dashboardData.upcomingActivities.map((activity: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.activityType === "#contributionDue"
                      ? "Next Contribution Due"
                      : activity.activityType === "#payoutAvailable"
                        ? "Payout Available"
                        : "Activity"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.groupName ? `${activity.groupName} - ` : ""}₵{Number(activity.amount).toFixed(2)}{" "}
                    {activity.dueDate ? `due on ${new Date(Number(activity.dueDate) / 1_000_000).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming activities.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}
                >
                  {getIcon(action.icon)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
                </div>
                <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;