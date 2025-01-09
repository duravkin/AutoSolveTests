// Ищем все радиокнопки на странице
function extractQuestionAndAnswers() {
    const questions = [];
    // Найти все блоки с вопросами
    const questionBlocks = document.querySelectorAll('div.que');

    questionBlocks.forEach(block => {
        const questionData = {};

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
                const labelId = input.getAttribute('aria-labelledby');
                if (labelId) {
                    // Экранируем символы, которые не допустимы в CSS-селекторах
                    const safeLabelId = CSS.escape(labelId);
                    const labelElement = block.querySelector(`#${safeLabelId}`);
                    const answerText = labelElement ? labelElement.textContent.trim() : '';
                    answers.push({
                        id: input.id,
                        type: input.type,
                        value: input.value,
                        text: answerText
                    });
                }
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
                type: textInput.type || null,
                name: textInput.name || null,
                placeholder: textInput.placeholder || '',
                value: textInput.value || ''
            };
            questionData.type = textInput.type;
        }

        questions.push(questionData);
    });

    return questions;
}


// Отправляем вопрос и варианты ответов на бекенд
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

// Автоматически выбираем правильный ответ
function selectAnswer(data, answer) {
    if (data.type === 'radio') {
        data.answers.forEach(element => {
            if (element.text.includes(answer)) {
                document.getElementById(element.id).click();
                console.log(element.text);
            }
        });
    }

    else if (data.type === 'checkbox') {
        data.answers.forEach(element => {
            const arr_answer = answer.split(' ');
            for (let i = 0; i < arr_answer.length; i++) {
                if (element.text.includes(arr_answer[i])) {
                    document.getElementById(element.id).click();
                    console.log(element.text);
                }
            }
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

// Основная функция
async function main() {
    const questions = extractQuestionAndAnswers();

    for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        let answer = await sendQuestionToBackend(question);
        selectAnswer(question, answer);
    }
}

main();