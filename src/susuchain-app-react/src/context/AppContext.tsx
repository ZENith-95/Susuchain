import { useState, createContext, useContext, useEffect } from "react";
import Toast from "../components/Toast";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory, _SERVICE } from "../../../declarations/susuchain/susuchain.did.js";
import { canisterId as backendCanisterId } from "../../../declarations/susuchain";
import { AuthClient } from "@dfinity/auth-client"; // Re-add AuthClient import

interface UserProfile {
  id: Principal;
  walletType: string;
  principal: string;
  balance: number;
}

interface AppContextType {
  user: UserProfile | null;
  backendActor: _SERVICE | null;
  login: (walletType: "plug" | "internetIdentity") => Promise<void>;
  logout: () => void;
  theme: string;
  toggleTheme: () => void;
  showToast: (message: string, type?: string) => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  groups: any[]; // TODO: Define a more specific type later if needed
  setGroups: React.Dispatch<React.SetStateAction<any[]>>;
}

// Define the types for backend responses based on susuchain.mo
interface ApiError {
  notFound?: string;
  unauthorized?: string;
  badRequest?: string;
  internalError?: string;
  insufficientFunds?: string;
  groupFull?: string;
  alreadyMember?: string;
}

interface BackendUser {
  id: Principal;
  principal: Principal;
  walletType: { plug: null } | { internetIdentity: null };
  balance: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

interface BackendGroup {
  id: string;
  name: string;
  description: string;
  admin: Principal;
  members: any[]; // TODO: Define Member type
  contributionAmount: bigint;
  frequency: { daily: null } | { weekly: null } | { monthly: null };
  maxMembers: bigint;
  currentCycle: bigint;
  totalCycles: bigint;
  startDate: bigint;
  nextPayoutDate: bigint;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

interface BackendDashboardData {
  user: BackendUser;
  totalBalance: bigint;
  activeGroups: BackendGroup[];
  upcomingActivities: any[]; // TODO: Define Activity type
  recentTransactions: any[]; // TODO: Define Transaction type
}

type RegisterUserResult = { ok: BackendUser } | { err: ApiError };
type GetDashboardResult = { ok: BackendDashboardData } | { err: ApiError };

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [backendActor, setBackendActor] = useState<_SERVICE | null>(null);
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);


  const login = async (walletType: "plug" | "internetIdentity") => {
    try {
      const agent = new HttpAgent({ host: "http://localhost:4943" }); // Adjust host for deployment
      if (process.env.DFX_NETWORK === "local") {
        agent.fetchRootKey();
      }
      console.log("backendCanisterId:", backendCanisterId);
      console.log("CANISTER_ID_INTERNET_IDENTITY:", process.env.CANISTER_ID_INTERNET_IDENTITY);

      if (walletType === "plug") {
        console.log("Attempting Plug Wallet login...");
        if (!(window as any).ic || !(window as any).ic.plug) {
          console.error("Plug Wallet API (window.ic.plug) not found.");
          showToast("Plug Wallet extension not detected or not enabled.", "error");
          throw new Error("Plug Wallet API not found.");
        }
        const whitelist = [backendCanisterId];
        const hasAllowed = await (window as any).ic.plug.requestConnect({ whitelist });
        if (!hasAllowed) {
          throw new Error("Plug wallet connection rejected.");
        }
        const principal = await (window as any).ic.plug.agent.getPrincipal();
        const actor = Actor.createActor<_SERVICE>(idlFactory, {
          agent,
          canisterId: backendCanisterId,
        });
        setBackendActor(actor);
        setUser({
          id: principal,
          walletType: "#plug",
          principal: principal.toText(),
          balance: 0, // Initial balance, will be fetched after registration/login
        });
        // Register user on the backend and fetch initial data
        const registerResult = (await actor.registerUser({ plug: null })) as RegisterUserResult;
        if ("ok" in registerResult) {
          const userProfile = registerResult.ok;
          setUser({
            id: userProfile.id,
            walletType: Object.keys(userProfile.walletType)[0],
            principal: userProfile.principal.toText(),
            balance: Number(userProfile.balance),
          });
          // Fetch dashboard data immediately after successful login/registration
          const dashboardResult = (await actor.getDashboard()) as GetDashboardResult;
          if ("ok" in dashboardResult) {
            setBalance(Number(dashboardResult.ok.totalBalance));
            setGroups(dashboardResult.ok.activeGroups);
          } else {
            const errorMsg = Object.values(dashboardResult.err)[0];
            showToast(`Failed to fetch dashboard data: ${errorMsg}`, "error");
          }
        } else {
          const errorMsg = Object.values(registerResult.err)[0];
          showToast(`Failed to register user: ${errorMsg}`, "error");
          throw new Error(`Failed to register user: ${errorMsg}`);
        }
      } else if (walletType === "internetIdentity") {
        console.log("Attempting Internet Identity login...");
        const authClient = await AuthClient.create();
        await authClient.login({
          identityProvider:
            process.env.DFX_NETWORK === "local"
              ? `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`
              : "https://identity.ic0.app",
          onSuccess: async () => {
            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal();
            agent.replaceIdentity(identity); // Set identity on the agent
            const actor = Actor.createActor<_SERVICE>(idlFactory, {
              agent,
              canisterId: backendCanisterId,
            });
            setBackendActor(actor);
            setUser({
              id: principal,
              walletType: "#internetIdentity",
              principal: principal.toText(),
              balance: 0,
            });
            const registerResult = (await actor.registerUser({ internetIdentity: null })) as RegisterUserResult;
            if ("ok" in registerResult) {
              const userProfile = registerResult.ok;
              setUser({
                id: userProfile.id,
                walletType: Object.keys(userProfile.walletType)[0],
                principal: userProfile.principal.toText(),
                balance: Number(userProfile.balance),
              });
              const dashboardResult = (await actor.getDashboard()) as GetDashboardResult;
              if ("ok" in dashboardResult) {
                setBalance(Number(dashboardResult.ok.totalBalance));
                setGroups(dashboardResult.ok.activeGroups);
              } else {
                const errorMsg = Object.values(dashboardResult.err)[0];
                showToast(`Failed to fetch dashboard data: ${errorMsg}`, "error");
              }
            } else {
              const errorMsg = Object.values(registerResult.err)[0];
              showToast(`Failed to register user: ${errorMsg}`, "error");
              throw new Error(`Failed to register user: ${errorMsg}`);
            }
          },
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setBackendActor(null);
    if ((window as any).ic?.plug) {
      (window as any).ic.plug.disconnect();
    }
    const authClient = await AuthClient.create();
    authClient.logout();
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const showToast = (message: string, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const contextValue: AppContextType = {
    user,
    backendActor,
    login,
    logout,
    theme,
    toggleTheme,
    showToast,
    balance,
    setBalance,
    groups,
    setGroups,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          {children}
          {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};