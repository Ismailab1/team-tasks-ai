import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Users, LogOut } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/authContext";

function App() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        {isAuthenticated && (
          <header className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold">
                  Team Tasks AI - Dashboard
                </h1>
              </div>
              <nav className="flex items-center space-x-6">
                <Link to="/" className="text-gray-500 hover:text-gray-600">
                  Dashboard
                </Link>
                <Link
                  to="/check-in"
                  className="text-gray-500 hover:text-gray-600"
                >
                  Check-ins
                </Link>
                <Link to="/tasks" className="text-gray-500 hover:text-gray-600">
                  Tasks
                </Link>
                <Link to="/profile" className="text-gray-500 hover:text-gray-600">
                  Profile
                </Link>
                <button 
                  onClick={logout}
                  className="flex items-center text-gray-500 hover:text-gray-600"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </nav>
            </div>
          </header>
        )}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/check-in" element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;