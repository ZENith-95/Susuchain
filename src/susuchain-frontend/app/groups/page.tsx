"use client"

import { useEffect } from "react"
import { useGroupStore } from "@/stores/group-store"
import { useAuthStore } from "@/stores/auth-store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GroupCard } from "@/components/groups/group-card"
import { Users, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function GroupsPage() {
  const { principal } = useAuthStore()
  const { groups, availableGroups, fetchUserGroups, fetchAvailableGroups, isLoading } = useGroupStore()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (principal) {
      fetchUserGroups()
      fetchAvailableGroups()
    }
  }, [principal, fetchUserGroups, fetchAvailableGroups])

  const filteredAvailableGroups = availableGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Susu Groups</h1>
              <p className="text-muted-foreground">Join or create rotational savings groups</p>
            </div>
          </div>
          <Link href="/groups/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </Link>
        </div>

        {/* My Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Groups</h2>
            <Badge variant="secondary">{groups.length} groups</Badge>
          </div>

          {groups.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Join your first susu group or create one to start saving together
                </p>
                <Link href="/groups/create">
                  <Button>Create Your First Group</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} isUserGroup={true} />
              ))}
            </div>
          )}
        </div>

        {/* Available Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Available Groups</h2>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {filteredAvailableGroups.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "Try adjusting your search terms" : "No groups available to join at the moment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableGroups.map((group) => (
                <GroupCard key={group.id} group={group} isUserGroup={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
