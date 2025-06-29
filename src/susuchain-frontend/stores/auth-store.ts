"use client"

import { create } from "zustand"
import { AuthClient } from "@dfinity/auth-client"
import { Actor, HttpAgent } from "@dfinity/agent"

interface AuthState {
  principal: string | null
  walletType: "plug" | "ii" | null
  isLoading: boolean
  authClient: AuthClient | null
  agent: HttpAgent | null
  loginII: () => Promise<void>
  loginPlug: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "rrkah-fqaaa-aaaah-qcwwa-cai"
const INTERNET_IDENTITY_CANISTER_ID =
  process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID || "rdmx6-jaaaa-aaaah-qdrva-cai"

// Add validation function
const validateCanisterId = (canisterId: string): boolean => {
  try {
    // Basic validation - should be in format xxxxx-xxxxx-xxxxx-xxxxx-xxx
    const principalRegex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/
    return principalRegex.test(canisterId)
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  principal: null,
  walletType: null,
  isLoading: false,
  authClient: null,
  agent: null,

  checkAuth: async () => {
    set({ isLoading: true })

    try {
      // Check for existing Plug connection
      if (typeof window !== "undefined" && window.ic?.plug) {
        const isConnected = await window.ic.plug.isConnected()
        if (isConnected) {
          const principal = await window.ic.plug.agent.getPrincipal()
          set({
            principal: principal.toString(),
            walletType: "plug",
            isLoading: false,
          })
          return
        }
      }

      // Check for Internet Identity
      const authClient = await AuthClient.create()
      const isAuthenticated = await authClient.isAuthenticated()

      if (isAuthenticated) {
        const identity = authClient.getIdentity()
        const principal = identity.getPrincipal()

        if (!principal.isAnonymous()) {
          const agent = new HttpAgent({ identity })
          set({
            principal: principal.toString(),
            walletType: "ii",
            authClient,
            agent,
            isLoading: false,
          })
          return
        }
      }

      set({ isLoading: false })
    } catch (error) {
      console.error("Auth check failed:", error)
      set({ isLoading: false })
    }
  },

  loginPlug: async () => {
    set({ isLoading: true })

    try {
      if (!window.ic?.plug) {
        throw new Error("Plug wallet not installed. Please install Plug wallet extension.")
      }

      if (!validateCanisterId(SUSUCHAIN_CANISTER_ID)) {
        throw new Error("Invalid canister ID configuration. Please check your environment variables.")
      }

      const host = process.env.NODE_ENV === "development" ? "http://localhost:4943" : "https://ic0.app"

      const connected = await window.ic.plug.requestConnect({
        whitelist: [SUSUCHAIN_CANISTER_ID],
        host,
        timeout: 50000,
      })

      if (!connected) {
        throw new Error("Failed to connect to Plug wallet")
      }

      const principal = await window.ic.plug.agent.getPrincipal()

      if (!principal || principal.isAnonymous()) {
        throw new Error("Failed to get valid principal from Plug wallet")
      }

      // Register user with backend
      try {
        const actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              registerUser: IDL.Func(
                [IDL.Variant({ plug: IDL.Null, internetIdentity: IDL.Null })],
                [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
                [],
              ),
            })
          },
        })

        const registerResult = await actor.registerUser({ plug: null })

        if ("err" in registerResult) {
          console.warn("User registration warning:", registerResult.err)
          // Continue anyway - user might already be registered
        }
      } catch (registerError) {
        console.warn("User registration failed:", registerError)
        // Continue anyway - the main authentication succeeded
      }

      set({
        principal: principal.toString(),
        walletType: "plug",
        isLoading: false,
      })
    } catch (error) {
      console.error("Plug login failed:", error)
      set({ isLoading: false })
      throw error
    }
  },

  loginII: async () => {
    set({ isLoading: true })

    try {
      if (!validateCanisterId(SUSUCHAIN_CANISTER_ID)) {
        throw new Error("Invalid canister ID configuration. Please check your environment variables.")
      }

      const authClient = await AuthClient.create()

      const identityProvider =
        process.env.NODE_ENV === "development"
          ? `http://localhost:4943?canisterId=${INTERNET_IDENTITY_CANISTER_ID}`
          : "https://identity.ic0.app"

      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider,
          onSuccess: () => resolve(),
          onError: (error) => reject(new Error(`Authentication failed: ${error}`)),
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        })
      })

      const identity = authClient.getIdentity()
      const principal = identity.getPrincipal()

      if (principal.isAnonymous()) {
        throw new Error("Authentication failed - anonymous principal")
      }

      const agent = new HttpAgent({
        identity,
        host: process.env.NODE_ENV === "development" ? "http://localhost:4943" : "https://ic0.app",
      })

      // Only fetch root key in development
      if (process.env.NODE_ENV === "development") {
        await agent.fetchRootKey()
      }

      // Register user with backend
      try {
        const actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              registerUser: IDL.Func(
                [IDL.Variant({ plug: IDL.Null, internetIdentity: IDL.Null })],
                [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
                [],
              ),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )

        const registerResult = await actor.registerUser({ internetIdentity: null })

        if ("err" in registerResult) {
          console.warn("User registration warning:", registerResult.err)
          // Continue anyway - user might already be registered
        }
      } catch (registerError) {
        console.warn("User registration failed:", registerError)
        // Continue anyway - the main authentication succeeded
      }

      set({
        principal: principal.toString(),
        walletType: "ii",
        authClient,
        agent,
        isLoading: false,
      })
    } catch (error) {
      console.error("Internet Identity login failed:", error)
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    const { authClient, walletType } = get()

    try {
      if (walletType === "plug" && window.ic?.plug) {
        await window.ic.plug.disconnect()
      } else if (walletType === "ii" && authClient) {
        await authClient.logout()
      }

      set({
        principal: null,
        walletType: null,
        authClient: null,
        agent: null,
      })
    } catch (error) {
      console.error("Logout failed:", error)
    }
  },
}))

// Extend window interface for Plug wallet
declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options: any) => Promise<boolean>
        isConnected: () => Promise<boolean>
        disconnect: () => Promise<void>
        agent: any
        createActor: (options: any) => Promise<any>
        requestTransfer: (options: any) => Promise<any>
      }
    }
  }
}
