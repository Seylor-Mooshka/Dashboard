/**
 * Главный файл приложения - Аналитический Дашборд
 * Инициализирует приложение и управляет общей логикой
 */

import { Dashboard } from './js/Dashboard.js';

class App {
    constructor() {
        this.dashboard = null;
        this.isInitialized = false;
    }

    /**
     * Инициализирует приложение
     */
    async init() {
        try {
            console.log('🚀 Инициализация Аналитического Дашборда...');
            
            // Создаем экземпляр дашборда
            this.dashboard = new Dashboard('dashboard');
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Загружаем сохраненное состояние
            await this.dashboard.loadFromStorage();
            
            
            // Показываем приветственное сообщение
            this.showWelcomeMessage();
            
            this.isInitialized = true;
            console.log('✅ Дашборд успешно инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации приложения:', error);
            this.showErrorMessage('Не удалось инициализировать приложение');
        }
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // Обработчики для кнопок добавления виджетов
        const addButtons = document.querySelectorAll('[data-widget]');
        addButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const widgetType = e.target.dataset.widget;
                await this.addWidget(widgetType);
            });
        });

        // Обработчик для клавиатуры
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N для добавления нового ToDo виджета
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.addWidget('todo');
            }
            
            // Escape для очистки дашборда
            if (e.key === 'Escape') {
                this.showClearConfirmation();
            }
        });

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            if (this.dashboard) {
                this.dashboard.updateLayout();
            }
        });


        // Обработчик перед закрытием страницы
        window.addEventListener('beforeunload', () => {
            if (this.dashboard) {
                this.dashboard.saveToStorage();
            }
        });

        // Периодическое сохранение состояния
        setInterval(() => {
            if (this.dashboard) {
                this.dashboard.saveToStorage();
            }
        }, 30000); // Каждые 30 секунд
    }

    /**
     * Добавляет новый виджет
     */
    async addWidget(widgetType) {
        if (!this.dashboard) {
            console.error('Дашборд не инициализирован');
            return;
        }

        try {
            // Показываем индикатор загрузки
            this.showLoadingIndicator(`Добавление виджета ${widgetType}...`);

            // Добавляем виджет
            const widget = await this.dashboard.addWidget(widgetType);
            
            // Сохраняем состояние
            this.dashboard.saveToStorage();
            
            // Скрываем индикатор загрузки
            this.hideLoadingIndicator();
            
            // Показываем уведомление
            this.showNotification(`Виджет "${widget.title}" добавлен`, 'success');
            
            console.log(`✅ Виджет ${widgetType} добавлен`);

        } catch (error) {
            console.error(`❌ Ошибка добавления виджета ${widgetType}:`, error);
            this.hideLoadingIndicator();
            this.showNotification(`Ошибка добавления виджета: ${error.message}`, 'error');
        }
    }

    /**
     * Показывает приветственное сообщение
     */
    showWelcomeMessage() {
        const stats = this.dashboard.getStats();
        
        if (stats.totalWidgets === 0) {
            this.showNotification(
                'Добро пожаловать! Добавьте виджеты для начала работы с дашбордом.',
                'info'
            );
        } else {
            this.showNotification(
                `Дашборд загружен. Активных виджетов: ${stats.totalWidgets}`,
                'success'
            );
        }
    }

    /**
     * Показывает индикатор загрузки
     */
    showLoadingIndicator(message = 'Загрузка...') {
        // Создаем индикатор загрузки, если его еще нет
        let loader = document.getElementById('app-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.className = 'app-loader';
            loader.innerHTML = `
                <div class="app-loader__content">
                    <div class="app-loader__spinner"></div>
                    <p class="app-loader__message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.app-loader__message').textContent = message;
        }
        
        loader.style.display = 'flex';
    }

    /**
     * Скрывает индикатор загрузки
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Показывает уведомление
     */
    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.app-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `app-notification app-notification--${type}`;
        notification.innerHTML = `
            <div class="app-notification__content">
                <span class="app-notification__message">${message}</span>
                <button class="app-notification__close">×</button>
            </div>
        `;

        // Добавляем в DOM
        document.body.appendChild(notification);

        // Обработчик закрытия
        const closeBtn = notification.querySelector('.app-notification__close');
        closeBtn.addEventListener('click', () => notification.remove());

        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Анимация появления
        setTimeout(() => {
            notification.classList.add('app-notification--show');
        }, 100);
    }

    /**
     * Показывает сообщение об ошибке
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Показывает подтверждение очистки дашборда
     */
    showClearConfirmation() {
        if (this.dashboard.getStats().totalWidgets === 0) {
            this.showNotification('Дашборд уже пуст', 'info');
            return;
        }

        const confirmed = confirm(
            'Вы уверены, что хотите удалить все виджеты? Это действие нельзя отменить.'
        );

        if (confirmed) {
            this.dashboard.clearAll();
            this.showNotification('Все виджеты удалены', 'success');
        }
    }


    /**
     * Получает статистику приложения
     */
    getAppStats() {
        if (!this.dashboard) return null;
        
        const dashboardStats = this.dashboard.getStats();
        return {
            ...dashboardStats,
            isInitialized: this.isInitialized,
            timestamp: new Date().toISOString()
        };
    }
}

// Создаем и инициализируем приложение
const app = new App();

// Инициализируем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Экспортируем для возможного использования в консоли разработчика
window.App = app;
