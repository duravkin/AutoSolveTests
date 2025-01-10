/* Функция для извлечения вопросов и ответов */
function extractQuestionAndAnswers() {
    const questions = [];
    // Найти все блоки с вопросами
    const questionBlocks = document.querySelectorAll('div.que');

    questionBlocks.forEach(block => {
        const questionData = {};

        // Извлекаем информацию о вопросе
        const infoElement = block.querySelector('.info');
        if (infoElement) {
            const infoDate = {};
            const numberTask = infoElement.querySelector('.qno');
            infoDate.numberTask = numberTask ? numberTask.textContent.trim() : '';

            const stateElement = infoElement.querySelector('.state');
            infoDate.state = stateElement ? stateElement.textContent.trim() : '';

            const gradeElement = infoElement.querySelector('.grade');
            infoDate.grade = gradeElement ? gradeElement.textContent.trim() : '';

            questionData.info = infoDate;
        }

        // Извлекаем текст вопроса
        const questionTextElement = block.querySelector('.qtext');
        questionData.question = questionTextElement ? questionTextElement.textContent.trim() : '';

        // Извлекаем prompt (если есть)
        const promptElement = block.querySelector('.prompt');
        if (promptElement) {
            const excessElement = block.querySelector('.sr-only');
            questionData.prompt = promptElement.textContent.replace(excessElement.textContent, '').trim();
        }

        // Проверяем наличие радиокнопок или чекбоксов
        const answers = [];
        const radioCheckboxInputs = block.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        if (radioCheckboxInputs.length > 0) {
            radioCheckboxInputs.forEach(input => {
                let answerText = '';

                // Пытаемся получить текст из атрибута aria-labelledby
                const labelId = input.getAttribute('aria-labelledby');
                if (labelId) {
                    const safeLabelId = CSS.escape(labelId);
                    const labelElement = block.querySelector(`#${safeLabelId}`).querySelector('div');
                    if (labelElement) {
                        answerText = labelElement.textContent.trim();
                    }
                }

                // Если aria-labelledby отсутствует, ищем связанный <label>
                if (!answerText) {
                    const labelElement = block.querySelector(`label[for="${CSS.escape(input.id)}"]`);
                    if (labelElement) {
                        answerText = labelElement.textContent.trim();
                    }
                }

                // Если связанный <label> не найден, ищем текст в ближайших родительских или соседних элементах
                if (!answerText) {
                    const parent = input.closest('div, span, p');
                    if (parent) {
                        answerText = parent.textContent.trim();
                    }
                }

                answers.push({
                    id: input.id || null,
                    name: input.name || null,
                    type: input.type || null,
                    value: input.value || null,
                    text: answerText || '',
                    checked: input.checked || false
                });
            });
            questionData.answers = answers;
            questionData.type = radioCheckboxInputs[0].type;
        }

        // Проверяем наличие селекта
        // const selectElement = block.querySelector('select');
        // if (selectElement) {
        //     const options = Array.from(selectElement.options).map(option => ({
        //         value: option.value,
        //         text: option.textContent.trim()
        //     }));
        //     questionData.select = options;
        // }

        // Проверяем наличие текстового поля для ввода
        const textInput = block.querySelector('input[type="text"], textarea');
        if (textInput) {
            if (questionData.question) {
                const temptext = block.querySelector('label').textContent.trim();
                questionData.question = questionData.question.replace(temptext, '_');
            }
            questionData.input = {
                id: textInput.id || null,
                name: textInput.name || null,
                type: textInput.type || null,
                value: textInput.value || ''
            };
            questionData.type = textInput.type;
        }

        questions.push(questionData);
    });

    return questions;
}

/* Отправляем вопрос и варианты ответов на бекенд для решения */
async function sendQuestionToBackend(questionData) {
    const response = await fetch('http://localhost:5000/get_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
    });
    const data = await response.json();
    return data.answer;
}

/* Отправляем вопросы и варианты ответов на бекенд для анализа */
async function sendQuestionsToFile(questionData) {
    const response = await fetch('http://localhost:5000/save_questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
    });
    const status = await response.json();
    console.log(status);
    return status;
}

/* Проверяем, является ли строка числом */
function isNumber(value) {
    return !isNaN(Number(value));
}

/* Автоматически выбираем ответ */
function selectAnswer(data, answer) {
    if (answer == null)
        return;

    if (data.type === 'radio') {
        let numberElement = 1;
        data.answers.forEach(element => {
            document.getElementById(element.id).checked = false;
            if (isNumber(answer) && answer == numberElement) {
                document.getElementById(element.id).checked = true;
                console.log(element.text);
            }
            else if (answer == element.text) {
                document.getElementById(element.id).checked = true;
                console.log(element.text);
            }
            numberElement++;
        });
    }

    else if (data.type === 'checkbox') {
        const arr_answer = answer.split('\n');
        let numberElement = 1;
        data.answers.forEach(element => {
            document.getElementById(element.id).checked = false;
            for (let i = 0; i < arr_answer.length; i++) {
                if (isNumber(arr_answer[i]) && arr_answer[i] == numberElement) {
                    document.getElementById(element.id).checked = true;
                    console.log(element.text);
                }
                else if (arr_answer[i] == element.text) {
                    document.getElementById(element.id).checked = true;
                    console.log(element.text);
                }
            }
            numberElement++;
        });
    }

    else if (data.type === 'text') {
        document.getElementById(data.input.id).value = answer;
        console.log(answer);
    }

    else {
        console.log("Невозможно автоматически выбрать ответ");
    }
}

/* Запуск процесса решения */
async function decision() {
    const questions = extractQuestionAndAnswers();
    console.log(questions);

    for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        let answer = await sendQuestionToBackend(question);
        selectAnswer(question, answer);
    }
    alert("Задачи решены!");
}

/* Запуск процесса анализа */
async function analysis() {
    const questions = extractQuestionAndAnswers();
    console.log(questions);

    const status = await sendQuestionsToFile(questions);

    if (status) alert("Анализ окончен!");
}