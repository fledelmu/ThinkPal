
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.utils import secure_filename 
from werkzeug.security import generate_password_hash, check_password_hash
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
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')

CORS(app, origins=[frontend_url], supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))



# Test DB connection
def test_db_connection():
    try:
        db.session.execute(text('SELECT 1'))
        print('Database connection successful!')
    except Exception as e:
        print(f'Database connection failed: {e}')

class User(UserMixin, db.Model):
    __tablename__ = 'tbl_users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    titles = db.relationship('Title', backref='user', lazy=True, cascade="all, delete", passive_deletes=True)
    tasks = db.relationship('Task', backref='user', lazy=True, cascade="all, delete", passive_deletes=True)

    def get_id(self):
        return str(self.user_id)


class Title(db.Model):
    __tablename__ = 'tbl_titles'
    title_num = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('tbl_users.user_id', ondelete="CASCADE"), nullable=False)
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


class Task(db.Model):
    __tablename__ = 'tbl_tasks'
    task_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('tbl_users.user_id', ondelete="CASCADE"), nullable=False)

    task_name = db.Column(db.String(255), nullable=False)
    task_details = db.Column(db.Text, nullable=True)

    # e.g. "Pending", "In Progress", "Completed"
    status = db.Column(db.String(50), default="Pending", nullable=False)

    date_created = db.Column(db.DateTime, default=datetime.now)
    date_completed = db.Column(db.DateTime, nullable=True)


# Test DB connection at startup with app context
with app.app_context():
    db.create_all()
    test_db_connection()



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
        GROQ_MODEL_NAME = "openai/gpt-oss-120b" 
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

