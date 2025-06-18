
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.utils import secure_filename 
import json
import re
import PyPDF2 
import requests
import os

import google.generativeai as genai
import groq
import traceback
from datetime import datetime

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
    date_accessed = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    notes = db.relationship('Note', backref='title', lazy=True, cascade="all, delete", passive_deletes=True)

class Note(db.Model):
    __tablename__ = 'tbl_note'
    note_num = db.Column(db.Integer, primary_key=True)
    title_num = db.Column(db.Integer, db.ForeignKey('tbl_titles.title_num', ondelete="CASCADE"), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    quizzes = db.relationship('Quiz', backref='note', lazy=True, cascade="all, delete", passive_deletes=True)

class Quiz(db.Model):
    __tablename__ = 'tbl_quiz'
    quiz_num = db.Column(db.Integer, primary_key=True)
    note_num = db.Column(db.Integer, db.ForeignKey('tbl_note.note_num', ondelete="CASCADE"), nullable=False)
    quiz_title = db.Column(db.String(100), nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)

# --- Hugging Face API for Question Answering (QA) ---
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')

if not HUGGINGFACE_API_KEY:
    print("WARNING: HUGGINGFACE_API_KEY not found in environment variables. Hugging Face QA API features might be unavailable.")

QA_API_URL = "https://api-inference.huggingface.co/models/google-bert/bert-large-uncased-whole-word-masking-finetuned-squad"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}


# Helper function to make requests to the Hugging Face Inference API
def query_hf_api(api_url, payload):
    if not HUGGINGFACE_API_KEY:
        print("Error: Hugging Face API token is not set. Cannot make API call for QA.")
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
        gemini_model = genai.GenerativeModel('gemini-1.5-flash-8b')
        print("Gemini 1.5 Flash-8B model initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini model: {e}")
        print("Ensure your API key is correct and the model name is valid for your region.")
        gemini_model = None
else:
    print("GEMINI_API_KEY not found in environment variables. Gemini features will be unavailable.")
    gemini_model = None

# --- Groq AI Client ---
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = groq.Groq(api_key=GROQ_API_KEY)
        GROQ_MODEL_NAME = "llama3-8b-8192" 
        print(f"Groq client initialized with model: {GROQ_MODEL_NAME}.")
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        groq_client = None
        GROQ_MODEL_NAME = None
else:
    print("GROQ_API_KEY not found in environment variables. Groq AI features will be unavailable.")


@app.route('/')
def home():
    return "Server is running!"

# Utility: Save AI-generated quizzes to DB
def save_ai_quiz_to_db(note_num, quiz_title, qa_pairs):
    for pair in qa_pairs:
        quiz = Quiz(
            note_num=note_num, 
            quiz_title=quiz_title,
            question=pair['question'], 
            answer=pair['answer'])
        db.session.add(quiz)
    db.session.commit()

def generate_questions_and_answers_with_gemini(text, num_questions=5):
    """
    Generate both questions and answers using Gemini in one go
    """
    try:
        prompt = f"""
        Based on the following text, generate {num_questions} question-answer pairs for a quiz.
        
        Requirements:
        - Questions should be clear and answerable from the text
        - Questions should test understanding of key concepts
        - Avoid yes/no questions
        - Make sure questions are derived from the original text 
        - Your questions should be about the text and do not ask questions such as "What is the text?" or "What is the text about?"
        - Do not create questions that refer to the text as "the text" or "the content", use the actual text provided
        - The answers should be words from the text, not explanations or interpretations
        - Do not generate sentence answers only one word answers
        - Do not refer to the text as "the text" or "the content", use the actual text provided because the user cannot see the text in the quiz screen
        - Return one question per line, no numbering
        - Answers should be specific and directly derived from the text    
        - Return in JSON format as an array of objects with "question" and "answer" keys
        
        Text: {text}
        
        Return ONLY a valid JSON array in this exact format:
        [
            {{"question": "What is...", "answer": "The answer is..."}},
            {{"question": "How does...", "answer": "It works by..."}}
        ]
        """
        
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            qa_pairs = json.loads(json_str)
            return qa_pairs
        else:
            print(f"--- Debug: Could not extract JSON from Gemini response: {response_text} ---")
            return []
            
    except json.JSONDecodeError as e:
        print(f"--- Debug: JSON parsing error: {e} ---")
        return []
    except Exception as e:
        print(f"--- Debug: Error generating questions with Gemini: {e} ---")
        return []

