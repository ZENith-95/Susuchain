"use client"

import { useEffect, useState } from "react"
import { useWalletStore } from "@/stores/wallet-store"
import { useAuthStore } from "@/stores/auth-store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatICP } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TransactionHistory } from "@/components/wallet/transaction-history"
import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"

export default function WalletPage() {
  const { principal } = useAuthStore()
  const { balance, transactions, deposit, withdraw, fetchWalletData, isLoading } = useWalletStore()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    if (principal) {
      fetchWalletData()
    }
  }, [principal, fetchWalletData])

  const handleDeposit = async () => {
    if (!depositAmount || isDepositing) return

    setIsDepositing(true)
    try {
      await deposit(Number.parseFloat(depositAmount))
      setDepositAmount("")
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || isWithdrawing) return

    setIsWithdrawing(true)
    try {
      await withdraw(Number.parseFloat(withdrawAmount))
      setWithdrawAmount("")
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (isLoading) {
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
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Personal Wallet</h1>
            <p className="text-muted-foreground">Manage your ICP savings</p>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Current Balance
            </CardTitle>
            <CardDescription>Your available ICP balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{formatICP(balance)} ICP</div>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Deposit ICP</CardTitle>
                <CardDescription>Add ICP to your savings wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (ICP)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleDeposit} disabled={!depositAmount || isDepositing} className="w-full">
                  {isDepositing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      Deposit ICP
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Withdraw ICP</CardTitle>
                <CardDescription>Transfer ICP from your savings to your wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (ICP)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">Available: {formatICP(balance)} ICP</div>
                <Button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount || isWithdrawing || Number.parseFloat(withdrawAmount) > Number(formatICP(balance))
                  }
                  className="w-full"
                >
                  {isWithdrawing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Withdraw ICP
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TransactionHistory transactions={transactions} />
      </div>
    </DashboardLayout>
  )
}
