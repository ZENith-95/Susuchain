import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatICP } from "@/lib/utils"
import { Wallet } from "lucide-react"

interface BalanceCardProps {
  balance: bigint
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">Total Balance</CardTitle>
        <Wallet className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{formatICP(balance)} ICP</div>
        <p className="text-xs text-white/60 mt-1">Your total savings balance</p>
      </CardContent>
    </Card>
  )
}
