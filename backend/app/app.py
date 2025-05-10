from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from flask import Flask, jsonify, request
from flask_cors import CORS
import torch

app = Flask(__name__)
CORS(app)

# Question Generation Model
tokenizer_qg = AutoTokenizer.from_pretrained("valhalla/t5-base-qg-hl")
model_qg = AutoModelForSeq2SeqLM.from_pretrained("valhalla/t5-base-qg-hl")

# Question Answering Model
tokenizer_qa = AutoTokenizer.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")
model_qa = AutoModelForQuestionAnswering.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")

@app.route('/')
def home():
    return "Server is running!"

@app.route('/process', methods=['POST'])
def process_text():
    data = request.get_json()
    input_text = data.get('text', '')
    
    if not input_text:
        return jsonify({"error": "No text provided"}), 400

    # Generate Question
    inputs_qg = tokenizer_qg.encode("generate question: " + input_text, return_tensors="pt")
    outputs_qg = model_qg.generate(inputs_qg, max_length=50, num_beams=5, early_stopping=True)
    question = tokenizer_qg.decode(outputs_qg[0], skip_special_tokens=True)

    # Get Answer
    inputs_qa = tokenizer_qa.encode_plus(question, input_text, return_tensors="pt")
    outputs_qa = model_qa(**inputs_qa)
    start_index = torch.argmax(outputs_qa.start_logits)
    end_index = torch.argmax(outputs_qa.end_logits)
    answer = tokenizer_qa.convert_tokens_to_string(
        tokenizer_qa.convert_ids_to_tokens(
            inputs_qa["input_ids"][0][start_index:end_index + 1]
        )
    )

    return jsonify({ "question": question, "answer": answer })

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)