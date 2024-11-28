// Обновляем список задач (перечень кругов)
function updateTaskList() {
    if (!taskList || !Array.isArray(circles)) {
        console.error('taskList или circles не определены');
        return;
    }

    const fragment = document.createDocumentFragment();

    circles.forEach((circle, index) => {
        const listItem = document.createElement('li');
        listItem.style.display = 'flex';
        listItem.style.alignItems = 'flex-start'; // Changed to flex-start to align with top of expanding textarea

        listItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            circles.splice(index, 1);
            drawCircles();
            updateTaskList();
        });

        const checkbox = createCheckbox(circle, listItem);
        const numberSpan = document.createElement('span');
        numberSpan.classList.add('forHighlight')
        numberSpan.textContent = `${index + 1}.`;

        if (typeof circle.isExpanded === 'undefined') {
            circle.isExpanded = false;
        }

        const editableElement = createEditableElement(circle, index);

        listItem.appendChild(checkbox);
        listItem.appendChild(numberSpan);
        listItem.appendChild(editableElement);
        fragment.appendChild(listItem);
    });

    taskList.innerHTML = '';
    taskList.appendChild(fragment);
}

function createCheckbox(circle, listItem) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = circle.checked || false;

    checkbox.addEventListener('change', () => {
        circle.checked = checkbox.checked;

        const textElement = listItem.querySelector('p, textarea');
        if (textElement) {
            if (checkbox.checked) {
                textElement.classList.add('completed');
            } else {
                textElement.classList.remove('completed');
            }
        }

        drawCircles(); // Перерисовываем круги
    });

    return checkbox;
}

function createEditableElement(circle, index) {
    // Если у круга нет текста, инициализируем его как пустую строку
    if (typeof circle.text === 'undefined') {
        circle.text = '';
    }
    
    return circle.text.trim() !== ""
        ? createTextArea(circle, index)
        : createParagraph(circle, index);
}

function createParagraph(circle, index) {
    const p = document.createElement('p');
    p.textContent = `Действие на точке ${index + 1}`;
    
    // Добавляем обработчик для любого нажатия клавиши
    p.addEventListener('keydown', () => switchToTextArea(p, circle, index));
    p.addEventListener('click', () => switchToTextArea(p, circle, index));
    
    // Делаем параграф редактируемым
    p.contentEditable = true;
    
    // При начале ввода сразу переключаемся на textarea
    p.addEventListener('input', () => {
        if (p.textContent !== `Действие на точке ${index + 1}`) {
            const text = p.textContent;
            circle.text = text;
            switchToTextArea(p, circle, index);
        }
    });

    if (circle.checked) {
        p.classList.add('completed');
    }

    return p;
}

function truncateText(text, maxWidth, fontStyle) {
    const tempDiv = document.createElement("div");
    tempDiv.style = `font: ${fontStyle}; white-space: nowrap; visibility: hidden; position: absolute;`;
    document.body.appendChild(tempDiv);
    let truncatedText = text;
    tempDiv.textContent = truncatedText;
    while (tempDiv.offsetWidth > maxWidth) {
      truncatedText = truncatedText.slice(0, -1);
      tempDiv.textContent = truncatedText + "...";
    }
    document.body.removeChild(tempDiv);
    return truncatedText.length < text.length ? truncatedText + "..." : text;
}

