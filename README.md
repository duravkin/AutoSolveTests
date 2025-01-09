# AutoSolveTests

AutoSolveTests — это расширение для автоматизации работы на страницах с тестированием, выступающее в роли помощника с элементами искусственного интеллекта.

**Установка:**

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/duravkin/AutoSolveTests.git
   ```
2. Перейдите в директорию проекта:
   ```bash
   cd AutoSolveTests
   ```
3. Установите необходимые зависимости:
   ```bash
   pip install -r requirements.txt
   ```

**Авторизация с GigaChat API:**

1. Инструкция предоставлена на [официальном сайте](https://developers.sber.ru/docs/ru/gigachat/quickstart/ind-using-api).
2. После получения ключа авторизации (`Authorization key`) необходимо его добавить в файл `config.json`.

**Использование:**

1. Запустите сервер:
   ```bash
   python server.py
   ```
2. Установите расширение в браузер, следуя инструкциям в [документации Chrome](https://developer.chrome.com/docs/extensions/mv3/getstarted/).
3. Перейдите на страницу с тестированием.
4. Активируйте расширение и запустите решение задач на странице.

**Структура проекта:**

- `content_script.js`: Основной скрипт, взаимодействующий с веб-страницей.
- `run_analysis.js`: Модуль анализа тестовых заданий.
- `run_decision.js`: Модуль принятия решений на основе анализа.
- `server.py`: Серверная часть для обработки запросов.
- `popup.html`, `popup.js`: Интерфейс расширения.
- `manifest.json`: Конфигурационный файл расширения.
