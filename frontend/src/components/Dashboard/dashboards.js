import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContexts";
import { toast } from "react-toastify";
import Projectf from "../../pages/Form/Projectf/projectf";
import {
    FaUserCircle,
    FaPalette,
    FaUserPlus,
    FaEnvelopeOpenText,
    FaTimes,
    FaPlus,
} from "react-icons/fa";
import "./dashboard.css";

// Mock friends data (replace with actual data fetching in real use)
const initialFriends = [
    {
        id: 1,
        name: "Alex Johnson",
        avatar: "https://i.pravatar.cc/60?img=1",
        bio: "Enthusiastic coder. Loves React & Roblox.",
        joined: "2024-07-12",
    },
    {
        id: 2,
        name: "Maya Patel",
        avatar: "https://i.pravatar.cc/60?img=2",
        bio: "UI/UX Designer, cat lover.",
        joined: "2023-12-03",
    },
    {
        id: 3,
        name: "Tomás Müller",
        avatar: "https://i.pravatar.cc/60?img=3",
        bio: "Backend specialist, NodeJS & Python.",
        joined: "2022-09-21",
    },
    {
        id: 4,
        name: "Sara Kim",
        avatar: "https://i.pravatar.cc/60?img=4",
        bio: "Full-stack dev and gamer.",
        joined: "2025-03-02",
    },
];

const Dashboards = () => {
    const { currentUser, isAuthenticated, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState(initialFriends);
    const [openProfile, setOpenProfile] = useState(null);
    const [addingFriend, setAddingFriend] = useState(false);
    const [friendUsername, setFriendUsername] = useState("");
    const [addingFriendLoading, setAddingFriendLoading] = useState(false);

    const [showModal, setShowModal] = useState(false); // For Projectf

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
        setShowModal(true); // open modal instead of navigating
    };

    const handleProjectCreated = () => {
        // Optional: you can add logic here to refetch project list after creation
        setShowModal(false); // close modal after project created
    };

    const handleCategoryClick = (category) => {
        toast.info(`${category} feature coming soon!`);
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (!friendUsername.trim()) {
            toast.error("Please enter a username!");
            return;
        }
        setAddingFriendLoading(true);
        setTimeout(() => {
            const newFriend = {
                id: Date.now(),
                name: friendUsername,
                avatar:
                    "https://i.pravatar.cc/60?img=" +
                    (Math.floor(Math.random() * 70) + 10),
                bio: "New friend on Dev-Cobb!",
                joined: new Date().toISOString().slice(0, 10),
            };
            setFriends((prev) => [newFriend, ...prev]);
            setFriendUsername("");
            setAddingFriend(false);
            setAddingFriendLoading(false);
            toast.success(`Friend request sent to ${friendUsername}!`);
        }, 900);
    };

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
            {/* Project Modal */}
            <Projectf
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleProjectCreated}
            />

            {/* Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1>DEV-COBB</h1>
                            <p>Welcome back, {currentUser.name}!</p>
                        </div>
                        <div className="dashboard-options-row">
                            {dashboardOptions.map((opt) => (
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

                    {/* Friends List Row */}
                    <div className="friends-list-row">
                        <div className="friends-list-row-titlebar">
                            <h3>Your Friends</h3>
                            <button
                                className="friend-avatar-card friend-avatar-add"
                                title="Add friend"
                                onClick={() => setAddingFriend(true)}
                                aria-label="Add friend"
                            >
                                <FaPlus size={22} />
                                <span className="friend-avatar-name">Add</span>
                            </button>
                        </div>
                        <div className="friends-row-scroll">
                            {friends.map((friend) => (
                                <div
                                    className="friend-avatar-card"
                                    key={friend.id}
                                    onClick={() => setOpenProfile(friend)}
                                    tabIndex={0}
                                    title={friend.name}
                                >
                                    <img
                                        src={friend.avatar}
                                        alt={friend.name}
                                        className="friend-avatar-img"
                                    />
                                    <span className="friend-avatar-name">{friend.name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Profile modal */}
                        {openProfile && (
                            <div
                                className="friend-profile-modal"
                                onClick={() => setOpenProfile(null)}
                            >
                                <div
                                    className="friend-profile-card"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        className="friend-profile-close"
                                        onClick={() => setOpenProfile(null)}
                                        aria-label="Close"
                                    >
                                        <FaTimes size={18} />
                                    </button>
                                    <img
                                        src={openProfile.avatar}
                                        alt={openProfile.name}
                                        className="friend-profile-avatar"
                                    />
                                    <h4>{openProfile.name}</h4>
                                    <p className="friend-profile-bio">{openProfile.bio}</p>
                                    <span className="friend-profile-joined">
                                        Joined: {openProfile.joined}
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Add Friend Modal */}
                        {addingFriend && (
                            <div
                                className="friend-profile-modal"
                                onClick={() => setAddingFriend(false)}
                            >
                                <form
                                    className="friend-profile-card"
                                    style={{ minWidth: 260, alignItems: "stretch" }}
                                    onClick={(e) => e.stopPropagation()}
                                    onSubmit={handleAddFriend}
                                >
                                    <button
                                        className="friend-profile-close"
                                        onClick={() => setAddingFriend(false)}
                                        aria-label="Close"
                                        type="button"
                                    >
                                        <FaTimes size={18} />
                                    </button>
                                    <h4 style={{ textAlign: "center" }}>Add a Friend</h4>
                                    <input
                                        className="add-friend-input"
                                        type="text"
                                        placeholder="Enter username"
                                        value={friendUsername}
                                        onChange={(e) => setFriendUsername(e.target.value)}
                                        autoFocus
                                        disabled={addingFriendLoading}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: 16 }}
                                        type="submit"
                                        disabled={addingFriendLoading}
                                    >
                                        {addingFriendLoading ? "Adding..." : "Add Friend"}
                                    </button>
                                </form>
                            </div>
                        )}
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
