import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import axios from "axios";
import { openSnackbar } from "../common/snackbar/snackbar";
import AuthShell from "../common/AuthShell";

const API_BASE = "http://localhost:4001";

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const show = Math.min(2, name.length);
  return `${name.slice(0, show)}${"*".repeat(Math.max(0, name.length - show))}@${domain}`;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(state?.email ?? "");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (state?.email) {
      setEmail(state.email);
    }
  }, [state?.email]);

  const handleSend = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return openSnackbar({
        message: "Please enter your email address",
        variant: "warning",
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return openSnackbar({
        message: "Please enter a valid email address",
        variant: "warning",
      });
    }

    try {
      setSending(true);

      const { data } = await axios.post(
        `${API_BASE}/auth/forgotPassword`,
        { email: trimmedEmail },
        { withCredentials: true }
      );

      if (data.success) {
        navigate("/forgot-password/otp-verify", {
          state: { email: trimmedEmail },
          replace: true,
        });
      }
    } catch (error) {
      openSnackbar({
        message: error?.response?.data?.message || "Failed to send OTP",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const maskedEmail = email.trim() ? maskEmail(email.trim()) : "";

  return (
    <AuthShell>
      <p className="text-[13px] text-[#667085] mb-2">
        Having trouble with your password?
      </p>

      <h1 className="text-2xl sm:text-[28px] font-bold text-[#735366] mb-4 sm:mb-6">
        Reset password
      </h1>

      <p className="text-[13px] sm:text-[14px] text-[#667085] mb-6 leading-6">
        {maskedEmail ? (
          <>
            A verification code will be sent to your registered email{" "}
            <span className="font-semibold text-[#A77A95] break-all">{maskedEmail}</span>.
          </>
        ) : (
          "Enter your registered email and we will send you a verification code."
        )}
      </p>

      {!state?.email && (
        <div className="relative mb-6">
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A77A95]"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full h-[48px] rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-[14px] outline-none focus:border-[#A77A95]"
          />
        </div>
      )}

      <button
        type="button"
        disabled={sending}
        onClick={handleSend}
        className="w-full h-[48px] rounded-xl bg-[#A77A95] hover:bg-[#8F6580] text-white font-semibold transition disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send OTP"}
      </button>

      <p className="text-center mt-6 text-[13px] sm:text-[14px] text-[#667085]">
        Remember your password?{" "}
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

export default ForgotPasswordConfirm;
