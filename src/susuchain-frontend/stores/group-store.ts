"use client"

import { create } from "zustand"
import { useAuthStore } from "./auth-store"
import { Actor } from "@dfinity/agent"

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

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "rdmx6-jaaaa-aaaah-qdrva-cai"

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  availableGroups: [],
  currentGroup: null,
  isLoading: false,

  createGroup: async (request: CreateGroupRequest) => {
    try {
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
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
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
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
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

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
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              joinGroup: IDL.Func(
                [
                  IDL.Record({
                    groupCode: IDL.Text,
                  }),
                ],
                [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
                [],
              ),
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              joinGroup: IDL.Func(
                [
                  IDL.Record({
                    groupCode: IDL.Text,
                  }),
                ],
                [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
                [],
              ),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

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
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              getUserGroups: IDL.Func([], [IDL.Variant({ ok: IDL.Vec(IDL.Record({})), err: IDL.Text })], ["query"]),
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              getUserGroups: IDL.Func([], [IDL.Variant({ ok: IDL.Vec(IDL.Record({})), err: IDL.Text })], ["query"]),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

      const result = await actor.getUserGroups()

      if ("ok" in result) {
        // Transform the result to match our Group interface
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
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              // This would need to be implemented in the backend
              getAvailableGroups: IDL.Func(
                [],
                [IDL.Variant({ ok: IDL.Vec(IDL.Record({})), err: IDL.Text })],
                ["query"],
              ),
            })
          },
        })
      }

      // For now, return empty array as this endpoint needs to be implemented
      set({ availableGroups: [] })
    } catch (error) {
      console.error("Failed to fetch available groups:", error)
    }
  },

  fetchGroup: async (groupId: string) => {
    try {
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              getGroup: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })], ["query"]),
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              getGroup: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })], ["query"]),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

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
        // First transfer ICP
        const transferResult = await window.ic.plug.requestTransfer({
          to: SUSUCHAIN_CANISTER_ID,
          amount: Number(amountE8s),
        })

        if (transferResult.height) {
          // Then call contribute
          const actor = await window.ic.plug.createActor({
            canisterId: SUSUCHAIN_CANISTER_ID,
            interfaceFactory: ({ IDL }) => {
              return IDL.Service({
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
              })
            },
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
      const { walletType, agent } = useAuthStore.getState()
      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              withdrawPayout: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })], []),
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              withdrawPayout: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })], []),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

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
