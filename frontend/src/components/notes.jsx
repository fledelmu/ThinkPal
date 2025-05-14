import notebook_image from '../assets/images/notebook_img.png';
import add_icon from '../assets/icons/add_icon.png';
import { useState, useRef, useEffect, use } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import { postNote, getSelectedNote, getNote,updateNote, postTitle, getTitle, getSelectedTitle, updateTitle, generateQuiz} from '../utils/api.js';

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
const AddNoteOptions = ({ onExit, onAddNote}) => {
    const [addPDFNote, showAddPDFNote] = useState(false);

    return(
        <>
            <div className='fixed inset-0 flex w-full h-full items-center justify-center bg-black bg-opacity-20 z-50'>
                <div className='bg-rule-30 w-[50%] h-[60%] flex flex-col items-center'>
                    {!addPDFNote ? (
                        <div className="bg-rule-60 w-full h-full flex flex-row items-center justify-center gap-5">
                            <button
                                onClick={onAddNote}
                                className="bg-rule-30 w-[25%] h-[60%] rounded-xl m-3 text-white"
                            >
                                Add Note
                            </button>
                            <button
                                onClick={() => showAddPDFNote(true)}
                                className="bg-rule-30 w-[25%] h-[60%] rounded-xl m-3 text-white"
                            >
                                Add Note via PDF
                            </button>
                        </div>
                    ) : (
                        <AddPDFNote onExit={() => showAddPDFNote(false)} />
                    )}
                    <div className='flex flex-row items-center justify-end w-full h-[20%] bg-rule-30'>
                        <button onClick={onExit} className='bg-rule-10 w-[100px] h-1 p-6 rounded-xl mr-10 flex items-center'>Cancel</button>
                    </div>

                </div>
            </div>
        </>
    )
}


const AddPDFNote = ({ onExit, onAddNote }) => {
    const [pdfText, setPdfText] = useState("");

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === 'application/pdf') {
            const text = await extractTextFromPDF(file);
            setPdfText(text); // Set the PDF content to be used in the Quill editor
            onAddNote(text); // Pass this text to the AddNote component (Quill editor)
        } else {
            alert("Please drop a valid PDF file.");
        }
    };

    const extractTextFromPDF = async (file) => {
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        let text = '';
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + "\n"; // Collect the text from each page
        }
        return text;
    };

    // Setup the dropzone for the drag-and-drop area
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: '.pdf',
        multiple: false,
    });

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-rule-60">
            {!pdfText ? (
                <div 
                    {...getRootProps()} 
                    className="p-8 border-dashed border-2 border-gray-500 w-3/4 h-3/4 flex items-center justify-center cursor-pointer rounded-lg"
                >
                    <input {...getInputProps()} />
                    <p className="text-center">Drag and drop your PDF file here</p>
                </div>
            ) : (
                <div className="w-4/5 h-4/5 overflow-auto p-4 border border-gray-300 rounded-lg">
                    <p className="font-bold mb-2">Extracted Text:</p>
                    <pre className="whitespace-pre-wrap">{pdfText}</pre>
                </div>
            )}
        </div>
    );
};


// Add Note Option #1
const AddNote = ({ onExit, note=null, onSave }) => {
    const [value, setValue] = useState('');
    const [title, setTitle] = useState('');
    const [exists, checkExistance] = useState(false);
    const quillRef = useRef(null);

    const loadData = async () => {
            if (note) {
                setValue(note.notes);
                const title = await getSelectedTitle(note.title_num);
                checkExistance(true);
                setTitle(title.note_title);
            }
        }

    useEffect(() => {
        console.log("Note received:", note);
        
        loadData();
    }, [note]);

    // Quill editor toolbar options
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

    // Extract text from the Quill editor
    const handleSave = async () => {
        const editor = quillRef.current.getEditor();
        const plain_text = editor.getText().trim();
        const html = editor.root.innerHTML.trim();
        

        const defaultTitle = 'Untitled Note';
        const defaultContent = '<p><em>No content provided.</em></p>';


        const finalTitle = title.trim() === '' ? defaultTitle : title.trim();
        const finalContent = (plain_text === '' || html === '<p><br></p>') ? defaultContent : html;

        if (exists) {
            const key = note.title_num;
            updateNote(key, finalContent)
            updateTitle(key, finalTitle);
            generateQuiz(key, plain_text);
        } else {
            postTitle(finalTitle);
            postNote(finalContent); 
        }

        
    }

    return (
        <div className='fixed top-0 left-[13.5rem] w-[calc(100vw-13.5rem)] h-screen flex items-center justify-center  z-50'>
            <div className='bg-rule-60 w-[85vw] h-[95vh] rounded-xl flex flex-col'>
                <div className="bg-rule-30 flex items-center h-[7%] rounded-tl-xl rounded-tr-xl w-full">
                    <button onClick={onExit} className='bg-rule-10 h-[30px] w-[50px] m-8 text-black flex items-center justify-center'>
                        Exit
                    </button>
                    <button onClick={handleSave} className='bg-rule-10 h-[30px] w-[50px] text-black flex items-center justify-center'>
                        Save
                    </button>
                </div>
                <div className='bg-rule-60 w-full h-[5%] flex flex-row items-center justify-start gap-5 '>
                        <h2 className='text-2xl m-5 font-bold text-rule-30'>Title:</h2>
                        <input 
                        className='border-2 w-[20%]' 
                        type='text' 
                        placeholder='Enter Title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                <div className='h-[92%] overflow-y-hidden'>
                    <ReactQuill
                    ref={quillRef}
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
    const [modal, popUp] = useState(false);
    const [addNote, showAddNote] = useState(false);
    const [titles, setTitle] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);


    // Displays the list
    const loadNotes = async () => {
        try{
            const titles = await getTitle();
            setTitle(titles);
        } catch (error) {
            console.error('Bruh ', error);
        }
    }  

    // Open an existing note
    const openNote = async (key) => {
        try{
            const existingNote = await getSelectedNote(key);
            console.log(existingNote);
            setSelectedNote(existingNote);
            showAddNote(true);
        } catch (error) {
            console.error('Error fetching note:', error);
        }
    };

    useEffect(() => {
        loadNotes();
    }, []);

    return(
        <>
            <div className='bg-rule-60 grid grid-cols-5 justify-start h-full w-full rounded-xl overflow-x-auto'>
                <button onClick={() => popUp(true)} className='bg-rule-30 h-[200px] w-[175px] m-8 rounded-xl text-white flex items-center justify-center '>
                    <img src={add_icon} alt='add icon' className='w-[20%] h-[20%] rounded-xl'/>
                </button>   
                {titles.map((title) => (
                    <div key={title.title_num} className='relative group bg-rule-30 w-[175px] h-[200px] m-8 rounded-xl text-white overflow-hidden'>
                        <img
                            src={notebook_image}
                            alt='notebook image'
                            className='w-full h-full rounded-xl object-cover'
                        />

                        {/* Overlay on hover */}
                        <div className='absolute inset-0 bg-black bg-opacity-20 rounded-xl flex flex-col gap-2 items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <h3 className='mb-10'>{title.note_title}</h3>
                            <button
                                className='text-black bg-rule-10 px-3 m-5 py-1 rounded'
                                onClick={() => openNote(title.title_num)}
                            >
                                Open
                            </button>
                        </div>
                    </div>
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

            {addNote && (<AddNote 
                note={selectedNote}
                onExit={() => {
                    showAddNote(false);
                    setSelectedNote(null);
                    loadNotes();
                }}/>
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