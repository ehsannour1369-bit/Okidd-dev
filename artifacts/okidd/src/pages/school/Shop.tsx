import { useAuthStore } from "../../store/auth";
import BookShop from "../../components/BookShop";

export default function SchoolShop() {
  const { user } = useAuthStore();
  if (!user?.schoolId) return null;
  return <BookShop scope="school" schoolId={user.schoolId} />;
}
