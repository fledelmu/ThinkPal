import notebook_image from '../assets/notebook_img.png';
import React, { useState } from 'react';

const SearchNotes = () => {
    return(
        <>  
            <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                <input type='text' 
                placeholder='Search Notes...' 
                className='bg-rule-30 h-[50px] w-full rounded-xl p-4 text-white'/>
            </div>
            
        </>
    )
}

const SearchContainer = () => {
    return(
        <div className='flex flex-col h-[110px] w-full  '>
            <h1 className='text-3xl font-bold m-4 text-rule-30'>Notes</h1>
            <SearchNotes/>
        </div>
    )
}

const AddNoteModal = ({ onExit }) => {
    return(
        <>
            <div className='fixed inset-0 flex w-full h-full items-center justify-center bg-black bg-opacity-20 z-50'>
                <div className='bg-rule-60 w-[50%] h-[50%] rounded-xl flex flex-col items-center'>
                    <div className=''></div>
                    <div className='flex flex-row bottom-0 items-center justify-center w-full h-full gap-4'>
                        <button onClick={onExit} className='bg-rule-10 w-[100px] h-1 p-6 rounded-xl'>Cancel</button>
                        <button className='bg-rule-10 w-[100px] h-1 p-6 rounded-xl'>Confirm</button>
                    </div>
                    
                </div>
            </div>
        </>
    )
}

const NotesList = () => {
    const items = Array(10).fill("");
    const [modal, popUp] = useState(false);

    return(
        <>
            <div className='bg-rule-60 grid grid-cols-5 justify-start h-full w-full rounded-xl overflow-x-auto'>
                <button onClick={() => popUp(true)} className='bg-rule-30 h-[200px] w-[175px] m-8 rounded-xl text-white'>+ notes</button>
                {items.map((_, idx) => (
                    <button key={idx} className='bg-rule-30 w-[175px] h-[200px] m-8 rounded-xl text-white'>
                        <img src={notebook_image} alt='notebook image' className='w-full h-full rounded-xl'/>
                    </button>
                ))}
                
            </div>

            {modal && (<AddNoteModal onExit={() => popUp(false)}/>)}
        </>
        
    )
}
const Notes = () => {
    return(
        <>
            <div className='grid grid-rows-[120px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-64 text-left'>
                <SearchContainer/>
                <NotesList/>
            </div>
        </>
    )
}

export { Notes };