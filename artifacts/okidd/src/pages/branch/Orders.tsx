import { useAuthStore } from "../../store/auth";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import BookOrders from "../../components/BookOrders";

export default function BranchOrders() {
  const { user } = useAuthStore();
  const schoolId = useEffectiveSchoolId();
  if (!schoolId) return null;
  return <BookOrders scope="branch" schoolId={schoolId} branchId={user?.branchId ?? undefined} />;
}
