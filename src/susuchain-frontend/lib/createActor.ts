import { Actor, HttpAgent, Identity } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

// Environment variables are injected by dfx/next.js config
const DFX_NETWORK = process.env.DFX_NETWORK || 'local';
const HOST = process.env.NEXT_PUBLIC_DFX_FRONTEND_HOST || 'http://localhost:4943';

export interface CreateActorOptions {
  canisterId: string;
  idlFactory: IDL.InterfaceFactory;
  identity?: Identity;
}

function validateAndSanitizeCanisterId(canisterId: string): string {
  try {
    // Try to parse and re-serialize the Principal ID to ensure it's valid
    const principal = Principal.fromText(canisterId);
    return principal.toText();
  } catch (error) {
    // If the original ID fails, try to clean it up
    const cleanId = canisterId.replace(/[^a-zA-Z0-9\-_]/g, '');
    try {
      const principal = Principal.fromText(cleanId);
      return principal.toText();
    } catch {
      throw new Error(`Invalid canister ID: ${canisterId}`);
    }
  }
}

export async function createActor<T>({ canisterId, idlFactory, identity }: CreateActorOptions): Promise<T> {
  try {
    // Validate and sanitize the canister ID
    const sanitizedCanisterId = validateAndSanitizeCanisterId(canisterId);
    
    // For Plug wallet integration
    if (window.ic?.plug) {
      const isConnected = await window.ic.plug.isConnected();
      if (isConnected) {
        try {
          return await window.ic.plug.createActor({
            canisterId: sanitizedCanisterId,
            interfaceFactory: idlFactory,
          });
        } catch (plugError) {
          console.warn("Plug actor creation failed, falling back to HTTP agent:", plugError);
        }
      }
    }

    // For Internet Identity or direct agent usage
    const agent = new HttpAgent({
      host: HOST,
      identity,
    });

    // Only fetch root key in development
    if (DFX_NETWORK !== 'ic') {
      await agent.fetchRootKey();
    }

    return Actor.createActor<T>(idlFactory, {
      agent,
      canisterId: sanitizedCanisterId,
    });
  } catch (error) {
    console.error("Error creating actor:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

type ServiceRecord = Record<string, IDL.FuncClass>;

// Helper to create an IDL interface factory
export function createIdlFactory(serviceDefinition: (idl: {
  Service: typeof IDL.Service;
  Record: typeof IDL.Record;
  Vec: typeof IDL.Vec;
  Opt: typeof IDL.Opt;
  Variant: typeof IDL.Variant;
  Func: typeof IDL.Func;
  Text: typeof IDL.Text;
  Bool: typeof IDL.Bool;
  Null: typeof IDL.Null;
  Nat: typeof IDL.Nat;
  Int: typeof IDL.Int;
}) => ServiceRecord): IDL.InterfaceFactory {
  return ({ IDL }) => IDL.Service(serviceDefinition(IDL));
}

// Helper to get current authentication state
export async function getAuthState() {
  if (window.ic?.plug) {
    const isConnected = await window.ic.plug.isConnected();
    if (isConnected) {
      return {
        identity: await window.ic.plug.agent.getPrincipal(),
        type: 'plug' as const,
      };
    }
  }

  const authClient = await AuthClient.create();
  const identity = authClient.getIdentity();
  
  return {
    identity,
    type: identity.getPrincipal().isAnonymous() ? null : 'ii' as const,
    authClient,
  };
}

// Re-export types needed for window.ic.plug
declare global {
  interface Window {
    ic?: {
      plug?: {
        agent: any;
        createActor: (options: { canisterId: string; interfaceFactory: IDL.InterfaceFactory }) => Promise<any>;
        requestConnect: (options: { whitelist: string[]; host?: string }) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        createAgent: (options: any) => Promise<any>;
        requestTransfer: (options: { to: string; amount: number }) => Promise<{ height: number }>;
      };
    };
  }
}