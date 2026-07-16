import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function readStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (token && user) {
      return {
        isLoggedIn: true,
        user,
        token,
        status: "succeeded",
        error: null,
      };
    }
  } catch {
    // ignore corrupt storage
  }

  return {
    isLoggedIn: false,
    user: null,
    token: null,
    status: "idle",
    error: null,
  };
}

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ emailid, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/auth/login`,
        { emailid, password },
        { withCredentials: true }
      );

      if (!data?.success) {
        return rejectWithValue(data?.message || "Login Failed");
      }

      const token = data.token || "";
      const user = data.user || null;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { token, user, message: data.message || "Login successful" };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Login Failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState: readStoredAuth(),
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetAuthStatus: (state) => {
      if (state.status !== "loading") {
        state.status = "idle";
      }
    },
    setCurrentUser: (state, action) => {
      const user = action.payload || null;
      state.user = user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isLoggedIn = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.isLoggedIn = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || "Login Failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoggedIn = false;
        state.user = null;
        state.token = null;
        state.status = "idle";
        state.error = null;
      });
  },
});

export const { clearAuthError, resetAuthStatus, setCurrentUser } = authSlice.actions;
export default authSlice.reducer;
