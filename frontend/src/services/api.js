import axios from "axios";

const api = axios.create({
  baseURL: "https://refactored-telegram-r4wwx596667jf55q5-5000.app.github.dev/api"|| "localhost:5000/api",
  withCredentials: true,
  timeout: 20000, // 20 seconds timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 globally (auto logout, refresh, etc.)
    if (error.response) {
      if (error.response.status === 401) {
        // e.g., window.location = "/login";
      }
      // Optionally show notifications:
      // window.showError(error.response.data.message);
    } else if (error.request) {
      // Network error
      // window.showError("Network error");
    } else {
      // Other errors
      // window.showError(error.message);
    }
    return Promise.reject(error);
  }
);

export default api;