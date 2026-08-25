import { create } from "zustand";
import api, { clearAccessToken, setAccessToken } from "../api/axios";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post("/auth/login/", { email, password });
    setAccessToken(res.data.access);
    const me = await api.get("/auth/me/");
    set({ user: me.data, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.post("/auth/logout/"); } finally { clearAccessToken(); }
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const refreshed = await api.post("/auth/token/refresh/");
      setAccessToken(refreshed.data.access);
      const res = await api.get("/auth/me/");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      clearAccessToken();
      set({ user: null, isAuthenticated: false });
    }
  },
}));

export default useAuthStore;
