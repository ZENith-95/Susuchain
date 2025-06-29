import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Calendar, Clock, Gift, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Group {
  id: string
  name: string
  nextPayoutDate: bigint
  contributionAmount: number
  members: any[]
}

interface UpcomingActivitiesProps {
  groups: Group[]
}

export function UpcomingActivities({ groups }: UpcomingActivitiesProps) {
  // Generate upcoming activities from groups
  const activities = groups
    .flatMap((group) => {
      const activities = []

      // Add contribution due activity
      activities.push({
        id: `contrib-${group.id}`,
        type: "contribution",
        groupId: group.id,
        groupName: group.name,
        amount: group.contributionAmount,
        dueDate: group.nextPayoutDate,
        description: `Contribution due for ${group.name}`,
      })

      return activities
    })
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "contribution":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "payout":
        return <Gift className="h-4 w-4 text-green-500" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "contribution":
        return "secondary"
      case "payout":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-white">Upcoming Activities</CardTitle>
        <CardDescription className="text-white/70">Important dates and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-white/40 mx-auto mb-2" />
            <div className="text-white/60 mb-2">No upcoming activities</div>
            <div className="text-sm text-white/40">Join a group to see activities</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-white text-sm truncate">{activity.description}</div>
                    <Badge variant={getActivityColor(activity.type)} className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-white/60">Due: {formatDate(activity.dueDate)}</div>
                </div>
                <Link href={`/groups/${activity.groupId}`}>
                  <Button size="sm" variant="ghost" className="text-xs">
                    View
                  </Button>
                </Link>
              </div>
            ))}
            {activities.length > 3 && (
              <div className="text-center pt-2">
                <Link href="/groups">
                  <Button size="sm" variant="ghost" className="text-xs">
                    View All Activities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
