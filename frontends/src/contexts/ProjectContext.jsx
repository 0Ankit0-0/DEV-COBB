"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useSocket } from "./SocketContext"
import api from "../services/api"

const ProjectContext = createContext()

export const useProject = () => useContext(ProjectContext)

export const ProjectProvider = ({ children }) => {
  const { projectId } = useParams()
  const { socket } = useSocket()

  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fileContent, setFileContent] = useState({})
  const [openedFiles, setOpenedFiles] = useState([])

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        const response = await api.get(`/projects/${projectId}`)
        setProject(response.data.project)
        setFiles(response.data.files || [])

        if (response.data.files && response.data.files.length > 0) {
          const mainFile = response.data.files.find((f) => f.isMain) || response.data.files[0]
          setActiveFile(mainFile)
          setOpenedFiles([mainFile])

          // Fetch content for the main file
          const contentRes = await api.get(`/projects/${projectId}/files/${mainFile._id}/content`)
          setFileContent((prev) => ({
            ...prev,
            [mainFile._id]: contentRes.data.content,
          }))
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError(err.response?.data?.message || "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // Socket event handlers for real-time collaboration
  useEffect(() => {
    if (!socket) return

    // File updates from other users
    socket.on("file:update", ({ fileId, content, userId }) => {
      setFileContent((prev) => ({
        ...prev,
        [fileId]: content,
      }))
    })

    // New file created
    socket.on("file:create", (newFile) => {
      setFiles((prev) => [...prev, newFile])
    })

    // File deleted
    socket.on("file:delete", (fileId) => {
      setFiles((prev) => prev.filter((f) => f._id !== fileId))
      setOpenedFiles((prev) => prev.filter((f) => f._id !== fileId))

      if (activeFile && activeFile._id === fileId) {
        const nextFile = openedFiles.find((f) => f._id !== fileId)
        setActiveFile(nextFile || null)
      }

      setFileContent((prev) => {
        const newContent = { ...prev }
        delete newContent[fileId]
        return newContent
      })
    })

    // File renamed
    socket.on("file:rename", ({ fileId, newName }) => {
      setFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, name: newName } : f)))

      setOpenedFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, name: newName } : f)))
    })

    return () => {
      socket.off("file:update")
      socket.off("file:create")
      socket.off("file:delete")
      socket.off("file:rename")
    }
  }, [socket, activeFile, openedFiles])

  // File operations
  const createFile = async (name, parentId = null, type = "file") => {
    try {
      const response = await api.post(`/projects/${projectId}/files`, {
        name,
        parentId,
        type,
      })

      const newFile = response.data.file
      setFiles((prev) => [...prev, newFile])

      if (type === "file") {
        openFile(newFile)
      }

      return newFile
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create file")
      throw err
    }
  }

  const deleteFile = async (fileId) => {
    try {
      await api.delete(`/projects/${projectId}/files/${fileId}`)

      setFiles((prev) => prev.filter((f) => f._id !== fileId && f.parentId !== fileId))
      setOpenedFiles((prev) => prev.filter((f) => f._id !== fileId))

      if (activeFile && activeFile._id === fileId) {
        const nextFile = openedFiles.find((f) => f._id !== fileId)
        setActiveFile(nextFile || null)
      }

      setFileContent((prev) => {
        const newContent = { ...prev }
        delete newContent[fileId]
        return newContent
      })
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete file")
      throw err
    }
  }

  const renameFile = async (fileId, newName) => {
    try {
      const response = await api.put(`/projects/${projectId}/files/${fileId}`, {
        name: newName,
      })

      setFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, name: newName } : f)))

      setOpenedFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, name: newName } : f)))

      return response.data.file
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rename file")
      throw err
    }
  }

  const openFile = async (file) => {
    if (!file) return

    // Check if file is already opened
    if (!openedFiles.some((f) => f._id === file._id)) {
      setOpenedFiles((prev) => [...prev, file])
    }

    setActiveFile(file)

    // Fetch file content if not already loaded
    if (!fileContent[file._id]) {
      try {
        const response = await api.get(`/projects/${projectId}/files/${file._id}/content`)
        setFileContent((prev) => ({
          ...prev,
          [file._id]: response.data.content,
        }))
      } catch (err) {
        console.error("Error fetching file content:", err)
        setError(err.response?.data?.message || "Failed to load file content")
      }
    }
  }

  const closeFile = (fileId) => {
    setOpenedFiles((prev) => prev.filter((f) => f._id !== fileId))

    if (activeFile && activeFile._id === fileId) {
      const nextFile = openedFiles.find((f) => f._id !== fileId)
      setActiveFile(nextFile || null)
    }
  }

  const updateFileContent = async (fileId, content) => {
    setFileContent((prev) => ({
      ...prev,
      [fileId]: content,
    }))

    // Emit changes to other collaborators
    if (socket) {
      socket.emit("file:update", { fileId, content })
    }

    // Debounced save to server
    debouncedSaveContent(fileId, content)
  }

  // Debounce function for saving file content
  const debouncedSaveContent = (fileId, content) => {
    if (window.saveTimeout) {
      clearTimeout(window.saveTimeout)
    }

    window.saveTimeout = setTimeout(async () => {
      try {
        await api.put(`/projects/${projectId}/files/${fileId}/content`, {
          content,
        })
      } catch (err) {
        console.error("Error saving file content:", err)
      }
    }, 1000)
  }

  return (
    <ProjectContext.Provider
      value={{
        project,
        files,
        activeFile,
        openedFiles,
        fileContent,
        loading,
        error,
        createFile,
        deleteFile,
        renameFile,
        openFile,
        closeFile,
        updateFileContent,
        setActiveFile,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}
