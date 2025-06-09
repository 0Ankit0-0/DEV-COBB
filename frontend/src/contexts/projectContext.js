import React, { createContext, useContext, useState } from "react";
import api from "../services/api";
import * as fileHelpers from "./fileContexts";

/**
 * Project Service Functions
 */
// Accepts params for search, tags, sortBy, etc.

export const getProjects = async (params = {}) => {
    try {
        const response = await api.get("/projects", { params });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        throw error;
    }
};

export const getUserProjects = async (userId, params = {}) => {
    try {
        const response = await api.get(`/projects/user/${userId}`, { params });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user projects:", error);
        throw error;
    }
};

// FIXED: createProject now properly sends data as request body
export const createProject = async ({
    name,
    description,
    isPublic,
    tags,
    template,
    thumbnail,
    languageUsed,
}) => {
    try {
        const response = await api.post("/projects", {
            name,
            description,
            isPublic,
            tags,
            template,
            thumbnail,
            languageUsed,
        });
        return response.data;
    } catch (error) {
        console.error("Failed to create project:", error);
        throw error;
    }
};

export const getProject = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        throw error;
    }
};

export const updateProject = async (projectId, projectData) => {
    try {
        const response = await api.put(`/projects/${projectId}`, projectData);
        return response.data;
    } catch (error) {
        console.error("Failed to update project:", error);
        throw error;
    }
};

export const deleteProject = async (projectId) => {
    try {
        const response = await api.delete(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete project:", error);
        throw error;
    }
};

// Add collaborator expects both userId and role
export const addCollaborator = async (projectId, userId, role = "viewer") => {
    try {
        const response = await api.post(`/projects/${projectId}/collaborators`, {
            userId,
            role,
        });
        return response.data;
    } catch (error) {
        console.error("Failed to add collaborator:", error);
        throw error;
    }
};

export const removeCollaborator = async (projectId, collaboratorId) => {
    try {
        const response = await api.delete(
            `/projects/${projectId}/collaborators/${collaboratorId}`
        );
        return response.data;
    } catch (error) {
        console.error("Failed to remove collaborator:", error);
        throw error;
    }
};

export const updateCollaboratorRole = async (
    projectId,
    collaboratorId,
    role
) => {
    try {
        const response = await api.put(
            `/projects/${projectId}/collaborators/${collaboratorId}/role`,
            { role }
        );
        return response.data;
    } catch (error) {
        console.error("Failed to update collaborator role:", error);
        throw error;
    }
};

export const getProjectAnalytics = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/analytics`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch project analytics:", error);
        throw error;
    }
};

export const forkProject = async (projectId) => {
    try {
        const response = await api.post(`/projects/${projectId}/fork`);
        return response.data;
    } catch (error) {
        console.error("Failed to fork project:", error);
        throw error;
    }
};

export const toggleLikeProject = async (projectId) => {
    try {
        const response = await api.post(`/projects/${projectId}/like`);
        return response.data;
    } catch (error) {
        console.error("Failed to like project:", error);
        throw error;
    }
};

/**
 * Project Context
 * Also exposes all file helpers for convenience
 */
const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);

    return (
        <ProjectContext.Provider
            value={{
                projects,
                setProjects,
                currentProject,
                setCurrentProject,
                // Project functions
                getProjects,
                getUserProjects,
                createProject,
                getProject,
                updateProject,
                deleteProject,
                addCollaborator,
                removeCollaborator,
                updateCollaboratorRole,
                getProjectAnalytics,
                forkProject,
                toggleLikeProject,
                // File helpers
                ...fileHelpers,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
