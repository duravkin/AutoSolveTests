import json

FILE_PATH = 'questions.json'

try:
    with open(FILE_PATH, 'r', encoding='utf-8') as file:
        content = file.read().strip()
        if content:
            data = json.loads(content)

            marks = [task.get('mark') for task in data if task.get('mark') is not None]
            marks_100 = [task.get('mark') for task in data if task.get('mark') == 1]
            marks_50 = [task.get('mark') for task in data if task.get('mark') >= 0.5]
            marks_01 = [task.get('mark') for task in data if task.get('mark') > 0.0]
            marks_0 = [task.get('mark') for task in data if task.get('mark') == 0.0]
            marks_with_type = [task.get('mark') for task in data if task.get('type') is not None]


            sum_mark = sum(marks)
            count_mark = len(marks)

            print(f"Средняя оценка: {sum_mark / count_mark:.2f}")
            print(f"Количество заданий: {count_mark}")
            print()
            print(f"Количество заданий на 100%:\t{len(marks_100):>5} шт.\t{len(marks_100) / count_mark * 100:.0f}%")
            print(f"Количество заданий на +50%:\t{len(marks_50):>5} шт.\t{len(marks_50) / count_mark * 100:.0f}%")
            print(f"Количество заданий на  +0%:\t{len(marks_01):>5} шт.\t{len(marks_01) / count_mark * 100:.0f}%")
            print(f"Количество заданий на   0%:\t{len(marks_0):>5} шт.\t{len(marks_0) / count_mark * 100:.0f}%")
            print()
            print(f"Процент обработанных заданий (от общего числа):\t{len(marks_with_type) / count_mark * 100:.0f}%")
            print(f"Процент обработанных заданий (от себя) на 100%:\t{len([m for m in marks_with_type if m == 1]) / len(marks_with_type) * 100:.0f}%")
            print(f"Процент обработанных заданий (от себя) на +50%:\t{len([m for m in marks_with_type if m >= 0.5]) / len(marks_with_type) * 100:.0f}%")
            print(f"Процент обработанных заданий (от себя) на  +0%:\t{len([m for m in marks_with_type if m > 0.0]) / len(marks_with_type) * 100:.0f}%")
            print(f"Процент обработанных заданий (от себя) на   0%:\t{len([m for m in marks_with_type if m == 0.0]) / len(marks_with_type) * 100:.0f}%")

except FileNotFoundError:
    print(f"Файл {FILE_PATH} не найден")
