"use client"

import { create } from "zustand"
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent, Identity } from "@dfinity/agent"
import { IDL } from "@dfinity/candid"
import { createActor, createIdlFactory, getAuthState } from "@/lib/createActor"

interface AuthState {
  principal: string | null
  walletType: "plug" | "ii" | null
  isLoading: boolean
  authClient: AuthClient | null
  identity: Identity | null
  loginII: () => Promise<void>
  loginPlug: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "rrkah-fqaaa-aaaah-qcwwa-cai"
const INTERNET_IDENTITY_CANISTER_ID = process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID || "rdmx6-jaaaa-aaaah-qdrva-cai"

const validateCanisterId = (canisterId: string): boolean => {
  try {
    const principalRegex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/
    return principalRegex.test(canisterId)
  } catch {
    return false
  }
}

// Create IDL factory for user registration
const registerUserIdlFactory = createIdlFactory((IDL) => ({
  registerUser: IDL.Func(
    [IDL.Variant({ plug: IDL.Null, internetIdentity: IDL.Null })],
    [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
    []
  ),
}))

export const useAuthStore = create<AuthState>((set, get) => ({
  principal: null,
  walletType: null,
  isLoading: false,
  authClient: null,
  identity: null,

  loginPlug: async () => {
    set({ isLoading: true })

    try {
      if (!validateCanisterId(SUSUCHAIN_CANISTER_ID)) {
        throw new Error("Invalid canister ID configuration")
      }

      if (!window.ic?.plug) {
        throw new Error("Plug wallet not available")
      }

      const result = await window.ic.plug.requestConnect({
        whitelist: [SUSUCHAIN_CANISTER_ID],
        host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
      })

      if (!result) {
        throw new Error("Failed to connect to Plug wallet")
      }

      const principal = await window.ic.plug.agent.getPrincipal()
      if (!principal || principal.isAnonymous()) {
        throw new Error("Failed to get valid principal from Plug wallet")
      }

      try {
        const actor = await createActor<any>({
          canisterId: SUSUCHAIN_CANISTER_ID,
          idlFactory: registerUserIdlFactory,
        })

        const registerResult = await actor.registerUser({ plug: null })
        if ("err" in registerResult) {
          console.warn("User registration warning:", registerResult.err)
        }
      } catch (registerError) {
        console.warn("User registration failed:", registerError)
      }

      set({
        principal: principal.toString(),
        walletType: "plug",
        identity: principal,
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
        throw new Error("Invalid canister ID configuration")
      }

      const authClient = await AuthClient.create()
      const identityProvider = process.env.DFX_NETWORK === "ic"
        ? "https://identity.ic0.app"
        : `http://localhost:4943?canisterId=${INTERNET_IDENTITY_CANISTER_ID}`

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

      try {
        const actor = await createActor<any>({
          canisterId: SUSUCHAIN_CANISTER_ID,
          idlFactory: registerUserIdlFactory,
          identity,
        })

        const registerResult = await actor.registerUser({ internetIdentity: null })
        if ("err" in registerResult) {
          console.warn("User registration warning:", registerResult.err)
        }
      } catch (registerError) {
        console.warn("User registration failed:", registerError)
      }

      set({
        principal: principal.toString(),
        walletType: "ii",
        authClient,
        identity,
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
    
    if (walletType === "plug" && window.ic?.plug) {
      await window.ic.plug.disconnect()
    } else if (authClient) {
      await authClient.logout()
    }

    set({
      principal: null,
      walletType: null,
      authClient: null,
      identity: null,
    })
  },

  checkAuth: async () => {
    const state = await getAuthState()
    if (state.type) {
      set({
        principal: state.identity.toString(),
        walletType: state.type,
        authClient: 'authClient' in state ? state.authClient : null,
        identity: state.identity,
      })
    }
  },
}))
