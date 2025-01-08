// Ищем все радиокнопки на странице
function extractQuestionAndAnswers() {
    const questions = [];
    // Найти все блоки с вопросами
    const questionBlocks = document.querySelectorAll('div.que');

    questionBlocks.forEach(block => {
        // Извлечь текст вопроса
        const questionTextElement = block.querySelector('.qtext');
        const questionText = questionTextElement ? questionTextElement.textContent.trim() : 'Unknown question';

        // Найти все радиокнопки и связанные с ними тексты
        const answers = [];
        const answerBlocks = block.querySelectorAll('.answer > div');

        answerBlocks.forEach(answerBlock => {
            const radioButton = answerBlock.querySelector('input[type="radio"]');
            const answerTextElement = answerBlock.querySelector('.flex-fill');
            const answerText = answerTextElement ? answerTextElement.textContent.trim() : 'Unknown answer';

            if (radioButton) {
                answers.push({
                    value: radioButton.value,
                    text: answerText
                });
            }
        });

        questions.push({
            question: questionText,
            answers: answers
        });
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