function createTextArea(circle, index) {
    const container = document.createElement('div');
    container.className = 'textarea-container';

    const textarea = document.createElement('textarea');
    textarea.value = circle.text || '';
    textarea.dataset.fullText = circle.text || ''; // Сохраняем полный текст
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.overflow = 'hidden';
    textarea.style.resize = 'none';
    textarea.style.minHeight = '19px'; // Устанавливаем минимальную высоту

    if (circle.checked) {
        textarea.classList.add('completed');
    }

    // Устанавливаем isExpanded в false при создании нового круга, чтобы текст не разворачивался по умолчанию
    if (typeof circle.isExpanded === 'undefined') {
        circle.isExpanded = false; // По умолчанию - свернуто
    }

    // Ограничиваем ширину обрезки текста до 30% высоты окна
    const maxWidth = window.innerHeight * 0.27;

    // Если не развернуто, применяем обрезку
    if (!circle.isExpanded) {
        const fontStyle = window.getComputedStyle(textarea).font;
        textarea.value = truncateText(textarea.dataset.fullText, maxWidth, fontStyle);
    }

    const expandButton = createExpandButton(textarea, circle);

    // Обработчик клика по текстовой области для разворачивания/сворачивания
    textarea.addEventListener('click', () => {
        if (!circle.isExpanded) {
            circle.isExpanded = true; // Разворачиваем текст
            toggleExpansionState(textarea, true); // Разворачиваем
            expandButton.textContent = '⬆️'; // Изменяем стрелочку
        }
    });

    textarea.addEventListener('input', (e) => {
        circle.text = textarea.value;
        textarea.dataset.fullText = textarea.value;

        if (!circle.isExpanded) {
            const fontStyle = window.getComputedStyle(textarea).font;
            textarea.value = truncateText(textarea.dataset.fullText, maxWidth, fontStyle);
        }

        // Показать или скрыть кнопку expand в зависимости от текста
        expandButton.style.visibility = textarea.value.trim() ? 'visible' : 'hidden';

        // Динамическая настройка высоты
        const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
        const minHeight = Math.max(lineCount * 19, 19);
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;

        // Управление состоянием "completed"
        if (circle.checked) {
            textarea.classList.add('completed');
        } else {
            textarea.classList.remove('completed');
        }
    });

    // Обработчик для Enter
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (textarea.value.trim() === "") {
                switchToParagraph(container, circle, index);
            } else {
                const cursorPosition = textarea.selectionStart;
                const textBefore = textarea.value.substring(0, cursorPosition);
                const textAfter = textarea.value.substring(cursorPosition);
                textarea.value = textBefore + '\n' + textAfter;
                textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
                textarea.dispatchEvent(new Event('input'));
            }
        }
    });

    textarea.addEventListener('blur', () => {
        if (textarea.value.trim() === "") {
            switchToParagraph(container, circle, index);
        } else if (!circle.isExpanded) {
            const fontStyle = window.getComputedStyle(textarea).font;
            textarea.value = textarea.value = truncateText(
                textarea.dataset.fullText,
                window.innerHeight * 0.3,
                fontStyle
            );
        }
    });

    container.appendChild(textarea);
    container.appendChild(expandButton);

    // Начальная настройка высоты
    requestAnimationFrame(() => {
        if (!circle.isExpanded) {
            textarea.style.height = '19px'; // Фиксированная минимальная высота для свёрнутого состояния
        } else {
            const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
            const minHeight = Math.max(lineCount * 19, 19);
            textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
        }
        expandButton.style.visibility = textarea.value.trim() ? 'visible' : 'hidden';
    });
    
    return container;
}

function toggleExpansionState(textarea, isExpanded) {
    textarea.dataset.expanded = isExpanded ? 'true' : 'false';
    if (isExpanded) {
        // Восстанавливаем полный текст
        textarea.style.whiteSpace = 'pre-wrap';
        textarea.style.overflow = 'hidden';
        textarea.value = textarea.dataset.fullText || '';
        adjustHeight(textarea); // Корректно настраиваем высоту при разворачивании
    } else {
        // Показываем обрезанный текст
        const fontStyle = window.getComputedStyle(textarea).font;
        textarea.value = truncateText(
            textarea.dataset.fullText,
            window.innerHeight * 0.3,
            fontStyle
        );
        // Устанавливаем минимальную высоту при сворачивании
        textarea.style.height = '19px';
    }
}


function createExpandButton(textarea, circle) {
    const expandButton = document.createElement('button');
    expandButton.className = 'expand-button';
    expandButton.textContent = circle.isExpanded ? '⬆️' : '⬇️';
    
    // Устанавливаем начальную видимость
    expandButton.style.visibility = 'visible';

    expandButton.addEventListener('click', () => {
        const isExpanded = textarea.dataset.expanded === 'true';
        toggleExpansionState(textarea, !isExpanded);
        expandButton.textContent = isExpanded ? '⬇️' : '⬆️';
        circle.isExpanded = !isExpanded;
    });

    return expandButton;
}

function toggleExpandButtonVisibility(textarea, expandButton) {
    // Показываем кнопку всегда, когда есть текст
    expandButton.style.visibility = textarea.value.trim() ? 'visible' : 'hidden';
}

function adjustHeight(textarea) {
    // Проверяем, находится ли textarea в развёрнутом состоянии
    if (textarea.dataset.expanded !== 'true') {
        textarea.style.height = '19px';
        return;
    }
    
    const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
    const minHeight = Math.max(lineCount * 19, 19);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
}

function switchToParagraph(container, circle, index) {
    const p = createParagraph(circle, index);
    container.replaceWith(p);
}

function switchToTextArea(p, circle, index) {
    const container = createTextArea(circle, index);
    p.replaceWith(container);

    const textarea = container.querySelector('textarea');
    textarea.focus();

    // Автоматически разворачиваем при переключении с параграфа
    if (!circle.isExpanded) {
        circle.isExpanded = true;
        toggleExpansionState(textarea, true);
        const expandButton = container.querySelector('.expand-button');
        if (expandButton) {
            expandButton.textContent = '⬆️';
        }
    }

    // Сохраняем состояние checked при переключении
    if (circle.checked) {
        textarea.classList.add('completed');
    }

    requestAnimationFrame(() => {
        adjustHeight(textarea);
    });
}