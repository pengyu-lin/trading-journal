import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { TradingAccount } from "../types/trade";
import { getPrimaryAccount, getAccounts } from "../services/accountsService";

interface AccountSelectorState {
  // Available accounts
  accounts: TradingAccount[];

  // Currently selected account
  selectedAccount: TradingAccount | null;

  // Loading state
  isLoading: boolean;

  // Actions
  fetchAccounts: (userId: string) => Promise<void>;
  selectAccount: (accountId: string, userId: string) => void;
  selectPrimaryAccount: (userId: string) => Promise<void>;
  refreshAccounts: (userId: string) => Promise<void>;
  clearSelectedAccount: () => void;
}

// Helper function to get smart default account
const getSmartDefaultAccount = (
  accounts: TradingAccount[]
): TradingAccount | null => {
  if (accounts.length === 0) return null;

  // First priority: primary account
  const primaryAccount = accounts.find((acc) => acc.isPrimary);
  if (primaryAccount) return primaryAccount;

  // Second priority: first created account (oldest by createdAt)
  const sortedAccounts = [...accounts].sort(
    (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
  );
  return sortedAccounts[0];
};

// Helper function to get localStorage key
const getLocalStorageKey = (userId: string) => `selectedAccount_${userId}`;

export const useAccountSelectorStore = create<AccountSelectorState>(
  (set, get) => ({
    accounts: [],
    selectedAccount: null,
    isLoading: false,

    fetchAccounts: async (userId: string) => {
      if (!userId) {
        console.warn("Cannot fetch accounts: userId is required");
        return;
      }

      set({ isLoading: true });
      try {
        const accounts = await getAccounts(userId);
        set({ accounts, isLoading: false });

        // Try to restore from localStorage first
        const localStorageKey = getLocalStorageKey(userId);
        const savedAccountId = localStorage.getItem(localStorageKey);

        if (savedAccountId && accounts.length > 0) {
          const savedAccount = accounts.find(
            (acc) => acc.id === savedAccountId
          );
          if (savedAccount) {
            set({ selectedAccount: savedAccount });
            return;
          }
        }

        // If no saved account or saved account doesn't exist, use smart default
        if (accounts.length > 0) {
          const defaultAccount = getSmartDefaultAccount(accounts);
          if (defaultAccount) {
            set({ selectedAccount: defaultAccount });
            // Save to localStorage
            localStorage.setItem(localStorageKey, defaultAccount.id!);
          }
        }
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    selectAccount: (accountId: string, userId: string) => {
      const { accounts } = get();
      const account = accounts.find((acc) => acc.id === accountId);
      if (account) {
        set({ selectedAccount: account });
        // Save to localStorage
        const localStorageKey = getLocalStorageKey(userId);
        localStorage.setItem(localStorageKey, accountId);
      }
    },

    selectPrimaryAccount: async (userId: string) => {
      if (!userId) {
        console.warn("Cannot select primary account: userId is required");
        return;
      }

      try {
        const primaryAccount = await getPrimaryAccount(userId);
        if (primaryAccount) {
          set({ selectedAccount: primaryAccount });
          // Save to localStorage
          const localStorageKey = getLocalStorageKey(userId);
          localStorage.setItem(localStorageKey, primaryAccount.id!);
        }
      } catch (error) {
        console.error("Failed to select primary account:", error);
      }
    },

    refreshAccounts: async (userId: string) => {
      if (!userId) {
        console.warn("Cannot refresh accounts: userId is required");
        return;
      }

      try {
        const accounts = await getAccounts(userId);
        set({ accounts });

        // Check if current selected account still exists
        const currentState = get();
        if (currentState.selectedAccount) {
          const accountStillExists = accounts.find(
            (acc) => acc.id === currentState.selectedAccount?.id
          );
          if (!accountStillExists) {
            // If selected account was deleted, use smart default
            const defaultAccount = getSmartDefaultAccount(accounts);
            if (defaultAccount) {
              set({ selectedAccount: defaultAccount });
              // Update localStorage
              const localStorageKey = getLocalStorageKey(userId);
              localStorage.setItem(localStorageKey, defaultAccount.id!);
            } else {
              set({ selectedAccount: null });
              // Clear localStorage
              const localStorageKey = getLocalStorageKey(userId);
              localStorage.removeItem(localStorageKey);
            }
          } else {
            // Update selected account with latest data
            const updatedSelectedAccount = accounts.find(
              (acc) => acc.id === currentState.selectedAccount?.id
            );
            if (updatedSelectedAccount) {
              set({ selectedAccount: updatedSelectedAccount });
            }
          }
        } else {
          // No account currently selected - use smart default if accounts exist
          if (accounts.length > 0) {
            const defaultAccount = getSmartDefaultAccount(accounts);
            if (defaultAccount) {
              set({ selectedAccount: defaultAccount });
              // Save to localStorage
              const localStorageKey = getLocalStorageKey(userId);
              localStorage.setItem(localStorageKey, defaultAccount.id!);
            }
          }
        }
      } catch (error) {
        console.error("Failed to refresh accounts:", error);
      }
    },

    clearSelectedAccount: () => {
      set({ selectedAccount: null });
    },
  })
);

// Selector hooks - optimized with useShallow
export const useAccounts = () =>
  useAccountSelectorStore(useShallow((state) => state.accounts));

export const useSelectedAccount = () =>
  useAccountSelectorStore(useShallow((state) => state.selectedAccount));

export const useAccountSelectorLoading = () =>
  useAccountSelectorStore(useShallow((state) => state.isLoading));

export const useAccountSelectorActions = () =>
  useAccountSelectorStore(
    useShallow((state) => ({
      fetchAccounts: state.fetchAccounts,
      selectAccount: state.selectAccount,
      selectPrimaryAccount: state.selectPrimaryAccount,
      refreshAccounts: state.refreshAccounts,
      clearSelectedAccount: state.clearSelectedAccount,
    }))
  );
