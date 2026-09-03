import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import EpicsPage from './pages/EpicsPage'
import FeaturesPage from './pages/FeaturesPage'
import SprintsPage from './pages/SprintsPage'
import RetroPage from './pages/RetroPage'
import RetroSessionPage from './pages/RetroSessionPage'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/epics" replace /> : <LoginPage />} 
      />
      
      {/* Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/epics" element={<EpicsPage />} />
        <Route path="/epics/:epicId" element={<EpicsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/features/:featureId" element={<FeaturesPage />} />
        <Route path="/sprints" element={<SprintsPage />} />
        <Route path="/retro" element={<RetroPage />} />
        <Route path="/retro/session/:sprintId" element={<RetroSessionPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/epics" replace />} />
      <Route path="*" element={<Navigate to="/epics" replace />} />
    </Routes>
  );
}

export default App
