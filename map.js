// Функция для отрисовки кругов и изображения на холсте
function drawCircles() {
    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем изображение, если оно загружено
    if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Рисуем линии между кругами
    for (let i = 0; i < circles.length - 1; i++) {
        const circle1 = circles[i];
        const circle2 = circles[i + 1];
        const angle = Math.atan2(circle2.y - circle1.y, circle2.x - circle1.x);

        const startX = circle1.x + circle1.radius * Math.cos(angle);
        const startY = circle1.y + circle1.radius * Math.sin(angle);
        const endX = circle2.x - circle2.radius * Math.cos(angle);
        const endY = circle2.y - circle2.radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);

        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 10;

        ctx.strokeStyle = '#501e82';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    // Рисуем сами круги
    circles.forEach((circle, index) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

        // Меняем цвет на зелёный, если круг выполнен
        // Используем сохраненное значение checked
        ctx.strokeStyle = circle.checked ? '#2d8b45' : '#cf412a';
        ctx.lineWidth = 4;

        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 10;

        ctx.stroke();
        ctx.closePath();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    });
}

function saveState() {
    try {
        const circlesData = circles.map(circle => ({
            x: circle.x,
            y: circle.y,
            radius: circle.radius,
            text: circle.text,
            checked: circle.checked,
            isExpanded: circle.isExpanded
        }));
        localStorage.setItem('circles', JSON.stringify(circlesData));
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

function loadState() {
    try {
        const savedData = localStorage.getItem('circles');
        if (savedData) {
            const savedCircles = JSON.parse(savedData);
            circles.length = 0; // Очищаем массив перед загрузкой
            circles.push(...savedCircles.map(circle => ({
                ...circle,
                checked: !!circle.checked, // Явно преобразуем в boolean
                isExpanded: !!circle.isExpanded // Явно преобразуем в boolean
            })));
            drawCircles();
            updateTaskList();
        }
    } catch (error) {
        console.error('Error loading state:', error);
    }
}

document.getElementById('imageLoaderButton').addEventListener('click', () => {
    document.getElementById('change').click();
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
const radiusInput = document.getElementById('radiusInput');
const imageLoader = document.getElementById('imageLoader');
const deleteCircleBtn = document.getElementById('deleteCircleBtn');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const modal = document.getElementById('confirmationModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveDataBtn = document.getElementById('saveDataBtn');
const loadDataBtn = document.getElementById('loadDataBtn');
const taskList = document.getElementById('taskList');
const circles = [];
let radius = 10;
let img = null;
let isDragging = false;  // Отслеживаем, перетаскивается ли сейчас круг
let draggedCircle = null;  // Храним круг, который перетаскиваем
let offsetX, offsetY;  // Смещение мыши относительно центра круга при перетаскивании

// Обновляем радиус круга, если меняется значение ползунка или текстового поля
radiusSlider.addEventListener('input', (e) => {
    radius = parseInt(e.target.value);
    radiusInput.value = radius;

    // Изменяем цвет ползунка в зависимости от текущего значения
    const value = (radius - radiusSlider.min) / (radiusSlider.max - radiusSlider.min) * 100;
    radiusSlider.style.background = `linear-gradient(to right, #f1a742 0%, #f1a742 ${value}%, #ddd ${value}%, #ddd 100%)`;
});

radiusInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
        radius = 10; // значение по умолчанию
    } else {
        radius = value;
    }
    radiusSlider.value = radius;
});

// Загружаем изображение, если пользователь выбрал файл
imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        img = new Image();
        img.onload = function() {
            // Подгоняем размер изображения, чтобы оно поместилось в холст
            const maxWidth = window.innerHeight * 0.91;
            const maxHeight = window.innerHeight * 0.91;
            let imgWidth = img.width;
            let imgHeight = img.height;

            // Считаем коэффициент масштабирования, чтобы вписать изображение в ограничения
            const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
            imgWidth = imgWidth * scaleFactor;
            imgHeight = imgHeight * scaleFactor;

            canvas.width = imgWidth;
            canvas.height = imgHeight;
            drawCircles();  // Перерисовываем все, включая круги
        };
        img.src = event.target.result;
    };
    if (file) {
        reader.readAsDataURL(file);
    }
});

// Обработчик события для перетаскивания кругов
// Удаление круга правым кликом мыши
canvas.addEventListener('mousedown', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (e.button === 2) {
        for (let i = 0; i < circles.length; i++) {
            const circle = circles[i];
            const dx = x - circle.x;
            const dy = y - circle.y;
            if (Math.sqrt(dx * dx + dy * dy) <= circle.radius) {
                circles.splice(i, 1);
                updateTaskList();
                drawCircles();
                return;
            }
        }
        return;
    }

    // Проверка на перетаскивание существующего круга
    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const dx = x - circle.x;
        const dy = y - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= circle.radius) {
            isDragging = true;
            draggedCircle = circle;
            offsetX = x - circle.x;
            offsetY = y - circle.y;
            return;
        }
    }

    // Добавление нового круга если не перетаскиваем
    if (!isDragging) {
        circles.push({ 
            x, 
            y, 
            radius,
            text: '', // Инициализируем пустым текстом
            isExpanded: false, // Начальное состояние развернутости
            checked: false // Начальное состояние чекбокса
        });
        updateTaskList();
        drawCircles();
    }
});

