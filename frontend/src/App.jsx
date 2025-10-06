import './App.css';
import Sidebar from './components/sidebar';
import { Dashboard } from './components/dashboard';
import Quiz from './components/quiz';
import { Notes } from './components/notes';
import { useState, useEffect } from 'react';
import { LoadingProvider } from './components/LoadingContext';
import LoginScreen from './components/login';

function App() {
  const [activeTab, setActive] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
    const handler = (e) => {
      if (e.type === 'navigateToTab' && e.detail) {
        setActive(e.detail);
      }
    };
    window.addEventListener('navigateToTab', handler);
    return () => window.removeEventListener('navigateToTab', handler);
  }, []);

  if (!isLoggedIn) {
    return (
      <LoadingProvider>
        <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
      </LoadingProvider>
    );
  }

  return (
    <LoadingProvider>
      <div className='flex bg-rule-bg w-screen h-screen'>
        <Sidebar setActive={setActive} activeTab={activeTab} />
        <div>
          {activeTab === "Dashboard" && <Dashboard />}
          {activeTab === "Quizzes" && <Quiz />}
          {activeTab === "Notes" && <Notes />}
        </div>
      </div>
    </LoadingProvider>
  );
}

export default App;
