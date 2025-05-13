from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.utils import secure_filename
import PyPDF2

import os
import torch

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
    notes = db.relationship('Note', backref='title', lazy=True)

class Note(db.Model):
    __tablename__ = 'tbl_note'
    note_num = db.Column(db.Integer, primary_key=True)
    title_num = db.Column(db.Integer, db.ForeignKey('tbl_titles.title_num'), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    quizzes = db.relationship('Quiz', backref='note', lazy=True)

class Quiz(db.Model):
    __tablename__ = 'tbl_quiz'
    quiz_num = db.Column(db.Integer, primary_key=True)
    note_num = db.Column(db.Integer, db.ForeignKey('tbl_note.note_num'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)

# Question Generation Model
tokenizer_qg = AutoTokenizer.from_pretrained("valhalla/t5-base-e2e-qg")
model_qg = AutoModelForSeq2SeqLM.from_pretrained("valhalla/t5-base-e2e-qg")

# Question Answering Model
tokenizer_qa = AutoTokenizer.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")
model_qa = AutoModelForQuestionAnswering.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")

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
    note_num = data.get('note_num')
    input_text = data.get('text')
    if not note_num or not input_text:
        return jsonify({'error': 'note_num and text are required'}), 400
    prompt = "e2e question generation: " + input_text
    inputs_qg = tokenizer_qg.encode(prompt, return_tensors="pt")
    outputs_qg = model_qg.generate(inputs_qg, max_length=256, num_beams=5, early_stopping=True)
    decoded_output = tokenizer_qg.decode(outputs_qg[0], skip_special_tokens=True)
    questions = [q.strip() for q in decoded_output.split("<sep>") if q.strip()]
    qa_pairs = []
    for question in questions:
        inputs_qa = tokenizer_qa.encode_plus(question, input_text, return_tensors="pt")
        outputs_qa = model_qa(**inputs_qa)
        start_index = torch.argmax(outputs_qa.start_logits)
        end_index = torch.argmax(outputs_qa.end_logits)
        answer_ids = inputs_qa["input_ids"][0][start_index:end_index + 1]
        answer = tokenizer_qa.convert_tokens_to_string(tokenizer_qa.convert_ids_to_tokens(answer_ids))
        qa_pairs.append({"question": question, "answer": answer})
    save_ai_quiz_to_db(note_num, qa_pairs)
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

# CRUD API ENDPOINTS 

# titles
@app.route('/titles', methods=['GET'])
def get_titles():
    titles = Title.query.all()
    return jsonify([{'title_num': t.title_num, 'note_title': t.note_title} for t in titles])

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