@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    data = request.get_json()
    title_num = data.get('title_num')
    quiz_title = data.get('quiz_title')
    note = None
    if title_num:
        note = Note.query.get(title_num)
        if not note:
            print(f"--- Debug: Error: Note with title_num={title_num} does not exist. ---")
            return jsonify({'error': f'Note with note_num={title_num} does not exist.'}), 404
    else:
        print("--- Debug: Error: title_num is required. ---")
        return jsonify({'error': 'title_num is required to fetch notes for quiz generation.'}), 400
    
    input_text = note.notes
    print(f"\n--- Debug: Fetched Note Content (first 200 chars): {input_text[:200] if input_text else 'EMPTY'} ---")
    print(f"--- Debug: Fetched Note Content Length: {len(input_text) if input_text else 0} ---")
    
    if not input_text.strip():
        print("--- Debug: Input text is empty or only whitespace. ---")
        return jsonify({'message': 'Provided notes are empty, cannot generate quiz.', 'quiz': []}), 200
    
    try:
        # Option 1: Generate both questions and answers with Gemini
        qa_pairs = generate_questions_and_answers_with_gemini(input_text)
        
        print(f"\n--- Debug: Final QA Pairs collected: {qa_pairs} (Count: {len(qa_pairs)}) ---")
        
        if not qa_pairs:
            print("--- Debug: No complete QA pairs could be generated. ---")
            return jsonify({'message': 'Quiz generated, but no valid question-answer pairs could be formed.', 'quiz': []}), 200
        
        # Save to database (assuming you have this function)
        save_ai_quiz_to_db(note.note_num, quiz_title, qa_pairs)
        
        # Return in the exact same format as your original endpoint
        return jsonify({'message': 'Quiz generated and saved', 'quiz': qa_pairs})
        
    except Exception as e:
        print(f"--- Debug: Error during quiz generation: {e} ---")
        return jsonify({'error': f'Failed during quiz generation: {str(e)}'}), 500


