import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DocumentSeo from "./components/DocumentSeo";
import SnackbarContainer from "./common/snackbar/SnackbarContainer";

const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const ForgotPasswordConfirm = lazy(
  () => import("./components/ForgotPasswordConfirm")
);
const OtpVerify = lazy(() => import("./components/OtpVerify"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const UserRequests = lazy(() => import("./pages/admin/UserRequests"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const Classes = lazy(() => import("./pages/admin/Classes"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAEEE9] text-[#735366] text-sm">
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DocumentSeo />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordConfirm />} />
          <Route
            path="/forgot-password/otp-verify"
            element={<OtpVerify />}
          />
          <Route path="/forgot-password/reset" element={<ResetPassword />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="requests" element={<UserRequests />} />
            <Route path="departments" element={<Departments />} />
            <Route path="classes" element={<Classes />} />
          </Route>
        </Routes>
      </Suspense>
      <SnackbarContainer />
    </BrowserRouter>
  );
}

export default App;
