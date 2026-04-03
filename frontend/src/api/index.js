import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  getMe:    ()     => api.get("/auth/me"),
  logout:   ()     => api.post("/auth/logout"),
};

// ─── Records ──────────────────────────────────────────────────────────────────
export const recordsAPI = {
  getAll:      (params) => api.get("/records", { params }),
  getOne:      (id)     => api.get(`/records/${id}`),
  create:      (data)   => api.post("/records", data),
  update:      (id, data) => api.put(`/records/${id}`, data),
  delete:      (id)     => api.delete(`/records/${id}`),
  getCategories: ()     => api.get("/records/categories"),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getFull:          () => api.get("/dashboard"),
  getSummary:       () => api.get("/dashboard/summary"),
  getRecent:        (limit = 10) => api.get("/dashboard/recent", { params: { limit } }),
  getCategories:    () => api.get("/dashboard/categories"),
  getMonthlyTrends: () => api.get("/dashboard/trends/monthly"),
  getWeeklyTrends:  () => api.get("/dashboard/trends/weekly"),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:   (params) => api.get("/users", { params }),
  getOne:   (id)     => api.get(`/users/${id}`),
  create:   (data)   => api.post("/users", data),
  update:   (id, data) => api.put(`/users/${id}`, data),
  delete:   (id)     => api.delete(`/users/${id}`),
  getProfile:    ()     => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
};

export default api;
