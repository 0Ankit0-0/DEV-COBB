import api from '../utils/api';
import { setAuthToken } from '../utils/api';

export const login = async (email, password) => {
    try {
        const response = await api.post('/users/login', { email, password });
        const { token } = response.data;
        setAuthToken(token);
        return response.data;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

export const register = async (userData) => {
    try {
        const response = await api.post('/users/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
}

export const logout = () => {
    setAuthToken(null);
}
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch current user:', error);
        throw error;
    }
}

export const updateUser = async (userData) => {
    try {
        const response = await api.put('/users/profile/me', userData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
}

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await api.put('/users/password', { currentPassword, newPassword });
        return response.data;
    } catch (error) {
        console.error('Failed to change password:', error);
        throw error;
    }
}

export const searchUsers = async (query) => {
    try {
        const response = await api.get(`/users/search/${query}`);
        return response.data;
    } catch (error) {
        console.error('Failed to search users:', error);
        throw error;
    }
}

export const addFriend = async (username) => {
    try {
        const response = await api.post(`/users/friends/add/${username}`);
        return response.data;
    } catch (error) {
        console.error('Failed to add friend:', error);
        throw error;
    }
}

export const removeFriend = async (username) => {
    try {
        const response = await api.delete(`/users/friends/remove/${username}`);
        return response.data;
    } catch (error) {
        console.error('Failed to remove friend:', error);
        throw error;
    }
}

export const getUserByUsername = async (username) => {
    try {
        const response = await api.get(`/users/${username}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user by username:', error);
        throw error;
    }
}

export const getAllUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch all users:', error);
        throw error;
    }
}

export const deleteUser = async () => {
    try {
        const response = await api.delete('/users/delete');
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
}

export const updateUserSettings = async (settings) => {
    try {
        const response = await api.put('/users/settings', settings);
        return response.data;
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error;
    }
}

export const getUserProfileByUsername = async (username) => {
    try {
        const response = await api.get(`/users/${username}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user profile by username:', error);
        throw error;
    }
}

export const getUserFriends = async (username) => {
    try {
        const response = await api.get(`/users/${username}/friends`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user friends:', error);
        throw error;
    }
}

