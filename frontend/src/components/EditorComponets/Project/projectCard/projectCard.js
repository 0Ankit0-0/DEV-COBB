import React from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../contexts/projectContext";
import "./projectf.css";

// Additional CSS for ProjectCard component
const additionalStyles = `
.project-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.project-thumbnail {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.project-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.project-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.project-visibility {
  font-size: 1rem;
}

.project-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.project-tag {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #888;
}

.project-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.project-card-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-card:hover .project-card-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
`;

// Inject styles
if (typeof document !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();
    const { toggleLikeProject, forkProject, deleteProject } = useProject();

    const handleCardClick = () => {
        navigate(`/project/${project.id}`);
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            await toggleLikeProject(project.id);
            // Optionally update local state or refetch projects
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    };

    const handleFork = async (e) => {
        e.stopPropagation();
        try {
            const forkedProject = await forkProject(project.id);
            navigate(`/project/${forkedProject.id}`);
        } catch (error) {
            console.error("Failed to fork project:", error);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                await deleteProject(project.id);
                // Optionally trigger a refresh of the projects list
                window.location.reload();
            } catch (error) {
                console.error("Failed to delete project:", error);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="project-card" onClick={handleCardClick}>
            {project.thumbnail && (
                <div className="project-thumbnail">
                    <img src={project.thumbnail} alt={project.name} />
                </div>
            )}

            <div className="project-card-content">
                <div className="project-card-header">
                    <h3 className="project-title">{project.name}</h3>
                    <div className="project-visibility">
                        {project.isPublic ? "🌍" : "🔒"}
                    </div>
                </div>

                <p className="project-description">
                    {project.description || "No description provided"}
                </p>

                <div className="project-tags">
                    {project.tags &&
                        project.tags.map((tag, index) => (
                            <span key={index} className="project-tag">
                                {tag}
                            </span>
                        ))}
                </div>

                <div className="project-meta">
                    <span className="project-language">{project.languageUsed}</span>
                    <span className="project-date">
                        Updated {formatDate(project.updatedAt)}
                    </span>
                </div>

                <div className="project-stats">
                    <span className="project-likes">❤️ {project.likesCount || 0}</span>
                    <span className="project-forks">🍴 {project.forksCount || 0}</span>
                </div>
            </div>

            <div className="project-card-actions">
                <button
                    className="action-btn like-btn"
                    onClick={handleLike}
                    title="Like project"
                >
                    ❤️
                </button>
                <button
                    className="action-btn fork-btn"
                    onClick={handleFork}
                    title="Fork project"
                >
                    🍴
                </button>
                {project.canDelete && (
                    <button
                        className="action-btn delete-btn"
                        onClick={handleDelete}
                        title="Delete project"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;
