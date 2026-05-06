import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('Epics')

  const tabs = ['Epics', 'Features', 'Sprints']

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">🔨 Mjolnir</h1>
        <div className="flex items-center space-x-4">
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900">User Profile</button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'Epics' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Epics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Epic cards will go here */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">Example Epic</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">45% Complete</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Features' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <p className="text-gray-500">Grouped by Epic...</p>
            </div>
          )}

          {activeTab === 'Sprints' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Sprints</h2>
              <div className="flex space-x-6 h-[calc(100vh-250px)]">
                <div className="w-1/3 bg-gray-100 p-4 rounded-lg overflow-y-auto">
                  <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Backlog</h3>
                  {/* Backlog stories */}
                </div>
                <div className="w-2/3 bg-gray-100 p-4 rounded-lg overflow-y-auto">
                  <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Active Sprint</h3>
                  <div className="flex space-x-4">
                     <div className="flex-1 min-w-[250px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">To Do</h4>
                        {/* Kanban column */}
                     </div>
                     <div className="flex-1 min-w-[250px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">In Progress</h4>
                     </div>
                     <div className="flex-1 min-w-[250px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Done</h4>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