def generate_questions_and_answers_with_groq(text, num_questions=5):
    """
    Generate both questions and answers using Groq in one go
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

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL_NAME,  # e.g., "llama-3.1-8b-instant"
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates quizzes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,  # keep answers deterministic
        )

        response_text = response.choices[0].message.content.strip()

        # Try to extract JSON from the response
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            qa_pairs = json.loads(json_str)
            return qa_pairs
        else:
            print(f"--- Debug: Could not extract JSON from Groq response: {response_text} ---")
            return []

    except json.JSONDecodeError as e:
        print(f"--- Debug: JSON parsing error: {e} ---")
        return []
    except Exception as e:
        print(f"--- Debug: Error generating questions with Groq: {e} ---")
        return []

# Authentication routes
@app.route('/login/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    hashed_password = generate_password_hash(password)

    user = User(username=username, password=hashed_password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    login_user(user)
    return jsonify({'message': f'Welcome, {user.username}!'})


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/protected', methods=['GET'])
@login_required
def protected():
    return jsonify({'message': f'Hello {current_user.username}, you are logged in!'})

# AI Routes
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
        qa_pairs = generate_questions_and_answers_with_groq(input_text)
        
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


@app.route('/groq/elaborate_note', methods=['POST'])
def groq_elaborate_note():
    if not groq_client:
        return jsonify({'error': 'Groq client not initialized. Check API key.'}), 500

    data = request.get_json()
    note_content = data.get('note_content')

    if not note_content:
        return jsonify({'error': 'No note_content provided for elaboration.'}), 400

    try:
        # --- Stage 1: Elaboration by Groq ---
        print("--- Debug: Stage 1: Groq elaborating notes (HTML bullet points)...")
        prompt_groq_elaborate = f"""Review the following study notes provided below.
        Highlight the important information in bullet form.
        **Do not add any new information; just focus on extracting and rephrasing the existing content.**
        Each bullet point should represent a key piece of information.

        **Return the response as raw HTML**, using appropriate HTML tags like `<ul>`, `<li>`, `<strong>`. 
        For any new lines or breaks *within* a bullet point's text content, use `<br>` tags explicitly.
        *Do not wrap the HTML in markdown code blocks. Format new lines properly too. The structure of the 
        elaboration must be in bullet form.*

        Study Notes:
        {note_content}
        """

        response_groq_elaborate = groq_client.chat.completions.create(
            model=GROQ_MODEL_NAME,
            messages=[{"role": "user", "content": prompt_groq_elaborate}],
            max_tokens=1000,
            temperature=0.0
        )
        elaborated_notes = response_groq_elaborate.choices[0].message.content.strip()
        print("--- Debug: Stage 1: Groq elaboration complete. ---")

        # --- Stage 2 (Optional): Fidelity check with Groq again ---
        print(f"--- Debug: Stage 2: Groq ({GROQ_MODEL_NAME}) performing STRICT fidelity check...")

        prompt_groq_fidelity = f"""Compare the 'Expanded Notes' to the 'Original Notes'.
        Respond ONLY with a percentage (0-100%) showing how much of the Expanded Notes is a direct reformulation
        of the Original Notes without adding new information.

        Original Notes:
        {note_content}

        Expanded Notes:
        {elaborated_notes}
        """

        response_groq_fidelity = groq_client.chat.completions.create(
            model=GROQ_MODEL_NAME,
            messages=[{"role": "user", "content": prompt_groq_fidelity}],
            max_tokens=10,
            temperature=0.0,
        )   
        fidelity_score = response_groq_fidelity.choices[0].message.content.strip()

        # --- Return combined result ---
        return jsonify({
            'expanded_notes': elaborated_notes,
            'fidelity_score': fidelity_score
        })

    except Exception as e:
        print(f"--- Debug: Error during Groq elaboration process: {e} ---")
        return jsonify({'error': f'Failed to elaborate notes with Groq: {str(e)}'}), 500



# CRUD API ENDPOINTS

# ------------------ TITLES ------------------

@app.route('/titles', methods=['GET'])
@login_required
def get_titles():
    titles = Title.query.filter_by(user_id=current_user.user_id).all()
    return jsonify([
        {'title_num': t.title_num, 'note_title': t.note_title, 'user_id': t.user_id}
        for t in titles
    ])

@app.route('/titles/sorted', methods=['GET'])
@login_required
def get_titles_sorted():
    titles = Title.query.filter_by(user_id=current_user.user_id).order_by(Title.date_accessed.desc()).all()
    return jsonify([
        {
            'title_num': t.title_num,
            'note_title': t.note_title,
            'date_accessed': t.date_accessed,
            'user_id': t.user_id
        } for t in titles
    ])

@app.route('/titles/get-num', methods=['GET'])
@login_required
def get_title_num():
    title = request.args.get('title')
    if not title:
        return jsonify({'error': 'Missing title parameter'}), 400

    result = Title.query.filter_by(note_title=title, user_id=current_user.user_id).first()
    if not result:
        return jsonify({'error': 'Title not found'}), 404

    return jsonify({'title_num': result.title_num, 'user_id': result.user_id})

@app.route('/titles/<int:title_num>', methods=['GET'])
@login_required
def get_selected_titles(title_num):
    title = Title.query.filter_by(title_num=title_num, user_id=current_user.user_id).first_or_404()
    return jsonify({
        'title_num': title.title_num,
        'note_title': title.note_title,
        'user_id': title.user_id
    })

@app.route('/titles', methods=['POST'])
@login_required
def create_title():
    data = request.get_json()
    if not data.get('note_title'):
        return jsonify({'error': 'note_title is required'}), 400

    new_title = Title(
        note_title=data['note_title'],
        user_id=current_user.user_id,
        date_accessed=datetime.now()
    )
    db.session.add(new_title)
    db.session.commit()
    return jsonify({
        'title_num': new_title.title_num,
        'note_title': new_title.note_title,
        'user_id': new_title.user_id
    }), 201

@app.route('/titles/<int:title_num>', methods=['PUT'])
@login_required
def update_title(title_num):
    data = request.get_json()
    title = Title.query.filter_by(title_num=title_num, user_id=current_user.user_id).first_or_404()
    title.note_title = data.get('note_title', title.note_title)
    title.date_accessed = datetime.now()
    db.session.commit()
    return jsonify({
        'title_num': title.title_num,
        'note_title': title.note_title,
        'date_accessed': title.date_accessed,
        'user_id': title.user_id
    })

@app.route('/titles/<int:title_num>', methods=['DELETE'])
@login_required
def delete_title(title_num):
    title = Title.query.filter_by(title_num=title_num, user_id=current_user.user_id).first_or_404()
    db.session.delete(title)
    db.session.commit()
    return jsonify({'message': 'Title deleted', 'user_id': current_user.user_id})

# ------------------ NOTES ------------------

@app.route('/notes', methods=['GET'])
@login_required
def get_notes():
    notes = (
        db.session.query(Note)
        .join(Title)
        .filter(Title.user_id == current_user.user_id)
        .all()
    )
    return jsonify([
        {'note_num': n.note_num, 'title_num': n.title_num, 'notes': n.notes, 'user_id': Title.query.get(n.title_num).user_id}
        for n in notes
    ])

@app.route('/notes/<int:title_num>', methods=['GET'])
@login_required
def get_selected_notes(title_num):
    title = Title.query.filter_by(title_num=title_num, user_id=current_user.user_id).first_or_404()
    notes = Note.query.filter_by(title_num=title.title_num).all()
    return jsonify([
        {'note_num': n.note_num, 'title_num': n.title_num, 'notes': n.notes, 'user_id': title.user_id}
        for n in notes
    ])

@app.route('/notes', methods=['POST'])
@login_required
def create_note():
    data = request.get_json()
    title_num = data.get('title_num')
    note_text = data.get('notes')

    if not title_num or not note_text:
        return jsonify({'error': 'title_num and notes are required'}), 400

    title = Title.query.filter_by(title_num=title_num, user_id=current_user.user_id).first()
    if not title:
        return jsonify({'error': 'Title not found or does not belong to this user'}), 403

    new_note = Note(
        title_num=title.title_num,
        notes=note_text
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({
        'note_num': new_note.note_num,
        'title_num': new_note.title_num,
        'notes': new_note.notes,
        'user_id': current_user.user_id
    }), 201

@app.route('/notes/<int:note_num>', methods=['PUT'])
@login_required
def update_note(note_num):
    data = request.get_json()
    note = (
        db.session.query(Note)
        .join(Title)
        .filter(Note.note_num == note_num, Title.user_id == current_user.user_id)
        .first_or_404()
    )
    note.notes = data.get('notes', note.notes)
    db.session.commit()
    return jsonify({
        'note_num': note.note_num,
        'title_num': note.title_num,
        'notes': note.notes,
        'user_id': current_user.user_id
    })

@app.route('/notes/<int:note_num>', methods=['DELETE'])
@login_required
def delete_note(note_num):
    note = (
        db.session.query(Note)
        .join(Title)
        .filter(Note.note_num == note_num, Title.user_id == current_user.user_id)
        .first_or_404()
    )
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted', 'user_id': current_user.user_id})

# ------------------ QUIZZES ------------------
@app.route('/quizzes', methods=['GET'])
@login_required
def get_quizzes():
    quizzes = (
        db.session.query(Quiz)
        .join(Note)
        .join(Title)
        .filter(Title.user_id == current_user.user_id)
        .all()
    )
    return jsonify([
        {
            'quiz_num': q.quiz_num,
            'note_num': q.note_num,
            'quiz_title': q.quiz_title,
            'question': q.question,
            'answer': q.answer,
            'user_id': Title.query.join(Note).filter(Note.note_num == q.note_num).first().user_id
        } for q in quizzes
    ])

"""
if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
"""
