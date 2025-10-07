import Pic from '../assets/icons/ThinkPal.png';
import notes_icon from "../assets/icons/notes_icon.png";
import notes_icon_hover from "../assets/icons/notes_icon_selected.png";
import quiz_icon from "../assets/icons/quiz_icon.png";
import quiz_icon_hover from "../assets/icons/quiz_icon_selected.png";
import dashboard_icon from "../assets/icons/dashboard_icon.png";
import dashboard_icon_hover from "../assets/icons/dashboard_icon_selected.png";
import task_icon from "../assets/icons/task_icon.png"
import task_icon_selected from "../assets/icons/task_icon_selected.png"

import { useState } from 'react';

const Sidebar = ({ setActive, activeTab }) => {
  const [currentBtn, setCrntBtn] = useState(null);

  const buttons = [
    { name: "Dashboard", icon: dashboard_icon, iconHover: dashboard_icon_hover },
    { name: "Notes", icon: notes_icon, iconHover: notes_icon_hover },
    { name: "Quizzes", icon: quiz_icon, iconHover: quiz_icon_hover },
    { name: "Tasks", icon: task_icon, iconHover: task_icon_selected },
  ];

  return (
    <div className='fixed top-0 z-10 left-0 h-full w-20 flex flex-col items-center bg-rule-60 text-white text-lg p-3'>
      <div className='p-2'>
        <img src={Pic} className="w-20 h-auto" alt="Sidebar Logo" />
      </div>

      <div className='flex-grow flex flex-col w-full items-center justify-center gap-5 pt-3 pb-3 mt-3'>
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
    </div>
  );
};

export default Sidebar;
