"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate, truncatePrincipal } from "@/lib/utils"
import { Users, Crown, Clock, CheckCircle, AlertCircle, Gift } from "lucide-react"

interface Member {
  userId: string
  joinedAt: bigint
  payoutOrder: number
  hasReceivedPayout: boolean
  payoutDate?: bigint
  contributionStatus: "pending" | "paid" | "overdue"
  paymentMethod: any
}

interface Group {
  id: string
  name: string
  admin: string
  members: Member[]
  currentCycle: number
}

interface GroupMembersListProps {
  group: Group
}

export function GroupMembersList({ group }: GroupMembersListProps) {
  const getInitials = (userId: string) => {
    return userId.slice(0, 2).toUpperCase()
  }

  const getContributionStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getContributionStatusColor = (status: string) => {
    switch (status) {
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

  const getContributionStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid"
      case "pending":
        return "Pending"
      case "overdue":
        return "Overdue"
      default:
        return "Unknown"
    }
  }

  const sortedMembers = [...group.members].sort((a, b) => a.payoutOrder - b.payoutOrder)

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5" />
          Group Members
        </CardTitle>
        <CardDescription className="text-white/70">
          {group.members.length} members • Cycle {group.currentCycle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMembers.map((member) => {
            const isAdmin = member.userId === group.admin
            const isCurrentPayout = member.payoutOrder === group.currentCycle

            return (
              <div
                key={member.userId}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isCurrentPayout ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary">{getInitials(member.userId)}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{truncatePrincipal(member.userId)}</span>
                      {isAdmin && (
                        <Badge variant="default" className="bg-yellow-600 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {isCurrentPayout && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          <Gift className="h-3 w-3 mr-1" />
                          Current Turn
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>Joined: {formatDate(member.joinedAt)}</span>
                      <span>Payout Order: #{member.payoutOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Contribution Status */}
                  <div className="flex items-center gap-2">
                    {getContributionStatusIcon(member.contributionStatus)}
                    <Badge variant={getContributionStatusColor(member.contributionStatus)} className="text-xs">
                      {getContributionStatusText(member.contributionStatus)}
                    </Badge>
                  </div>

                  {/* Payout Status */}
                  {member.hasReceivedPayout && (
                    <Badge variant="default" className="bg-purple-600 text-xs">
                      <Gift className="h-3 w-3 mr-1" />
                      Paid Out
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {group.members.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <div className="text-white/60 mb-2">No members yet</div>
            <div className="text-sm text-white/40">Be the first to join this group</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
