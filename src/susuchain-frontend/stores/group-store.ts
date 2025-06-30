"use client"

import { create } from "zustand"
import { useAuthStore } from "./auth-store"
import { IDL } from "@dfinity/candid"
import { createActor, createIdlFactory } from "@/lib/createActor"

interface Member {
  userId: string
  joinedAt: bigint
  payoutOrder: number
  hasReceivedPayout: boolean
  payoutDate?: bigint
  contributionStatus: "pending" | "paid" | "overdue"
  paymentMethod: any
}

interface Group {
  id: string
  name: string
  description: string
  admin: string
  members: Member[]
  contributionAmount: number
  frequency: "daily" | "weekly" | "monthly"
  maxMembers: number
  currentCycle: number
  totalCycles: number
  startDate: bigint
  nextPayoutDate: bigint
  isActive: boolean
  createdAt: bigint
  updatedAt: bigint
}

interface CreateGroupRequest {
  name: string
  description: string
  contributionAmount: number
  maxMembers: number
  frequency: "daily" | "weekly" | "monthly"
  startDate: number
}

interface GroupState {
  groups: Group[]
  availableGroups: Group[]
  currentGroup: Group | null
  isLoading: boolean
  createGroup: (request: CreateGroupRequest) => Promise<boolean>
  joinGroup: (groupId: string) => Promise<boolean>
  fetchUserGroups: () => Promise<void>
  fetchAvailableGroups: () => Promise<void>
  fetchGroup: (groupId: string) => Promise<void>
  contribute: (groupId: string, amount: number) => Promise<boolean>
  withdrawPayout: (groupId: string) => Promise<boolean>
}

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "umunu-kh777-77774-qaaca-cai"

// Create IDL factories for group operations
const createGroupIdlFactory = createIdlFactory((IDL) => ({
  createGroup: IDL.Func(
    [
      IDL.Record({
        name: IDL.Text,
        description: IDL.Text,
        contributionAmount: IDL.Nat,
        maxMembers: IDL.Nat,
        frequency: IDL.Variant({
          daily: IDL.Null,
          weekly: IDL.Null,
          monthly: IDL.Null,
        }),
        startDate: IDL.Int,
      }),
    ],
    [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
    [],
  ),
}))

const joinGroupIdlFactory = createIdlFactory((IDL) => ({
  joinGroup: IDL.Func(
    [IDL.Record({ groupCode: IDL.Text })],
    [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
    [],
  ),
}))

const userGroupsIdlFactory = createIdlFactory((IDL) => ({
  getUserGroups: IDL.Func(
    [],
    [IDL.Variant({ ok: IDL.Vec(IDL.Record({})), err: IDL.Text })],
    ["query"],
  ),
}))

const availableGroupsIdlFactory = createIdlFactory((IDL) => ({
  getAvailableGroups: IDL.Func(
    [],
    [IDL.Variant({ ok: IDL.Vec(IDL.Record({})), err: IDL.Text })],
    ["query"],
  ),
}))

const groupIdlFactory = createIdlFactory((IDL) => ({
  getGroup: IDL.Func(
    [IDL.Text],
    [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
    ["query"],
  ),
}))

const contributeIdlFactory = createIdlFactory((IDL) => ({
  contribute: IDL.Func(
    [
      IDL.Record({
        groupId: IDL.Text,
        amount: IDL.Nat,
        paymentMethod: IDL.Variant({ crypto: IDL.Null }),
        reference: IDL.Opt(IDL.Text),
      }),
    ],
    [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
    [],
  ),
}))

const withdrawPayoutIdlFactory = createIdlFactory((IDL) => ({
  withdrawPayout: IDL.Func(
    [IDL.Text],
    [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
    [],
  ),
}))

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  availableGroups: [],
  currentGroup: null,
  isLoading: false,

  createGroup: async (request: CreateGroupRequest) => {
    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: createGroupIdlFactory,
        identity,
      })

      const result = await actor.createGroup({
        name: request.name,
        description: request.description,
        contributionAmount: BigInt(request.contributionAmount),
        maxMembers: BigInt(request.maxMembers),
        frequency: { [request.frequency]: null },
        startDate: BigInt(request.startDate),
      })

      if ("err" in result) {
        throw new Error(result.err)
      }

      await get().fetchUserGroups()
      return true
    } catch (error) {
      console.error("Create group failed:", error)
      return false
    }
  },

  joinGroup: async (groupId: string) => {
    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: joinGroupIdlFactory,
        identity,
      })

      const result = await actor.joinGroup({ groupCode: groupId })

      if ("err" in result) {
        throw new Error(result.err)
      }

      await Promise.all([get().fetchUserGroups(), get().fetchGroup(groupId)])
      return true
    } catch (error) {
      console.error("Join group failed:", error)
      return false
    }
  },

  fetchUserGroups: async () => {
    set({ isLoading: true })

    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: userGroupsIdlFactory,
        identity,
      })

      const result = await actor.getUserGroups()

      if ("ok" in result) {
        set({ groups: result.ok || [] })
      }
    } catch (error) {
      console.error("Failed to fetch user groups:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchAvailableGroups: async () => {
    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: availableGroupsIdlFactory,
        identity,
      })

      const result = await actor.getAvailableGroups()

      if ("ok" in result) {
        set({ availableGroups: result.ok || [] })
      }
    } catch (error) {
      console.error("Failed to fetch available groups:", error)
    }
  },

  fetchGroup: async (groupId: string) => {
    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: groupIdlFactory,
        identity,
      })

      const result = await actor.getGroup(groupId)

      if ("ok" in result) {
        set({ currentGroup: result.ok })
      }
    } catch (error) {
      console.error("Failed to fetch group:", error)
    }
  },

  contribute: async (groupId: string, amount: number) => {
    try {
      const { walletType } = useAuthStore.getState()
      const amountE8s = BigInt(Math.floor(amount * 100000000))

      if (walletType === "plug" && window.ic?.plug) {
        const transferResult = await window.ic.plug.requestTransfer({
          to: SUSUCHAIN_CANISTER_ID,
          amount: Number(amountE8s),
        })

        if (transferResult.height) {
          const actor = await createActor<any>({
            canisterId: SUSUCHAIN_CANISTER_ID,
            idlFactory: contributeIdlFactory,
          })

          const result = await actor.contribute({
            groupId,
            amount: amountE8s,
            paymentMethod: { crypto: null },
            reference: [transferResult.height.toString()],
          })

          if ("err" in result) {
            throw new Error(result.err)
          }

          await get().fetchGroup(groupId)
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Contribute failed:", error)
      return false
    }
  },

  withdrawPayout: async (groupId: string) => {
    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: withdrawPayoutIdlFactory,
        identity,
      })

      const result = await actor.withdrawPayout(groupId)

      if ("err" in result) {
        throw new Error(result.err)
      }

      await get().fetchGroup(groupId)
      return true
    } catch (error) {
      console.error("Withdraw payout failed:", error)
      return false
    }
  },
}))
