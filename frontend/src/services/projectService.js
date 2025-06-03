const api = require('./api');

const { getFileTree } = require('./fileService');
const { getProjectFiles } = require('./fileService');
const { getFile } = require('./fileService');
const { createFile } = require('./fileService');
const { updateFile } = require('./fileService');
const { deleteFile } = require('./fileService');
const { moveFile } = require('./fileService');
const { addComment } = require('./fileService');
const { deleteComment } = require('./fileService');
const { searchFiles } = require('./fileService');

export const createProject = async (projectData) => {
    try {
        const response = await api.post('/projects', projectData);
        return response.data;
    } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
    }
}

export const getProjects = async () => {
    try {
        const response = await api.get('/projects');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw error;
    }
}

export const getProject = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch project:', error);
        throw error;
    }
}

export const updateProject = async (projectId, projectData) => {
    try {
        const response = await api.put(`/projects/${projectId}`, projectData);
        return response.data;
    } catch (error) {
        console.error('Failed to update project:', error);
        throw error;
    }
}

export const deleteProject = async (projectId) => {
    try {
        const response = await api.delete(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
    }
}

export const getProjectFiles = getProjectFiles;
export const getFileTree = getFileTree;
export const getFile = getFile;
export const createFile = createFile;
export const updateFile = updateFile;
export const deleteFile = deleteFile;           
