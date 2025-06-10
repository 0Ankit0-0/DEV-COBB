import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../contexts/projectContext";
import FileExplorer from "./FileExplorer";
import "./projectf.css";

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, currentProject, setCurrentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const project = await getProject(projectId);
        setCurrentProject(project);
      } catch (err) {
        setError("Failed to load project");
        console.error("Error loading project:", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, getProject, setCurrentProject]);

  if (loading) {
    return (
      <div className="project-loading">
        <div>Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-error">
        <div>{error}</div>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="project-not-found">
        <div>Project not found</div>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="project-container">
      <header className="project-header">
        <h1>{currentProject.name}</h1>
        <p>{currentProject.description}</p>
        <div className="project-meta">
          <span>Language: {currentProject.languageUsed}</span>
          <span>•</span>
          <span>{currentProject.isPublic ? "Public" : "Private"}</span>
        </div>
      </header>

      <main className="project-main">
        <div className="project-sidebar">
          <FileExplorer projectId={projectId} />
        </div>

        <div className="project-content">
          <div className="project-workspace">
            {/* Code editor and file content will go here */}
            <div className="workspace-placeholder">
              <h3>Select a file to start editing</h3>
              <p>
                Choose a file from the file explorer to view and edit its
                contents.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Project;
