import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { openSnackbar } from "../common/snackbar/snackbar";
import AuthShell from "../common/AuthShell";

const API_BASE = "http://localhost:4001";

function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const mismatch = useMemo(
    () => password && confirmPassword && password !== confirmPassword,
    [password, confirmPassword]
  );

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("");
      return true;
    }

    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = async () => {
    setConfirmError("");

    if (!password) {
      setPasswordError("New password is required.");
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    if (!confirmPassword) {
      setConfirmError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await axios.post(
        `${API_BASE}/auth/setNewPassword`,
        { email, password },
        { withCredentials: true }
      );

      if (data.success) {
        openSnackbar({
          message:
            "Password updated successfully. Please login with your new password.",
          variant: "success",
        });
        navigate("/");
      }
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to reset password",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <p className="text-[13px] text-[#667085] mb-2">
        Almost done
      </p>

      <h1 className="text-2xl sm:text-[28px] font-bold text-[#735366] mb-4">
        New password
      </h1>

      <p className="text-[13px] sm:text-[14px] text-[#667085] mb-6">
        Create a new password for{" "}
        <span className="font-semibold text-[#A77A95] break-all">{email}</span>
      </p>

      <div className="relative mb-4">
        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A77A95]"
        />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.value);
          }}
          placeholder="New password"
          className={`w-full h-[48px] rounded-xl border bg-white pl-12 pr-12 text-[14px] outline-none ${
            passwordError
              ? "border-red-500 focus:border-red-500"
              : "border-[#D0D5DD] focus:border-[#A77A95]"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {passwordError && (
        <p className="text-[12px] text-red-500 mb-3">{passwordError}</p>
      )}

      <div className="relative mb-4">
        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A77A95]"
        />
        <input
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError("");
          }}
          placeholder="Confirm password"
          className={`w-full h-[48px] rounded-xl border bg-white pl-12 pr-12 text-[14px] outline-none ${
            confirmError || mismatch
              ? "border-red-500 focus:border-red-500"
              : "border-[#D0D5DD] focus:border-[#A77A95]"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowConfirm((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]"
          aria-label={showConfirm ? "Hide password" : "Show password"}
        >
          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {(confirmError || mismatch) && (
        <p className="text-[12px] text-red-500 mb-3">
          {confirmError || "Passwords do not match."}
        </p>
      )}

      <button
        type="button"
        disabled={submitting || !email}
        onClick={handleSubmit}
        className="w-full h-[48px] rounded-xl bg-[#A77A95] hover:bg-[#8F6580] text-white font-semibold transition disabled:opacity-60"
      >
        {submitting ? "Updating..." : "Update Password"}
      </button>

      <p className="text-center mt-6 text-[13px] sm:text-[14px] text-[#667085]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-semibold text-[#A77A95] hover:text-[#8F6580]"
        >
          Back to login
        </button>
      </p>
    </AuthShell>
  );
}

export default ResetPassword;
