"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { NavBar } from "./nav-bar"
import { MobileNav } from "./mobile-nav"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { principal, isLoading, checkAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && !principal) {
      router.push("/login")
    }
  }, [principal, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!principal) {
    return null
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <MobileNav />
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  )
}
