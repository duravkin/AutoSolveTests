from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid
import json

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
    'Authorization': f'Basic {Authorization_key}'
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
    answers = data.get('answers')
    promt = data.get('promt')
    que_type = data.get('type')

    if que_type == 'radio':
        content = f"{promt}\n{question}\n{answers}\nIn the answer, give only the number of the answer option."
    elif que_type == 'checkbox':
        content = f"{promt}\n{question}\n{answers}\nIn the answer, give only the numbers of the answer options separated by a space."
    elif que_type == 'text':
        content = f"Which word should be inserted in place of the _ sign in the sentence?: \n{question}\nShow only the right word (without punctuation marks)"
    else:
        content = None

    return content


@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.json
    content = format_content(data)
    answer = get_answer_from_ai(content)
    return jsonify({'answer': answer})


if __name__ == '__main__':
    app.run(debug=True)
