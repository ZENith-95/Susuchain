"use client"

import { create } from "zustand"
import { useAuthStore } from "./auth-store"
import { Actor } from "@dfinity/agent"

interface Transaction {
  id: string
  transactionType: "deposit" | "withdraw" | "groupContribution" | "groupPayout"
  amount: bigint
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: bigint
  reference?: string
  groupId?: string
}

interface WalletState {
  balance: bigint
  transactions: Transaction[]
  isLoading: boolean
  deposit: (amount: number) => Promise<void>
  withdraw: (amount: number) => Promise<void>
  fetchWalletData: () => Promise<void>
}

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "rdmx6-jaaaa-aaaah-qdrva-cai"

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: BigInt(0),
  transactions: [],
  isLoading: false,

  fetchWalletData: async () => {
    set({ isLoading: true })

    try {
      const { principal, walletType, agent } = useAuthStore.getState()
      if (!principal) throw new Error("Not authenticated")

      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              getUser: IDL.Func([], [IDL.Variant({ ok: IDL.Record({ balance: IDL.Nat }), err: IDL.Text })], ["query"]),
              getUserTransactions: IDL.Func(
                [],
                [
                  IDL.Variant({
                    ok: IDL.Vec(
                      IDL.Record({
                        id: IDL.Text,
                        transactionType: IDL.Variant({
                          deposit: IDL.Null,
                          withdraw: IDL.Null,
                          groupContribution: IDL.Null,
                          groupPayout: IDL.Null,
                        }),
                        amount: IDL.Nat,
                        status: IDL.Variant({
                          pending: IDL.Null,
                          completed: IDL.Null,
                          failed: IDL.Null,
                          cancelled: IDL.Null,
                        }),
                        timestamp: IDL.Int,
                        reference: IDL.Opt(IDL.Text),
                        groupId: IDL.Opt(IDL.Text),
                      }),
                    ),
                    err: IDL.Text,
                  }),
                ],
                ["query"],
              ),
            })
          },
        })
      } else if (walletType === "ii" && agent) {
        actor = Actor.createActor(
          ({ IDL }) =>
            IDL.Service({
              getUser: IDL.Func([], [IDL.Variant({ ok: IDL.Record({ balance: IDL.Nat }), err: IDL.Text })], ["query"]),
              getUserTransactions: IDL.Func(
                [],
                [
                  IDL.Variant({
                    ok: IDL.Vec(
                      IDL.Record({
                        id: IDL.Text,
                        transactionType: IDL.Variant({
                          deposit: IDL.Null,
                          withdraw: IDL.Null,
                          groupContribution: IDL.Null,
                          groupPayout: IDL.Null,
                        }),
                        amount: IDL.Nat,
                        status: IDL.Variant({
                          pending: IDL.Null,
                          completed: IDL.Null,
                          failed: IDL.Null,
                          cancelled: IDL.Null,
                        }),
                        timestamp: IDL.Int,
                        reference: IDL.Opt(IDL.Text),
                        groupId: IDL.Opt(IDL.Text),
                      }),
                    ),
                    err: IDL.Text,
                  }),
                ],
                ["query"],
              ),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

      const [userResult, transactionsResult] = await Promise.all([actor.getUser(), actor.getUserTransactions()])

      if ("ok" in userResult) {
        set({ balance: userResult.ok.balance })
      }

      if ("ok" in transactionsResult) {
        const transactions = transactionsResult.ok.map((tx: any) => ({
          id: tx.id,
          transactionType: Object.keys(tx.transactionType)[0] as any,
          amount: tx.amount,
          status: Object.keys(tx.status)[0] as any,
          timestamp: tx.timestamp,
          reference: tx.reference[0] || undefined,
          groupId: tx.groupId[0] || undefined,
        }))
        set({ transactions })
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  deposit: async (amount: number) => {
    try {
      const { walletType } = useAuthStore.getState()
      const amountE8s = BigInt(Math.floor(amount * 100000000)) // Convert to e8s

      if (walletType === "plug" && window.ic?.plug) {
        // Request ICP transfer via Plug
        const transferResult = await window.ic.plug.requestTransfer({
          to: SUSUCHAIN_CANISTER_ID,
          amount: Number(amountE8s),
        })

        if (transferResult.height) {
          // Call deposit on backend
          const actor = await window.ic.plug.createActor({
            canisterId: SUSUCHAIN_CANISTER_ID,
            interfaceFactory: ({ IDL }) => {
              return IDL.Service({
                deposit: IDL.Func(
                  [
                    IDL.Record({
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

          const result = await actor.deposit({
            amount: amountE8s,
            paymentMethod: { crypto: null },
            reference: [transferResult.height.toString()],
          })

          if ("err" in result) {
            throw new Error(result.err)
          }

          // Refresh wallet data
          await get().fetchWalletData()
        }
      }
    } catch (error) {
      console.error("Deposit failed:", error)
      throw error
    }
  },

  withdraw: async (amount: number) => {
    try {
      const { walletType, agent } = useAuthStore.getState()
      const amountE8s = BigInt(Math.floor(amount * 100000000))

      let actor: any

      if (walletType === "plug" && window.ic?.plug) {
        actor = await window.ic.plug.createActor({
          canisterId: SUSUCHAIN_CANISTER_ID,
          interfaceFactory: ({ IDL }) => {
            return IDL.Service({
              withdraw: IDL.Func(
                [
                  IDL.Record({
                    amount: IDL.Nat,
                    paymentMethod: IDL.Variant({ crypto: IDL.Null }),
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
              withdraw: IDL.Func(
                [
                  IDL.Record({
                    amount: IDL.Nat,
                    paymentMethod: IDL.Variant({ crypto: IDL.Null }),
                  }),
                ],
                [IDL.Variant({ ok: IDL.Record({}), err: IDL.Text })],
                [],
              ),
            }),
          { agent, canisterId: SUSUCHAIN_CANISTER_ID },
        )
      }

      const result = await actor.withdraw({
        amount: amountE8s,
        paymentMethod: { crypto: null },
      })

      if ("err" in result) {
        throw new Error(result.err)
      }

      // Refresh wallet data
      await get().fetchWalletData()
    } catch (error) {
      console.error("Withdraw failed:", error)
      throw error
    }
  },
}))
