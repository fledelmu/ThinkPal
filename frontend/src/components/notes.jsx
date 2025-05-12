import notebook_image from '../assets/images/notebook_img.png';
import add_icon from '../assets/icons/add_icon.png';
import { useState } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Start of search components
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
// End of search components

// Start of notes components
const AddNoteOptions = ({ onExit, onAddNote }) => {
    return(
        <>
            <div className='fixed inset-0 flex w-full h-full items-center justify-center bg-black bg-opacity-20 z-50'>
                <div className='bg-rule-30 w-[50%] h-[60%] flex flex-col items-center'>
                    <div className='bg-rule-60 w-full h-[100%] flex flex-row items-center justify-center gap-5'>
                        <button onClick={onAddNote} className='bg-rule-30 w-[25%] h-[60%] rounded-xl m-3 text-white'>Add Note</button>
                        <button className='bg-rule-30 w-[25%] h-[60%] rounded-xl m-3 text-white'>Add Note via PDF</button>
                    </div>
                    <div className='flex flex-row items-center justify-end w-full h-[20%] bg-rule-30'>
                        <button onClick={onExit} className='bg-rule-10 w-[100px] h-1 p-6 rounded-xl mr-10 flex items-center'>Cancel</button>
                    </div>
                    
                </div>
            </div>
        </>
    )
}

const AddNote = ({ onExit }) => {
    const [value, setValue] = useState('');
    const Size = Quill.import('formats/size');
    Size.whitelist = ['8px', '10px', '12px', '14px', '18px', '24px', '36px', '48px', '64px', '96px', '128px'];
    Quill.register(Size, true);
    const modules = {
        toolbar: [
            [{ 'font': [] }],
            [{ 'size': Size.whitelist }],
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    };
    return (
        <div className='fixed top-0 left-[13.5rem] w-[calc(100vw-13.5rem)] h-screen flex items-center justify-center  z-50'>
            <div className='bg-rule-60 w-[85vw] h-[95vh] rounded-xl flex flex-col'>
                <div className="bg-rule-30 flex items-center h-[7%] rounded-tl-xl rounded-tr-xl w-full">
                    <button onClick={onExit} className='bg-rule-10 h-[30px] w-[50px] m-8 text-black flex items-center justify-center'>
                        Exit
                    </button>
                </div>
                <div className='h-[92%] overflow-y-hidden'>
                    <ReactQuill
                    style={{ height: "100%" }}
                    theme="snow"
                    value={value}
                    onChange={setValue}
                    modules={modules}
                    placeholder="Start writing here..."
                    />
            </div>
            </div>
            
        </div>
    );
};

const NotesList = () => {   
    const items = Array(10).fill("");
    const [modal, popUp] = useState(false);
    const [addNote, showAddNote] = useState(false);

    return(
        <>
            <div className='bg-rule-60 grid grid-cols-5 justify-start h-full w-full rounded-xl overflow-x-auto'>
                <button onClick={() => popUp(true)} className='bg-rule-30 h-[200px] w-[175px] m-8 rounded-xl text-white flex items-center justify-center '>
                    <img src={add_icon} alt='add icon' className='w-[20%] h-[20%] rounded-xl'/>
                </button>   
                {items.map((_, idx) => (
                    <button key={idx} className='bg-rule-30 w-[175px] h-[200px] m-8 rounded-xl text-white'>
                        <img src={notebook_image} alt='notebook image' className='w-full h-full rounded-xl'/>
                    </button>
                ))}
                
            </div>

            {modal && (
                <AddNoteOptions onExit={() => popUp(false)}
                onAddNote={() => {
                    showAddNote(true);
                    popUp(false);
                }}
                />
            )}

            {addNote && (
                <AddNote onExit={() => showAddNote(false)}/>
            )}
        </>
        
    )
}
// End of notes components

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