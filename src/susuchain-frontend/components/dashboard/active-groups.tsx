import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import Link from "next/link"

interface Group {
  id: string
  name: string
  members: any[]
  maxMembers: number
  isActive: boolean
}

interface ActiveGroupsProps {
  groups: Group[]
}

export function ActiveGroups({ groups }: ActiveGroupsProps) {
  const activeGroups = groups.filter((group) => group.isActive)

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">Active Groups</CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-2">{activeGroups.length}</div>
        {activeGroups.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-white/60">No active groups yet</p>
            <Link href="/groups">
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <Plus className="h-3 w-3 mr-1" />
                Join Group
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeGroups.slice(0, 2).map((group) => (
              <div key={group.id} className="flex items-center justify-between">
                <div className="text-xs text-white/70 truncate">{group.name}</div>
                <Badge variant="secondary" className="text-xs">
                  {group.members.length}/{group.maxMembers}
                </Badge>
              </div>
            ))}
            {activeGroups.length > 2 && (
              <Link href="/groups">
                <Button size="sm" variant="ghost" className="w-full text-xs">
                  View All ({activeGroups.length})
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
