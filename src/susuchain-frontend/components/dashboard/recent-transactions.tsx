import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatICP, formatDate } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, Users, Gift } from "lucide-react"

interface Transaction {
  id: string
  transactionType: "deposit" | "withdraw" | "groupContribution" | "groupPayout"
  amount: bigint
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: bigint
  groupId?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "groupContribution":
        return <Users className="h-4 w-4 text-blue-500" />
      case "groupPayout":
        return <Gift className="h-4 w-4 text-purple-500" />
      default:
        return <ArrowDownLeft className="h-4 w-4" />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdraw":
        return "Withdrawal"
      case "groupContribution":
        return "Group Contribution"
      case "groupPayout":
        return "Group Payout"
      default:
        return "Transaction"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-white">Recent Transactions</CardTitle>
        <CardDescription className="text-white/70">Your latest financial activities</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/60 mb-2">No transactions yet</div>
            <div className="text-sm text-white/40">Start saving to see your transaction history</div>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transactionType)}
                  <div>
                    <div className="font-medium text-white text-sm">
                      {getTransactionLabel(transaction.transactionType)}
                    </div>
                    <div className="text-xs text-white/60">{formatDate(transaction.timestamp)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white text-sm">
                    {transaction.transactionType === "withdraw" ? "-" : "+"}
                    {formatICP(transaction.amount)} ICP
                  </div>
                  <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