function highlightTask(index) {
    const taskItems = document.querySelectorAll('#taskList li');
    if (!taskItems || !taskItems[index]) return;

    // Убираем подсветку со всех элементов
    taskItems.forEach(item => item.classList.remove('highlighted'));

    // Добавляем подсветку нужному элементу
    const targetItem = taskItems[index];
    targetItem.classList.add('highlighted');

    // Прокручиваем контейнер к этому элементу
    targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

canvas.addEventListener('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    // Проверяем, попали ли в круг
    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const dx = x - circle.x;
        const dy = y - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= circle.radius) {
            highlightTask(i); // Подсвечиваем соответствующий пункт
            return;
        }
    }
});

// Обработчик для перетаскивания кругов
canvas.addEventListener('mousemove', (e) => {
    if (isDragging && draggedCircle) {
        const x = Math.min(Math.max(e.offsetX - offsetX, draggedCircle.radius), 
                         canvas.width - draggedCircle.radius);
        const y = Math.min(Math.max(e.offsetY - offsetY, draggedCircle.radius), 
                         canvas.height - draggedCircle.radius);

        draggedCircle.x = x;
        draggedCircle.y = y;
        drawCircles();
    }
});
// Обработчик завершения перетаскивания круга
canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggedCircle = null;
});

// Отключаем контекстное меню при правом клике
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Удаляем последний добавленный круг
deleteCircleBtn.addEventListener('click', () => {
    circles.pop();  // Удаляем последний круг
    updateTaskList();  // Обновляем список задач
    drawCircles();  // Перерисовываем холст
});

// Вызываем "saveState" при изменении данных (например, в "updateTaskList").
window.addEventListener('beforeunload', saveState);

// Загружаем состояние при загрузке страницы
window.addEventListener('load', loadState);

// Показываем модальное окно
clearCanvasBtn.addEventListener('click', () => {
    modal.style.display = 'flex'; // Показываем модальное окно
});

// Подтверждаем действие
confirmBtn.addEventListener('click', () => {
    // Очищаем полностью canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сбрасываем изображение
    img = null;
    
    // Удаляем все круги
    circles.length = 0;
    
    // Обновляем список задач
    updateTaskList();
    
    // Устанавливаем белый фон
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Скрываем модальное окно
    modal.style.display = 'none';
});

// Отменяем действие
cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none'; // Просто скрываем окно
});

// Закрываем модальное окно при клике вне его
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

saveDataBtn.addEventListener('click', () => {
    // Сохраняем список дел
    const taskData = circles.map((circle, index) => ({
        index: index + 1,
        x: circle.x,
        y: circle.y,
        radius: circle.radius,
        text: circle.text || '',
        checked: circle.checked || false,
        isExpanded: circle.isExpanded || false
    }));

    // Сохраняем оригинальное изображение
    const originalImageData = img ? img.src : null;

    // Объединяем всё в один объект
    const dataToSave = {
        originalImage: originalImageData,
        tasks: taskData,
        timestamp: new Date().toISOString()
    };

    // Генерируем JSON файл
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });

    // Создаём ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `canvas_tasks_${new Date().toISOString().replace(/:/g, '-')}.json`; // Уникальное имя файла
    link.click();

    // Освобождаем URL
    URL.revokeObjectURL(link.href);
});

loadDataBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);

                    // Проверка структуры данных
                    if (!data.originalImage || !data.tasks || !Array.isArray(data.tasks)) {
                        throw new Error('Invalid file format');
                    }

                    const image = new Image();
                    image.onload = function() {
                        try {
                            const maxWidth = window.innerWidth * 0.9;
                            const maxHeight = window.innerHeight * 0.9;
                            let imgWidth = image.width;
                            let imgHeight = image.height;
                            const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                            imgWidth = imgWidth * scaleFactor;
                            imgHeight = imgHeight * scaleFactor;

                            canvas.width = imgWidth;
                            canvas.height = imgHeight;
                            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                            // Сохраняем изображение
                            img = image;

                            circles.length = 0;
                            data.tasks.forEach(task => {
                                if (typeof task.x === 'number' &&
                                    typeof task.y === 'number' &&
                                    typeof task.radius === 'number') {
                                    circles.push({
                                        x: task.x,
                                        y: task.y,
                                        radius: task.radius,
                                        text: task.text || '',
                                        checked: Boolean(task.checked),
                                        isExpanded: Boolean(task.isExpanded || false)
                                    });
                                }
                            });

                            drawCircles();
                            updateTaskList();
                        } catch (error) {
                            console.error('Error processing image:', error);
                            alert('Ошибка загрузки данных. Пожалуйста, попробуйте снова.');
                        }
                    };

                    image.onerror = function() {
                        console.error('Error loading image');
                        alert('Ошибка загрузки изображения. Пожалуйста, попробуйте снова.');
                    };

                    image.src = data.originalImage;
                } catch (error) {
                    console.error('Error parsing file:', error);
                    alert('Неверный формат файла. Пожалуйста, выберите корректный файл сохранения.');
                }
            };

            reader.onerror = function() {
                console.error('Error reading file');
                alert('Ошибка чтения файла. Пожалуйста, попробуйте снова.');
            };

            reader.readAsText(file);
        }
    });

    input.click();
});


canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    draggedCircle = null;
});