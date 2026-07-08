import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import RegisterModal from "../components/Register";
import AuthShell from "../common/AuthShell";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { openSnackbar } from "../common/snackbar/snackbar";


function Login() {
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error(error);

      openSnackbar({
        message: error?.response?.data?.message || "Login Failed",
        variant: "error",
      });
    }
  };

  return (
    <>
      <AuthShell className={showRegister ? "blur-sm" : ""}>
            <p className="text-[13px] text-[#667085] mb-2">
              Please enter your details
            </p>

            <h1 className="text-2xl sm:text-[28px] font-bold text-[#2E1065] mb-4 sm:mb-6">
              Welcome back
            </h1>

            {/* Email */}
            <div className="relative mb-4">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F56D9]"
              />

              <input
                type="email"
                name="emailid"
                value={loginData.emailid}
                onChange={handleChange}
                placeholder="Email Address"
                className="
    w-full
    h-[48px]
    rounded-xl
    border
    border-[#D0D5DD]
    bg-white
    pl-12
    pr-4
    text-[14px]
    outline-none
    focus:border-[#7F56D9]
  "
              />
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F56D9]"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginData.password}
                onChange={handleChange}
                placeholder="Password"
                className="
    w-full
    h-[48px]
    rounded-xl
    border
    border-[#D0D5DD]
    bg-white
    pl-12
    pr-12
    text-[14px]
    outline-none
    focus:border-[#7F56D9]
  "
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7F56D9] hover:text-[#6941C6]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 text-[13px]">
              <label className="flex items-center gap-2 text-[#667085]">
                <input type="checkbox" className="accent-[#7F56D9] cursor-pointer" />
                Remember me
              </label>

              <button
                type="button"
                onClick={() =>
                  navigate("/forgot-password", {
                    state: loginData.emailid
                      ? { email: loginData.emailid }
                      : undefined,
                  })
                }
                className="text-[#7F56D9] hover:text-[#6941C6]"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In */}
            <button
              onClick={handleLogin}
              className="
    w-full
    h-[48px]
    rounded-xl
    bg-[#7F56D9]
    hover:bg-[#6941C6]
    text-white
    font-semibold
    transition
  "
            >
              Sign In
            </button>

            {/* Signup */}
            <p className="text-center mt-6 text-[14px] text-[#667085]">
              Don't have an account?{" "}
              <button
                onClick={() => setShowRegister(true)}
                className="font-semibold text-[#7F56D9] hover:text-[#6941C6]"
              >
                Sign Up
              </button>
            </p>
      </AuthShell>

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
        />
      )}
    </>
  );
}

export default Login;