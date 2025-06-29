"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatICP, formatDate } from "@/lib/utils"
import { History, Search, ArrowUpRight, ArrowDownLeft, Users, Gift, ExternalLink } from "lucide-react"

interface Transaction {
  id: string
  transactionType: "deposit" | "withdraw" | "groupContribution" | "groupPayout"
  amount: bigint
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: number
  reference?: string
  groupId?: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

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
      case "cancelled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getAmountDisplay = (transaction: Transaction) => {
    const isNegative = transaction.transactionType === "withdraw" || transaction.transactionType === "groupContribution"
    const prefix = isNegative ? "-" : "+"
    const color = isNegative ? "text-red-400" : "text-green-400"

    return (
      <span className={`font-medium ${color}`}>
        {prefix}
        {formatICP(transaction.amount)} ICP
      </span>
    )
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTransactionLabel(transaction.transactionType).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || transaction.transactionType === filterType
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const sortedTransactions = filteredTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription className="text-white/70">View and filter your transaction history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdraw">Withdrawals</SelectItem>
              <SelectItem value="groupContribution">Group Contributions</SelectItem>
              <SelectItem value="groupPayout">Group Payouts</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <div className="text-white/60 mb-2">
                {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
              </div>
              <div className="text-sm text-white/40">
                {transactions.length === 0
                  ? "Start saving to see your transaction history"
                  : "Try adjusting your search or filter criteria"}
              </div>
            </div>
          ) : (
            sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getTransactionIcon(transaction.transactionType)}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {getTransactionLabel(transaction.transactionType)}
                      </span>
                      <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>{formatDate(transaction.timestamp)}</span>
                      <span>ID: {transaction.id}</span>
                      {transaction.reference && <span>Ref: {transaction.reference}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm mb-1">{getAmountDisplay(transaction)}</div>

                  {transaction.groupId && (
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Group
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed) */}
        {sortedTransactions.length > 0 && sortedTransactions.length < transactions.length && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              Load More Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
