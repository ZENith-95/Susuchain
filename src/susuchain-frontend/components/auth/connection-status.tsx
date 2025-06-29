"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [canisterStatus, setCanisterStatus] = useState<"checking" | "connected" | "error">("checking")

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check canister connectivity
    const checkCanisterStatus = async () => {
      try {
        const canisterId = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID
        if (!canisterId) {
          setCanisterStatus("error")
          return
        }

        // Simple connectivity check
        const response = await fetch(`https://ic0.app/api/v2/canister/${canisterId}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/cbor" },
          body: new ArrayBuffer(0),
        })

        setCanisterStatus(response.ok ? "connected" : "error")
      } catch {
        setCanisterStatus("error")
      }
    }

    checkCanisterStatus()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOnline || canisterStatus === "error") {
    return (
      <Card className="glass border-red-500/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-400">No internet connection</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">Cannot connect to SusuChain network</span>
              </>
            )}
            <Badge variant="destructive" className="ml-auto">
              Offline
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (canisterStatus === "connected") {
    return (
      <Card className="glass border-green-500/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">Connected to SusuChain network</span>
            <Badge variant="default" className="ml-auto bg-green-600">
              Online
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