# Utility: PDF to plain text (kept for completeness, though not used in this specific endpoint)
def pdf_to_text(pdf_path, txt_path):
    with open(pdf_path, 'rb') as pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
    with open(txt_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write(text)
    return txt_path

# Endpoint to elaborate notes using Gemini and fact-check with Groq AI
@app.route('/gemini/elaborate_note', methods=['POST'])
def gemini_elaborate_note():
    if not gemini_model:
        return jsonify({'error': 'Gemini model not initialized. Check API key.'}), 500
    if not groq_client:
        return jsonify({'error': 'Groq client not initialized. Check API key.'}), 500

    data = request.get_json()
    note_content = data.get('note_content')

    if not note_content:
        return jsonify({'error': 'No note_content provided for elaboration.'}), 400

    try:
        # --- Stage 1: Initial Elaboration by Gemini ---
        print("--- Debug: Stage 1: Gemini highlighting notes (strict, with <br> for new lines)...")
        prompt_gemini_elaborate = f"""Review the following study notes provided below.
        Highlight the important information in bullet form.
        **Do not add any new information; just focus on extracting and rephrasing the existing content.**
        Each bullet point should represent a key piece of information.

        **Return the response as raw HTML**, using appropriate HTML tags like `<ul>`, `<li>`, `<strong>`. For any new lines or breaks *within* a bullet point's text content, use `<br>` tags explicitly.
        *Do not wrap the HTML in markdown code blocks. Format new lines properly too.*

        Study Notes:
        {note_content}
        """
        response_gemini_elaborate = gemini_model.generate_content(prompt_gemini_elaborate)
        elaborated_notes_gemini_1 = response_gemini_elaborate.text
        print("--- Debug: Stage 1: Gemini elaboration complete.")

        # --- Stage 2: Source Fidelity Check by Groq AI ---
        print(f"--- Debug: Stage 2: Groq AI ({GROQ_MODEL_NAME}) performing STRICTER source fidelity check with percentage...")
        prompt_groq_fidelity_check = f"""You are an AI assistant specializing in text fidelity and source verification. Your task is to rigorously compare the 'Expanded Notes' (generated by another AI, potentially in HTML) strictly against the 'Original User Notes'.

        Your primary goal is to assess the percentage of content in 'Expanded Notes' that is a **direct reformulation or exact extraction** of information *solely from* 'Original User Notes'.

        **Any sentence, phrase, or piece of information in the 'Expanded Notes' that introduces new concepts, external details, deeper explanations, examples not present, or interpretations NOT directly stated in the 'Original User Notes' should significantly decrease the confidence percentage.** Even if factually correct, if it's not a direct derivation, it should count heavily against fidelity.

        Consider the ratio of derived content to added content. A higher percentage means almost all expanded content is a direct echo of the original.

        **Respond ONLY with a number (0-100) followed immediately by a '%' sign (e.g., '65%').** Do not include any other text or explanation.

        ---
        Original User Notes:
        {note_content}

        ---
        Expanded Notes (from Gemini, potentially HTML):
        {elaborated_notes_gemini_1}
        """

        response_groq_fidelity_check = groq_client.chat.completions.create(
            model=GROQ_MODEL_NAME,
            messages=[
                {"role": "user", "content": prompt_groq_fidelity_check}
            ],
            max_tokens=10,
            temperature=0.0,
        )
        groq_percentage_output = response_groq_fidelity_check.choices[0].message.content.strip()
        print(f"--- Debug: Stage 2: Groq AI source fidelity check complete. Raw Groq output: '{groq_percentage_output}'")

        # --- Stage 3: Parse Groq's Percentage Output and Assign to Confidence Level ---
        print("--- Debug: Stage 3: Parsing Groq's percentage and assigning to Confidence Level...")
        confidence_level = None
        try:
            if groq_percentage_output.endswith('%'):
                confidence_level = int(groq_percentage_output[:-1])
            else:
                confidence_level = int(groq_percentage_output)
            if not (0 <= confidence_level <= 100):
                confidence_level = None
        except ValueError:
            print(f"--- Warning: Could not parse '{groq_percentage_output}' into a valid percentage. ---")
            confidence_level = None

        print(f"--- Debug: Stage 3: Final Confidence Level: '{confidence_level}'")

        # --- Stage 4: Generate new key points if Confidence Level is below 80% ---
        strictly_original_key_points = None
        if confidence_level is not None and confidence_level < 80:
            print("--- Debug: Confidence Level below 80%. Generating strictly original key points...")
            prompt_strictly_original_key_points = f"""Review the following study notes.
            Extract only the most essential key concepts and information **directly stated** in these notes.
            Do NOT add any interpretation, explanation, or external information.
            Present these essential key points as a bulleted list.

            Return the response as raw HTML, using appropriate HTML tags like `<ul>`, `<li>`, `<strong>`. For any new lines or breaks *within* a bullet point's text content, use `<br>` tags explicitly.
            *Do not wrap the HTML in markdown code blocks. Format new lines properly too.*

            Study Notes:
            {note_content}
            """
            response_strict_key_points = gemini_model.generate_content(prompt_strictly_original_key_points)
            strictly_original_key_points = response_strict_key_points.text
            print("--- Debug: Strictly original key points generated.")

        # --- Return combined result ---
        response_data = {
            'expanded_notes': elaborated_notes_gemini_1,
            'Confidence Level': confidence_level
        }
        if strictly_original_key_points:
            response_data['strictly_original_key_points'] = strictly_original_key_points

        return jsonify(response_data)

    except Exception as e:
        print(f"--- Debug: Error during elaboration and fact-check process: {e} ---")
        return jsonify({'error': f'Failed to elaborate and fact-check notes: {str(e)}'}), 500

# CRUD API ENDPOINTS

# titles
@app.route('/titles', methods=['GET'])
def get_titles():
    titles = Title.query.all()
    return jsonify([{'title_num': t.title_num, 'note_title': t.note_title} for t in titles])

@app.route('/titles/sorted', methods=['GET'])
def get_titles_sorted():
    titles = Title.query.order_by(Title.date_accessed.desc()).all()
    return jsonify([
        {
            'title_num': t.title_num,
            'note_title': t.note_title,
            'date_accessed': t.date_accessed
        } for t in titles
    ])

@app.route('/titles/get-num', methods=['GET'])
def get_title_num():
    title = request.args.get('title')

    if not title:
        return jsonify({'error': 'Missing title parameter'}), 400

    result = Title.query.filter(Title.note_title == title).first()

    if not result:
        return jsonify({'error': 'Title not found'}), 404

    return jsonify({'title_num': result.title_num})

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
    title.date_accessed = datetime.now()
    db.session.commit()
    return jsonify({'title_num': title.title_num, 'note_title': title.note_title, 'date_accessed': title.date_accessed})

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
        {'quiz_num': q.quiz_num, 'note_num': q.note_num, 'quiz_title': q.quiz_title, 'question': q.question, 'answer': q.answer} for q in quizzes
    ])

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)