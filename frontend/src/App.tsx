import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Layout from "./Layout";
import ProtectedLayout from "./components/ProtectedLayout";
import RoleRoute from "./components/RoleRoute";

// Auth
import Login from "./pages/Auth/Login";
import RegisterVessel from "./pages/Auth/RegisterVessel";

// Items
import Items from "./pages/Items/Items";
import CreateItem from "./pages/Items/CreateItem";
import ItemDetails from "./pages/Items/ItemDetails";
import EditItem from "./pages/Items/EditItem";

// Requisitions
import RequisitionsList from "./pages/Requisitions/RequisitionsList";
import CreateRequisition from "./pages/Requisitions/CreateRequisition";
import RequisitionDetails from "./pages/Requisitions/RequisitionDetails";
import EditRequisition from "./pages/Requisitions/EditRequisition";

// Companies
import Companies from "./pages/Companies/Companies";
import CompanyDetails from "./pages/Companies/CompanyDetails";
import CreateCompany from "./pages/Companies/CreateCompany";
import EditCompany from "./pages/Companies/EditCompany";

// Vessel
import CrewManagement from "./pages/Vessels/CrewManagement";
import VesselSettings from "./pages/Vessels/VesselSettings";

// Admin
import AdminVessels from "./pages/Admin/AdminVessels";

const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      // Public
      { path: "/login", element: <Login /> },
      { path: "/register", element: <RegisterVessel /> },

      // Protected (any authenticated user)
      {
        element: <ProtectedLayout />,
        children: [
          { path: "/", element: <Navigate to="/items" /> },

          // Items
          { path: "/items", element: <Items /> },
          { path: "/items/new", element: <CreateItem /> },
          { path: "/items/:id", element: <ItemDetails /> },
          { path: "/items/:id/edit", element: <EditItem /> },

          // Companies (shared, readable by all)
          { path: "/companies", element: <Companies /> },
          { path: "/companies/new", element: <CreateCompany /> },
          { path: "/companies/:id", element: <CompanyDetails /> },
          { path: "/companies/:id/edit", element: <EditCompany /> },

          // Requisitions
          { path: "/requisitions", element: <RequisitionsList /> },
          { path: "/requisitions/new", element: <CreateRequisition /> },
          { path: "/requisitions/:id", element: <RequisitionDetails /> },
          { path: "/requisitions/:id/edit", element: <EditRequisition /> },

          // Captain-only vessel management
          {
            path: "/crew",
            element: (
              <RoleRoute role="captain">
                <CrewManagement />
              </RoleRoute>
            ),
          },
          {
            path: "/vessel/settings",
            element: (
              <RoleRoute role="captain">
                <VesselSettings />
              </RoleRoute>
            ),
          },

          // Super admin
          {
            path: "/admin/vessels",
            element: (
              <RoleRoute role="super_admin">
                <AdminVessels />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <RouterProvider router={router} />
    </>
  );
}