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
function selectAnswer(answer) {
    const radioButton = document.querySelector(`input[type="radio"][value="${answer}"]`);
    if (radioButton) {
        radioButton.checked = true;
    }
}

// Основная логика
// const questions = extractQuestionAndAnswers();
// questions.forEach(question => {
//     sendQuestionToBackend(question).then(answer => {
//         selectAnswer(answer);
//     });
// });

const MY_data = extractQuestionAndAnswers();
console.log(MY_data);

// async function testPostRequest() {
//     const questionData = {
//         question: "Какой ваш любимый цвет?",
//         answers: ["Белый", "Черный"]
//     };

//     try {
//         const response = await fetch('http://localhost:5000/get_answer', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(questionData)
//         });

//         // Проверяем, если статус ответа успешный
//         if (response.ok) {
//             const data = await response.json();
//             console.log('Ответ от бекенда:', data.answer);
//         } else {
//             console.error('Ошибка при отправке запроса:', response.status);
//         }
//     } catch (error) {
//         console.error('Ошибка при выполнении запроса:', error);
//     }
// }

// // Вызовем функцию для теста
// testPostRequest();
