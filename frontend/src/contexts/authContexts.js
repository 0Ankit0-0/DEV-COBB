import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (err) {
          setAuthToken(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (loginInput, password) => {
    setError(null);
    try {
      const response = await api.post("/users/login", {
        login: loginInput,
        password,
      });
      const { token } = response.data;
      setAuthToken(token);
      localStorage.setItem("token", token);
      const user = await getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setError(err?.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const register = async ({ name, username, email, password }) => {
    setError(null);
    try {
      const response = await api.post("/users/register", {
        name,
        username,
        email,
        password,
      });
      const { token } = response.data;
      setAuthToken(token);
      localStorage.setItem("token", token);
      const user = await getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setError(err?.response?.data?.message || "Signup failed");
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const getCurrentUser = async () => {
    // Use '/users/me' for clarity and consistency with backend
    const response = await api.get("/users/me");
    return response.data;
  };

  const updateUser = async (userData) => {
    const response = await api.put("/users/profile/me", userData);
    return response.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put("/users/password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to change password:", error);
      throw error;
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await api.get(`/users/search/${query}`);
      return response.data;
    } catch (error) {
      console.error("Failed to search users:", error);
      throw error;
    }
  };

  const addFriend = async (username) => {
    try {
      const response = await api.post(`/users/friends/add/${username}`);
      return response.data;
    } catch (error) {
      console.error("Failed to add friend:", error);
      throw error;
    }
  };

  const removeFriend = async (username) => {
    try {
      const response = await api.delete(`/users/friends/remove/${username}`);
      return response.data;
    } catch (error) {
      console.error("Failed to remove friend:", error);
      throw error;
    }
  };

  const getUserByUsername = async (username) => {
    try {
      const response = await api.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user by username:", error);
      throw error;
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch all users:", error);
      throw error;
    }
  };

  const deleteUser = async () => {
    try {
      const response = await api.delete("/users/delete");
      return response.data;
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  const updateUserSettings = async (settings) => {
    try {
      const response = await api.put("/users/settings", settings);
      return response.data;
    } catch (error) {
      console.error("Failed to update user settings:", error);
      throw error;
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      throw error;
    }
  };

  const getUserProfileByUsername = async (username) => {
    try {
      const response = await api.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user profile by username:", error);
      throw error;
    }
  };

  const getUserFriends = async (username) => {
    try {
      const response = await api.get(`/users/${username}/friends`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user friends:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        register,
        updateUser,
        getCurrentUser,
        changePassword,
        searchUsers,
        addFriend,
        removeFriend,
        getUserByUsername,
        getAllUsers,
        deleteUser,
        updateUserSettings,
        getUserProfile,
        getUserProfileByUsername,
        getUserFriends,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
