import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
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
    element: <Layout />, // 👈 ALWAYS rendered
    children: [
      { path: "/login", element: <Login /> },

      { path: "/", element: <Navigate to="/items" /> },

      { path: "/items", element: <Items /> },
      { path: "/items/new", element: <CreateItem /> },
      { path: "/items/:id", element: <ItemDetails /> },
      { path: "/items/:id/edit", element: <EditItem /> },

      { path: "/companies", element: <Companies /> },
      { path: "/companies/new", element: <CreateCompany /> },
      { path: "/companies/:id", element: <CompanyDetails /> },
      { path: "/companies/:id/edit", element: <EditCompany /> },

      { path: "/requisitions/new", element: <CreateRequisition /> },
      { path: "/requisitions", element: <RequisitionsList /> },
      { path: "/requisitions/:id", element: <RequisitionDetails /> },
      { path: "/requisitions/:id/edit", element: <EditRequisition /> }

    ],
  },
]);



export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  );
}
