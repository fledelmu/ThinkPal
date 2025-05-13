import axios from 'axios';

require('dotenv').config();

const URL =process.env.LOCALHOST || 'http://localhost:5000';

const postNote = async (title, note) => {
    try{
        const response = await axios.post(`${URL}/notes`, {
            note_title: title,
            note_content: note
        });
        return response.data;
    } catch (error) {
        console.error('Error posting note:', error);
        throw error;
    }
}
