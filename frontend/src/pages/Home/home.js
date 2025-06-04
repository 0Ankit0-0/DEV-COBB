import { Link } from "react-router-dom"
import "./home.css"

const home = () => {
  const features = [
    {
      title: "Editor",
      description: "Create and edit your projects with our powerful editor.",
      icon: "💻",
    },
    {
      title: "Project Management",
      description: "Manage your projects efficiently with our tools.",
      icon: "📁",
    },
    {
      title: "Collaboration",
      description: "Work together with others on your projects.",
      icon: "👥",
    },
    {
      title: "Community",
      description: "Join our community to share and learn from others.",
      icon: "⚡",
    },
    {
      title: "AI Assistance",
      description: "Get help from AI to enhance your projects.",
      icon: "🤖",
    },
  ]

  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1 className="logo">ProjectHub</h1>
          <div className="header-buttons">
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Welcome to ProjectHub</h1>
          <p className="hero-description">
            The ultimate platform for creating, managing, and collaborating on projects. Join our community and bring
            your ideas to life.
          </p>
          <Link to="/signup" className="btn btn-primary btn-large">
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Categories */}
      <section className="project-categories">
        <div className="container">
          <h2 className="section-title">Explore Projects</h2>
          <div className="categories-grid">
            <div className="category-card">
              <h3>All Projects</h3>
              <p>Browse through all available projects</p>
            </div>
            <div className="category-card">
              <h3>Trending Projects</h3>
              <p>Discover the most viewed projects</p>
            </div>
            <div className="category-card">
              <h3>Popular Projects</h3>
              <p>Check out the most liked projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to start your first project?</h2>
          <p>Join thousands of creators and bring your ideas to life.</p>
          <Link to="/signup" className="btn btn-secondary btn-large">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 ProjectHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default home
