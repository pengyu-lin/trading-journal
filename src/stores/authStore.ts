import { create } from "zustand";
import type { User } from "firebase/auth";
import type { AuthState } from "../types/auth";
import { onAuthStateChange } from "../services/authService";

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  initializeAuth: () => {
    set({ isLoading: true });

    const unsubscribe = onAuthStateChange((user) => {
      set({ user, isLoading: false, error: null });
    });

    // Return cleanup function
    return unsubscribe;
  },
}));
