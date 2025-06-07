import React, { createContext, useContext, useState } from "react";
import api from "../services/api";
import {
    getFileTree,
    getProjectFiles,
    getFile,
    createFile,
    updateFile,
    deleteFile,
    moveFile,
    addComment,
    deleteComment,
    searchFiles
} from "./fileContext";

/**
 * Project Service Functions
 */
export const createProject = async (projectData) => {
    try {
        const response = await api.post("/projects", projectData);
        return response.data;
    } catch (error) {
        console.error("Failed to create project:", error);
        throw error;
    }
};

export const getProjects = async () => {
    try {
        const response = await api.get("/projects");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch projects:", error);
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

/**
 * (Optional) Project Context to manage project selection/state in UI
 */
const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);

    return (
        <ProjectContext.Provider value={{
            projects,
            setProjects,
            currentProject,
            setCurrentProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);