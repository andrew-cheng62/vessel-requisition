import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Layout from "./Layout";
import ProtectedLayout from "./components/ProtectedLayout";
import RoleRoute from "./components/RoleRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Auth/Login";
import AdminLogin from "./pages/Auth/AdminLogin";
import RegisterVessel from "./pages/Auth/RegisterVessel";

import Items from "./pages/Items/Items";
import CreateItem from "./pages/Items/CreateItem";
import ItemDetails from "./pages/Items/ItemDetails";
import EditItem from "./pages/Items/EditItem";

import RequisitionsList from "./pages/Requisitions/RequisitionsList";
import RequisitionDetails from "./pages/Requisitions/RequisitionDetails";
import EditRequisition from "./pages/Requisitions/EditRequisition";

import Companies from "./pages/Companies/Companies";
import CompanyDetails from "./pages/Companies/CompanyDetails";
import CreateCompany from "./pages/Companies/CreateCompany";
import EditCompany from "./pages/Companies/EditCompany";

import CrewManagement from "./pages/Vessels/CrewManagement";
import VesselSettings from "./pages/Vessels/VesselSettings";

import AdminVessels from "./pages/Admin/AdminVessels";
import TagManagement from "./pages/Admin/TagManagement";
import BulkUpload from "./pages/Admin/BulkUpload";

const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <RegisterVessel /> },
      { path: "/admin/login", element: <AdminLogin /> },

      {
        element: <ProtectedLayout />,
        children: [
          { path: "/", element: <Navigate to="/items" /> },

          { path: "/items", element: <Items /> },
          { path: "/items/new", element: <CreateItem /> },
          { path: "/items/:id", element: <ItemDetails /> },
          { path: "/items/:id/edit", element: <EditItem /> },

          { path: "/companies", element: <Companies /> },
          { path: "/companies/new", element: <CreateCompany /> },
          { path: "/companies/:id", element: <CompanyDetails /> },
          { path: "/companies/:id/edit", element: <EditCompany /> },

          { path: "/requisitions", element: <RequisitionsList /> },
          { path: "/requisitions/:id", element: <RequisitionDetails /> },
          { path: "/requisitions/:id/edit", element: <EditRequisition /> },

          {
            path: "/crew",
            element: <RoleRoute role="captain"><CrewManagement /></RoleRoute>,
          },
          {
            path: "/vessel/settings",
            element: <RoleRoute role="captain"><VesselSettings /></RoleRoute>,
          },

          {
            path: "/admin/vessels",
            element: <RoleRoute role="super_admin"><AdminVessels /></RoleRoute>,
          },
          {
            path: "/admin/tags",
            element: <RoleRoute role="super_admin"><TagManagement /></RoleRoute>,
          },
          {
            path: "/admin/bulk",
            element: <RoleRoute role="super_admin"><BulkUpload /></RoleRoute>,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="bottom-right" toastOptions={{
        error: { duration: 5000 },
        success: { duration: 3000 },
      }} />
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
