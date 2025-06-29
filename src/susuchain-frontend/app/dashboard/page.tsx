"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useWalletStore } from "@/stores/wallet-store"
import { useGroupStore } from "@/stores/group-store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { SavingsSummary } from "@/components/dashboard/savings-summary"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { ActiveGroups } from "@/components/dashboard/active-groups"
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Dashboard() {
  const { principal } = useAuthStore()
  const { balance, transactions, fetchWalletData, isLoading: walletLoading } = useWalletStore()
  const { groups, fetchUserGroups, isLoading: groupsLoading } = useGroupStore()

  useEffect(() => {
    if (principal) {
      fetchWalletData()
      fetchUserGroups()
    }
  }, [principal, fetchWalletData, fetchUserGroups])

  if (walletLoading || groupsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BalanceCard balance={balance} />
          <SavingsSummary transactions={transactions} />
          <ActiveGroups groups={groups} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions transactions={transactions.slice(0, 5)} />
          <UpcomingActivities groups={groups} />
        </div>
      </div>
    </DashboardLayout>
  )
}
