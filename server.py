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

FILE_PATH = 'questions.json'

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
        answers = ';\n'.join([f"{i + 1}) " + key.get('text') for i, key in enumerate(data.get('answers'))])
    else:
        answers = None
    prompt = data.get('prompt')
    que_type = data.get('type')

    if que_type == 'radio':
        content = f"{prompt}\n{question}\n{answers}\nIn the answer, give **only** the number of the answer option"
    elif que_type == 'checkbox':
        content = f"{prompt}\n{question}\n{answers}\nIn the answer, give **only** the numbers of the answer options separated by ,"
    elif que_type == 'text':
        content = f"Which word should be inserted in place of the _ sign in the sentence?: \n{question}\nShow only the right word (without punctuation marks)"
    else:
        content = None

    print(f"{YELLOW}{content}{RESET}")
    return content


def mark_calculate(element_grade: str) -> float:
    if element_grade is None:
        return None
    marks = element_grade.split()
    if len(marks) == 4:
        f_mark = marks[1].split(',')
        s_mark = marks[-1].split(',')
        mark = (int(f_mark[0]) * 100 + int(f_mark[1])) / (int(s_mark[0]) * 100 + int(s_mark[1]))
        return mark
    return 0


def check_question_in_file(question_text):
    if question_text is None:
        return None    
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as file:
            content = file.read().strip()
            if content:
                data = json.loads(content)
            else:
                return None
    except FileNotFoundError:
        return None
    
    for question_struct in data:
        question = question_struct.get('question')
        mark = question_struct.get('mark', 0)
        question_type = question_struct.get('type')

        if question == question_text and mark == 1:
            if question_type == 'radio' or question_type == 'checkbox':
                answers = question_struct.get('answers')
                return '\n'.join([answer.get('text') for answer in answers if answer.get('checked')])
            elif question_type == 'text':
                return question_struct.get('input', {}).get('value')


@app.route('/')
def index():
    return "Server is running..."


@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.json
    content = format_content(data)
    answer = check_question_in_file(data.get('question'))
    answer_type = None

    if answer is None:
        answer = get_answer_from_ai(content)
        if (data.get('type') == 'radio' or data.get('type') == 'checkbox') and answer is not None:
            # answer = answer.replace(',', ' ').replace('.', ' ').replace(' ', '')
            answer = '\n'.join([i for i in answer if i.isdigit()])
            
            answer_type = 'AI'
    else:
        answer_type = 'JSON'
    
    print(f"{GREEN}{answer}{RESET}")
    return jsonify({'answer': answer, 'answer_type': answer_type})


@app.route('/save_questions', methods=['POST'])
def save_questions():
    new_data = request.json
    
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as file:
            content = file.read().strip()
            if content:
                data = json.loads(content)
            else:
                data = []
    except FileNotFoundError:
        data = []

    for new_task in new_data:
        question = new_task.get('question')
        new_task['mark'] = mark_calculate(new_task.get('info', {}).get('grade'))
        
        if question not in [task.get('question') for task in data]:
            data.append(new_task)
        elif new_task.get('mark') > [task.get('mark') for task in data if task.get('question') == new_task.get('question')][0]:
            data = [task for task in data if task.get('question') != new_task.get('question')]
            data.append(new_task)

    with open(FILE_PATH, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    print(f"{GREEN}Сохранено в файл: {FILE_PATH}{RESET}")
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(debug=True)
