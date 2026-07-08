import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthShell from "../common/AuthShell";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const OTP_LENGTH = 6;

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const show = Math.min(2, name.length);
  return `${name.slice(0, show)}${"*".repeat(Math.max(0, name.length - show))}@${domain}`;
};

function OtpVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email ?? "";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const [otpErr, setOtpErr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      500
    );
    return () => clearInterval(timer);
  }, []);

  const canResend = useMemo(() => now >= resendAt, [now, resendAt]);
  const remaining = Math.max(0, resendAt - now);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }
    inputsRef.current?.[0]?.focus();
  }, [email, navigate]);

  const onDigit = (idx, raw) => {
    const char = (raw.match(/\d/g) || []).slice(-1)[0] || "";
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = char;
      return next;
    });

    if (char && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (otpErr) setOtpErr("");
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const chars = (e.clipboardData.getData("text").match(/\d/g) || []).slice(
      0,
      OTP_LENGTH
    );
    if (!chars.length) return;

    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < chars.length; i++) next[i] = chars[i];
      return next;
    });

    setTimeout(() => {
      inputsRef.current[Math.min(chars.length, OTP_LENGTH - 1)]?.focus();
    }, 0);

    if (otpErr) setOtpErr("");
  };

  const doResend = async () => {
    try {
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpErr("");

      await axios.post(
        `${API_BASE}/auth/forgotPassword`,
        { email },
        { withCredentials: true }
      );

      setResendAt(Math.floor(Date.now() / 1000) + 30);
      inputsRef.current?.[0]?.focus();
    } catch (error) {
      setOtpErr(error?.response?.data?.message || "Failed to resend code");
    }
  };

  const doVerify = async () => {
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setOtpErr("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);

      const { data } = await axios.post(
        `${API_BASE}/auth/verifyForgotOtp`,
        { email, otp: code },
        { withCredentials: true }
      );

      if (data.success) {
        navigate("/forgot-password/reset", {
          state: { email },
        });
      }
    } catch (error) {
      setOtpErr(error?.response?.data?.message || "Invalid verification code");
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthShell>
      <p className="text-[13px] text-[#667085] mb-2">
        Verify your identity
      </p>

      <h1 className="text-2xl sm:text-[28px] font-bold text-[#2E1065] mb-4">
        Enter code
      </h1>

      <p className="text-[13px] sm:text-[14px] text-[#667085] mb-6">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-[#7F56D9] break-all">
          {maskEmail(email)}
        </span>
      </p>

      <div className="flex justify-center gap-1.5 sm:gap-2 mb-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => onDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={i === 0 ? onPaste : undefined}
            className={`w-9 h-11 sm:w-10 sm:h-12 text-center text-[15px] sm:text-[16px] rounded-xl border bg-white outline-none transition-colors ${
              otpErr
                ? "border-red-500 focus:border-red-500"
                : "border-[#D0D5DD] focus:border-[#7F56D9]"
            }`}
          />
        ))}
      </div>

      {otpErr && (
        <p className="text-[12px] text-red-500 text-center mb-4">{otpErr}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[12px] sm:text-[13px] mb-6">
        <button
          type="button"
          onClick={doResend}
          disabled={!canResend}
          className={`${
            canResend
              ? "text-[#7F56D9] hover:text-[#6941C6]"
              : "text-[#98A2B3] cursor-not-allowed"
          }`}
        >
          {canResend ? "Resend code" : `Resend in ${remaining}s`}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password", { state: { email } })}
          className="text-[#667085] hover:text-[#6941C6]"
        >
          Change email
        </button>
      </div>

      <button
        type="button"
        disabled={verifying}
        onClick={doVerify}
        className="w-full h-[48px] rounded-xl bg-[#7F56D9] hover:bg-[#6941C6] text-white font-semibold transition disabled:opacity-60"
      >
        {verifying ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="text-center mt-6 text-[13px] sm:text-[14px] text-[#667085]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-semibold text-[#7F56D9] hover:text-[#6941C6]"
        >
          Back to login
        </button>
      </p>
    </AuthShell>
  );
}

export default OtpVerify;
