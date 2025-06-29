"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, Users, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors",
                  isActive ? "bg-primary/20 text-primary" : "text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
