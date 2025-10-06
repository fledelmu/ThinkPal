import notebook_image from "../assets/images/notebook_img.png"
import add_icon from "../assets/icons/add_icon.png"
import close_icon from "../assets/icons/close_icon.png"
import close_icon_hover from "../assets/icons/close_icon_hovered.png"
import save_icon from "../assets/icons/save_icon.png"
import save_icon_hover from "../assets/icons/save_hovered.png"
import quiz_icon from "../assets/icons/quiz_add_icon.png"
import quiz_icon_hover from "../assets/icons/quiz_add_hovered.png"
import elaborate_icon from "../assets/icons/elaborate_icon.png"
import elaborate_hovered from "../assets/icons/elaborate_hovered.png"
import { useState, useRef, useEffect } from "react"
import ReactQuill, { Quill } from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"
import { useDropzone } from "react-dropzone"
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import dayjs from "dayjs"
import { useLoading } from "../components/LoadingContext"

import {
  postNote,
  getSelectedNote,
  updateNote,
  postTitle,
  getTitle,
  getSelectedTitle,
  updateTitle,
  getTitleNum,
  generateQuiz,
  elaborateNote,
  deleteNote,
  deleteTitle
} from "../utils/api.js"

// Set the worker source for PDF.js - using a more reliable CDN path
GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
const nowSQL = dayjs().format("YYYY-MM-DD HH:mm:ss")

// Start of notes components
const AddNoteOptions = ({ onExit }) => {
  const [addPDFNote, showAddPDFNote] = useState(false)
  const [showAddNoteEditor, setShowAddNoteEditor] = useState(false)
  const [pdfText, setPdfText] = useState(null)


  const handlePdfTextExtracted = (text) => {
    setPdfText(text)
  }

  return (
    <>
      <div className="fixed inset-0 flex w-full h-full items-center justify-center bg-black bg-opacity-20 z-30">
        {showAddNoteEditor || pdfText ? (
          <AddNote
            note={{ notes: pdfText }}
            onExit={() => {
              setPdfText(null)
              onExit()
            }}
          />
        ) : (
          <div className="bg-rule-30 w-[50%] h-[60%] flex flex-col items-center">
            {!addPDFNote ? (
              <div className="bg-rule-bg w-full h-full flex flex-row items-center justify-center gap-5">
                <button
                  onClick={() => {
                    setPdfText("")
                    setShowAddNoteEditor(true)
                  }}
                  className="bg-rule-60 w-[25%] h-[60%] rounded-xl m-3 text-white"
                >
                  Add Note
                </button>
                <button
                  onClick={() => showAddPDFNote(true)}
                  className="bg-rule-60 w-[25%] h-[60%] rounded-xl m-3 text-white"
                >
                  Add Note via PDF
                </button>
              </div>
            ) : (
              <AddPDFNote onExit={() => showAddPDFNote(false)} onTextExtracted={handlePdfTextExtracted} />
            )}
            <div className="flex flex-row items-center justify-end w-full h-[20%] bg-rule-60">
              <button onClick={onExit} className="bg-rule-10 w-[100px] h-1 p-6 rounded-xl mr-10 flex items-center">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}



const AddPDFNote = ({ onExit, onTextExtracted }) => {
  const [pdfText, setPdfText] = useState("")

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file && file.type === "application/pdf") {
      const text = await extractTextFromPDF(file)
      setPdfText(text)
      // Call the callback with extracted text
      onTextExtracted(text)
    } else {
      alert("Please drop a valid PDF file.")
    }
  }

  const extractTextFromPDF = async (file) => {
    const pdf = await getDocument(URL.createObjectURL(file)).promise
    let text = ""
    const numPages = pdf.numPages

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items.map((item) => item.str).join(" ")
      text += pageText + "\n" // Collect the text from each page
    }
    console.log("Extracted PDF text:", text)
    return text
  }

  // Setup the dropzone for the drag-and-drop area
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".pdf",
    multiple: false,
  })

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-rule-bg">
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
  )
}

