"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGroupStore } from "@/stores/group-store"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default function CreateGroupPage() {
  const router = useRouter()
  const { createGroup, isLoading } = useGroupStore()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    maxMembers: "",
    frequency: "",
    startDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    const startDate = new Date(formData.startDate).getTime() * 1000000 // Convert to nanoseconds

    const success = await createGroup({
      name: formData.name,
      description: formData.description,
      contributionAmount: Number.parseFloat(formData.contributionAmount) * 100000000, // Convert to e8s
      maxMembers: Number.parseInt(formData.maxMembers),
      frequency: formData.frequency as "daily" | "weekly" | "monthly",
      startDate,
    })

    if (success) {
      router.push("/groups")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Create Susu Group</h1>
            <p className="text-muted-foreground">Start a new rotational savings group</p>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>Set up your susu group with contribution rules and member limits</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Friends Savings Circle"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="20"
                    placeholder="e.g., 10"
                    value={formData.maxMembers}
                    onChange={(e) => handleInputChange("maxMembers", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and rules of your group..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contributionAmount">Contribution Amount (ICP)</Label>
                  <Input
                    id="contributionAmount"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="e.g., 10.0000"
                    value={formData.contributionAmount}
                    onChange={(e) => handleInputChange("contributionAmount", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Contribution Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Group...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
