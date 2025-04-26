import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";
import "../styles/Profile.css";

const Profile = () => {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    website: "",
    location: "",
  });

  const isOwnProfile =
    currentUser && (!username || username === currentUser.username);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          username ? `/users/${username}` : "/auth/me"
        );
        const userData = response.data.user;

        setUser(userData);
        setProfileData({
          name: userData.name || "",
          bio: userData.bio || "",
          website: userData.website || "",
          location: userData.location || "",
        });

        const projectsResponse = await api.get(
          username ? `/users/${userData._id}/projects` : "/projects"
        );
        setProjects(projectsResponse.data.projects);

        const friendsResponse = await api.get(
          isOwnProfile ? "/friends" : `/users/${userData._id}/friends`
        );
        setFriends(friendsResponse.data.friends);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOwnProfile, username, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put("/auth/profile", profileData);

      setUser((prev) => ({
        ...prev,
        ...profileData,
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleFriendAction = async (userId, action) => {
    try {
      if (action === "add") {
        await api.post(`/users/friends/${userId}`);
      } else if (action === "remove") {
        await api.delete(`/users/friends/${userId}`);
      }

      // Refresh friends list
      const friendsResponse = await api.get("/users/friends");
      setFriends(friendsResponse.data.friends);
    } catch (err) {
      console.error("Error with friend action:", err);
      setError(err.response?.data?.message || "Failed to perform action");
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="logo-container">
          <Link to="/dashboard" className="logo">
            <span className="gradient-text">DEV-COBB</span>
          </Link>
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

          <Link to="/dashboard" className="btn btn-outline">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">{user?.name?.charAt(0) || "U"}</div>
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-username">
              @{user?.username || user?.email.split("@")[0]}
            </p>

            {user?.bio && <p className="profile-bio">{user.bio}</p>}

            <div className="profile-meta">
              {user?.location && (
                <div className="profile-meta-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{user.location}</span>
                </div>
              )}

              {user?.website && (
                <div className="profile-meta-item">
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
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              <div className="profile-meta-item">
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
                <span>{friends.length} Friends</span>
              </div>

              <div className="profile-meta-item">
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
                <span>{projects.length} Projects</span>
              </div>
            </div>

            {isOwnProfile ? (
              <button
                className="btn btn-primary btn-block"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <button
                className="btn btn-primary btn-block"
                onClick={() => handleFriendAction(user.id, "add")}
              >
                Add Friend
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              Projects
            </button>
            <button
              className={`tab ${activeTab === "friends" ? "active" : ""}`}
              onClick={() => setActiveTab("friends")}
            >
              Friends
            </button>
          </div>

          {activeTab === "projects" && (
            <div className="profile-projects">
              <h2 className="section-title">Projects</h2>

              {projects.length === 0 ? (
                <div className="no-items">
                  <p>No projects yet</p>
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.map((project) => (
                    <div className="project-card" key={project._id}>
                      <div className="project-card-header">
                        <h3 className="project-title">{project.name}</h3>
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
                        </div>
                      </div>
                      <div className="project-card-footer">
                        <Link
                          to={`/editor/${project._id}`}
                          className="btn btn-primary btn-block"
                        >
                          Open Project
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div className="profile-friends">
              <h2 className="section-title">Friends</h2>

              {friends.length === 0 ? (
                <div className="no-items">
                  <p>No friends yet</p>
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map((friend) => (
                    <div className="friend-card" key={friend._id}>
                      <div className="friend-avatar">
                        {friend.name.charAt(0)}
                      </div>
                      <div className="friend-info">
                        <h3 className="friend-name">{friend.name}</h3>
                        <p className="friend-username">
                          @{friend.username || friend.email.split("@")[0]}
                        </p>
                      </div>
                      <div className="friend-actions">
                        <Link
                          to={`/profile/${
                            friend.username || friend.email.split("@")[0]
                          }`}
                          className="btn btn-outline btn-sm"
                        >
                          View Profile
                        </Link>
                        {isOwnProfile && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleFriendAction(friend._id, "remove")
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button
                className="modal-close"
                onClick={() => setIsEditing(false)}
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
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="City, Country"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
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

export default Profile;
