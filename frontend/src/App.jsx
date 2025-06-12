import './App.css'
import Sidebar from './components/sidebar'
import { Dashboard } from './components/dashboard'
import Quiz from './components/quiz'
// import Routines from './components/routines'
import { Notes } from './components/notes'
import { useState, useEffect } from 'react'
import { LoadingProvider } from './components/LoadingContext'

function App() {
  const [activeTab, setActive] = useState("Dashboard")

  useEffect(() => {
    const handler = (e) => {
      if (e.type === 'navigateToTab' && e.detail) {
        setActive(e.detail);
      }
    };
    window.addEventListener('navigateToTab', handler);
    return () => window.removeEventListener('navigateToTab', handler);
  }, []);

  return (
    <LoadingProvider>
      <div className='flex bg-rule-bg w-screen h-screen'>
        <Sidebar setActive={setActive} activeTab={activeTab} />

        <div>
          {activeTab === "Dashboard" && <Dashboard />}
          {activeTab === "Quizzes" && <Quiz />}
          {/* {activeTab === "Routines" && <Routines />} */}
          {activeTab === "Notes" && <Notes />}
        </div>
      </div>
    </LoadingProvider>
  )
}

export default App
