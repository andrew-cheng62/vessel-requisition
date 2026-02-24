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
import Items from "./pages/Items/Items";
import CreateItem from "./pages/Items/CreateItem";
import Login from "./pages/Login";
import ItemDetails from "./pages/Items/ItemDetails";
import EditItem from "./pages/Items/EditItem";
import CreateRequisition from "./pages/Requisitions/CreateRequisition";
import Companies from "./pages/Companies/Companies";
import CompanyDetails from "./pages/Companies/CompanyDetails";
import CreateCompany from "./pages/Companies/CreateCompany";
import EditCompany from "./pages/Companies/EditCompany";
import RequisitionDetails from "./pages/Requisitions/RequisitionDetails";
import EditRequisition from "./pages/Requisitions/EditRequisition";
import RequisitionsList from "./pages/Requisitions/RequisitionsList";

const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      // 🔓 PUBLIC ROUTE
      { path: "/login", element: <Login /> },

      // 🔒 PROTECTED ROUTES
      {
        element: <ProtectedLayout />,
        children: [
          { path: "/", element: <Navigate to="/items" /> },

          // Items
          { path: "/items", element: <Items /> },
          { path: "/items/new", element: <CreateItem /> },
          { path: "/items/:id", element: <ItemDetails /> },
          { path: "/items/:id/edit", element: <EditItem /> },

          // Companies
          { path: "/companies", element: <Companies /> },
          { path: "/companies/new", element: <CreateCompany /> },
          { path: "/companies/:id", element: <CompanyDetails /> },
          { path: "/companies/:id/edit", element: <EditCompany /> },

          // Requisitions
          { path: "/requisitions", element: <RequisitionsList /> },
          { path: "/requisitions/new", element: <CreateRequisition /> },
          { path: "/requisitions/:id", element: <RequisitionDetails /> },
          { path: "/requisitions/:id/edit", element: <EditRequisition /> },
          { path: "/requisitions/:id/export", element: <RequisitionDetails /> },
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
