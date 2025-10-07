import Pic from '../assets/icons/ThinkPal.png';
import notes_icon from "../assets/icons/notes_icon.png";
import notes_icon_hover from "../assets/icons/notes_icon_selected.png";
import quiz_icon from "../assets/icons/quiz_icon.png";
import quiz_icon_hover from "../assets/icons/quiz_icon_selected.png";
import dashboard_icon from "../assets/icons/dashboard_icon.png";
import dashboard_icon_hover from "../assets/icons/dashboard_icon_selected.png";
import task_icon from "../assets/icons/task_icon.png";
import task_icon_selected from "../assets/icons/task_icon_selected.png";
import logout_icon from "../assets/icons/logout_icon.png";
import logout_icon_hovered from "../assets/icons/logout_icon_hovered.png";
import { logoutUser } from '../utils/api';
import { useState } from 'react';

const LogoutModal = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-rule-bg text-rule-text w-[25%] p-6 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Confirm Logout</h1>
        <p className="mb-6 text-lg">Are you sure you want to log out?</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ setActive, activeTab, setIsLoggedIn }) => {
  const [currentBtn, setCrntBtn] = useState(null);
  const [logoutHover, setLogoutHover] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const buttons = [
    { name: "Dashboard", icon: dashboard_icon, iconHover: dashboard_icon_hover },
    { name: "Notes", icon: notes_icon, iconHover: notes_icon_hover },
    { name: "Quizzes", icon: quiz_icon, iconHover: quiz_icon_hover },
    { name: "Tasks", icon: task_icon, iconHover: task_icon_selected },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser(); // Call your backend logout
      setIsLoggedIn(false); // 👈 Return to login screen (SPA style)
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 h-full w-20 flex flex-col justify-between items-center bg-rule-60 text-white text-lg p-3 z-10">
        {/* Top Logo */}
        <div className="p-2">
          <img src={Pic} className="w-20 h-auto" alt="Sidebar Logo" />
        </div>

        {/* Middle Buttons */}
        <div className="flex flex-col w-full items-center justify-center gap-5 pt-3 pb-3 mt-3">
          {buttons.map((btn, index) => (
            <div key={index} className="relative group w-fit h-fit flex justify-center">
              <div
                className={`absolute inset-0 mx-auto w-12 h-full rounded-md bg-rule-bg transition-all duration-500 z-0
                  ${currentBtn === index || activeTab === btn.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              ></div>

              <button
                className="relative z-10 flex items-center justify-center px-3 py-2"
                onMouseEnter={() => setCrntBtn(index)}
                onMouseLeave={() => setCrntBtn(null)}
                onClick={() => setActive(btn.name)}
              >
                <img
                  src={currentBtn === index || activeTab === btn.name ? btn.iconHover : btn.icon}
                  className="w-8 h-8"
                  alt={`${btn.name} Icon`}
                />
              </button>

              <div className="absolute left-full ml-5 top-1/2 transform -translate-y-1/2 whitespace-nowrap
                bg-rule-60 text-white text-lg rounded px-2 py-1
                opacity-0 pointer-events-none
                transition-opacity duration-300
                group-hover:opacity-100 group-hover:pointer-events-auto">
                {btn.name}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Logout Button */}
        <div className="pb-3">
          <div className="relative group w-fit h-fit flex justify-center">
            <div
              className={`absolute inset-0 mx-auto w-12 h-full rounded-md bg-rule-bg transition-all duration-500 z-0
                ${logoutHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            ></div>

            <button
              className="relative z-10 flex items-center justify-center px-3 py-2"
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              onClick={() => setShowLogoutModal(true)}
            >
              <img
                src={logoutHover ? logout_icon_hovered : logout_icon}
                className="w-8 h-8"
                alt="Logout Icon"
              />
            </button>

            <div className="absolute left-full ml-5 top-1/2 transform -translate-y-1/2 whitespace-nowrap
              bg-rule-60 text-white text-lg rounded px-2 py-1
              opacity-0 pointer-events-none
              transition-opacity duration-300
              group-hover:opacity-100 group-hover:pointer-events-auto">
              Logout
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
};

export default Sidebar;
