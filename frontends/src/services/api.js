import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error);
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: "Network error. Please check your connection.",
          },
        },
      });
    }

    // Handle server errors
    if (error.response.status === 500) {
      console.error("Server Error:", error.response);
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: "Server error. Please try again later.",
          },
        },
      });
    }

    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
