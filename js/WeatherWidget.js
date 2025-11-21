import { UIComponent } from './UIComponent.js';

export class WeatherWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '🌤️ Погода',
            className: 'weather-widget'
        });
        
        this.weatherData = config.weatherData || null;
        this.location = config.location || 'Moscow';
        this.apiKeys = [
            '1ab2e4c24809a73a125925778e297ff1',
            '73d97d40da8542ec0b65d35763a3c21e'
        ];
        this.currentApiKeyIndex = 0;
        this.isLoading = false;
        this.autoRefreshInterval = null;
        this.refreshInterval = 2 * 60 * 60 * 1000; // 2 часа
        this.lastUpdate = null;
        this.fetchTimeout = null;
        this.abortController = null;
    }

    render() {
        // Создаем базовую структуру виджета через родительский класс
        super.render();
        
        // Обновляем содержимое и привязываем события
        this.updateDisplay();
        this.bindEvents();
        
        return this.element;
    }

    initialize() {
        this.startAutoRefresh();
        
        // Запускаем первую загрузку данных с небольшой задержкой
        this.fetchTimeout = setTimeout(() => {
            if (!this.isLoading) {
                this.fetchWeatherData();
            }
        }, 1000);
    }

    renderContent() {
        return `
            <div class="weather-widget__location">
                <input 
                    type="text" 
                    class="weather-widget__city-input" 
                    placeholder="Введите город" 
                    value="${this.escapeHtml(this.location)}"
                />
                <button class="weather-widget__search-btn">🔍</button>
            </div>

            <div class="weather-widget__content">
                ${this.isLoading ? this.renderLoading() : this.renderWeather()}
            </div>

            <div class="weather-widget__actions">
                <button class="widget__btn weather-widget__refresh-btn">
                    ${this.isLoading ? '🔄 Загрузка...' : '🔄 Обновить'}
                </button>
            </div>

            <div class="weather-widget__info">
                <small>${this.renderUpdateInfo()}</small>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="weather-widget__loading">
                <div class="weather-widget__spinner"></div>
                <div class="weather-widget__placeholder">Загрузка погоды...</div>
            </div>
        `;
    }

    renderWeather() {
        if (!this.weatherData) {
            return `
                <div class="weather-widget__loading">
                    <div class="weather-widget__placeholder">Нет данных о погоде</div>
                </div>
            `;
        }

        const temp = Math.round(this.weatherData.main.temp);
        const feelsLike = Math.round(this.weatherData.main.feels_like);
        const description = this.weatherData.weather[0].description;
        const city = this.weatherData.name;

        return `
            <div class="weather-widget__main">
                <div class="weather-widget__temperature">${temp}°C</div>
                <div class="weather-widget__description">${this.escapeHtml(description)}</div>
                <div class="weather-widget__location-name">📍 ${this.escapeHtml(city)}</div>
            </div>

            <div class="weather-widget__details">
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Ощущается как</span>
                    <span class="weather-widget__value">${feelsLike}°C</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Влажность</span>
                    <span class="weather-widget__value">${this.weatherData.main.humidity}%</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Ветер</span>
                    <span class="weather-widget__value">${this.weatherData.wind.speed} м/с</span>
                </div>
                <div class="weather-widget__detail">
                    <span class="weather-widget__label">Давление</span>
                    <span class="weather-widget__value">${Math.round(this.weatherData.main.pressure * 0.75)} мм</span>
                </div>
            </div>
        `;
    }

    renderUpdateInfo() {
        if (!this.lastUpdate) return 'Обновляется...';
        
        const now = new Date();
        const updateTime = new Date(this.lastUpdate);
        const diffMinutes = Math.floor((now - updateTime) / 60000);
        
        if (diffMinutes < 1) {
            return 'Обновлено: только что';
        } else if (diffMinutes < 60) {
            return `Обновлено: ${diffMinutes} мин назад`;
        } else {
            const timeString = updateTime.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            return `Обновлено: ${timeString}`;
        }
    }

    bindEvents() {
        // ВАЖНО: Не вызываем super.bindEvents() - его нет в родительском классе
        
        const refreshBtn = this.element?.querySelector('.weather-widget__refresh-btn');
        const searchBtn = this.element?.querySelector('.weather-widget__search-btn');
        const cityInput = this.element?.querySelector('.weather-widget__city-input');

        // Очищаем старые обработчики
        this.cleanUpEventListeners();
        
        if (refreshBtn) {
            const refreshHandler = () => this.fetchWeatherData();
            refreshBtn.addEventListener('click', refreshHandler);
            this.eventListeners.push({ element: refreshBtn, event: 'click', handler: refreshHandler });
        }

        if (searchBtn) {
            const searchHandler = () => {
                if (cityInput && cityInput.value.trim()) {
                    this.location = cityInput.value.trim();
                    this.stopAutoRefresh();
                    this.fetchWeatherData();
                    this.startAutoRefresh();
                }
            };
            searchBtn.addEventListener('click', searchHandler);
            this.eventListeners.push({ element: searchBtn, event: 'click', handler: searchHandler });
        }

        if (cityInput) {
            const keypressHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchBtn.click();
                }
            };
            cityInput.addEventListener('keypress', keypressHandler);
            this.eventListeners.push({ element: cityInput, event: 'keypress', handler: keypressHandler });
        }
        
        // Привязываем событие закрытия виджета
        const closeBtn = this.element?.querySelector('.widget__btn--close');
        if (closeBtn) {
            const closeHandler = () => this.destroy();
            closeBtn.addEventListener('click', closeHandler);
            this.eventListeners.push({ element: closeBtn, event: 'click', handler: closeHandler });
        }
    }

    updateDisplay() {
        const contentContainer = this.element?.querySelector('.widget__content');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderContent();
            this.bindEvents();
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        
        this.autoRefreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.fetchWeatherData();
            }
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
            this.fetchTimeout = null;
        }
    }

    async fetchWeatherData() {
        if (this.isLoading) return;
        
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.isLoading = true;
        this.updateDisplay();
        
        this.abortController = new AbortController();
        
        try {
            const data = await this.tryAllApiKeys();
            
            if (data) {
                this.weatherData = data;
                this.lastUpdate = Date.now();
            } else {
                throw new Error('Все API ключи недоступны');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }
            
            console.error('Ошибка загрузки погоды:', error);
            this.useDemoData();
            this.lastUpdate = Date.now();
        } finally {
            this.isLoading = false;
            this.abortController = null;
            this.updateDisplay();
        }
    }

    async tryAllApiKeys() {
        const signal = this.abortController?.signal;
        
        for (let i = 0; i < this.apiKeys.length; i++) {
            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            
            try {
                const apiKey = this.apiKeys[i];
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(this.location)}&units=metric&appid=${apiKey}&lang=ru`;
                
                const response = await fetch(url, { signal });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }
                console.warn(`API ключ ${i + 1} не сработал`, error);
            }
        }
        
        return null;
    }

    useDemoData() {
        this.weatherData = {
            main: {
                temp: 20 + Math.random() * 10 - 5,
                feels_like: 18 + Math.random() * 10 - 5,
                humidity: 40 + Math.floor(Math.random() * 40),
                pressure: 1010 + Math.floor(Math.random() * 20)
            },
            weather: [{
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: ['ясно', 'облачно', 'небольшой дождь'][Math.floor(Math.random() * 3)]
            }],
            wind: {
                speed: (1 + Math.random() * 10).toFixed(1)
            },
            name: this.location,
            visibility: 10000
        };
    }

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    cleanUpEventListeners() {
        if (this.eventListeners) {
            this.eventListeners.forEach(({ element, event, handler }) => {
                if (element && handler) {
                    element.removeEventListener(event, handler);
                }
            });
        }
        this.eventListeners = [];
    }

    destroy() {
        this.stopAutoRefresh();
        
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        
        this.cleanUpEventListeners();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
