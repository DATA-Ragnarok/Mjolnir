import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import EpicsPage from './pages/EpicsPage'
import FeaturesPage from './pages/FeaturesPage'
import SprintsPage from './pages/SprintsPage'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('Epics')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'Epics' && <EpicsPage />}
      {activeTab === 'Features' && <FeaturesPage />}
      {activeTab === 'Sprints' && <SprintsPage />}
    </DashboardLayout>
  )
}

export default App
