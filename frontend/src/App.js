import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./pages/Home/home";
import LoginPage from "./pages/Form/Login/login";
import SignupPage from "./pages/Form/Registration/Signup";
import DashboardPage from "./components/Dashboard/dashboards";
import { AuthProvider } from "./contexts/authContexts";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
