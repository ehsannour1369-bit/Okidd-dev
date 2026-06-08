import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/auth";
import { useAntiPiracy } from "./hooks/useAntiPiracy";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import NotFound from "./pages/not-found";
import ToastContainer from "./components/ToastContainer";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminSchools from "./pages/admin/Schools";
import AdminUsers from "./pages/admin/Users";
import AdminBooks from "./pages/admin/Books";
import AdminOrders from "./pages/admin/Orders";
import AdminContent from "./pages/admin/Content";
import AdminBranches from "./pages/admin/Branches";
import AdminTeachers from "./pages/admin/Teachers";
import AdminStudents from "./pages/admin/Students";
import AdminClasses from "./pages/admin/Classes";
import AdminConsultants from "./pages/admin/Consultants";
import AdminWallets from "./pages/admin/Wallets";

import SchoolDashboard from "./pages/school/Dashboard";
import SchoolBranches from "./pages/school/Branches";
import SchoolClasses from "./pages/school/Classes";
import SchoolTeachers from "./pages/school/Teachers";
import SchoolStudents from "./pages/school/Students";
import SchoolNotifications from "./pages/school/Notifications";
import SchoolExams from "./pages/school/Exams";
import SchoolReport from "./pages/school/Report";
import SchoolProgressChart from "./pages/school/ProgressChart";
import SchoolOnlineClass from "./pages/school/OnlineClass";

import SchoolShop from "./pages/school/Shop";
import SchoolOrders from "./pages/school/Orders";
import SchoolWallet from "./pages/school/Wallet";

import BranchDashboard from "./pages/branch/Dashboard";
import BranchClasses from "./pages/branch/Classes";
import BranchStudents from "./pages/school/Students";
import BranchTeachers from "./pages/school/Teachers";
import BranchNotifications from "./pages/branch/Notifications";
import BranchExams from "./pages/school/Exams";
import BranchShop from "./pages/branch/Shop";
import BranchOrders from "./pages/branch/Orders";
import BranchWallet from "./pages/branch/Wallet";
import BranchReport from "./pages/branch/Report";
import BranchOnlineClass from "./pages/branch/OnlineClass";

import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherMySchools from "./pages/teacher/MySchools";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherProgress from "./pages/teacher/Progress";
import TeacherNotifications from "./pages/teacher/Notifications";
import TeacherOnlineClass from "./pages/teacher/OnlineClass";

import ParentGenderSetup from "./components/ParentGenderSetup";
import ParentDashboard from "./pages/parent/Dashboard";
import ParentChildren from "./pages/parent/Children";
import ParentConsultations from "./pages/parent/Consultations";
import ParentNotifications from "./pages/parent/Notifications";
import ParentOnlineClass from "./pages/parent/OnlineClass";

import ConsultantDashboard from "./pages/consultant/Dashboard";
import ConsultantSchedule from "./pages/consultant/Schedule";

import StudentDashboard from "./pages/student/Dashboard";
import StudentBooks from "./pages/student/Books";
import StudentOnlineClass from "./pages/student/OnlineClass";
import StudentRanking from "./pages/student/Ranking";
import StudentGame from "./pages/student/Game";
import GamePlayer from "./pages/student/GamePlayer";
import LessonPlayer from "./pages/student/LessonPlayer";
import StudentTeacher from "./pages/student/Teacher";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function roleHome(role: string) {
  if (role === "admin") return "/admin";
  if (role === "school_manager") return "/school";
  if (role === "branch_manager") return "/branch";
  if (role === "teacher") return "/teacher";
  if (role === "parent") return "/parent";
  if (role === "consultant") return "/consultant";
  return "/student";
}

function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuthStore();
  useAntiPiracy();
  if (!user) return <Redirect to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Redirect to={roleHome(user.role)} />;
  return <>{children}</>;
}

function LayoutRoute({ component: Component, roles }: { component: React.ComponentType; roles: string[] }) {
  return (
    <AuthGuard allowedRoles={roles}>
      <Layout><Component /></Layout>
    </AuthGuard>
  );
}

