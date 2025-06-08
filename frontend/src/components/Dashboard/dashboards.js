import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContexts";
import { toast } from "react-toastify";
import {
    FaUserCircle,
    FaPalette,
    FaUserPlus,
    FaEnvelopeOpenText,
} from "react-icons/fa";
import "./dashboard.css";

const Dashboards = () => {
    const { currentUser, isAuthenticated, logout, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                toast.error("Please log in to access the dashboard");
                navigate("/login");
            } else {
                toast.success(
                    `Welcome to your dashboard, ${currentUser?.name || "User"}!`
                );
            }
        }
        // eslint-disable-next-line
    }, [isAuthenticated, loading, navigate]);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
    };

    const handleCreateProject = () => {
        toast.success("Project creation feature coming soon!");
    };

    const handleCategoryClick = (category) => {
        toast.info(`${category} feature coming soon!`);
    };

    // New dashboard options
    const dashboardOptions = [
        {
            label: "Profile",
            icon: currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="avatar" className="profile-avatar" />
            ) : (
                <FaUserCircle size={28} />
            ),
            onClick: () => navigate("/profile"),
            tooltip: "View your profile",
        },
        {
            label: "Design Lab",
            icon: <FaPalette size={24} />,
            onClick: () => toast.info("Designing feature coming soon!"),
            tooltip: "Design workspace",
        },
        {
            label: "Join Project",
            icon: <FaUserPlus size={24} />,
            onClick: () => toast.info("Join project feature coming soon!"),
            tooltip: "Join a project",
        },
        {
            label: "Inbox",
            icon: <FaEnvelopeOpenText size={24} />,
            onClick: () => navigate("/inbox"),
            tooltip: "View invitations/messages",
        },
    ];

    if (loading || !isAuthenticated || !currentUser) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    const projectCategories = [
        {
            title: "All Projects",
            description: "Browse through all available projects",
            icon: "📁",
            count: 1234,
            color: "#a78bfa",
        },
        {
            title: "Trending Projects",
            description: "Discover the most viewed projects",
            icon: "📈",
            count: 89,
            color: "#c4b5fd",
        },
        {
            title: "Popular Projects",
            description: "Check out the most liked projects",
            icon: "❤️",
            count: 156,
            color: "#7c3aed",
        },
        {
            title: "Recent Projects",
            description: "Latest projects from the community",
            icon: "🕒",
            count: 45,
            color: "#8b5cf6",
        },
        {
            title: "My Projects",
            description: "Your personal project collection",
            icon: "👤",
            count: 12,
            color: "#f3e8ff",
        },
    ];

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1>DEV-COBB</h1>
                            <p>Welcome back, {currentUser.name}!</p>
                        </div>
                        <div className="dashboard-options-row">
                            {dashboardOptions.map((opt, i) => (
                                <button
                                    key={opt.label}
                                    className="dashboard-option-btn"
                                    title={opt.tooltip}
                                    onClick={opt.onClick}
                                >
                                    {opt.icon}
                                    <span className="dashboard-option-label">{opt.label}</span>
                                </button>
                            ))}
                            <button
                                className="btn btn-outline"
                                onClick={handleLogout}
                                title="Logout"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="container">
                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <h2>Welcome to your Dashboard, {currentUser.name}</h2>
                        <p>
                            Manage your projects, explore the community, and bring your ideas
                            to life.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <div className="action-card">
                            <div className="action-content">
                                <h3>➕ Ready to create something amazing?</h3>
                                <p>Start a new project and turn your ideas into reality.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateProject}
                                >
                                    ➕ Create New Project
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Projects Row List */}
                    <div className="projects-list-section">
                        <h3>Your Project Highlights</h3>
                        <div className="projects-list-row">
                            {projectCategories.map((category, index) => (
                                <div
                                    key={index}
                                    className="project-row-card"
                                    style={{ borderLeft: `6px solid ${category.color}` }}
                                    onClick={() => handleCategoryClick(category.title)}
                                >
                                    <div className="project-header-row">
                                        <div
                                            className="project-row-icon"
                                            style={{ background: category.color }}
                                        >
                                            {category.icon}
                                        </div>
                                        <span className="project-row-count">{category.count}</span>
                                    </div>
                                    <h4>{category.title}</h4>
                                    <p>{category.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="activity-section">
                        <h3>Recent Activity</h3>
                        <div className="activity-card">
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <h4>No recent activity</h4>
                                <p>Start creating projects to see your activity here.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateProject}
                                >
                                    ➕ Create Your First Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboards;
