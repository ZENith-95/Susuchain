"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useGroupStore } from "@/stores/group-store"
import { useAuthStore } from "@/stores/auth-store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GroupMembersList } from "@/components/groups/group-members-list"
import { ContributionForm } from "@/components/groups/contribution-form"
import { PayoutCard } from "@/components/groups/payout-card"
import { formatICP, formatDate } from "@/lib/utils"
import { ArrowLeft, Users, Calendar, Coins, Target } from "lucide-react"
import Link from "next/link"

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
  description: string
  admin: string
  members: Member[]
  contributionAmount: number
  frequency: "daily" | "weekly" | "monthly"
  maxMembers: number
  currentCycle: number
  totalCycles: number
  startDate: bigint
  nextPayoutDate: bigint
  isActive: boolean
  createdAt: bigint
  updatedAt: bigint
}

export function GroupDetailClient() {
  const params = useParams()
  const groupId = params.id as string
  const { principal } = useAuthStore()
  const { currentGroup, fetchGroup, joinGroup, isLoading } = useGroupStore()
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId)
    }
  }, [groupId, fetchGroup])

  const handleJoinGroup = async () => {
    if (!groupId || isJoining) return

    setIsJoining(true)
    try {
      await joinGroup(groupId)
    } finally {
      setIsJoining(false)
    }
  }

  const isUserMember = currentGroup?.members?.some(member => member.userId === principal)
  const userMember = currentGroup?.members?.find(member => member.userId === principal)

  if (isLoading || !currentGroup) {
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
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </div>

        <Card className="glass">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{currentGroup?.name ?? 'Unnamed Group'}</CardTitle>
                <CardDescription className="text-base">{currentGroup?.description ?? 'No description'}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={currentGroup?.isActive ? "default" : "secondary"}>
                  {currentGroup?.isActive ? "Active" : "Inactive"}
                </Badge>
                {!isUserMember && (currentGroup?.members?.length ?? 0) < (currentGroup?.maxMembers ?? 0) && (
                  <Button onClick={handleJoinGroup} disabled={isJoining}>
                    {isJoining ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Joining...
                      </>
                    ) : (
                      "Join Group"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Members</div>
                  <div className="font-semibold">
                    {currentGroup?.members?.length ?? 0}/{currentGroup?.maxMembers ?? 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Contribution</div>
                  <div className="font-semibold">
                    {formatICP(BigInt(currentGroup?.contributionAmount ?? 0))} ICP
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Cycle</div>
                  <div className="font-semibold">
                    {currentGroup?.currentCycle ?? 0}/{currentGroup?.totalCycles ?? 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Next Payout</div>
                  <div className="font-semibold text-xs">
                    {currentGroup?.nextPayoutDate ? formatDate(currentGroup.nextPayoutDate) : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isUserMember && userMember && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContributionForm group={currentGroup} userMember={userMember} />
            <PayoutCard group={currentGroup} userMember={userMember} />
          </div>
        )}

        <GroupMembersList group={currentGroup} />
      </div>
    </DashboardLayout>
  )
}