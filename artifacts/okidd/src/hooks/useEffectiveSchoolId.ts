import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";

/**
 * Returns the effective schoolId for the current user:
 * - school_manager: user.schoolId (direct)
 * - branch_manager: looks up branch.schoolId from user.branchId
 */
export function useEffectiveSchoolId(): number | null | undefined {
  const { user } = useAuthStore();

  const { data: branch } = useQuery({
    queryKey: ["branch", user?.branchId],
    queryFn: () => api.get<{ schoolId: number }>(`/branches/${user!.branchId}`),
    enabled: user?.role === "branch_manager" && !!user?.branchId,
    staleTime: 60_000,
  });

  if (!user) return null;
  if (user.role === "school_manager") return user.schoolId ?? null;
  if (user.role === "branch_manager") return branch?.schoolId ?? null;
  return user.schoolId ?? null;
}