function AppRouter() {
  const { user } = useAuthStore();

  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        {() => {
          if (!user) return <Redirect to="/login" />;
          return <Redirect to={roleHome(user.role)} />;
        }}
      </Route>

      {/* Admin */}
      <Route path="/admin"><LayoutRoute component={AdminDashboard} roles={["admin"]} /></Route>
      <Route path="/admin/schools"><LayoutRoute component={AdminSchools} roles={["admin"]} /></Route>
      <Route path="/admin/users"><LayoutRoute component={AdminUsers} roles={["admin"]} /></Route>
      <Route path="/admin/books"><LayoutRoute component={AdminBooks} roles={["admin"]} /></Route>
      <Route path="/admin/orders"><LayoutRoute component={AdminOrders} roles={["admin"]} /></Route>
      <Route path="/admin/content"><LayoutRoute component={AdminContent} roles={["admin"]} /></Route>
      <Route path="/admin/branches"><LayoutRoute component={AdminBranches} roles={["admin"]} /></Route>
      <Route path="/admin/teachers"><LayoutRoute component={AdminTeachers} roles={["admin"]} /></Route>
      <Route path="/admin/students"><LayoutRoute component={AdminStudents} roles={["admin"]} /></Route>
      <Route path="/admin/classes"><LayoutRoute component={AdminClasses} roles={["admin"]} /></Route>
      <Route path="/admin/consultants"><LayoutRoute component={AdminConsultants} roles={["admin"]} /></Route>
      <Route path="/admin/wallets"><LayoutRoute component={AdminWallets} roles={["admin"]} /></Route>

      {/* School Manager */}
      <Route path="/school"><LayoutRoute component={SchoolDashboard} roles={["school_manager"]} /></Route>
      <Route path="/school/branches"><LayoutRoute component={SchoolBranches} roles={["school_manager"]} /></Route>
      <Route path="/school/classes"><LayoutRoute component={SchoolClasses} roles={["school_manager"]} /></Route>
      <Route path="/school/teachers"><LayoutRoute component={SchoolTeachers} roles={["school_manager"]} /></Route>
      <Route path="/school/students"><LayoutRoute component={SchoolStudents} roles={["school_manager"]} /></Route>
      <Route path="/school/notifications"><LayoutRoute component={SchoolNotifications} roles={["school_manager"]} /></Route>
      <Route path="/school/exams"><LayoutRoute component={SchoolExams} roles={["school_manager"]} /></Route>
      <Route path="/school/report"><LayoutRoute component={SchoolReport} roles={["school_manager"]} /></Route>
      <Route path="/school/progress"><LayoutRoute component={SchoolProgressChart} roles={["school_manager"]} /></Route>
      <Route path="/school/online-class"><LayoutRoute component={SchoolOnlineClass} roles={["school_manager"]} /></Route>
      <Route path="/school/shop"><LayoutRoute component={SchoolShop} roles={["school_manager"]} /></Route>
      <Route path="/school/orders"><LayoutRoute component={SchoolOrders} roles={["school_manager"]} /></Route>
      <Route path="/school/wallet"><LayoutRoute component={SchoolWallet} roles={["school_manager"]} /></Route>

      {/* Branch Manager */}
      <Route path="/branch"><LayoutRoute component={BranchDashboard} roles={["branch_manager"]} /></Route>
      <Route path="/branch/classes"><LayoutRoute component={BranchClasses} roles={["branch_manager"]} /></Route>
      <Route path="/branch/students"><LayoutRoute component={BranchStudents} roles={["branch_manager"]} /></Route>
      <Route path="/branch/teachers"><LayoutRoute component={BranchTeachers} roles={["branch_manager"]} /></Route>
      <Route path="/branch/notifications"><LayoutRoute component={BranchNotifications} roles={["branch_manager"]} /></Route>
      <Route path="/branch/exams"><LayoutRoute component={BranchExams} roles={["branch_manager"]} /></Route>
      <Route path="/branch/report"><LayoutRoute component={BranchReport} roles={["branch_manager"]} /></Route>
      <Route path="/branch/online-class"><LayoutRoute component={BranchOnlineClass} roles={["branch_manager"]} /></Route>
      <Route path="/branch/shop"><LayoutRoute component={BranchShop} roles={["branch_manager"]} /></Route>
      <Route path="/branch/orders"><LayoutRoute component={BranchOrders} roles={["branch_manager"]} /></Route>
      <Route path="/branch/wallet"><LayoutRoute component={BranchWallet} roles={["branch_manager"]} /></Route>

      {/* Teacher */}
      <Route path="/teacher"><LayoutRoute component={TeacherDashboard} roles={["teacher"]} /></Route>
      <Route path="/teacher/schools"><LayoutRoute component={TeacherMySchools} roles={["teacher"]} /></Route>
      <Route path="/teacher/classes"><LayoutRoute component={TeacherClasses} roles={["teacher"]} /></Route>
      <Route path="/teacher/online-class"><LayoutRoute component={TeacherOnlineClass} roles={["teacher"]} /></Route>
      <Route path="/teacher/progress"><LayoutRoute component={TeacherProgress} roles={["teacher"]} /></Route>
      <Route path="/teacher/notifications"><LayoutRoute component={TeacherNotifications} roles={["teacher"]} /></Route>

      {/* Parent */}
      <Route path="/parent"><LayoutRoute component={ParentDashboard} roles={["parent"]} /></Route>
      <Route path="/parent/children"><LayoutRoute component={ParentChildren} roles={["parent"]} /></Route>
      <Route path="/parent/online-class"><LayoutRoute component={ParentOnlineClass} roles={["parent"]} /></Route>
      <Route path="/parent/consultations"><LayoutRoute component={ParentConsultations} roles={["parent"]} /></Route>
      <Route path="/parent/notifications"><LayoutRoute component={ParentNotifications} roles={["parent"]} /></Route>

      {/* Consultant */}
      <Route path="/consultant"><LayoutRoute component={ConsultantDashboard} roles={["consultant"]} /></Route>
      <Route path="/consultant/schedule"><LayoutRoute component={ConsultantSchedule} roles={["consultant"]} /></Route>

      {/* Student */}
      <Route path="/student"><LayoutRoute component={StudentDashboard} roles={["student"]} /></Route>
      <Route path="/student/books"><LayoutRoute component={StudentBooks} roles={["student"]} /></Route>
      <Route path="/student/online-class"><LayoutRoute component={StudentOnlineClass} roles={["student"]} /></Route>
      <Route path="/student/ranking"><LayoutRoute component={StudentRanking} roles={["student"]} /></Route>
      <Route path="/student/game"><LayoutRoute component={StudentGame} roles={["student"]} /></Route>
      <Route path="/student/game-player"><AuthGuard allowedRoles={["student"]}><GamePlayer /></AuthGuard></Route>
      <Route path="/student/lesson-player"><AuthGuard allowedRoles={["student"]}><LessonPlayer /></AuthGuard></Route>
      <Route path="/student/teacher"><LayoutRoute component={StudentTeacher} roles={["student"]} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRouter />
      </WouterRouter>
      <ToastContainer />
      <ParentGenderSetup />
    </QueryClientProvider>
  );
}
