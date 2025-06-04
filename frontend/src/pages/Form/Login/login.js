import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useAuthServices } from "../../../services/authService"
import toast from "react-hot-toast"
import "../..Form/auth.css"

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Simple validation
        if (!email || !password) {
            toast.error("Please fill in all fields")
            setIsLoading(false)
            return
        }

        const { login } = useAuthServices()

        // Simulate API call
        try {
            const userData = await login(email, password)
            localStorage.setItem("token", userData.token) // Store token if returned
            setEmail("")
            setPassword("")
            toast.success("Login successful! Welcome back.")
            navigate("/dashboard")
        } catch (err) {
            toast.error("Login failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Welcome back</h2>
                        <p>Enter your credentials to access your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Eye/>: < EyeOff/>}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{" "}
                            <Link to="/signup" className="auth-link">
                                Sign up
                            </Link>
                        </p>
                        <Link to="/" className="back-link">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
