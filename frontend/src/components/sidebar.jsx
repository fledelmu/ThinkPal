import Pic from '../assets/icons/ThinkPal.png';
import notes_icon from "../assets/icons/notes_icon.png"
import notes_icon_hover from "../assets/icons/notes_icon_selected.png"
import quiz_icon from "../assets/icons/quiz_icon.png"
import quiz_icon_hover from "../assets/icons/quiz_icon_selected.png"
import { useState } from 'react';

const Sidebar = ({ setActive }) => {
    const [currentBtn, setCrntBtn] = useState(null);


    return(
        <>
            <div className='fixed top-0 left-0 h-full w-32 flex flex-col bg-rule-60 text-white text-lg p-3'>
                <div className='p-2'>
                    <img src={Pic} className="w-28 h-auto" alt="Sidebar Logo" />
                </div>
                <div className='flex flex-col w-full gap-5 mt-3 border-b-2  border-rule-text pb-3'>
                    <button
                    className="hover:bg-rule-bg hover:text-black"
                    onMouseEnter={() => setCrntBtn(1)}
                    onMouseLeave={() => setCrntBtn(null)}
                    onClick={() => setActive("Notes")}
                    >
                    <img
                        src={currentBtn === 1 ? notes_icon_hover : notes_icon}
                        className="w-6 h-6 inline-block mr-2"
                        alt="Notes Icon"
                    />
                    </button>
                    <button className='hover:bg-white hover:text-black'
                    onMouseEnter={() => setCrntBtn(2)}
                    onMouseLeave={() => setCrntBtn(null)}
                    onClick={() => setActive("Quizes")}>
                        <img src={currentBtn === 2 ? quiz_icon_hover : quiz_icon} 
                        className="w-6 h-6 inline-block mr-2" 
                        alt="Quiz Icon" />
                    </button>
                </div>
            </div>                                                
        </>
    )
}

export default Sidebar