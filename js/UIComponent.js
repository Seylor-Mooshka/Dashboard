/**
 * Базовый класс для всех UI-компонентов
 * Абстрактный класс, который определяет общий интерфейс для всех виджетов
 */
export class UIComponent {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.title = config.title || 'Виджет';
        this.type = config.type || 'base';
        this.element = null;
        this.isMinimized = false;
        this.isDestroyed = false;
    }

    /**
     * Генерирует уникальный ID для виджета
     */
    generateId() {
        return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Создает DOM-элемент виджета
     * Должен быть переопределен в дочерних классах
     */
    render() {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'widget';
        this.element.id = this.id;
        this.element.setAttribute('data-type', this.type);

        this.element.innerHTML = `
            <div class="widget__header">
                <h3 class="widget__title">${this.title}</h3>
                <div class="widget__controls">
                    <button class="widget__btn widget__btn--minimize" title="Свернуть">
                        <span class="widget__btn-icon">−</span>
                    </button>
                    <button class="widget__btn widget__btn--close" title="Закрыть">
                        <span class="widget__btn-icon">×</span>
                    </button>
                </div>
            </div>
            <div class="widget__content">
                ${this.renderContent()}
            </div>
        `;

        this.attachEventListeners();
        return this.element;
    }

    /**
     * Рендерит содержимое виджета
     * Должен быть переопределен в дочерних классах
     */
    renderContent() {
        return '<p>Базовый виджет</p>';
    }

    /**
     * Привязывает обработчики событий
     */
    attachEventListeners() {
        if (!this.element) return;

        // Обработчик для кнопки сворачивания
        const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }

        // Обработчик для кнопки закрытия
        const closeBtn = this.element.querySelector('.widget__btn--close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Переключает состояние сворачивания виджета
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const content = this.element.querySelector('.widget__content');
        const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
        
        if (this.isMinimized) {
            content.style.display = 'none';
            minimizeBtn.innerHTML = '<span class="widget__btn-icon">+</span>';
            this.element.classList.add('widget--minimized');
        } else {
            content.style.display = 'block';
            minimizeBtn.innerHTML = '<span class="widget__btn-icon">−</span>';
            this.element.classList.remove('widget--minimized');
        }
    }

    /**
     * Закрывает виджет
     */
    close() {
        this.destroy();
    }

    /**
     * Уничтожает виджет и очищает все ресурсы
     */
    destroy() {
        if (this.isDestroyed) return;

        // Удаляем все обработчики событий
        this.removeEventListeners();
        
        // Удаляем элемент из DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        // Очищаем ссылки
        this.element = null;
        this.isDestroyed = true;

        // Вызываем кастомную очистку в дочерних классах
        this.onDestroy();
    }

    /**
     * Удаляет обработчики событий
     */
    removeEventListeners() {
        if (!this.element) return;

        // Удаляем все обработчики с кнопок
        const buttons = this.element.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
    }

    /**
     * Кастомная очистка ресурсов
     * Может быть переопределен в дочерних классах
     */
    onDestroy() {
        // Переопределяется в дочерних классах при необходимости
    }

    /**
     * Обновляет содержимое виджета
     */
    update() {
        if (this.element && !this.isMinimized) {
            const content = this.element.querySelector('.widget__content');
            if (content) {
                content.innerHTML = this.renderContent();
                this.attachEventListeners();
            }
        }
    }

    /**
     * Показывает виджет
     */
    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    /**
     * Скрывает виджет
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }
}
