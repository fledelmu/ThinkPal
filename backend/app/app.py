from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from flask import Flask, jsonify, request
from flask_cors import CORS

import torch

app = Flask(__name__)
CORS(app)

tokenizer_qg = AutoTokenizer.from_pretrained("valhalla/t5-base-e2e-qg")
model_qg = AutoModelForSeq2SeqLM.from_pretrained("valhalla/t5-base-e2e-qg")

# Question Answering Model
tokenizer_qa = AutoTokenizer.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")
model_qa = AutoModelForQuestionAnswering.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")


"""
@app.route('/')
def home():
    return "Server is running!"

@app.route('/process', methods=['POST'])
def process_text():
    data = request.get_json()
    input_text = data.get('text', '')

    return jsonify(qa_pairs)

if _name_ == '_main_':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)

"""


input_text = "Paris, the capital city of France, is known for its rich history, stunning architecture, and vibrant culture. The Eiffel Tower, one of the most famous landmarks in the world, is located in Paris and attracts millions of tourists each year. Paris is also renowned for its art galleries, including the Louvre, which houses the iconic painting, the Mona Lisa. The city is a hub for fashion, with its high-end boutiques and annual Fashion Week showcasing the latest trends. Paris has been a symbol of romance, elegance, and intellectual thought for centuries, making it a unique destination for travelers worldwide."

# Generate Questions (E2E style)
prompt = "e2e question generation: " + input_text
inputs_qg = tokenizer_qg.encode(prompt, return_tensors="pt")
outputs_qg = model_qg.generate(inputs_qg, max_length=256, num_beams=5, early_stopping=True)
decoded_output = tokenizer_qg.decode(outputs_qg[0], skip_special_tokens=True)



# Split into multiple questions using <sep>
questions = [q.strip() for q in decoded_output.split("<sep>") if q.strip()]

# Get Answers using BERT
qa_pairs = []
for question in questions:
    inputs_qa = tokenizer_qa.encode_plus(question, input_text, return_tensors="pt")
    outputs_qa = model_qa(**inputs_qa)

    start_index = torch.argmax(outputs_qa.start_logits)
    end_index = torch.argmax(outputs_qa.end_logits)
    answer_ids = inputs_qa["input_ids"][0][start_index:end_index + 1]
    answer = tokenizer_qa.convert_tokens_to_string(tokenizer_qa.convert_ids_to_tokens(answer_ids))

    qa_pairs.append({"question": question, "answer": answer})

print("QA Pairs:")
for pair in qa_pairs:
    print(pair)