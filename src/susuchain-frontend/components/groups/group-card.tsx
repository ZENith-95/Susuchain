"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatICP, formatDate } from "@/lib/utils"
import { useGroupStore } from "@/stores/group-store"
import { useAuthStore } from "@/stores/auth-store"
import { useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Users, Calendar, Coins, Crown, Clock } from "lucide-react"
import Link from "next/link"

interface Group {
  id: string
  name: string
  description: string
  admin: string
  members: any[]
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

interface GroupCardProps {
  group: Group
  isUserGroup: boolean
}

export function GroupCard({ group, isUserGroup }: GroupCardProps) {
  const { principal } = useAuthStore()
  const { joinGroup } = useGroupStore()
  const { toast } = useToast()
  const [isJoining, setIsJoining] = useState(false)

  const isUserAdmin = group.admin === principal
  const isUserMember = group.members.some((member) => member.userId === principal)
  const canJoin = !isUserMember && group.members.length < group.maxMembers && group.isActive
  const membershipProgress = (group.members.length / group.maxMembers) * 100

  const handleJoinGroup = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isJoining) return

    setIsJoining(true)
    try {
      const success = await joinGroup(group.id)
      if (success) {
        toast({
          title: "Joined Group",
          description: `You have successfully joined ${group.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Failed to Join",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Daily"
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"
      default:
        return frequency
    }
  }

  const getStatusColor = () => {
    if (!group.isActive) return "secondary"
    if (group.members.length === group.maxMembers) return "default"
    return "outline"
  }

  const getStatusText = () => {
    if (!group.isActive) return "Inactive"
    if (group.members.length === group.maxMembers) return "Full"
    return "Open"
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="glass hover:bg-white/15 transition-all duration-200 cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-white text-lg truncate">{group.name}</CardTitle>
              <CardDescription className="text-white/70 text-sm line-clamp-2">{group.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isUserAdmin && (
                <Badge variant="default" className="bg-yellow-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Group Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Coins className="h-3 w-3" />
                <span>Contribution</span>
              </div>
              <div className="text-white font-semibold text-sm">{formatICP(BigInt(group.contributionAmount))} ICP</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Clock className="h-3 w-3" />
                <span>Frequency</span>
              </div>
              <div className="text-white font-semibold text-sm">{getFrequencyLabel(group.frequency)}</div>
            </div>
          </div>

          {/* Members Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Users className="h-3 w-3" />
                <span>Members</span>
              </div>
              <span className="text-white text-xs font-medium">
                {group.members.length}/{group.maxMembers}
              </span>
            </div>
            <Progress value={membershipProgress} className="h-2" />
          </div>

          {/* Next Payout */}
          {group.isActive && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Calendar className="h-3 w-3" />
                <span>Next Payout</span>
              </div>
              <div className="text-white text-xs">{formatDate(group.nextPayoutDate)}</div>
            </div>
          )}

          {/* Cycle Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Cycle Progress</span>
              <span className="text-white font-medium">
                {group.currentCycle}/{group.totalCycles}
              </span>
            </div>
            <Progress value={(group.currentCycle / group.totalCycles) * 100} className="h-1.5" />
          </div>

          {/* Action Button */}
          {!isUserGroup && canJoin && (
            <Button onClick={handleJoinGroup} disabled={isJoining} className="w-full mt-4" size="sm">
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

          {isUserGroup && <div className="text-center text-xs text-white/60 mt-4">Click to view details</div>}
        </CardContent>
      </Card>
    </Link>
  )
}
