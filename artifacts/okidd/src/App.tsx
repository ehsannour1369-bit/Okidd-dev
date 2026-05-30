import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import NotFound from "./pages/not-found";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminSchools from "./pages/admin/Schools";
import AdminUsers from "./pages/admin/Users";
import AdminBooks from "./pages/admin/Books";
import AdminPackages from "./pages/admin/Packages";
import AdminTransactions from "./pages/admin/Transactions";
import AdminContent from "./pages/admin/Content";

import SchoolDashboard from "./pages/school/Dashboard";
import SchoolBranches from "./pages/school/Branches";
import SchoolClasses from "./pages/school/Classes";
import SchoolTeachers from "./pages/school/Teachers";
import SchoolStudents from "./pages/school/Students";
import SchoolNotifications from "./pages/school/Notifications";
import SchoolExams from "./pages/school/Exams";

import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherMySchools from "./pages/teacher/MySchools";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherProgress from "./pages/teacher/Progress";

import ParentDashboard from "./pages/parent/Dashboard";
import ParentChildren from "./pages/parent/Children";
import ParentNotifications from "./pages/parent/Notifications";

import StudentDashboard from "./pages/student/Dashboard";
import StudentBooks from "./pages/student/Books";
import StudentRanking from "./pages/student/Ranking";
import StudentGame from "./pages/student/Game";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  if (!user) return <Redirect to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "school") return <Redirect to="/school" />;
    if (user.role === "teacher") return <Redirect to="/teacher" />;
    if (user.role === "parent") return <Redirect to="/parent" />;
    return <Redirect to="/student" />;
  }
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

      {/* Root redirect */}
      <Route path="/">
        {() => {
          if (!user) return <Redirect to="/login" />;
          if (user.role === "admin") return <Redirect to="/admin" />;
          if (user.role === "school") return <Redirect to="/school" />;
          if (user.role === "teacher") return <Redirect to="/teacher" />;
          if (user.role === "parent") return <Redirect to="/parent" />;
          return <Redirect to="/student" />;
        }}
      </Route>

      {/* Admin */}
      <Route path="/admin"><LayoutRoute component={AdminDashboard} roles={["admin"]} /></Route>
      <Route path="/admin/schools"><LayoutRoute component={AdminSchools} roles={["admin"]} /></Route>
      <Route path="/admin/users"><LayoutRoute component={AdminUsers} roles={["admin"]} /></Route>
      <Route path="/admin/books"><LayoutRoute component={AdminBooks} roles={["admin"]} /></Route>
      <Route path="/admin/packages"><LayoutRoute component={AdminPackages} roles={["admin"]} /></Route>
      <Route path="/admin/transactions"><LayoutRoute component={AdminTransactions} roles={["admin"]} /></Route>
      <Route path="/admin/content"><LayoutRoute component={AdminContent} roles={["admin"]} /></Route>

      {/* School */}
      <Route path="/school"><LayoutRoute component={SchoolDashboard} roles={["school"]} /></Route>
      <Route path="/school/branches"><LayoutRoute component={SchoolBranches} roles={["school"]} /></Route>
      <Route path="/school/classes"><LayoutRoute component={SchoolClasses} roles={["school"]} /></Route>
      <Route path="/school/teachers"><LayoutRoute component={SchoolTeachers} roles={["school"]} /></Route>
      <Route path="/school/students"><LayoutRoute component={SchoolStudents} roles={["school"]} /></Route>
      <Route path="/school/notifications"><LayoutRoute component={SchoolNotifications} roles={["school"]} /></Route>
      <Route path="/school/exams"><LayoutRoute component={SchoolExams} roles={["school"]} /></Route>

      {/* Teacher */}
      <Route path="/teacher"><LayoutRoute component={TeacherDashboard} roles={["teacher"]} /></Route>
      <Route path="/teacher/schools"><LayoutRoute component={TeacherMySchools} roles={["teacher"]} /></Route>
      <Route path="/teacher/classes"><LayoutRoute component={TeacherClasses} roles={["teacher"]} /></Route>
      <Route path="/teacher/progress"><LayoutRoute component={TeacherProgress} roles={["teacher"]} /></Route>

      {/* Parent */}
      <Route path="/parent"><LayoutRoute component={ParentDashboard} roles={["parent"]} /></Route>
      <Route path="/parent/children"><LayoutRoute component={ParentChildren} roles={["parent"]} /></Route>
      <Route path="/parent/notifications"><LayoutRoute component={ParentNotifications} roles={["parent"]} /></Route>

      {/* Student */}
      <Route path="/student"><LayoutRoute component={StudentDashboard} roles={["student"]} /></Route>
      <Route path="/student/books"><LayoutRoute component={StudentBooks} roles={["student"]} /></Route>
      <Route path="/student/ranking"><LayoutRoute component={StudentRanking} roles={["student"]} /></Route>
      <Route path="/student/game"><LayoutRoute component={StudentGame} roles={["student"]} /></Route>

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
    </QueryClientProvider>
  );
}
