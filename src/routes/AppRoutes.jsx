// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../auth/AuthContext";

// Page imports
import Dashboard from "../pages/dashboard/Dashboard";
import LeadsAll from "../pages/leads/AllLeads";
import QuotationCreate from "../pages/quotation/CreateQuotation";
import QuotationView from "../pages/quotation/View";
import ReturnQuotationCreate from "../pages/Orders/return";

import CustomerInquiry from "../pages/customer inquiry/Customer";
import RolesPermissions from "../pages/settings/RolesPermissions";
import CreateUser from "../pages/settings/CreateNewUser";
import OrgInfo from "../pages/settings/OrganisationInfo";
import Logout from "../pages/logout/logout";
import Login from "../pages/login/Login";
import UpdateProfile from "../pages/settings/UpdateProfile";
import CustomLeadsComponent from "../pages/leads/CustomLeadsComponent";
import LeadsSettings from "../pages/settings/LeadsSettings";
import CreatePayment from "../pages/payment/CreatePayment";
import ViewPayment from "../pages/payment/ViewPayment";
import ViewInvoice from "../pages/invoice/ViewInvoice";
import CreateInvoice from "../pages/invoice/CreateInvoice";
import ViewPage from "../pages/Orders/order"
import SalesmanOrderFlow from "@/pages/Orders/neworder";
import Website from "@/Website/website";  

function PrivateRoute({ children, roles }) {
  const { user, loading, rolePermissions } = useAuth();
  if (loading) {
    return null;
  }
 if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
}

// PermissionRoute: checks for 'view' permission on a module
function PermissionRoute({ moduleName, children }) {
  const { rolePermissions, loading } = useAuth();
  if (loading) return null;
  
  // If no moduleName is provided, treat route as not permission-guarded
  // (legacy routes may have omitted moduleName - allow them instead of redirecting)
  if (!moduleName) return children;
  // If rolePermissions is "ALL", allow access to everything
  if (
    typeof rolePermissions === "string" &&
    rolePermissions.trim().toUpperCase() === "ALL"
  ) {
    return children;
  }

  const modulePerm = rolePermissions?.find(
  (perm) => perm.module?.toLowerCase() === moduleName?.toLowerCase()
);

  const hasView = modulePerm?.permissions?.includes("view");
  if (!hasView) return <Navigate to="/dashboard" replace />;
  return children;
}

// PermissionActionRoute: checks for a specific action permission on a module
function PermissionActionRoute({ moduleName, action, children }) {
  const { rolePermissions, loading } = useAuth();
  if (loading) return null;

  // If rolePermissions is "ALL", allow access to everything
  if (
    typeof rolePermissions === "string" &&
    rolePermissions.trim().toUpperCase() === "ALL"
  ) {
    return children;
  }

  const modulePerm = rolePermissions?.find(
    (perm) => perm.module.toLowerCase() === moduleName.toLowerCase()
  );
  const hasAction = modulePerm?.permissions?.includes(action);
  if (!hasAction) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Website />} />
      {/* Public login route */}
      
      <Route path="/login" element={<Login />} />

      {/* Redirect root to dashboard */}
      {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}

      {/* Protected routes under Layout */}
      <Route
        path=""
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />


        {/* Leads routes (flattened) */}
        <Route
          path="leads/all"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Leads">
                <LeadsAll />
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="leads/:statusId/:statusName"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Leads">
                <CustomLeadsComponent
                  apiEndpoint="/leadstatus/:statusId"
                  headerTitle="All :statusName Items"
                  modalTitle="Edit :statusName Item"
                />
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        {/* Quotation routes (flattened) */}
        <Route
          path="quotation/create"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Quotation">
                <PermissionActionRoute moduleName="Quotation" action="create">
                  <QuotationCreate />
                </PermissionActionRoute>
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="quotation/view"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Quotation">
                <QuotationView />
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        {/* Invoice routes (flattened) */}
        <Route
          path="invoice/create"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Invoice">
                <PermissionActionRoute moduleName="Invoice" action="create">
                  <CreateInvoice />
                </PermissionActionRoute>
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="invoice/view"
          element={
            <PrivateRoute>
              <PermissionRoute moduleName="Invoice">
                <ViewInvoice />
              </PermissionRoute>
            </PrivateRoute>
          }
        />


 <Route
          path="Order/view"
          element={
            <PrivateRoute>
              <PermissionRoute>
                < ViewPage/>
              </PermissionRoute>
            </PrivateRoute>
          }
        />
         <Route
          path="Order/new"
          element={
            <PrivateRoute>
              <PermissionRoute>
                < SalesmanOrderFlow/>
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="Order/return"
          element={
            <PrivateRoute>
              <PermissionRoute>
                <ReturnQuotationCreate />
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        {/* Payment routes (flattened) */}
        <Route
          path="payment/create"
          element={
            <PrivateRoute>
              <CreatePayment />
            </PrivateRoute>
          }
        />
        <Route
          path="payment/view"
          element={
            <PrivateRoute>
              <ViewPayment />
            </PrivateRoute>
          }
        />

        {/* Customer Inquiry */}
        <Route
          path="customer-inquiry"
          element={
            <PrivateRoute>
              <CustomerInquiry />
            </PrivateRoute>
          }
        />

        


        {/* Settings (admin only, flattened) */}
        <Route
          path="settings/roles"
          element={
            <PrivateRoute roles={["admin"]}>
              <RolesPermissions />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/users"
          element={
            <PrivateRoute roles={["admin"]}>
              <CreateUser />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/org"
          element={
            <PrivateRoute roles={["admin"]}>
              <OrgInfo />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/update-profile"
          element={
            <PrivateRoute>
              <UpdateProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/leads-settings"
          element={
            <PrivateRoute roles={["admin"]}>
              <LeadsSettings />
            </PrivateRoute>
          }
        />
        {/* Logout route */}
        <Route path="logout" element={<Logout />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<h1>404 - Not Found</h1>} />
    </Routes>
  );
}
