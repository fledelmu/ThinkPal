import add_note_icon from "../assets/icons/dashboard_add_note_icon.png"
import quiz_icon from "../assets/icons/quiz_icon_large.png"
import notebook_image from "../assets/images/notebook_img.png"
import { getRecents } from "../utils/api";
import { useState, useEffect } from 'react';
import { AddNoteOptions } from "./notes.jsx"

// Dashboard Component and related code
const ShortcutsContainer = () => {
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const navigateToQuiz = () => {
        // Instead of changing the hash, use the setActive prop from Sidebar
        // We'll dispatch a custom event to communicate with App
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Quizzes' }));
    };
    return(
        <div className='bg-rule-bg h-full w-full flex flex-row items-center justify-start space-x-10 '>
            <button className='bg-rule-60 w-[15%] h-full flex items-center justify-center rounded-xl text-white'
                onClick={() => setShowAddNoteModal(true)}>
                <img src={add_note_icon}/>
            </button>
            <button className='bg-rule-60 w-[15%] h-full flex items-center justify-center rounded-xl text-white'
                onClick={navigateToQuiz}>
                <img src={quiz_icon}/>
            </button>
            {showAddNoteModal && (
                <AddNoteOptions onExit={() => setShowAddNoteModal(false)} />
            )}
        </div>
    )
}

const Priority = () => {
    return(
        <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
            <h1>Priority</h1>
        </div>
    )
}

// Shows deadlines
const Shortcuts = () => {
    return(
        <div className='grid grid-cols-1 gap-4 h-full w-full'>
            <div className='h-full flex flex-col justify-start text-left'>
                <h1 className='text-3xl font-bold m-4 text-rule-text'>Shortcuts</h1>
                <ShortcutsContainer />
            </div>
        </div>
    )
}

const Recents = () => {
    const [recents, setRecents] = useState([]);

    useEffect(() => {
        const fetchRecents = async () => {
            try {
                const data = await getRecents();
                setRecents(data);
            } catch (error) {
                console.error("Failed to fetch recents:", error);
            }
        };

        fetchRecents();
    }, []);

    return (
        <div className='h-full w-full flex flex-col text-left'>
            <h1 className='text-3xl font-bold m-4 text-rule-text'>Recently Opened</h1>
            <div className='bg-rule-bg border-2 border-rule-60 h-full w-full rounded-xl flex flex-wrap items-start justify-start overflow-y-auto p-4'>
                {recents.length === 0 ? (
                    <div className="text-rule-30 w-full text-center mt-10">No recent notes.</div>
                ) : (
                    recents.map((title) => (
                        <div
                            key={title.title_num}
                            className="relative group bg-rule-60 w-[175px] m-4 h-[200px] rounded-xl text-white overflow-hidden"
                        >
                            <img
                                src={notebook_image}
                                alt="notebook"
                                className="w-full h-full rounded-xl object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl flex flex-col gap-2 items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <h3 className="mb-10">{title.note_title}</h3>
                                <button
                                    className="text-black bg-rule-10 px-3 m-5 py-1 rounded"
                                    onClick={() => {/* openNote(title.title_num) */}}
                                >
                                    Open
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// main()   
const Dashboard = () => {
    return (
        <div className="grid grid-rows-[150px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-32 text-left">
            <Shortcuts />
            <Recents/>
        </div>
    )
}

export { Dashboard };