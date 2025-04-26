import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../services/api";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState("blank");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get("/projects");
        setProjects(response.data.projects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        toast.error("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out successfully");
    navigate("/login");
  };

  const toProfile = () => {
    navigate("/profile");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!newProjectName.trim()) {
      toast.warning("Please enter a project name");
      return;
    }

    try {
      setCreatingProject(true);
      const response = await api.post("/projects", {
        name: newProjectName,
        description: newProjectDescription,
        template: newProjectTemplate,
      });

      setProjects([...projects, response.data.project]);
      setShowNewProjectModal(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectTemplate("blank");

      toast.success(
        `Project "${response.data.project.name}" created successfully!`
      );

      navigate(`/editor/${response.data.project._id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project. Please try again.");
      toast.error("Failed to create project. Please try again.");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter((p) => p._id !== projectId));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project. Please try again.");
      toast.error("Failed to delete project. Please try again.");
    }
  };

  const projectTemplates = [
    {
      id: "blank",
      name: "Blank Project",
      description: "Start with an empty project",
    },
    {
      id: "html-css-js",
      name: "HTML/CSS/JS",
      description: "Basic web project with HTML, CSS, and JavaScript",
    },
    {
      id: "react",
      name: "React",
      description: "React project with a basic component structure",
    },
    {
      id: "node-express",
      name: "Node.js/Express",
      description: "Backend API with Node.js and Express",
    },
    {
      id: "python",
      name: "Python",
      description: "Python project with a main script",
    },
  ];

  return (
    <div className="dashboard-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />

      <header className="dashboard-header">
        <div className="logo-container">
          <div className="logo">DEV-COBB</div>
        </div>

        <div className="header-actions">
          {/* <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button> */}

          <div className="header-user-section">
            <button className="user-profile-button" onClick={toProfile}>
              <div className="user-avatar">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <span className="user-name">{currentUser?.name || "User"}</span>
            </button>

            <div className="logout-container">
              <button className="logout-button" onClick={handleLogout}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="logout-icon"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1>Welcome, {currentUser?.name || "Developer"}!</h1>
          <p>Manage your projects and start coding</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="dashboard-actions">
          <button
            className="btn btn-primary create-project-btn"
            onClick={() => setShowNewProjectModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create New Project</span>
          </button>
        </div>

        <div className="projects-container">
          <h2 className="section-title">Your Projects</h2>

          {loading ? (
            <div className="loading-projects">
              <div className="spinner"></div>
              <p>Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="no-projects">
              <div className="no-projects-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowNewProjectModal(true);
                  toast.info("Let's create your first project!");
                }}
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div className="project-card" key={project._id}>
                  <div className="project-card-header">
                    <h3 className="project-title">{project.name}</h3>
                    <div className="project-actions">
                      <button
                        className="project-action-btn"
                        onClick={() => handleDeleteProject(project._id)}
                        aria-label="Delete project"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="project-card-body">
                    <p className="project-description">
                      {project.description || "No description provided"}
                    </p>
                    <div className="project-meta">
                      <div className="project-meta-item">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="project-meta-item">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{project.collaborators?.length || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <Link
                      to={`/editor/${project._id}`}
                      className="btn btn-primary btn-block"
                      onClick={() => toast.info(`Opening ${project.name}...`)}
                    >
                      Open Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                className="modal-close"
                onClick={() => setShowNewProjectModal(false)}
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label htmlFor="projectName">Project Name</label>
                  <input
                    type="text"
                    id="projectName"
                    className="form-control"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectDescription">
                    Description (optional)
                  </label>
                  <textarea
                    id="projectDescription"
                    className="form-control"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Project Template</label>
                  <div className="template-grid">
                    {projectTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`template-card ${
                          newProjectTemplate === template.id ? "selected" : ""
                        }`}
                        onClick={() => {
                          setNewProjectTemplate(template.id);
                          toast.info(`Selected template: ${template.name}`);
                        }}
                      >
                        <div className="template-icon">
                          {template.id === "blank" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                          )}
                          {template.id === "html-css-js" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="16 18 22 12 16 6"></polyline>
                              <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                          )}
                          {template.id === "react" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <circle cx="12" cy="12" r="4"></circle>
                              <line
                                x1="4.93"
                                y1="4.93"
                                x2="9.17"
                                y2="9.17"
                              ></line>
                              <line
                                x1="14.83"
                                y1="14.83"
                                x2="19.07"
                                y2="19.07"
                              ></line>
                              <line
                                x1="14.83"
                                y1="9.17"
                                x2="19.07"
                                y2="4.93"
                              ></line>
                              <line
                                x1="14.83"
                                y1="9.17"
                                x2="18.36"
                                y2="5.64"
                              ></line>
                              <line
                                x1="4.93"
                                y1="19.07"
                                x2="9.17"
                                y2="14.83"
                              ></line>
                            </svg>
                          )}
                          {template.id === "node-express" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 10h-4v4h4v-4z"></path>
                              <path d="M10 10H6v4h4v-4z"></path>
                              <path d="M2 20h20V4H2v16z"></path>
                            </svg>
                          )}
                          {template.id === "python" && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0"></path>
                            </svg>
                          )}
                        </div>
                        <div className="template-info">
                          <h4>{template.name}</h4>
                          <p>{template.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowNewProjectModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingProject || !newProjectName.trim()}
                  >
                    {creatingProject ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
