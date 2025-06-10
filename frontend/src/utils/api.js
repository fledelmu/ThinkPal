import axios from 'axios';


const URL =import.meta.env.LOCALHOST || 'http://localhost:5000';


// Note API
const postNote = async (note) => {
    try{
        const response = await axios.post(`${URL}/notes`, {
            notes: note,
        });
        return response.data;
    } catch (error) {
        console.error('Error posting note:', error);
        throw error;
    }
}

const getNote = async () => {
    try {
        const response = await axios.get(`${URL}/notes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notes:', error);
        throw error;
    }
};

const getSelectedNote = async (note_num) => {
    try{
        const response = await axios.get(`${URL}/notes/${note_num}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notes:', error);
        throw error;
    }
} 

const updateNote = async (note_num, note) => {
    try {
        const response = await axios.put(`${URL}/notes/${note_num}`, {
            title_num: note_num,
            notes: note
        });
        return response.data;
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
};

const deleteNote = async (note_num) => {
    try {
        const response = await axios.delete(`${URL}/notes/${note_num}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
};

// Title API

const postTitle = async (title) => {
    try {
        const response = await axios.post(`${URL}/titles`, {
            note_title: title,
        });
        return response.data;
    } catch (error) {
        console.error('Error posting title:', error);
        throw error;
    }
};

const updateTitle = async (title_num, title) => {
    try {
        const response = await axios.put(`${URL}/titles/${title_num}`, {
            note_title: title,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating title:', error);
        throw error;
    }
};

const getTitle = async () => {
    try{
        const response = await axios.get(`${URL}/titles`);
        return response.data;
    } catch (error) {
        console.error('Error fetching titles:', error);
        throw error;
    }
};

const getSelectedTitle = async (title_num) => {
    try{
        const response = await axios.get(`${URL}/titles/${title_num}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching titles:', error);
        throw error;
    }
};

const generateQuiz = async (title_num, text) => {
    try {
        const response = await axios.post(`${URL}/generate_quiz`, {
            title_num: title_num,
            plain_text: text
        });
        return response.data;
    } catch (error) {
        console.error('Error generating quiz:', error);
        throw error;
    }
};

const getQuizzes = async () => {
    try {
        const response = await axios.get(`${URL}/quizzes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
    }
};

const elaborateNote = async (note) => {
    try {
        const response = await axios.post(`${URL}/gemini/elaborate_note`, {
            note_content: note
        });
        return response.data;
    } catch (error) {
        console.error('Error elaborating text:', error);
        throw error;
    }
};

const getRecents = async () => {
    try {
        const response = await axios.get(`${URL}/titles/sorted`);
        return response.data;
    } catch (error) {
        console.error('Error fetching recents:', error);
        throw error;
    }
}

export { postNote, getSelectedNote, getNote, updateNote, deleteNote, elaborateNote, // Note methods
        postTitle, updateTitle, getSelectedTitle, getTitle, // Title methods
        generateQuiz, getQuizzes, // Quiz methods
        getRecents //Dashboard
};