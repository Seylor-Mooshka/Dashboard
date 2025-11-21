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
        
        // API ключ для OpenWeatherMap (в реальном проекте должен быть в переменных окружения)
        this.apiKey = 'f6392c735d2b68f57323a6903c8a85f9'; // Для демо используем demo ключ
        this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
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
                        value="${this.city}"
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

        return `
            <div class="weather-widget__main">
                <div class="weather-widget__temperature">
                    ${Math.round(main.temp)}°C
                </div>
                <div class="weather-widget__description">
                    ${this.getWeatherEmoji(weatherInfo.main)} ${weatherInfo.description}
                </div>
            </div>
            
            <div class="weather-widget__details">
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Ощущается как:</span>
                    <span class="weather-widget__value">${Math.round(main.feels_like)}°C</span>
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
            // Для демо используем моковые данные, так как API требует регистрации
            await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация загрузки
            
            // Моковые данные для демонстрации
            this.weatherData = {
                main: {
                    temp: Math.round(Math.random() * 30 - 10), // -10 до 20°C
                    feels_like: Math.round(Math.random() * 30 - 10),
                    humidity: Math.round(Math.random() * 40 + 40), // 40-80%
                    pressure: Math.round(Math.random() * 50 + 1000) // 1000-1050 гПа
                },
                weather: [{
                    main: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
                    description: ['ясно', 'облачно', 'дождь', 'снег'][Math.floor(Math.random() * 4)]
                }],
                wind: {
                    speed: Math.round(Math.random() * 10) // 0-10 м/с
                }
            };

            this.lastUpdate = new Date();

        } catch (error) {
            console.error('Ошибка загрузки данных о погоде:', error);
            this.weatherData = null;
        } finally {
            this.isLoading = false;
            this.update();
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
            'Snow': '❄️',
            'Thunderstorm': '⛈️',
            'Drizzle': '🌦️',
            'Mist': '🌫️',
            'Fog': '🌫️'
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
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
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
