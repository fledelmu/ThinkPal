import './App.css';
import Sidebar from './components/sidebar';
import { Dashboard } from './components/dashboard';
import Quiz from './components/quiz';
import { Notes } from './components/notes';
import Tasks from './components/tasks';
import Admin from './components/admin'; // import admin screen
import { useState, useEffect } from 'react';
import { LoadingProvider } from './components/LoadingContext';
import LoginScreen from './components/login';
import { getCurrentUser } from './utils/api';

function App() {
  const [activeTab, setActive] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    if (isLoggedIn) fetchUser();
  }, [isLoggedIn]);

  // Listen to custom navigation events
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
        <Sidebar
          setActive={setActive}
          activeTab={activeTab}
          setIsLoggedIn={setIsLoggedIn}
          currentUser={currentUser} // pass current user to Sidebar
        />
        <div className='ml-20 w-full p-4'>
          {activeTab === "Dashboard" && <Dashboard />}
          {activeTab === "Quizzes" && <Quiz />}
          {activeTab === "Notes" && <Notes />}
          {activeTab === "Tasks" && <Tasks />}
          {activeTab === "Admin" && currentUser?.role === "admin" && <Admin />}
        </div>
      </div>
    </LoadingProvider>
  );
}

export default App;
