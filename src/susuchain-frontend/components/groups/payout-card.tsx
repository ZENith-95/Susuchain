"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useGroupStore } from "@/stores/group-store"
import { useToast } from "@/hooks/use-toast"
import { formatICP, formatDate } from "@/lib/utils"
import { Gift, Calendar, CheckCircle, Clock } from "lucide-react"

interface Member {
  userId: string
  payoutOrder: number
  hasReceivedPayout: boolean
  payoutDate?: bigint
}

interface Group {
  id: string
  name: string
  members: Member[]
  contributionAmount: number
  currentCycle: number
  nextPayoutDate: bigint
}

interface PayoutCardProps {
  group: Group
  userMember: Member
}

export function PayoutCard({ group, userMember }: PayoutCardProps) {
  const { withdrawPayout } = useGroupStore()
  const { toast } = useToast()
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const isUserTurn = userMember.payoutOrder === group.currentCycle
  const hasReceivedPayout = userMember.hasReceivedPayout
  const payoutAmount = group.contributionAmount * group.members.length
  const canWithdraw = isUserTurn && !hasReceivedPayout

  const handleWithdrawPayout = async () => {
    if (isWithdrawing || !canWithdraw) return

    setIsWithdrawing(true)
    try {
      const success = await withdrawPayout(group.id)
      if (success) {
        toast({
          title: "Payout Successful",
          description: `You have received ${formatICP(BigInt(payoutAmount))} ICP from ${group.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Payout Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getNextPayoutMember = () => {
    return group.members.find((member) => member.payoutOrder === group.currentCycle)
  }

  const nextPayoutMember = getNextPayoutMember()

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Gift className="h-5 w-5" />
          Payout Information
        </CardTitle>
        <CardDescription className="text-white/70">Cycle {group.currentCycle} payout details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payout Amount */}
        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-white/60 text-sm mb-1">Total Payout Amount</div>
          <div className="text-white font-bold text-2xl">{formatICP(BigInt(payoutAmount))} ICP</div>
          <div className="text-white/50 text-xs mt-1">
            {group.members.length} members × {formatICP(BigInt(group.contributionAmount))} ICP
          </div>
        </div>

        {/* User's Payout Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Your Payout Order:</span>
            <Badge variant="outline">#{userMember.payoutOrder}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/70">Current Cycle:</span>
            <Badge variant="default">#{group.currentCycle}</Badge>
          </div>

          {userMember.hasReceivedPayout && userMember.payoutDate && (
            <div className="flex items-center justify-between">
              <span className="text-white/70">Payout Received:</span>
              <span className="text-white text-sm">{formatDate(userMember.payoutDate)}</span>
            </div>
          )}
        </div>

        {/* Current Status */}
        {isUserTurn ? (
          <div className="space-y-4">
            {hasReceivedPayout ? (
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-green-400 font-medium">Payout Received</div>
                <div className="text-green-400/70 text-sm">You have already received your payout for this cycle</div>
              </div>
            ) : (
              <>
                <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-primary font-medium">It's Your Turn!</div>
                  <div className="text-primary/70 text-sm">You can now withdraw your payout</div>
                </div>

                <Button onClick={handleWithdrawPayout} disabled={isWithdrawing} className="w-full" size="lg">
                  {isWithdrawing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Withdraw {formatICP(BigInt(payoutAmount))} ICP
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <Clock className="h-8 w-8 text-white/40 mx-auto mb-2" />
              <div className="text-white/60 font-medium">Waiting for Your Turn</div>
              <div className="text-white/40 text-sm">
                {group.currentCycle < userMember.payoutOrder
                  ? `${userMember.payoutOrder - group.currentCycle} cycles remaining`
                  : "Your turn has passed"}
              </div>
            </div>

            {nextPayoutMember && (
              <div className="space-y-2">
                <div className="text-white/60 text-sm">Current Turn:</div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-white text-sm">Member #{nextPayoutMember.payoutOrder}</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Payout Date */}
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Calendar className="h-4 w-4" />
          <span>Next cycle: {formatDate(group.nextPayoutDate)}</span>
        </div>

        {/* Help Text */}
        <div className="text-xs text-white/50 text-center">
          Payouts are distributed in order based on when members joined the group
        </div>
      </CardContent>
    </Card>
  )
}
