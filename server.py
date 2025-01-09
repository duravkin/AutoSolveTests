from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid
import json

YELLOW = "\033[93m"
GREEN = "\033[92m"
RESET = "\033[0m"

with open('config.json') as f:
    config = json.load(f)

AUTHORIZATION_KEY = config['AUTHORIZATION_KEY']

app = Flask(__name__)
CORS(app)


def get_access_token():
    url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

    payload='scope=GIGACHAT_API_PERS'
    headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'RqUID': str(uuid.uuid4()),
    'Authorization': f'Basic {AUTHORIZATION_KEY}'
    }

    response = requests.request("POST", url, verify=False, headers=headers, data=payload)
    response_data = response.json()

    if 'access_token' in response_data:
        return response_data['access_token']
    else:
        print("Ошибка: access_token не найден в ответе")
        print(response_data)


def get_answer_from_ai(content):
    if content is None:
        return None
    access_token = get_access_token()
    if access_token is None:
        return None
        
    url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    
    message = [{
        'role': 'user',
        'content': content
    }]
    payload = json.dumps({
    "model": "GigaChat",
    "messages": message,
    "stream": False,
    "repetition_penalty": 1
    })
    headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': f'Bearer {access_token}'
    }

    response = requests.request("POST", url, verify=False, headers=headers, data=payload)

    return response.json()['choices'][0]['message']['content']


def format_content(data):
    question = data.get('question')
    if data.get('answers'):
        answers = ';\n'.join([i.get('text') for i in data.get('answers')])
    else:
        answers = None
    prompt = data.get('prompt')
    que_type = data.get('type')

    if que_type == 'radio':
        content = f"{prompt}\n{question}\n{answers}\nIn the answer, give only the number of the answer option."
    elif que_type == 'checkbox':
        content = f"{prompt}\n{question}\n{answers}\nIn the answer, give only the numbers of the answer options separated by a space."
    elif que_type == 'text':
        content = f"Which word should be inserted in place of the _ sign in the sentence?: \n{question}\nShow only the right word (without punctuation marks)"
    else:
        content = None

    print(f"{YELLOW}{content}{RESET}")
    return content


def mark_calculate(element: str) -> float:
    if element is None:
        return None
    marks = element.split()
    f_mark = marks[1].split(',')
    s_mark = marks[-1].split(',')
    mark = (int(f_mark[0]) * 100 + int(f_mark[1])) / (int(s_mark[0]) * 100 + int(s_mark[1]))
    return mark


def check_question_in_file(question_text):
    file_path = 'questions.json'
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        return None
    
    for question in data:
        if question.get('question') == question_text and question.get('mark', 0) == 1:
            if question.get('type') == 'radio' or question.get('type') == 'checkbox':
                return ' '.join([answer['text'][0] for answer in question.get('answers') if answer['checked']])
            elif question.get('type') == 'text':
                return question.get('input').get('value')


@app.route('/')
def index():
    return "Server is running..."


@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.json
    content = format_content(data)
    answer = check_question_in_file(data.get('question'))
    if answer is None:
        answer = get_answer_from_ai(content)
    
    print(f"{GREEN}{answer}{RESET}")
    return jsonify({'answer': answer})


@app.route('/save_questions', methods=['POST'])
def save_questions():
    new_data = request.json
    file_path = 'questions.json'
    
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        data = []

    for new_question in new_data:
        question = new_question.get('question')
        new_question['mark'] = mark_calculate(new_question.get('info'))
        
        if question not in [question['question'] for question in data]:
            data.append(new_question)
        elif new_question.get('mark') > [question['mark'] for question in data if question['question'] == new_question.get('question')][0]:
            data = [question for question in data if question['question'] != new_question.get('question')]
            data.append(new_question)

    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    print(f"{GREEN}Сохранено в файл: {file_path}{RESET}")
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(debug=True)
