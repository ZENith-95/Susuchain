"use client"

import { create } from "zustand"
import { useAuthStore } from "./auth-store"
import { IDL } from "@dfinity/candid"
import { createActor, createIdlFactory } from "@/lib/createActor"

interface Transaction {
  id: string
  transactionType: "deposit" | "withdraw" | "groupContribution" | "groupPayout"
  amount: bigint
  status: "pending" | "completed" | "failed" | "cancelled"
  timestamp: number
  reference?: string
  groupId?: string
}

interface WalletState {
  balance: bigint
  transactions: Transaction[]
  isLoading: boolean
  fetchWalletData: () => Promise<void>
  deposit: (amount: number) => Promise<void>
  withdraw: (amount: number) => Promise<void>
}

const SUSUCHAIN_CANISTER_ID = process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || "rdmx6-jaaaa-aaaah-qdrva-cai"

// Create IDL factories for wallet operations
const userDataIdlFactory = createIdlFactory((IDL) => ({
  getUser: IDL.Func(
    [],
    [IDL.Variant({ ok: IDL.Record({ balance: IDL.Nat }), err: IDL.Text })],
    ["query"],
  ),
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
}))

const depositIdlFactory = createIdlFactory((IDL) => ({
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
}))

const withdrawIdlFactory = createIdlFactory((IDL) => ({
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
}))

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: BigInt(0),
  transactions: [],
  isLoading: false,

  fetchWalletData: async () => {
    set({ isLoading: true })

    try {
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: userDataIdlFactory,
        identity,
      })

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
          timestamp: Number(tx.timestamp) / 1000000, // Convert nanoseconds to milliseconds
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
      const amountE8s = BigInt(Math.floor(amount * 100000000))

      if (walletType === "plug" && window.ic?.plug) {
        const transferResult = await window.ic.plug.requestTransfer({
          to: SUSUCHAIN_CANISTER_ID,
          amount: Number(amountE8s),
        })

        if (transferResult.height) {
          const actor = await createActor<any>({
            canisterId: SUSUCHAIN_CANISTER_ID,
            idlFactory: depositIdlFactory,
          })

          const result = await actor.deposit({
            amount: amountE8s,
            paymentMethod: { crypto: null },
            reference: [transferResult.height.toString()],
          })

          if ("err" in result) {
            throw new Error(result.err)
          }

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
      const { identity } = useAuthStore.getState()
      if (!identity) throw new Error("Not authenticated")

      const amountE8s = BigInt(Math.floor(amount * 100000000))

      const actor = await createActor<any>({
        canisterId: SUSUCHAIN_CANISTER_ID,
        idlFactory: withdrawIdlFactory,
        identity,
      })

      const result = await actor.withdraw({
        amount: amountE8s,
        paymentMethod: { crypto: null },
      })

      if ("err" in result) {
        throw new Error(result.err)
      }

      await get().fetchWalletData()
    } catch (error) {
      console.error("Withdraw failed:", error)
      throw error
    }
  },
}))
