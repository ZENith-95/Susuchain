"use client"

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Shield, Coins } from "lucide-react"
import { ConnectionStatus } from "./connection-status"

export function LoginPage() {
  const { loginII, loginPlug, isLoading } = useAuthStore()
  const { toast } = useToast()
  const [loginType, setLoginType] = useState<"ii" | "plug" | null>(null)

  const handleLogin = async (type: "ii" | "plug") => {
    setLoginType(type)
    try {
      if (type === "ii") {
        await loginII()
      } else {
        await loginPlug()
      }
      toast({
        title: "Login Successful",
        description: "Welcome to SusuChain!",
      })
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "Please try again"

      if (error instanceof Error) {
        if (error.message.includes("not installed")) {
          errorMessage = "Please install the required wallet extension"
        } else if (error.message.includes("canister ID")) {
          errorMessage = "Configuration error. Please contact support."
        } else if (error.message.includes("checksum")) {
          errorMessage = "Invalid network configuration. Please try again."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoginType(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10 backdrop-blur-sm">
              <Coins className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">SusuChain</h1>
            <p className="text-xl text-white/80">Web3 Savings on ICP</p>
            <p className="text-white/60">Secure personal and group savings using ICP tokens</p>
          </div>
        </div>

        <ConnectionStatus />

        {/* Login Options */}
        <Card className="glass border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-white/70">Choose your preferred authentication method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleLogin("plug")}
              disabled={isLoading}
              className="w-full h-12 text-base"
              variant="default"
            >
              {isLoading && loginType === "plug" ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect with Plug Wallet
                </>
              )}
            </Button>

            <Button
              onClick={() => handleLogin("ii")}
              disabled={isLoading}
              className="w-full h-12 text-base"
              variant="outline"
            >
              {isLoading && loginType === "ii" ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Internet Identity
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Personal Savings</h3>
                  <p className="text-sm text-white/70">Secure ICP token savings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Group Savings</h3>
                  <p className="text-sm text-white/70">Rotational susu groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
