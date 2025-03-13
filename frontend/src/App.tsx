import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Tasks from './pages/Tasks';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Team Tasks AI - Dashboard</h1>
            </div>
            <nav className="flex space-x-6">
              <Link to="/" className="text-gray-500 hover:text-gray-600">Dashboard</Link>
              <Link to="/check-in" className="text-gray-500 hover:text-gray-600">Check-ins</Link>
              <Link to="/tasks" className="text-gray-500 hover:text-gray-600">Tasks</Link>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;