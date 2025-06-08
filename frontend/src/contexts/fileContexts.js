import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

/**
 * File Service Functions
 */
export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        console.error("Failed to upload file:", error);
        throw error;
    }
};

export const createFile = async (fileData) => {
    try {
        const response = await api.post("/files", fileData);
        return response.data;
    } catch (error) {
        console.error("Failed to create file:", error);
        throw error;
    }
};

export const getProjectFiles = async (projectId, parentId = null) => {
    try {
        const params = {};
        if (parentId) params.parentId = parentId;
        const response = await api.get(`/files/project/${projectId}`, { params });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch project files:", error);
        throw error;
    }
};

export const getFileTree = async (projectId) => {
    try {
        const response = await api.get(`/files/project/${projectId}/tree`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch file tree:", error);
        throw error;
    }
};

export const getFile = async (fileId) => {
    try {
        const response = await api.get(`/files/${fileId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch file:", error);
        throw error;
    }
};

export const updateFile = async (fileId, fileData) => {
    try {
        const response = await api.put(`/files/${fileId}`, fileData);
        return response.data;
    } catch (error) {
        console.error("Failed to update file:", error);
        throw error;
    }
};

export const deleteFile = async (fileId) => {
    try {
        const response = await api.delete(`/files/${fileId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete file:", error);
        throw error;
    }
};

// FIX: moveFile expects { newParentId, newName }
export const moveFile = async (fileId, newParentId = null, newName = null) => {
    try {
        const body = {};
        if (newParentId) body.newParentId = newParentId;
        if (newName) body.newName = newName;
        const response = await api.post(`/files/${fileId}/move`, body);
        return response.data;
    } catch (error) {
        console.error("Failed to move file:", error);
        throw error;
    }
};

// FIX: addComment expects { text, line }
export const addComment = async (fileId, text, line = null) => {
    try {
        const body = { text };
        if (line !== null) body.line = line;
        const response = await api.post(`/files/${fileId}/comment`, body);
        return response.data;
    } catch (error) {
        console.error("Failed to add comment:", error);
        throw error;
    }
};

export const deleteComment = async (fileId, commentId) => {
    try {
        const response = await api.delete(`/files/${fileId}/comment/${commentId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete comment:", error);
        throw error;
    }
};

// FIX: searchFiles expects query param { query, type, language }
export const searchFiles = async (projectId, { query = '', type = '', language = '' } = {}) => {
    try {
        const params = {};
        if (query) params.query = query;
        if (type) params.type = type;
        if (language) params.language = language;
        const response = await api.get(`/files/project/${projectId}/search`, { params });
        return response.data;
    } catch (error) {
        console.error("Failed to search files:", error);
        throw error;
    }
};

/**
 * (Optional) File Context to manage open/active files if needed in UI
 */
const FileContext = createContext();

export const FileProvider = ({ children }) => {
    const [openFiles, setOpenFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);

    return (
        <FileContext.Provider value={{
            openFiles,
            setOpenFiles,
            activeFile,
            setActiveFile,
        }}>
            {children}
        </FileContext.Provider>
    );
};

export const useFile = () => useContext(FileContext);