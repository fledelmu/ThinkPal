import { loginUser, registerUser } from '../utils/api';
import { useState, useEffect } from 'react';

const Notification = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      const showTimer = setTimeout(() => setVisible(true), 10);
      const hideTimer = setTimeout(() => setVisible(false), 1800);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        px-6 py-3 rounded-xl shadow-lg text-lg font-semibold text-white
        transition-all duration-500 ease-in-out
        ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
        ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {message}
    </div>
  );
};

const LoginContext = ({
  username,
  password,
  role,
  setUsername,
  setPassword,
  setRole,
  handleLogin,
  handleRegister
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-left h-[35%] w-[30%] bg-rule-bg text-black rounded-xl p-6 shadow-lg z-10">
      <h1 className="text-2xl font-semibold mb-4">ThinkPal Login</h1>

      <div className="flex flex-col w-full">
        <label htmlFor="username" className="mb-1 font-medium text-sm">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="p-2 mb-4 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="password" className="mb-1 font-medium text-sm">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="p-2 mb-4 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="role" className="mb-1 font-medium text-sm">Role (temporary)</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="p-2 mb-6 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <div className="flex justify-between">
          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // temporary role
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 2000);
  };

  const handleRegister = async () => {
    try {
      // Pass role to registerUser
      const response = await registerUser(username, password, role);
      showNotification(`Registration Successful! (${role})`, 'success');
      console.log(response.message);
    } catch (error) {
      showNotification('Registration Unsuccessful!', 'error');
      console.error('Register failed:', error);
    }
  };
  const handleLogin = async () => {
    try {
      const response = await loginUser(username, password);
      showNotification('Login Successful!', 'success');
      setTimeout(() => {
        onLoginSuccess?.({ username, role }); // Pass role to App for testing
        setNotification({ message: '', type: '' });
      }, 2000);
    } catch (error) {
      showNotification('Login Unsuccessful!', 'error');
      setTimeout(() => setNotification({ message: '', type: '' }), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900 text-white relative overflow-hidden">
      <LoginContext
        username={username}
        password={password}
        role={role}
        setUsername={setUsername}
        setPassword={setPassword}
        setRole={setRole}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
      />
      <Notification message={notification.message} type={notification.type} />
    </div>
  );
};

export default LoginScreen;