// Add Note Option #1
const AddNote = ({ onExit, note = null, onSave }) => {
  const [value, setValue] = useState("")
  const [title, setTitle] = useState("")
  const [exists, checkExistance] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [elaboratedContent, setElaboratedContent] = useState("")
  const [isElaborating, setIsElaborating] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [titleNum, setTitleNum] = useState(note?.title_num || null)
  const [hasChanged, setHasChanged] = useState(false)

  const { setLoading, setLoadingMessage } = useLoading()
  const quillRef = useRef(null)

  const loadData = async () => {
    if (note) {
      setValue(note.notes)
      if (note.title_num) {
        const title = await getSelectedTitle(note.title_num)
        checkExistance(true)
        setTitle(title.note_title)
        setTitleNum(note.title_num)
      }
    }
  }

  useEffect(() => {
    if (note) {
      loadData()
    }
  }, [note])

  // Quill editor toolbar options
  const Size = Quill.import("formats/size")
  Size.whitelist = ["8px", "10px", "12px", "14px", "18px", "24px", "36px", "48px", "64px", "96px", "128px"]
  Quill.register(Size, true)
  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ size: Size.whitelist }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  }

  const createQuiz = async () => {
    const editor = quillRef.current.getEditor()
    const plain_text = editor.getText().trim()
    const quizTitle = title + " Quiz"
    
    if (!plain_text) {
      alert("Cannot generate quiz from empty content.")
      return
    }

    let noteKey = titleNum

    // Save the note if it's not yet saved
    if (!noteKey) {
      console.log("No titleNum found, attempting to save note first...")
      try {
        noteKey = await handleSave()
        console.log("handleSave returned:", noteKey)

        if (!noteKey) {
          alert("Failed to save the note. Cannot generate quiz.")
          return
        }

        // Update the titleNum state with the new key
        setTitleNum(noteKey)
        console.log("Updated titleNum state to:", noteKey)
      } catch (error) {
        console.error("Error saving note:", error)
        alert("Failed to save the note. Cannot generate quiz.")
        return
      }
    }

    try {
      setLoading(true)
      setLoadingMessage("Generating quiz...")
      console.log("Generating quiz with noteKey:", noteKey)

      await generateQuiz(noteKey, quizTitle, plain_text)

      setLoadingMessage("Quiz successfully generated!")
      setTimeout(() => setLoading(false), 1500)
    } catch (error) {
      console.error("Quiz generation error:", error)
      setLoadingMessage("Failed to generate quiz.")
      setTimeout(() => setLoading(false), 1500)
    }
  }

  // Extract text from the Quill editor
  const handleSave = async () => {
    if (!hasChanged) {
      console.log("No changes detected, returning existing titleNum:", titleNum)
      return titleNum
    }

    setHasSaved(true)
    setHasChanged(false)

    const editor = quillRef.current.getEditor()
    const plain_text = editor.getText().trim()
    const html = editor.root.innerHTML.trim()

    const defaultTitle = "Untitled Note"
    const defaultContent = "<p><em>No content provided.</em></p>"

    const finalTitle = title.trim() === "" ? defaultTitle : title.trim()
    const finalContent = plain_text === "" || html === "<p><br></p>" ? defaultContent : html

    try {
      if (exists) {
        console.log("Updating existing note with titleNum:", note.title_num)
        const key = note.title_num
        await updateNote(key, finalContent)
        await updateTitle(key, finalTitle)
        return key
      } else {
        console.log("Creating new note with title:", finalTitle)
        await postTitle(finalTitle)

        
        await postNote(finalContent, finalTitle)
        const newTitleNum = await getTitleNum(finalTitle)

        console.log("Fetching title_num using getTitleNum...")
        if (!newTitleNum) {
          throw new Error("Failed to retrieve title_num from getTitleNum")
        }

        checkExistance(true)
        setTitleNum(newTitleNum)

        return newTitleNum
      }
    } catch (error) {
      console.error("Error in handleSave:", error)
      throw error
    } finally {
      setTimeout(() => setHasSaved(false), 500)
    }
  }


  return (
    <div className="fixed top-0 left-24 w-[calc(100vw-12rem)] h-screen flex items-center justify-center  z-30">
      <div className="bg-rule-bg w-[100vw] h-[95vh] rounded-xl flex flex-col">
        <div className="bg-rule-60 flex items-center h-[7%] rounded-tl-xl rounded-tr-xl gap-2 w-full">
          <button
            onClick={async () => {
              try {
                await handleSave()
              } catch (error) {
                console.error("Error saving note:", error)
              } finally {
                onExit()
              }
            }}
            className=" group relative h-[30px] w-[30px] ml-5 text-black flex items-center justify-center rounded-sm hover:bg-rule-bg transition-colors duration-200"
          >
            <img src={close_icon || "/placeholder.svg"} className="group-hover:hidden" alt="Close icon light" />
            <img
              src={close_icon_hover || "/placeholder.svg"}
              className="hidden group-hover:block"
              alt="Close icon dark"
            />
          </button>
          <button
            onClick={handleSave}
            className="group relative h-[30px] w-[30px] text-black flex items-center justify-center rounded-sm hover:bg-rule-bg transition-colors duration-200"
          >
            <img src={save_icon || "/placeholder.svg"} className="group-hover:hidden" alt="Save icon light" />
            <img
              src={save_icon_hover || "/placeholder.svg"}
              className="hidden group-hover:block"
              alt="Save icon dark"
            />
            <span className="absolute bottom-full mb-1 px-2 py-1 text-xs text-rule-60 bg-rule-bg border-2 border-rule-60 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Save
            </span>
          </button>
          <button
            onClick={createQuiz}
            className="group relative h-[30px] w-[30px] text-black flex items-center justify-center rounded-sm hover:bg-rule-bg transition-colors duration-200"
          >
            <img src={quiz_icon || "/placeholder.svg"} className="group-hover:hidden" alt="Quiz icon light" />
            <img
              src={quiz_icon_hover || "/placeholder.svg"}
              className="hidden group-hover:block"
              alt="Quiz icon dark"
            />
            <span className="absolute bottom-full mb-1 px-2 py-1 text-xs text-rule-60 bg-rule-bg border-2 border-rule-60 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Generate Quiz
            </span>
          </button>
          <button
            onClick={async () => {
              if (showPreview) {
                setShowPreview(false)
                setElaboratedContent("")
                return
              }

              const editor = quillRef.current?.getEditor()
              const plainText = editor?.getText().trim()

              if (!plainText) {
                alert("Cannot elaborate empty notes.")
                return
              }

              setIsElaborating(true)
              try {
                const result = await elaborateNote(plainText)
                setElaboratedContent(result.expanded_notes)
                setShowPreview(true)
              } catch (error) {
                alert("Failed to elaborate notes.")
              } finally {
                setIsElaborating(false)
              }
            }}
            className="group relative h-[30px] w-[30px] text-black flex items-center justify-center rounded-sm hover:bg-rule-bg transition-colors duration-200"
          >
            <img src={elaborate_icon || "/placeholder.svg"} className="group-hover:hidden" alt="Elaborate icon light" />
            <img
              src={elaborate_hovered || "/placeholder.svg"}
              className="hidden group-hover:block"
              alt="Elaborate icon dark"
            />
            <span className="absolute bottom-full mb-1 px-2 py-1 text-xs text-rule-60 bg-rule-bg border-2 border-rule-60 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Key Points
            </span>
          </button>
        </div>
        <div className="bg-rule-bg border-l-2 border-r-2 border-rule-60 w-full h-[5%] flex flex-row items-center justify-start gap-5">
          <input
            className="w-[20%] text-2xl font-bold bg-rule-bg text-rule-text mx-5 rounded-xl "
            type="text"
            placeholder=" Enter Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanged(true)
            }}
          />
        </div>
        <div className="h-[92%] flex flex-row overflow-hidden border-l-2 border-r-2 border-b-2 border-rule-60">
          {/* Quill Editor on the left */}
          <div className={showPreview ? "w-1/2" : "w-full"}>
            <ReactQuill
              ref={quillRef}
              style={{ height: "100%" }}
              theme="snow"
              value={value}
              onChange={(content, delta, source, editor) => {
                setValue(content)
                setHasChanged(true)
              }}
              modules={modules}
              placeholder="Start writing here..."
            />
          </div>

          {showPreview && (
            <div className="w-1/2 bg-rule-bg text-black p-4 overflow-auto">
              <h2 className="text-lg font-semibold mb-2">Key Points:</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: elaboratedContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const NotesList = () => {
  const [modal, popUp] = useState(false)
  const [addNote, showAddNote] = useState(false)
  const [titles, setTitle] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTitles = titles.filter((title) =>
    title.note_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Displays the list
  const loadNotes = async () => {
    try {
      const titles = await getTitle()
      setTitle(titles)
    } catch (error) {
      console.error("Bruh ", error)
    }
  }

  // Open an existing note
  const openNote = async (key) => {
    try {
      const existingNote = await getSelectedNote(key)
      console.log(existingNote)
      setSelectedNote(existingNote)
      showAddNote(true)
    } catch (error) {
      console.error("Error fetching note:", error)
    }
  }

  const handleDelete = async (titleNum) => {
    setNoteToDelete(titleNum);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTitle(noteToDelete);
      setTitle((prev) => prev.filter((note) => note.title_num !== noteToDelete));
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setShowDeleteModal(false);
      setNoteToDelete(null);
    }
  };

  useEffect(() => {
    loadNotes()
  }, [])

  return (
    <>
      <div className="flex flex-col h-[110px] w-full ">
        <h1 className="text-3xl font-bold m-4 text-rule-text">Notes</h1>
          <div className="bg-rule-60 h-full w-full rounded-xl flex items-center justify-center">
            <input
              type="text"
              placeholder="Search Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-rule-60 h-[50px] w-full rounded-xl p-4 text-white"
            />
          </div>
      </div>
      <div className="bg-rule-bg grid grid-cols-5 border-2 border-rule-60  justify-start h-full w-full rounded-xl flex-wrap overflow-y-auto">
        <button
          onClick={() => popUp(true)}
          className="bg-rule-60 h-[200px] w-[175px] m-8 rounded-xl text-rule-text flex items-center justify-center "
        >
          <img src={add_icon || "/placeholder.svg"} alt="add icon" className="w-[20%] h-[20%] rounded-xl" />
        </button>
          {filteredTitles.map((title) => (
            <div
              key={title.title_num}
              className="relative group bg-rule-60 w-[175px] m-8 h-[200px] rounded-xl text-white overflow-hidden"
            >
              <img
                src={notebook_image || "/placeholder.svg"}
                alt="notebook image"
                className="w-full h-full rounded-xl object-cover"
              />

              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl flex flex-col gap-2 items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="mb-10">{title.note_title}</h3>
                <button
                  className="text-black bg-rule-10 py-1 px-2 rounded text-sm"
                  onClick={() => openNote(title.title_num)}
                >
                  Open
                </button>
                <button
                  className="text-black bg-rule-10 py-1 px-2 mb-4 rounded text-sm"
                  onClick={() => handleDelete(title.title_num)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <AddNoteOptions
          onExit={() => {
            popUp(false)
            loadNotes()
          }}
        />
      )}

      {addNote && (
        <AddNote
          note={selectedNote}
          onExit={() => {
            showAddNote(false)
            setSelectedNote(null)
            loadNotes()
          }}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[300px] text-center">
            <h2 className="text-xl font-bold mb-4 text-rule-60">Confirm Delete</h2>
            <p className="mb-6 text-rule-text">Are you sure you want to delete this note?</p>
            <div className="flex justify-between gap-4">
              <button
                onClick={confirmDelete}
                className="bg-rule-10 text-rule-60 px-4 py-2 rounded hover:bg-rule-60 hover:text-white"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-rule-60 text-white px-4 py-2 rounded hover:bg-rule-10 hover:text-rule-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// End of notes components

const Notes = () => {
  return (
    <>
      <div className="grid grid-rows-[120px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-32 text-left">
        <NotesList />
      </div>
    </>
  )
}

export { AddNoteOptions, Notes, AddNote }
