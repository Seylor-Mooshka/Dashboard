import { UIComponent } from './UIComponent.js';

/**
 * Виджет для управления списком дел
 * Наследуется от UIComponent и реализует функционал задач
 */
export class ToDoWidget extends UIComponent {
    constructor(config = {}) {
        super({
            ...config,
            title: config.title || '📝 Список дел',
            type: 'todo'
        });
        
        // Массив задач - инкапсулированное состояние виджета
        this.tasks = config.tasks || [];
        this.nextId = 1;
        
        // Загружаем сохраненные задачи из localStorage
        this.loadFromStorage();
    }

    /**
     * Рендерит содержимое виджета списка дел
     */
    renderContent() {
        return `
            <div class="todo-widget">
                <div class="todo-widget__input">
                    <input 
                        type="text" 
                        class="todo-widget__input-field" 
                        placeholder="Добавить новую задачу..."
                        maxlength="100"
                    >
                    <button class="todo-widget__add-btn btn btn--primary">
                        Добавить
                    </button>
                </div>
                
                <div class="todo-widget__stats">
                    <span class="todo-widget__stat">
                        Всего: <strong>${this.tasks.length}</strong>
                    </span>
                    <span class="todo-widget__stat">
                        Выполнено: <strong>${this.getCompletedCount()}</strong>
                    </span>
                    <span class="todo-widget__stat">
                        Осталось: <strong>${this.getPendingCount()}</strong>
                    </span>
                </div>
                
                <div class="todo-widget__list">
                    ${this.renderTasks()}
                </div>
                
                ${this.tasks.length > 0 ? `
                    <div class="todo-widget__actions">
                        <button class="todo-widget__clear-btn btn btn--secondary">
                            Очистить выполненные
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Рендерит список задач
     */
    renderTasks() {
        if (this.tasks.length === 0) {
            return '<div class="todo-widget__empty">Нет задач. Добавьте первую!</div>';
        }

        return this.tasks.map(task => `
            <div class="todo-widget__task ${task.completed ? 'todo-widget__task--completed' : ''}" 
                 data-task-id="${task.id}">
                <label class="todo-widget__task-checkbox">
                    <input 
                        type="checkbox" 
                        ${task.completed ? 'checked' : ''}
                        class="todo-widget__checkbox"
                    >
                    <span class="todo-widget__checkbox-custom"></span>
                </label>
                
                <span class="todo-widget__task-text">${this.escapeHtml(task.text)}</span>
                
                <button class="todo-widget__delete-btn" title="Удалить задачу">
                    🗑️
                </button>
            </div>
        `).join('');
    }

    /**
     * Привязывает обработчики событий для виджета
     */
    attachEventListeners() {
        super.attachEventListeners();
        
        if (!this.element) return;

        // Обработчик добавления новой задачи
        const addBtn = this.element.querySelector('.todo-widget__add-btn');
        const inputField = this.element.querySelector('.todo-widget__input-field');
        
        if (addBtn && inputField) {
            const addTask = () => {
                const text = inputField.value.trim();
                if (text) {
                    this.addTask(text);
                    inputField.value = '';
                    this.update();
                    this.saveToStorage();
                }
            };

            addBtn.addEventListener('click', addTask);
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
        }

        // Обработчики для чекбоксов задач
        const checkboxes = this.element.querySelectorAll('.todo-widget__checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.todo-widget__task').dataset.taskId);
                this.toggleTask(taskId);
                this.update();
                this.saveToStorage();
            });
        });

        // Обработчики для кнопок удаления
        const deleteBtns = this.element.querySelectorAll('.todo-widget__delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.todo-widget__task').dataset.taskId);
                this.removeTask(taskId);
                this.update();
                this.saveToStorage();
            });
        });

        // Обработчик очистки выполненных задач
        const clearBtn = this.element.querySelector('.todo-widget__clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearCompleted();
                this.update();
                this.saveToStorage();
            });
        }
    }

    /**
     * Добавляет новую задачу
     */
    addTask(text) {
        const task = {
            id: this.nextId++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
    }

    /**
     * Удаляет задачу по ID
     */
    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    /**
     * Переключает статус выполнения задачи
     */
    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
        }
    }

    /**
     * Удаляет все выполненные задачи
     */
    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
    }

    /**
     * Возвращает количество выполненных задач
     */
    getCompletedCount() {
        return this.tasks.filter(task => task.completed).length;
    }

    /**
     * Возвращает количество невыполненных задач
     */
    getPendingCount() {
        return this.tasks.filter(task => !task.completed).length;
    }

    /**
     * Экранирует HTML для безопасности
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Сохраняет задачи в localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(`todo-widget-${this.id}`, JSON.stringify({
                tasks: this.tasks,
                nextId: this.nextId
            }));
        } catch (error) {
            console.warn('Не удалось сохранить задачи в localStorage:', error);
        }
    }

    /**
     * Загружает задачи из localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(`todo-widget-${this.id}`);
            if (saved) {
                const data = JSON.parse(saved);
                this.tasks = data.tasks || [];
                this.nextId = data.nextId || 1;
            }
        } catch (error) {
            console.warn('Не удалось загрузить задачи из localStorage:', error);
        }
    }

    /**
     * Очистка ресурсов при уничтожении виджета
     */
    onDestroy() {
        // Очищаем localStorage при удалении виджета
        try {
            localStorage.removeItem(`todo-widget-${this.id}`);
        } catch (error) {
            console.warn('Не удалось очистить localStorage:', error);
        }
    }
}
