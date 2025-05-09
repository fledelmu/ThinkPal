from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering

# Load tokenizer and model for question generation (QG)
tokenizer_qg = AutoTokenizer.from_pretrained("valhalla/t5-base-qg-hl")
model_qg = AutoModelForSeq2SeqLM.from_pretrained("valhalla/t5-base-qg-hl")

# Load tokenizer and model for question answering (QA)
tokenizer_qa = AutoTokenizer.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")
model_qa = AutoModelForQuestionAnswering.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")

input_text = "Jian Ngsuy is a filipino-chinese person, he is a student of DLSU"

# Generate the question
inputs_qg = tokenizer_qg.encode("generate question: " + input_text, return_tensors="pt")
outputs_qg = model_qg.generate(inputs_qg, max_length=50, num_beams=5, early_stopping=True)
question = tokenizer_qg.decode(outputs_qg[0], skip_special_tokens=True)

# Print the generated question
print("Generated Question:", question)

# Tokenize the question and context for the QA model
inputs_qa = tokenizer_qa.encode_plus(question, input_text, return_tensors="pt")

# Get the start and end positions of the answer
outputs_qa = model_qa(**inputs_qa)
start_scores, end_scores = outputs_qa.start_logits, outputs_qa.end_logits

# Get the answer based on the highest start and end scores
start_index = start_scores.argmax()
end_index = end_scores.argmax()

# Decode the answer
answer = tokenizer_qa.convert_tokens_to_string(tokenizer_qa.convert_ids_to_tokens(inputs_qa["input_ids"][0][start_index:end_index + 1]))

# Print the generated answer
print("Generated Answer:", answer)
