import axios from 'axios';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: URL,
  withCredentials: true, 
});

// -------------------- NOTE API --------------------
const postNote = async (title_num, note) => {
  try {
    const response = await api.post('/notes', {
      title_num: title_num,
      notes: note,
    });
    return response.data;
  } catch (error) {
    console.error('Error posting note:', error.response?.data || error.message);
    throw error;
  }
};


const getNote = async () => {
  try {
    const response = await api.get('/notes');
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

const getSelectedNote = async (note_num) => {
  try {
    const response = await api.get(`/notes/${note_num}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
};

const updateNote = async (note_num, note) => {
  try {
    const response = await api.put(`/notes/${note_num}`, {
      title_num: note_num,
      notes: note,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

const deleteNote = async (note_num) => {
  try {
    const response = await api.delete(`/notes/${note_num}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// -------------------- TITLE API --------------------
const postTitle = async (title) => {
  try {
    const response = await api.post('/titles', { note_title: title });
    return response.data;
  } catch (error) {
    console.error('Error posting title:', error);
    throw error;
  }
};

const updateTitle = async (title_num, title) => {
  try {
    const response = await api.put(`/titles/${title_num}`, { note_title: title });
    return response.data;
  } catch (error) {
    console.error('Error updating title:', error);
    throw error;
  }
};

const getTitle = async () => {
  try {
    const response = await api.get('/titles');
    return response.data;
  } catch (error) {
    console.error('Error fetching titles:', error);
    throw error;
  }
};

const getTitleNum = async (title) => {
  try {
    const response = await api.get('/titles/get-num', { params: { title } });
    return response.data.title_num;
  } catch (error) {
    console.error('Error fetching title number:', error);
    throw error;
  }
};

const getSelectedTitle = async (title_num) => {
  try {
    const response = await api.get(`/titles/${title_num}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching selected title:', error);
    throw error;
  }
};

const deleteTitle = async (title_num) => {
  try {
    const response = await api.delete(`/titles/${title_num}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting title:', error);
    throw error;
  }
};

// -------------------- QUIZ API --------------------
const generateQuiz = async (title_num, title, text) => {
  try {
    const response = await api.post('/generate_quiz', {
      title_num,
      quiz_title: title,
      plain_text: text,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

const getQuizzes = async () => {
  try {
    const response = await api.get('/quizzes');
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// -------------------- DASHBOARD --------------------
const getRecents = async () => {
  try {
    const response = await api.get('/titles/sorted');
    return response.data;
  } catch (error) {
    console.error('Error fetching recents:', error);
    throw error;
  }
};

// -------------------- GROQ --------------------
const elaborateNote = async (note) => {
  try {
    const response = await api.post('/groq/elaborate_note', { note_content: note });
    return response.data;
  } catch (error) {
    console.error('Error elaborating note:', error);
    throw error;
  }
};

// -------------------- AUTH --------------------
const registerUser = async (username, password) => {
  try {
    const response = await api.post('/login/register', { username, password });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

const loginUser = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

const logoutUser = async () => {
  try {
    const response = await api.post('/logout');
    return response.data;
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export {
  postNote,
  getSelectedNote,
  getNote,
  updateNote,
  deleteNote,
  elaborateNote,
  postTitle,
  updateTitle,
  getSelectedTitle,
  getTitle,
  getTitleNum,
  deleteTitle,
  generateQuiz,
  getQuizzes,
  getRecents,
  registerUser,
  loginUser,
  logoutUser,
};
