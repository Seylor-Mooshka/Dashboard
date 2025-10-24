import { ToDoWidget } from './ToDoWidget.js';
import { QuoteWidget } from './QuoteWidget.js';
import { WeatherWidget } from './WeatherWidget.js';
import { CryptoWidget } from './CryptoWidget.js';

/**
 * Класс для управления панелью виджетов
 * Инкапсулирует коллекцию активных виджетов и управляет их жизненным циклом
 */
export class Dashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.widgets = new Map(); // Используем Map для быстрого поиска по ID
        this.widgetCounter = 0;
        
        if (!this.container) {
            throw new Error(`Контейнер с ID "${containerId}" не найден`);
        }
        
        this.initializeContainer();
    }

    /**
     * Инициализирует контейнер дашборда
     */
    initializeContainer() {
        this.container.className = 'dashboard';
        this.container.innerHTML = '<div class="dashboard__empty">Добавьте виджеты для начала работы</div>';
    }

    /**
     * Добавляет новый виджет указанного типа
     */
    async addWidget(widgetType, config = {}) {
        try {
            let widget;
            const widgetId = config.id || this.generateWidgetId();
            const isRestoring = !!config.id; // Проверяем, восстанавливаем ли мы виджет из localStorage
            
            // Создаем экземпляр виджета в зависимости от типа
            switch (widgetType.toLowerCase()) {
                case 'todo':
                    widget = new ToDoWidget({
                        ...config,
                        id: widgetId,
                        title: config.title || `📝 Список дел #${this.widgetCounter + 1}`
                    });
                    break;
                    
                case 'quote':
                    widget = new QuoteWidget({
                        ...config,
                        id: widgetId,
                        title: config.title || `💭 Цитата #${this.widgetCounter + 1}`
                    });
                    break;
                    
                case 'weather':
                    widget = new WeatherWidget({
                        ...config,
                        id: widgetId,
                        title: config.title || `🌤️ Погода #${this.widgetCounter + 1}`
                    });
                    break;
                    
                case 'crypto':
                    widget = new CryptoWidget({
                        ...config,
                        id: widgetId,
                        title: config.title || `💰 Криптовалюты #${this.widgetCounter + 1}`
                    });
                    break;
                    
                default:
                    throw new Error(`Неизвестный тип виджета: ${widgetType}`);
            }

            // Добавляем виджет в коллекцию
            this.widgets.set(widgetId, widget);
            
            // Увеличиваем счетчик только при создании новых виджетов, не при восстановлении
            if (!isRestoring) {
                this.widgetCounter++;
            }

            // Рендерим виджет и добавляем в DOM
            const widgetElement = widget.render();
            this.container.appendChild(widgetElement);

            // Удаляем сообщение о пустом дашборде, если оно есть
            const emptyMessage = this.container.querySelector('.dashboard__empty');
            if (emptyMessage) {
                emptyMessage.remove();
            }

            // Инициализируем виджет (загружаем данные для API виджетов)
            if (typeof widget.initialize === 'function') {
                await widget.initialize();
            }

            // Обновляем layout
            this.updateLayout();
            

            return widget;

        } catch (error) {
            console.error('Ошибка при добавлении виджета:', error);
            throw error;
        }
    }

    /**
     * Удаляет виджет по ID
     */
    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        
        if (!widget) {
            console.warn(`Виджет с ID "${widgetId}" не найден`);
            return false;
        }

        try {
            // Уничтожаем виджет (очищаем ресурсы и удаляем из DOM)
            widget.destroy();
            
            // Удаляем из коллекции
            this.widgets.delete(widgetId);
            
            // Обновляем layout
            this.updateLayout();
            
            
            // Показываем сообщение о пустом дашборде, если виджетов не осталось
            if (this.widgets.size === 0) {
                this.showEmptyMessage();
            }

            return true;

        } catch (error) {
            console.error('Ошибка при удалении виджета:', error);
            return false;
        }
    }

    /**
     * Получает виджет по ID
     */
    getWidget(widgetId) {
        return this.widgets.get(widgetId);
    }

    /**
     * Получает все виджеты
     */
    getAllWidgets() {
        return Array.from(this.widgets.values());
    }

    /**
     * Получает виджеты определенного типа
     */
    getWidgetsByType(type) {
        return Array.from(this.widgets.values()).filter(widget => widget.type === type);
    }

    /**
     * Очищает все виджеты
     */
    clearAll() {
        const widgetIds = Array.from(this.widgets.keys());
        widgetIds.forEach(id => this.removeWidget(id));
    }

    /**
     * Обновляет layout дашборда
     */
    updateLayout() {
        // Применяем CSS Grid для автоматического размещения виджетов
        const widgetCount = this.widgets.size;
        
        if (widgetCount === 0) {
            this.container.style.gridTemplateColumns = '1fr';
            return;
        }

        // Определяем количество колонок в зависимости от количества виджетов
        let columns;
        if (widgetCount === 1) {
            columns = 1;
        } else if (widgetCount === 2) {
            columns = 2;
        } else if (widgetCount <= 4) {
            columns = 2;
        } else if (widgetCount <= 6) {
            columns = 3;
        } else {
            columns = 4;
        }

        this.container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    /**
     * Показывает сообщение о пустом дашборде
     */
    showEmptyMessage() {
        this.container.innerHTML = '<div class="dashboard__empty">Добавьте виджеты для начала работы</div>';
    }

    /**
     * Генерирует уникальный ID для виджета
     */
    generateWidgetId() {
        return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Получает статистику дашборда
     */
    getStats() {
        const stats = {
            totalWidgets: this.widgets.size,
            widgetsByType: {}
        };

        // Подсчитываем виджеты по типам
        this.widgets.forEach(widget => {
            const type = widget.type;
            stats.widgetsByType[type] = (stats.widgetsByType[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Сохраняет состояние дашборда в localStorage
     */
    saveToStorage() {
        try {
            const dashboardState = {
                widgets: Array.from(this.widgets.entries()).map(([id, widget]) => ({
                    id,
                    type: widget.type,
                    title: widget.title,
                    config: this.getWidgetConfig(widget)
                })),
                counter: this.widgetCounter
            };

            localStorage.setItem('dashboard-state', JSON.stringify(dashboardState));
        } catch (error) {
            console.warn('Не удалось сохранить состояние дашборда:', error);
        }
    }

    /**
     * Загружает состояние дашборда из localStorage
     */
    async loadFromStorage() {
        try {
            const saved = localStorage.getItem('dashboard-state');
            if (!saved) return;

            const dashboardState = JSON.parse(saved);
            
            // Устанавливаем счетчик ПЕРЕД восстановлением виджетов
            this.widgetCounter = dashboardState.counter || 0;
            
            // Восстанавливаем виджеты
            for (const widgetData of dashboardState.widgets) {
                await this.addWidget(widgetData.type, {
                    id: widgetData.id,
                    title: widgetData.title,
                    ...widgetData.config
                });
            }

        } catch (error) {
            console.warn('Не удалось загрузить состояние дашборда:', error);
        }
    }

    /**
     * Получает конфигурацию виджета для сохранения
     */
    getWidgetConfig(widget) {
        // Базовые настройки, которые можно сохранить
        const config = {};
        
        // Для ToDo виджета сохраняем задачи
        if (widget.type === 'todo' && widget.tasks) {
            config.tasks = widget.tasks;
        }
        
        // Для Weather виджета сохраняем город
        if (widget.type === 'weather' && widget.city) {
            config.city = widget.city;
        }

        return config;
    }


    /**
     * Очистка ресурсов дашборда
     */
    destroy() {
        // Уничтожаем все виджеты
        this.clearAll();
        
        // Очищаем ссылки
        this.widgets.clear();
        this.container = null;
    }
}
