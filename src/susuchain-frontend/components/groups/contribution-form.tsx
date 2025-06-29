"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useGroupStore } from "@/stores/group-store"
import { useToast } from "@/hooks/use-toast"
import { formatICP } from "@/lib/utils"
import { Coins, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Member {
  userId: string
  contributionStatus: "pending" | "paid" | "overdue"
}

interface Group {
  id: string
  name: string
  contributionAmount: number
  frequency: "daily" | "weekly" | "monthly"
  currentCycle: number
}

interface ContributionFormProps {
  group: Group
  userMember: Member
}

export function ContributionForm({ group, userMember }: ContributionFormProps) {
  const { contribute } = useGroupStore()
  const { toast } = useToast()
  const [isContributing, setIsContributing] = useState(false)

  const contributionAmountICP = Number(formatICP(BigInt(group.contributionAmount)))
  const hasContributed = userMember.contributionStatus === "paid"
  const isOverdue = userMember.contributionStatus === "overdue"

  const handleContribute = async () => {
    if (isContributing || hasContributed) return

    setIsContributing(true)
    try {
      const success = await contribute(group.id, contributionAmountICP)
      if (success) {
        toast({
          title: "Contribution Successful",
          description: `You have contributed ${formatICP(BigInt(group.contributionAmount))} ICP to ${group.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Contribution Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsContributing(false)
    }
  }

  const getStatusIcon = () => {
    switch (userMember.contributionStatus) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (userMember.contributionStatus) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = () => {
    switch (userMember.contributionStatus) {
      case "paid":
        return "Contribution Paid"
      case "pending":
        return "Contribution Pending"
      case "overdue":
        return "Contribution Overdue"
      default:
        return "Unknown Status"
    }
  }

  const getFrequencyText = () => {
    switch (group.frequency) {
      case "daily":
        return "daily"
      case "weekly":
        return "weekly"
      case "monthly":
        return "monthly"
      default:
        return group.frequency
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Coins className="h-5 w-5" />
          Make Contribution
        </CardTitle>
        <CardDescription className="text-white/70">
          Cycle {group.currentCycle} • {getFrequencyText()} contribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-white font-medium">{getStatusText()}</div>
              <div className="text-white/60 text-sm">Current cycle status</div>
            </div>
          </div>
          <Badge variant={getStatusColor()}>{userMember.contributionStatus}</Badge>
        </div>

        {/* Contribution Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Required Amount:</span>
            <span className="text-white font-semibold text-lg">{formatICP(BigInt(group.contributionAmount))} ICP</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/70">Frequency:</span>
            <span className="text-white capitalize">{getFrequencyText()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/70">Current Cycle:</span>
            <span className="text-white">#{group.currentCycle}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {hasContributed ? (
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-green-400 font-medium">Contribution Complete</div>
              <div className="text-green-400/70 text-sm">You have successfully contributed for this cycle</div>
            </div>
          ) : (
            <>
              <Button
                onClick={handleContribute}
                disabled={isContributing}
                className="w-full"
                variant={isOverdue ? "destructive" : "default"}
              >
                {isContributing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing Contribution...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Contribute {formatICP(BigInt(group.contributionAmount))} ICP
                  </>
                )}
              </Button>

              {isOverdue && (
                <div className="text-center text-red-400 text-sm">
                  ⚠️ Your contribution is overdue. Please contribute as soon as possible.
                </div>
              )}
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-white/50 text-center">
          Contributions are processed using ICP tokens via your connected wallet
        </div>
      </CardContent>
    </Card>
  )
}
