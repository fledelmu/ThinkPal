import './App.css'
import Sidebar from './components/sidebar'
import { Dashboard } from './components/dashboard'
import Goals from './components/goals'
import Routines from './components/routines'
import { Notes } from './components/notes'

import { useState } from 'react'

function App() {
  const [activeTab, setActive] = useState("Dashboard")

  return (
    <> 

      <div className='flex bg-rule-bg w-screen h-screen'>
        <Sidebar setActive={setActive} />

        <div>
          {activeTab === "Dashboard" && <Dashboard/>}
          {activeTab === "Goals" && <Goals/>}
          {activeTab === "Routines" && <Routines/>}
          {activeTab === "Notes" && <Notes/>}
        </div>
      </div>

    </>
  )
}

export default App