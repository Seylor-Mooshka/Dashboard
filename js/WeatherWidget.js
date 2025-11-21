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
        this.refreshInterval = 2 * 60 * 60 * 1000;
        this.lastUpdate = null;
        this.fetchTimeout = null;
        this.abortController = null;
    }

    initialize() {
        this.startAutoRefresh();
        
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
                    value="${this.location}"
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
        const icon = this.getWeatherIcon(this.weatherData.weather[0].main);
        const city = this.weatherData.name;

        return `
            <div class="weather-widget__main">
                <div class="weather-widget__temperature">${temp}°C</div>
                <div class="weather-widget__description">${description}</div>
                <div class="weather-widget__location-name">📍 ${city}</div>
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
            return `Обновлено: ${updateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
    }

    bindEvents() {
        super.bindEvents();

        const refreshBtn = this.element?.querySelector('.weather-widget__refresh-btn');
        const searchBtn = this.element?.querySelector('.weather-widget__search-btn');
        const cityInput = this.element?.querySelector('.weather-widget__city-input');

        if (refreshBtn) {
            this.addListener(refreshBtn, 'click', () => {
                this.fetchWeatherData();
            });
        }

        if (searchBtn) {
            this.addListener(searchBtn, 'click', () => {
                if (cityInput && cityInput.value.trim()) {
                    this.location = cityInput.value.trim();
                    this.stopAutoRefresh();
                    this.fetchWeatherData();
                    this.startAutoRefresh();
                }
            });
        }

        if (cityInput) {
            this.addListener(cityInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchBtn.click();
                }
            });
        }
    }

    // --- Остальные методы остаются почти без изменений ---
    // (fetchWeatherData, tryAllApiKeys, useDemoData, getWeatherIcon и т.д.)

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.autoRefreshInterval = setInterval(() => {
            if (!this.isLoading) this.fetchWeatherData();
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
        if (this.abortController) this.abortController.abort();

        this.isLoading = true;
        this.updateDisplay();

        this.abortController = new AbortController();

        try {
            const data = await this.tryAllApiKeys();
            if (data) {
                this.weatherData = data;
                this.lastUpdate = Date.now();
            } else {
                throw new Error('API keys failed');
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Weather fetch error:', error);
            this.useDemoData();
            this.lastUpdate = Date.now();
        } finally {
            this.isLoading = false;
            this.abortController = null;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const content = this.element?.querySelector('.widget__content');
        if (content) {
            content.innerHTML = this.renderContent();
            this.bindEvents();
        }
    }

    async tryAllApiKeys() {
        const signal = this.abortController?.signal;
        for (let i = 0; i < this.apiKeys.length; i++) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&units=metric&appid=${this.apiKeys[i]}&lang=ru`,
                    { signal }
                );
                if (response.ok) return await response.json();
            } catch (e) {
                if (e.name === 'AbortError') throw e;
            }
        }
        return null;
    }

    useDemoData() {
        this.weatherData = {
            main: {
                temp: 18 + Math.random() * 8,
                feels_like: 16 + Math.random() * 10,
                humidity: 40 + Math.random() * 40,
                pressure: 1013
            },
            weather: [{
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: ['ясно', 'облачно', 'дождь'][Math.floor(Math.random() * 3)]
            }],
            wind: { speed: (1 + Math.random() * 7).toFixed(1) },
            visibility: 10000,
            name: this.location
        };
    }

    getWeatherIcon(weatherType) {
        const icons = { Clear: '☀️', Clouds: '🌤️', Rain: '🌧️', Snow: '❄️', Thunderstorm: '⛈️', Drizzle: '🌦️', Mist: '🌫️', Fog: '🌫️' };
        return icons[weatherType] || '🌤️';
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.abortController) this.abortController.abort();
        super.destroy();
    }
}
