import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LayoutAdmin from "./layout/admin";
import ErrorPage from "./pages/result/error";
import NotFoundPage from "./pages/result/not-found";
import LoginPage from "./pages/auth/login";
import { useAppDispatch } from "./hooks/hooks";
import { useEffect } from "react";
import { fetchAccount } from "./redux/account/accountSlice";
import DashboardPage from "./pages/admin/dashboard";
import UsersPage from "./pages/admin/users";
import RolesPage from "./pages/admin/roles";
import PermissionsPage from "./pages/admin/permissions";
import LayoutHR from "./layout/hr";
import HRDashboard from "./pages/hr/Dashboard";
import WalletAdmin from "./pages/hr/WalletAdmin";
import ReviewConsole from "./pages/hr/ReviewConsole";
import LayoutPM from "./layout/pm";
import { PMActionCenterPage } from "./pages/pm/PMActionCenterPage";

import { SprintManagementPage } from "./pages/pm/SprintManagement";
import { MyTeamPage } from "./pages/pm/MyTeamPage"; // (Trang ở sprint trước)

import DeveloperLayout from "./layout/dev";
import DashBoardDev from "./pages/dev/dashboard";
import SkillPage from "./pages/dev/skill";
import UserSkillPage from "./pages/dev/user-skill";

import { ProjectsPage } from "./pages/pm/ProjectsPage";
import { ProjectDetail } from "./pages/pm/ProjectDetail";
import { ResourcePlannerPage } from "./pages/pm/ResourcePlannerPage";
import { PMDashboardPage } from "./pages/pm/PMDashboardPage";

import BenchForecast from "./pages/hr/BenchForecast";
import TalentManagement from "./pages/hr/TalentManagement";
import UserPorjectPage from "./pages/dev/project";
import DevProjectDetail from "./pages/dev/project-detail";
import SkillTreePage from "./pages/dev/skill-tree";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotPermittedPage from "./pages/result/not-permitted";
import DeveloperTasksPage from "./pages/dev/tasks";
import HrMatchingRecommendations from "./pages/hr/MatchingRecommendations";
import { MatchingRecommendationsPage } from "./pages/pm/MatchingRecommendationsPage";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAccount());
  }, [dispatch]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <div>Home</div>,
    },
    {
      path: "/admin",
      element: (
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <LayoutAdmin />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "users", element: <UsersPage /> },
        { path: "roles", element: <RolesPage /> },
        { path: "permissions", element: <PermissionsPage /> },
      ],
    },
    {
      path: "/hr",
      element: (
        <ProtectedRoute allowedRoles={["HR"]}>
          <LayoutHR />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <HRDashboard /> },
        { path: "dashboard", element: <HRDashboard /> },
        { path: "talents", element: <TalentManagement /> },
        { path: "wallet", element: <WalletAdmin /> },
        { path: "review", element: <ReviewConsole /> },
        { path: "bench", element: <BenchForecast /> },
        { path: "matching", element: <HrMatchingRecommendations /> },
      ],
    },

    {
      path: "/pm",
      element: (
        <ProtectedRoute allowedRoles={["PM"]}>
          <LayoutPM />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <PMDashboardPage />,
        },
        {
          path: "dashboard",
          element: <PMDashboardPage />,
        },
        {
          path: "action-center",
          element: <PMActionCenterPage />,
        },
        {
          path: "projects",
          element: <ProjectsPage />, // Màn hình Danh sách Dự án
        },
        {
          path: "projects/:projectId",
          element: <ProjectDetail />, // Bấm vào 1 dự án thì văng ra Command Center tuyệt đẹp
        },
        {
          path: "sprints/:sprintId",
          element: <SprintManagementPage />, // Bấm vào "Manage Tasks" trong Command Center thì văng ra đây
        },
        {
          path: "my-team",
          element: <MyTeamPage />,
        },
        {
          path: "resources",
          element: <ResourcePlannerPage />,
        },
        {
          path: "matching",
          element: <MatchingRecommendationsPage />,
        },
      ],
    },

    {
      path: "/developer",
      element: (
        <ProtectedRoute allowedRoles={["DEVELOPER"]}>
          <DeveloperLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <DashBoardDev />,
        },
        {
          path: "skills",
          element: <SkillPage />,
        },
        {
          path: "user-skill",
          element: <UserSkillPage />,
        },
        {
          path: "user-project",
          element: <UserPorjectPage />,
        },
        {
          path: "tasks",
          element: <DeveloperTasksPage />,
        },
        {
          path: "projects/:projectId",
          element: <DevProjectDetail />,
        },
        {
          path: "skill-tree",
          element: <SkillTreePage />,
        }
      ],
    },

    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <div>Register</div>,
    },
    {
      path: "/403",
      element: <NotPermittedPage />,
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
