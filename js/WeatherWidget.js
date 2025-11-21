import { UIComponent } from './UIComponent.js';

/**
 * Виджет для отображения погоды
 * Получает данные с внешнего API OpenWeatherMap
 */
export class WeatherWidget extends UIComponent {
    constructor(config = {}) {
        super({
            ...config,
            title: config.title || '🌤️ Погода',
            type: 'weather'
        });
        
        this.city = config.city || 'Москва';
        this.weatherData = null;
        this.isLoading = false;
        this.lastUpdate = null;
        this.updateInterval = 10 * 60 * 1000; // 10 минут
        this.updateTimer = null;
        
        // API ключ для OpenWeatherMap
        this.apiKey = '7f958b5c29d990879d16c1b7bd590b5e';
        // Используем прокси для обхода CORS на GitHub Pages
        this.proxyUrl = 'https://corsproxy.io/?';
        this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    }

    /**
     * Формирует URL для запроса к OpenWeatherMap API
     */
    getApiUrl() {
        const directUrl = `${this.apiUrl}?q=${encodeURIComponent(this.city)}&appid=${this.apiKey}&units=metric&lang=ru`;
        
        // Определяем, запущено ли приложение на GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        // Используем прокси только для GitHub Pages для обхода CORS
        return isGitHubPages ? this.proxyUrl + encodeURIComponent(directUrl) : directUrl;
    }

