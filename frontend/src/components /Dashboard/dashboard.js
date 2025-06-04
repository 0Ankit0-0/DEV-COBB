import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "./dashboard.css"

const dashboard = () => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const userInfo = localStorage.getItem("user")
        if (userInfo) {
            setUser(JSON.parse(userInfo))
            toast.success("Welcome to your dashboard!")
        } else {
            toast.error("Please log in to access the dashboard")
            navigate("/login")
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem("user")
        toast.success("Logged out successfully")
        navigate("/")
    }

    const handleCreateProject = () => {
        toast.success("Project creation feature coming soon!")
    }

    const handleCategoryClick = (category) => {
        toast.info(`${category} feature coming soon!`)
    }

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        )
    }

    const projectCategories = [
        {
            title: "All Projects",
            description: "Browse through all available projects",
            icon: "📁",
            count: 1234,
            color: "#3b82f6",
        },
        {
            title: "Trending Projects",
            description: "Discover the most viewed projects",
            icon: "📈",
            count: 89,
            color: "#10b981",
        },
        {
            title: "Popular Projects",
            description: "Check out the most liked projects",
            icon: "❤️",
            count: 156,
            color: "#ef4444",
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
            color: "#f59e0b",
        },
    ]

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1>DEV-COBB</h1>
                            <p>Welcome back, {user.name}!</p>
                        </div>
                        <button className="btn btn-outline" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="container">
                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <h2>Welcome to your Dashboard, {user.name}</h2>
                        <p>Manage your projects, explore the community, and bring your ideas to life.</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <div className="action-card">
                            <div className="action-content">
                                <h3>➕ Ready to create something amazing?</h3>
                                <p>Start a new project and turn your ideas into reality.</p>
                                <button className="btn btn-primary" onClick={handleCreateProject}>
                                    ➕ Create New Project
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Project Categories */}
                    <div className="categories-section">
                        <h3>Explore Projects</h3>
                        <div className="categories-grid">
                            {projectCategories.map((category, index) => (
                                <div key={index} className="category-card" onClick={() => handleCategoryClick(category.title)}>
                                    <div className="category-header">
                                        <div className="category-icon" style={{ backgroundColor: category.color }}>
                                            {category.icon}
                                        </div>
                                        <span className="category-count">{category.count}</span>
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
                                <button className="btn btn-primary" onClick={handleCreateProject}>
                                    ➕ Create Your First Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default dashboard
