import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Calendar } from "lucide-react"

interface Transaction {
  id: string
  transactionType: "deposit" | "withdraw" | "groupContribution" | "groupPayout"
  amount: bigint
  timestamp: bigint
}

interface SavingsSummaryProps {
  transactions: Transaction[]
}

export function SavingsSummary({ transactions }: SavingsSummaryProps) {
  const deposits = transactions.filter((tx) => tx.transactionType === "deposit")
  const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, BigInt(0))
  const savingsDays =
    deposits.length > 0
      ? Math.floor((Date.now() - Number(deposits[deposits.length - 1].timestamp) / 1000000) / (1000 * 60 * 60 * 24))
      : 0

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">Savings Progress</CardTitle>
        <Target className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Monthly Goal</span>
            <span className="text-white">100 ICP</span>
          </div>
          <Progress value={Math.min(Number(totalDeposits) / 10000000000, 100)} className="h-2" />
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Calendar className="h-3 w-3" />
          <span>{savingsDays} days saving</span>
        </div>
      </CardContent>
    </Card>
  )
}