    /**
     * Рендерит содержимое виджета погоды
     */
    renderContent() {
        return `
            <div class="weather-widget">
                <div class="weather-widget__location">
                    <input 
                        type="text" 
                        class="weather-widget__city-input" 
                        placeholder="Введите город"
                        value="${this.escapeHtml(this.city)}"
                        maxlength="50"
                    >
                    <button class="weather-widget__search-btn btn btn--primary">
                        🔍
                    </button>
                </div>
                
                <div class="weather-widget__content">
                    ${this.isLoading ? this.renderLoading() : this.renderWeather()}
                </div>
                
                <div class="weather-widget__actions">
                    <button class="weather-widget__refresh-btn btn btn--secondary" ${this.isLoading ? 'disabled' : ''}>
                        ${this.isLoading ? '⏳ Загрузка...' : '🔄 Обновить'}
                    </button>
                </div>
                
                ${this.lastUpdate ? `
                    <div class="weather-widget__info">
                        <small>Обновлено: ${this.formatTime(this.lastUpdate)}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Экранирует HTML-символы для безопасности
     */
    escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Рендерит состояние загрузки
     */
    renderLoading() {
        return `
            <div class="weather-widget__loading">
                <div class="weather-widget__spinner"></div>
                <p>Получаем данные о погоде...</p>
            </div>
        `;
    }

    /**
     * Рендерит данные о погоде
     */
    renderWeather() {
        if (!this.weatherData) {
            return `
                <div class="weather-widget__placeholder">
                    <p>Нажмите "Обновить" чтобы получить данные о погоде</p>
                </div>
            `;
        }

        const { main, weather, wind } = this.weatherData;
        const weatherInfo = weather[0];
        const feelsLike = main.feels_like !== undefined ? Math.round(main.feels_like) : Math.round(main.temp);

        return `
            <div class="weather-widget__main">
                <div class="weather-widget__temperature">
                    ${Math.round(main.temp)}°C
                </div>
                <div class="weather-widget__description">
                    ${this.getWeatherEmoji(weatherInfo.main)} ${this.escapeHtml(weatherInfo.description)}
                </div>
            </div>
            
            <div class="weather-widget__details">
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Ощущается как:</span>
                    <span class="weather-widget__value">${feelsLike}°C</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Влажность:</span>
                    <span class="weather-widget__value">${main.humidity}%</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Давление:</span>
                    <span class="weather-widget__value">${Math.round(main.pressure * 0.75)} мм рт.ст.</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Ветер:</span>
                    <span class="weather-widget__value">${Math.round(wind.speed)} м/с</span>
                </div>
            </div>
        `;
    }

    /**
     * Привязывает обработчики событий
     */
    attachEventListeners() {
        super.attachEventListeners();
        
        if (!this.element) return;

        // Обработчик поиска по городу
        const searchBtn = this.element.querySelector('.weather-widget__search-btn');
        const cityInput = this.element.querySelector('.weather-widget__city-input');
        
        if (searchBtn && cityInput) {
            const searchWeather = () => {
                const newCity = cityInput.value.trim();
                if (newCity && newCity !== this.city) {
                    this.city = newCity;
                    this.loadWeather();
                }
            };

            searchBtn.addEventListener('click', searchWeather);
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchWeather();
                }
            });
        }

        // Обработчик обновления
        const refreshBtn = this.element.querySelector('.weather-widget__refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeather());
        }
    }

    /**
     * Загружает данные о погоде
     */
    async loadWeather() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.update();

        try {
            console.log('Запрос данных о погоде для города:', this.city);
            console.log('URL запроса:', this.getApiUrl());
            
            const response = await fetch(this.getApiUrl());
            
            console.log('Статус ответа:', response.status);
            
            if (response.status === 401) {
                throw new Error('Неверный или неактивный API-ключ');
            }
            
            if (response.status === 404) {
                throw new Error('Город не найден. Проверьте название города');
            }
            
            if (response.status === 429) {
                throw new Error('Превышен лимит запросов к API. Попробуйте позже');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `Ошибка сервера: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('Полученные данные о погоде:', data);
            
            // Проверка структуры данных
            if (!data.main || !data.weather || !data.wind) {
                throw new Error('Неверная структура ответа от API');
            }

            this.weatherData = data;
            this.lastUpdate = new Date();
            
            console.log('Данные о погоде успешно загружены');
            
        } catch (error) {
            console.error('Ошибка загрузки данных о погоде:', error);
            this.showError(error.message || 'Не удалось загрузить данные о погоде. Проверьте консоль для деталей.');
            this.weatherData = null;
        } finally {
            this.isLoading = false;
            this.update();
        }
    }

    /**
     * Отображает сообщение об ошибке
     */
    showError(message) {
        if (!this.element) return;
        
        const contentElement = this.element.querySelector('.weather-widget__content');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="weather-widget__error">
                    <div class="weather-widget__error-icon">⚠️</div>
                    <div class="weather-widget__error-message">${this.escapeHtml(message)}</div>
                    <button class="weather-widget__retry-btn btn btn--secondary" style="margin-top: 10px">
                        Попробовать снова
                    </button>
                </div>
            `;
            
            const retryBtn = contentElement.querySelector('.weather-widget__retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.loadWeather());
            }
        }
    }

    /**
     * Возвращает эмодзи для типа погоды
     */
    getWeatherEmoji(weatherMain) {
        const emojiMap = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Snow': '❄️',
            'Thunderstorm': '⛈️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Smoke': '🌫️',
            'Haze': '🌫️',
            'Dust': '💨',
            'Sand': '💨',
            'Ash': '🌋',
            'Squall': '💨',
            'Tornado': '🌪️'
        };
        return emojiMap[weatherMain] || '🌤️';
    }

    /**
     * Форматирует время для отображения
     */
    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Инициализация виджета
     */
    async initialize() {
        await this.loadWeather();
        
        // Устанавливаем автоматическое обновление
        this.startAutoUpdate();
    }

    /**
     * Запускает автоматическое обновление
     */
    startAutoUpdate() {
        this.stopAutoUpdate();
        
        this.updateTimer = setInterval(() => {
            this.loadWeather();
        }, this.updateInterval);
    }

    /**
     * Останавливает автоматическое обновление
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Очистка ресурсов при уничтожении виджета
     */
    onDestroy() {
        this.stopAutoUpdate();
    }
}
