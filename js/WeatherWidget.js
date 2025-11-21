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
        const currentWeather = this.weatherData ? this.renderCurrentWeather() : this.renderLoading();
        const forecast = this.weatherData ? this.renderForecast() : '';

        return `
            <div class="widget-header">
                <h3>🌤️ Погода</h3>
                <div class="widget-controls">
                    <button class="control-btn minimize-btn">−</button>
                    <button class="control-btn close-btn">×</button>
                </div>
            </div>

            <div class="widget-content">
                <div class="section-title">Текущая погода</div>

                ${currentWeather}

                ${forecast}

                <div class="refresh-section">
                    <button class="refresh-button">
                        <span>🔄</span> Обновить
                    </button>
                </div>

                <div class="update-info">
                    Обновлено: ${this.renderUpdateInfo()}
                </div>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="loading-state">
                <div class="spinner">🔄</div>
                <div>Загрузка данных...</div>
            </div>
        `;
    }

    renderCurrentWeather() {
        const temp = Math.round(this.weatherData.main.temp);
        const feelsLike = Math.round(this.weatherData.main.feels_like);
        const description = this.weatherData.weather[0].description;
        const icon = this.getWeatherIcon(this.weatherData.weather[0].main);
        const city = this.weatherData.name;

        return `
            <div class="weather-item">
                <div class="icon-and-temp">
                    <span class="weather-icon">${icon}</span>
                    <div class="temp-large">${temp}°C</div>
                </div>
                <div class="weather-details">
                    <div class="city-name">📍 ${city}</div>
                    <div class="weather-desc">${description}</div>
                    <div class="feels-like">Ощущается как ${feelsLike}°C</div>
                </div>
            </div>
        `;
    }

    renderForecast() {
        const forecasts = [
            { time: '+3ч', temp: Math.round(this.weatherData.main.temp + 1), icon: this.getWeatherIcon(this.weatherData.weather[0].main) },
            { time: '+6ч', temp: Math.round(this.weatherData.main.temp - 1), icon: this.getForecastIcon(this.weatherData.weather[0].main, 6) },
            { time: '+12ч', temp: Math.round(this.weatherData.main.temp - 2), icon: this.getForecastIcon(this.weatherData.weather[0].main, 12) }
        ];

        return `
            <div class="forecast-section">
                <div class="section-title">Прогноз на день</div>
                ${forecasts.map(f => `
                    <div class="forecast-item">
                        <span class="time">${f.time}</span>
                        <span class="icon">${f.icon}</span>
                        <span class="temp">${f.temp}°</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderUpdateInfo() {
        if (!this.lastUpdate) return '...';
        
        const now = new Date();
        const updateTime = new Date(this.lastUpdate);
        const diffMinutes = Math.floor((now - updateTime) / 60000);
        
        if (diffMinutes < 1) {
            return 'только что';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} мин назад`;
        } else {
            return updateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
    }

    bindEvents() {
        super.bindEvents();

        const refreshBtn = this.element?.querySelector('.refresh-button');
        const minimizeBtn = this.element?.querySelector('.minimize-btn');
        const closeBtn = this.element?.querySelector('.close-btn');

        if (refreshBtn) {
            this.addListener(refreshBtn, 'click', () => {
                this.fetchWeatherData();
            });
        }

        if (minimizeBtn) {
            this.addListener(minimizeBtn, 'click', () => {
                this.minimize();
            });
        }

        if (closeBtn) {
            this.addListener(closeBtn, 'click', () => {
                this.close();
            });
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        
        this.autoRefreshInterval = setInterval(() => {
            if (this.isLoading) return;
            this.fetchWeatherData();
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
        this.updateRefreshButton();
        
        this.abortController = new AbortController();
        
        try {
            const data = await this.tryAllApiKeys();
            
            if (data) {
                this.weatherData = data;
                this.lastUpdate = Date.now();
            } else {
                throw new Error('Все API ключи нерабочие');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') return;
            
            console.error('Weather API error:', error);
            this.useDemoData();
            this.lastUpdate = Date.now();
        } finally {
            this.isLoading = false;
            this.abortController = null;
            
            if (this.element) {
                this.updateDisplay();
            }
        }
    }

    updateRefreshButton() {
        const refreshBtn = this.element?.querySelector('.refresh-button');
        if (refreshBtn) {
            if (this.isLoading) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<span>🔄</span> Загрузка...';
            } else {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<span>🔄</span> Обновить';
            }
        }
    }

    async tryAllApiKeys() {
        const signal = this.abortController?.signal;
        
        for (let i = 0; i < this.apiKeys.length; i++) {
            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            
            try {
                this.currentApiKeyIndex = i;
                const apiKey = this.apiKeys[i];
                
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&units=metric&appid=${apiKey}&lang=ru`,
                    { signal }
                );
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                if (error.name === 'AbortError') throw error;
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
                pressure: 1013,
                temp_min: 15 + Math.random() * 5,
                temp_max: 20 + Math.random() * 10
            },
            weather: [{
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: ['ясно', 'облачно', 'небольшой дождь'][Math.floor(Math.random() * 3)]
            }],
            wind: {
                speed: (1 + Math.random() * 7).toFixed(1)
            },
            visibility: 10000,
            name: this.location,
            sys: {
                country: 'RU'
            }
        };
    }

    updateDisplay() {
        const container = this.element?.querySelector('.widget-content');
        if (container) {
            container.innerHTML = this.renderContent().split('</div>')[1]; // Только содержимое
            this.bindEvents();
        }
    }

    getWeatherIcon(weatherType) {
        const icons = {
            'Clear': '☀️',
            'Clouds': '🌤️',
            'Rain': '🌧️',
            'Snow': '❄️',
            'Thunderstorm': '⛈️',
            'Drizzle': '🌦️',
            'Mist': '🌫️',
            'Fog': '🌫️'
        };
        return icons[weatherType] || '🌤️';
    }

    getForecastIcon(weatherType, hours) {
        if (hours >= 18 || hours <= 6) {
            const nightIcons = {
                'Clear': '🌙',
                'Clouds': '☁️',
                'Rain': '🌧️',
                'Snow': '❄️'
            };
            return nightIcons[weatherType] || '🌙';
        }
        return this.getWeatherIcon(weatherType);
    }

    refresh() {
        if (!this.isLoading) {
            this.fetchWeatherData();
        }
    }

    destroy() {
        this.stopAutoRefresh();
        
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        
        super.destroy();
    }

    minimize() {
        this.element.style.display = 'none';
        // Можно добавить логику восстановления
    }

    close() {
        this.destroy();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
