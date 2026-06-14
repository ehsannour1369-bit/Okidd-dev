import { useAuthStore } from "../../store/auth";
import BookOrders from "../../components/BookOrders";

export default function SchoolOrders() {
  const { user } = useAuthStore();
  if (!user?.schoolId) return null;
  return <BookOrders scope="school" schoolId={user.schoolId} />;
}
