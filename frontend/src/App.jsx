import './App.css'
import Sidebar from './components/sidebar'
import { Dashboard } from './components/dashboard'
import Quiz from './components/quiz'
import Routines from './components/routines'
import { Notes } from './components/notes'

import { useState } from 'react'

function App() {
  //const [activeTab, setActive] = useState("Dashboard") default
  const [activeTab, setActive] = useState("Notes")
  return (
    <> 

      <div className='flex bg-rule-bg w-screen h-screen'>
        <Sidebar setActive={setActive} activeTab={activeTab} />

        <div>
          {activeTab === "Dashboard" && <Dashboard/>}
          {activeTab === "Quizzes" && <Quiz/>}
          {/*{activeTab === "Routines" && <Routines/>}*/}
          {activeTab === "Notes" && <Notes/>}
        </div>
      </div>

    </>
  )
}

export default App