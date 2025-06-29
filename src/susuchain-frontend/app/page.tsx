"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { LoginPage } from "@/components/auth/login-page"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  const { principal, isLoading, checkAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (principal && !isLoading) {
      router.push("/dashboard")
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
    return <LoginPage />
  }

  return null
}
