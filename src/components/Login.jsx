import { lazy, Suspense, useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthShell from "../common/AuthShell";
import EdvoraLoader from "../common/EdvoraLoader";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { openSnackbar } from "../common/snackbar/snackbar";
import {
  clearAuthError,
  loginUser,
  resetAuthStatus,
} from "../redux/slices/authSlice";

const RegisterModal = lazy(() => import("../components/Register"));

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isLoggedIn } = useSelector((state) => state.auth);

  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    emailid: "",
    password: "",
  });

  const loading = status === "loading";

  useEffect(() => {
    if (isLoggedIn && status === "succeeded") {
      navigate("/admin/dashboard");
      dispatch(resetAuthStatus());
    }
  }, [isLoggedIn, status, navigate, dispatch]);

  useEffect(() => {
    if (status === "failed" && error) {
      openSnackbar({
        message: error,
        variant: "error",
      });
      dispatch(clearAuthError());
      dispatch(resetAuthStatus());
    }
  }, [status, error, dispatch]);

  const handleChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = () => {
    if (!loginData.emailid || !loginData.password) {
      return openSnackbar({
        message: "Please enter email and password",
        variant: "warning",
      });
    }

    dispatch(
      loginUser({
        emailid: loginData.emailid,
        password: loginData.password,
      })
    );
  };

  return (
    <>
      <AuthShell className={showRegister || loading ? "blur-sm" : ""}>
        <p className="text-[13px] text-[#667085] mb-2">
          Please enter your details
        </p>

        <h1 className="text-2xl sm:text-[28px] font-bold text-[#735366] mb-4 sm:mb-6">
          Welcome back
        </h1>

        <div className="relative mb-4">
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A77A95]"
          />
          <input
            type="email"
            name="emailid"
            value={loginData.emailid}
            onChange={handleChange}
            disabled={loading}
            placeholder="Email Address"
            className="w-full h-[48px] rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-[14px] outline-none focus:border-[#A77A95] disabled:opacity-60"
          />
        </div>

        <div className="relative mb-4">
          <Lock
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A77A95]"
          />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={loginData.password}
            onChange={handleChange}
            disabled={loading}
            placeholder="Password"
            className="w-full h-[48px] rounded-xl border border-[#D0D5DD] bg-white pl-12 pr-12 text-[14px] outline-none focus:border-[#A77A95] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A77A95] hover:text-[#8F6580] disabled:opacity-60"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 text-[13px]">
          <label className="flex items-center gap-2 text-[#667085]">
            <input
              type="checkbox"
              disabled={loading}
              className="accent-[#A77A95] cursor-pointer"
            />
            Remember me
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              navigate("/forgot-password", {
                state: loginData.emailid
                  ? { email: loginData.emailid }
                  : undefined,
              })
            }
            className="text-[#A77A95] hover:text-[#8F6580] disabled:opacity-60"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-[48px] rounded-xl bg-[#A77A95] hover:bg-[#8F6580] text-white font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center mt-6 text-[14px] text-[#667085]">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowRegister(true)}
            className="font-semibold text-[#A77A95] hover:text-[#8F6580] disabled:opacity-60"
          >
            Sign Up
          </button>
        </p>
      </AuthShell>

      {loading && <EdvoraLoader overlay message="Signing you in…" />}

      {showRegister && (
        <Suspense fallback={null}>
          <RegisterModal onClose={() => setShowRegister(false)} />
        </Suspense>
      )}
    </>
  );
}

export default Login;
