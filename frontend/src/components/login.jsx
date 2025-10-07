import { registerUser, loginUser } from '../utils/api';
import { useState } from 'react';

const Notification = ({ message, type }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
      px-6 py-3 rounded-xl shadow-lg text-lg font-semibold text-white transition-opacity duration-300
      ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {message}
    </div>
  );
};

const LoginContext = ({
  username,
  password,
  setUsername,
  setPassword,
  handleLogin,
  handleRegister
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-left h-[30%] w-[30%] bg-rule-bg text-black rounded-xl p-6 shadow-lg">
      <h1 className="text-2xl font-semibold mb-4">ThinkPal Login</h1>

      <div className="flex flex-col w-full">
        <label htmlFor="username" className="mb-1 font-medium text-sm">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="p-2 mb-4 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="password" className="mb-1 font-medium text-sm">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="p-2 mb-6 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

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
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 2000); // disappears after 2 seconds
  };

  const handleRegister = async () => {
    try {
      const response = await registerUser(username, password);
      console.log(`Successfully registered ${username}!`);
      showNotification('Registration Successful!', 'success');
      console.log(response.message);
    } catch (error) {
      console.error('Register failed:', error);
      showNotification('Registration Unsuccessful!', 'error');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await loginUser(username, password);
      console.log('Login successful!');
      showNotification('Login Successful!', 'success');
      console.log(response.message);
      onLoginSuccess?.(); // move to dashboard later
    } catch (error) {
      console.error('Login failed: Invalid credentials!');
      showNotification('Login Unsuccessful!', 'error');
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900 text-white relative">
      <LoginContext
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
      />
      <Notification message={notification.message} type={notification.type} />
    </div>
  );
};

export default LoginScreen;
