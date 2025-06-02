from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.utils import secure_filename

import PyPDF2
import requests 
import os
import torch 
import google.generativeai as genai
load_dotenv()


app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  

db = SQLAlchemy(app)

# Test DB connection
def test_db_connection():
    try:
        db.session.execute(text('SELECT 1'))
        print('Database connection successful!')
    except Exception as e:
        print(f'Database connection failed: {e}')

# Test DB connection at startup with app context
with app.app_context():
    test_db_connection()

class Title(db.Model):
    __tablename__ = 'tbl_titles'
    title_num = db.Column(db.Integer, primary_key=True)
    note_title = db.Column(db.String(255), nullable=False)
    notes = db.relationship('Note', backref='title', lazy=True, cascade="all, delete")

class Note(db.Model):
    __tablename__ = 'tbl_note'
    note_num = db.Column(db.Integer, primary_key=True)
    title_num = db.Column(db.Integer, db.ForeignKey('tbl_titles.title_num', ondelete="CASCADE"), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    quizzes = db.relationship('Quiz', backref='note', lazy=True, cascade="all, delete")

class Quiz(db.Model):
    __tablename__ = 'tbl_quiz'
    quiz_num = db.Column(db.Integer, primary_key=True)
    note_num = db.Column(db.Integer, db.ForeignKey('tbl_note.note_num', ondelete="CASCADE"), nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)

HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')

if not HUGGINGFACE_API_KEY:
    print("WARNING: HUGGINGFACE_API_KEY not found in environment variables. Hugging Face API features might be unavailable.")


QG_API_URL = "https://api-inference.huggingface.co/models/valhalla/t5-base-e2e-qg"
QA_API_URL = "https://api-inference.huggingface.co/models/bert-large-uncased-whole-word-masking-finetuned-squad"

HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Helper function to make requests to the Hugging Face Inference API
def query_hf_api(api_url, payload):
    # Use the correctly named API key variable here
    if not HUGGINGFACE_API_KEY:
        print("Error: Hugging Face API token is not set. Cannot make API call.")
        return None
    try:
        response = requests.post(api_url, headers=HEADERS, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API at {api_url}: {e}")
        return None

# Initialize Gemini Pro model if API key is set
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash-8b') # Changed to gemini-1.5-flash-8b
        print("Gemini 1.5 Flash-8B model initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini model: {e}")
        print("Ensure your API key is correct and the model name is valid for your region.")
        gemini_model = None
else:
    print("GEMINI_API_KEY not found in environment variables. Gemini features will be unavailable.")
    gemini_model = None

@app.route('/')
def home():
    return "Server is running!"

# Utility: Save AI-generated quizzes to DB

def save_ai_quiz_to_db(note_num, qa_pairs):
    for pair in qa_pairs:
        quiz = Quiz(note_num=note_num, question=pair['question'], answer=pair['answer'])
        db.session.add(quiz)
    db.session.commit()

# Endpoint: Generate quiz from text and save to DB

@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    data = request.get_json()
    title_num = data.get('title_num')
    text = data.get('plain_text')
    note = None
    if title_num:
        note = Note.query.get(title_num)
        if not note:
            return jsonify({'error': f'Note with note_num={title_num} does not exist.'}), 404
    else:
        return jsonify({'error': 'Either note_num or title_num is required'}), 400
    
    input_text = note.notes

    # Question Generation via API
    qg_payload = {"inputs": "e2e question generation: " + input_text}
    qg_response = query_hf_api(QG_API_URL, qg_payload)

    if qg_response is None:
        return jsonify({'error': 'Failed to generate questions from Hugging Face API (QG).'}), 500
    if not isinstance(qg_response, list) or not qg_response or 'generated_text' not in qg_response[0]:
        print(f"Unexpected QG API response format: {qg_response}")
        return jsonify({'error': 'Unexpected response format from Question Generation API.'}), 500

    decoded_output = qg_response[0]['generated_text']
    questions = [q.strip() for q in decoded_output.split("<sep>") if q.strip()]
    
    qa_pairs = []
    for question in questions:
        # Question Answering via API
        qa_payload = {
            "inputs": {
                "question": question,
                "context": input_text
            }
        }
        qa_response = query_hf_api(QA_API_URL, qa_payload)

        if qa_response is None:
            print(f"Failed to get answer for question: {question}. Skipping.")
            continue

        if not isinstance(qa_response, list) or not qa_response or 'answer' not in qa_response[0]:
            print(f"Unexpected QA API response format for question '{question}': {qa_response}. Skipping.")
            continue

        answer = qa_response[0]['answer']
        qa_pairs.append({"question": question, "answer": answer})
    

    save_ai_quiz_to_db(note.note_num, qa_pairs)
    return jsonify({'message': 'Quiz generated and saved', 'quiz': qa_pairs})

# Utility: PDF to plain text

def pdf_to_text(pdf_path, txt_path):
    with open(pdf_path, 'rb') as pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
    with open(txt_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write(text)
    return txt_path

# --- NEW: Gemini Insight Endpoints (for testing in backend) ---

@app.route('/gemini/elaborate_note', methods=['POST']) # Endpoint name changed
def gemini_elaborate_note(): # Function name changed
    if not gemini_model:
        return jsonify({'error': 'Gemini model not initialized. Check API key.'}), 500

    data = request.get_json()
    note_content = data.get('note_content')

    if not note_content:
        return jsonify({'error': 'No note_content provided for elaboration.'}), 400

    try:
        # Prompt specifically for a *brief* but meaningful elaboration
        prompt = f"""Review the following study notes. Add a small amount of relevant, clarifying detail or context to each main point, making the notes slightly more comprehensive without significantly increasing their length. Avoid deep dives or extensive new information. Focus on making existing points clearer and and adding minor, helpful expansions.

        Original Notes:
        {note_content}

        Expanded Notes:
        """
        response = gemini_model.generate_content(prompt)
        elaborated_notes = response.text # Variable name changed

        return jsonify({'elaborated_notes': elaborated_notes}) # Key name changed
    except Exception as e:
        return jsonify({'error': f'Failed to elaborate notes with Gemini: {str(e)}'}), 500
    
@app.route('/gemini/extract_insights', methods=['POST'])
def gemini_extract_insights():
    if not gemini_model:
        return jsonify({'error': 'Gemini model not initialized. Check API key.'}), 500

    data = request.get_json()
    note_content = data.get('note_content')
    if not note_content:
        return jsonify({'error': 'No note_content provided for insight extraction.'}), 400

    try:
        # Modified prompt to request HTML formatting
        prompt = f"""Analyze the following study notes and provide only the 'Key Insights' and 'Important Concepts' derived from them. Do not include sections for 'Potential Areas of Confusion' or 'Related Topics for Further Study'.

        **Format your response as valid HTML.** Use appropriate HTML tags like `<h2>`, `<ul>`, `<li>`, `<strong>`, `<p>` for clear structure and readability.

        Study Notes:\n\n{note_content}
        """
        response = gemini_model.generate_content(prompt)
        insights_html = response.text
        return jsonify({'insights_html': insights_html}) 
    except Exception as e:
        return jsonify({'error': f'Failed to extract insights with Gemini: {str(e)}'}), 500


# CRUD API ENDPOINTS 

# titles
@app.route('/titles', methods=['GET'])
def get_titles():
    titles = Title.query.all()
    return jsonify([{'title_num': t.title_num, 'note_title': t.note_title} for t in titles])

@app.route('/titles/<int:title_num>', methods=['GET'])
def get_selected_titles(title_num):
    title = Title.query.filter_by(title_num=title_num).first()
    return jsonify({
        'title_num': title.title_num, 
        'note_title': title.note_title})

@app.route('/titles', methods=['POST'])
def create_title():
    data = request.get_json()
    new_title = Title(note_title=data['note_title'])
    db.session.add(new_title)
    db.session.commit()
    return jsonify({'note_title': new_title.note_title}), 201

@app.route('/titles/<int:title_num>', methods=['PUT'])
def update_title(title_num):
    data = request.get_json()
    title = Title.query.get_or_404(title_num)
    title.note_title = data['note_title']
    db.session.commit()
    return jsonify({'title_num': title.title_num, 'note_title': title.note_title})

@app.route('/titles/<int:title_num>', methods=['DELETE'])
def delete_title(title_num):
    title = Title.query.get_or_404(title_num)
    db.session.delete(title)
    db.session.commit()
    return jsonify({'message': 'Title deleted'})

# notes
@app.route('/notes', methods=['GET'])
def get_notes():
    notes = Note.query.all()
    return jsonify([
        {'note_num': n.note_num, 'title_num': n.title_num, 'notes': n.notes} for n in notes
    ])

@app.route('/notes/<int:title_num>', methods=['GET'])
def get_selected_notes(title_num):  
    note = Note.query.filter_by(title_num=title_num).first()
    return jsonify({
        'note_num': note.note_num,
        'title_num': note.title_num, 
        'notes': note.notes
    })

@app.route('/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    latest_title = Title.query.order_by(Title.title_num.desc()).first()
    new_note = Note(title_num=latest_title.title_num, notes=data['notes'])
    db.session.add(new_note)
    db.session.commit()
    return jsonify({'note_num': new_note.note_num, 'title_num': new_note.title_num, 'notes': new_note.notes}), 201

@app.route('/notes/<int:note_num>', methods=['PUT'])
def update_note(note_num):
    data = request.get_json()
    note = Note.query.get_or_404(note_num)
    note.title_num = data['title_num']
    note.notes = data['notes']
    db.session.commit()
    return jsonify({'note_num': note.note_num, 'title_num': note.title_num, 'notes': note.notes})

@app.route('/notes/<int:note_num>', methods=['DELETE'])
def delete_note(note_num):
    note = Note.query.get_or_404(note_num)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})

# quizzes (Read only, since AI generates quizzes)
@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([
        {'quiz_num': q.quiz_num, 'note_num': q.note_num, 'question': q.question, 'answer': q.answer} for q in quizzes
    ])

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)