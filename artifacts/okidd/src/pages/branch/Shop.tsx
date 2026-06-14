import { useAuthStore } from "../../store/auth";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import BookShop from "../../components/BookShop";

export default function BranchShop() {
  const { user } = useAuthStore();
  const schoolId = useEffectiveSchoolId();
  if (!schoolId) return null;
  return <BookShop scope="branch" schoolId={schoolId} branchId={user?.branchId ?? undefined} />;
}
