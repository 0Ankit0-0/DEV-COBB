import api from '../utils/api';

export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
    }
}

export const createFile = async (fileData) => {
    try {
        const response = await api.post('/files', fileData);
        return response.data;
    } catch (error) {
        console.error('Failed to create file:', error);
        throw error;
    }
}

export const getProjectFiles = async (projectId) => {
    try {
        const response = await api.get(`/files/project/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch project files:', error);
        throw error;
    }
}

export const getFileTree = async (projectId) => {
    try {
        const response = await api.get(`/files/project/${projectId}/tree`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch file tree:', error);
        throw error;
    }
}

export const getFile = async (fileId) => {
    try {
        const response = await api.get(`/files/${fileId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch file:', error);
        throw error;
    }
}

export const updateFile = async (fileId, fileData) => {
    try {
        const response = await api.put(`/files/${fileId}`, fileData);
        return response.data;
    } catch (error) {
        console.error('Failed to update file:', error);
        throw error;
    }
}

export const deleteFile = async (fileId) => {
    try {
        const response = await api.delete(`/files/${fileId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete file:', error);
        throw error;
    }
}

export const moveFile = async (fileId, destinationPath) => {
    try {
        const response = await api.post(`/files/${fileId}/move`, { destinationPath });
        return response.data;
    } catch (error) {
        console.error('Failed to move file:', error);
        throw error;
    }
}

export const addComment = async (fileId, comment) => {
    try {
        const response = await api.post(`/files/${fileId}/comment`, { comment });
        return response.data;
    } catch (error) {
        console.error('Failed to add comment:', error);
        throw error;
    }
}

export const deleteComment = async (fileId, commentId) => {
    try {
        const response = await api.delete(`/files/${fileId}/comment/${commentId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete comment:', error);
        throw error;
    }
}

export const searchFiles = async (projectId, query) => {
    try {
        const response = await api.get(`/files/project/${projectId}/search`, { params: { q: query } });
        return response.data;
    } catch (error) {
        console.error('Failed to search files:', error);
        throw error;
    }
}

