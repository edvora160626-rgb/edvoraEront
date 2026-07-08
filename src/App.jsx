import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPasswordConfirm from "./components/ForgotPasswordConfirm";
import OtpVerify from "./components/OtpVerify";
import ResetPassword from "./components/ResetPassword";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserRequests from "./pages/admin/UserRequests";
import Departments from "./pages/admin/Departments";
import SnackbarContainer from "./common/snackbar/SnackbarContainer";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordConfirm />} />
        <Route path="/forgot-password/otp-verify" element={<OtpVerify />} />
        <Route path="/forgot-password/reset" element={<ResetPassword />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="requests"
            element={<UserRequests />}
          />

          <Route
            path="departments"
            element={<Departments />}
          />
        </Route>

      </Routes>
      <SnackbarContainer />
    </BrowserRouter>
  );
}

export default App;