import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "school_manager" | "branch_manager" | "teacher" | "parent" | "student" | "consultant";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: number | null;
  branchId?: number | null;
  gender?: string | null;
  genderConfirmed?: boolean | null;
  status: string;
  avatarUrl?: string | null;
  phone?: string | null;
  nationalId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "okidd-auth" }
  )
);
