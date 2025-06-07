import Pic from '../assets/icons/ThinkPal.png';
import notes_icon from "../assets/icons/notes_icon.png"
import notes_icon_hover from "../assets/icons/notes_icon_selected.png"
import quiz_icon from "../assets/icons/quiz_icon.png"
import quiz_icon_hover from "../assets/icons/quiz_icon_selected.png"
import { useState } from 'react';

const Sidebar = ({ setActive, activeTab }) => {
    const [currentBtn, setCrntBtn] = useState(null);


    return(
        <>
            <div className='fixed top-0 left-0 h-full w-20 flex flex-col justify-items items-center bg-rule-60 text-white text-lg p-3'>
                <div className='p-2'>
                    <img src={Pic} className="w-20 h-auto" alt="Sidebar Logo" />
                </div>
                <div className='flex flex-col w-full items-center justify-center gap-5 mt-3 border-b-2 border-t-2 border-rule-text pt-3 pb-3'>
                    <div className="relative group w-fit h-fit flex justify-center">
                        <div 
                            className={`absolute inset-0 mx-auto w-12 h-full rounded-md bg-rule-bg transition-all duration-500 z-0
                            ${currentBtn === 1 || activeTab === "Notes" ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        ></div>
                        
                        <button
                        className="relative z-10 flex items-center justify-center px-3 py-2"
                        onMouseEnter={() => setCrntBtn(1)}
                        onMouseLeave={() => setCrntBtn(null)}
                        onClick={() => setActive("Notes")}
                        >
                        <img
                            src={currentBtn === 1 || activeTab === "Notes" ? notes_icon_hover : notes_icon}
                            className="w-8 h-8"
                            alt="Notes Icon"
                        />
                        </button>
                        <div
                            className="absolute left-full ml-5 top-1/2 transform -translate-y-1/2 whitespace-nowrap
                            bg-rule-60 text-white text-lg rounded px-2 py-1
                            opacity-0 pointer-events-none
                            transition-opacity duration-300
                            group-hover:opacity-100 group-hover:pointer-events-auto"
                        >
                            Notes
                        </div>
                    </div>
                    <div className="relative group w-fit h-fit flex justify-center">
                        <div 
                            className={`absolute inset-0 mx-auto w-12 h-full rounded-md bg-rule-bg transition-all duration-200 z-0
                            ${currentBtn === 2 || activeTab === "Quizzes" ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        ></div>

                        <button className='relative z-10 flex items-center justify-center px-3 py-2'
                        onMouseEnter={() => setCrntBtn(2)}
                        onMouseLeave={() => setCrntBtn(null)}
                        onClick={() => setActive("Quizzes")}>
                            <img src={currentBtn === 2 || activeTab === "Quizzes" ? quiz_icon_hover : quiz_icon} 
                            className="w-8 h-8"     
                            alt="Quiz Icon" />
                        </button>
                        <div
                            className="absolute left-full ml-5 top-1/2 transform -translate-y-1/2 whitespace-nowrap
                            bg-rule-60 text-white text-lg rounded px-2 py-1
                            opacity-0 pointer-events-none
                            transition-opacity duration-300
                            group-hover:opacity-100 group-hover:pointer-events-auto"
                        >
                            Quizzes
                        </div>
                    </div>
                </div>
            </div>                                                
        </>
    )
}

export default Sidebar