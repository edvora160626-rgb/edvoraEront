import { lazy, Suspense, useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthShell from "../common/AuthShell";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { openSnackbar } from "../common/snackbar/snackbar";

const RegisterModal = lazy(() => import("../components/Register"));

function Login() {
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    emailid: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async () => {
    try {
      if (!loginData.emailid || !loginData.password) {
        return openSnackbar({
          message: "Please enter email and password",
          variant: "warning",
        });
      }

      setLoading(true);

      const { data } = await axios.post(
        "http://localhost:4001/auth/login",
        {
          emailid: loginData.emailid,
          password: loginData.password,
        },
        {
          withCredentials: true,
        }
      );

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error(error);
      openSnackbar({
        message: error?.response?.data?.message || "Login Failed",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
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

      {loading && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FAEEE9]/55"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="login-loader" />
          <p className="mt-8 text-sm font-medium text-[#735366]">
            Signing you in…
          </p>
        </div>
      )}

      {showRegister && (
        <Suspense fallback={null}>
          <RegisterModal onClose={() => setShowRegister(false)} />
        </Suspense>
      )}
    </>
  );
}

export default Login;
