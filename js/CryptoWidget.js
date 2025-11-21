import { UIComponent } from './UIComponent.js';

/**
 * Виджет для отображения курса криптовалют
 * Получает данные с внешнего API CoinGecko
 */
export class CryptoWidget extends UIComponent {
    constructor(config = {}) {
        super({
            ...config,
            title: config.title || '💰 Криптовалюты',
            type: 'crypto'
        });
        
        this.cryptoData = null;
        this.isLoading = false;
        this.lastUpdate = null;
        this.updateInterval = 5 * 60 * 1000; // 5 минут
        this.updateTimer = null;
        
        // API URL для CoinGecko
        this.baseApiUrl = 'https://api.coingecko.com/api/v3/simple/price';
        this.cryptoIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
        this.currency = 'usd';
        this.useMock = false; // Моковые данные полностью отключены
    }

    /**
     * Формирует URL для запроса к CoinGecko
     */
    getApiUrl() {
        const ids = this.cryptoIds.join(',');
        const currencies = this.currency;
        // Добавляем timestamp для обхода кэширования
        return `${this.baseApiUrl}?ids=${ids}&vs_currencies=${currencies}&include_24hr_change=true`;
    }

    /**
     * Рендерит содержимое виджета криптовалют
     */
    renderContent() {
        return `
            <div class="crypto-widget">
                <div class="crypto-widget__header">
                    <h4>Топ криптовалюты</h4>
                    <div class="crypto-widget__currency">
                        <select class="crypto-widget__currency-select">
                            <option value="usd" ${this.currency === 'usd' ? 'selected' : ''}>USD</option>
                            <option value="eur" ${this.currency === 'eur' ? 'selected' : ''}>EUR</option>
                            <option value="rub" ${this.currency === 'rub' ? 'selected' : ''}>RUB</option>
                        </select>
                    </div>
                </div>
                
                <div class="crypto-widget__content">
                    ${this.isLoading ? this.renderLoading() : this.renderCryptoList()}
                </div>
                
                <div class="crypto-widget__actions">
                    <button class="crypto-widget__refresh-btn btn btn--primary" ${this.isLoading ? 'disabled' : ''}>
                        ${this.isLoading ? '⏳ Загрузка...' : '🔄 Обновить'}
                    </button>
                </div>
                
                ${this.lastUpdate ? `
                    <div class="crypto-widget__info">
                        <small>Обновлено: ${this.formatDateTime(this.lastUpdate)}</small>
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
            <div class="crypto-widget__loading">
                <div class="crypto-widget__spinner"></div>
                <p>Получаем данные о криптовалютах...</p>
            </div>
        `;
    }

    /**
     * Рендерит список криптовалют
     */
    renderCryptoList() {
        if (!this.cryptoData) {
            return `
                <div class="crypto-widget__placeholder">
                    <p>Нажмите "Обновить" чтобы получить данные о криптовалютах</p>
                </div>
            `;
        }

        return this.cryptoIds.map(id => {
            if (!this.cryptoData[id]) return '';

            const data = this.cryptoData[id];
            const crypto = this.getCryptoInfo(id);
            const price = data[this.currency];
            const changeKey = `${this.currency}_24h_change`;
            const change24h = typeof data[changeKey] === 'number' ? data[changeKey] : 0;
            const isPositive = change24h >= 0;

            return `
                <div class="crypto-widget__item">
                    <div class="crypto-widget__crypto-info">
                        <div class="crypto-widget__crypto-icon">
                            ${crypto.emoji}
                        </div>
                        <div class="crypto-widget__crypto-details">
                            <div class="crypto-widget__crypto-name">${crypto.name}</div>
                            <div class="crypto-widget__crypto-symbol">${crypto.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                    
                    <div class="crypto-widget__crypto-price">
                        <div class="crypto-widget__price">
                            ${price !== undefined ? this.formatPrice(price) : '—'}
                        </div>
                        <div class="crypto-widget__change ${isPositive ? 'crypto-widget__change--positive' : 'crypto-widget__change--negative'}">
                            ${isPositive ? '+' : ''}${change24h.toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Привязывает обработчики событий
     */
    attachEventListeners() {
        super.attachEventListeners();
        
        if (!this.element) return;

        // Обработчик смены валюты
        const currencySelect = this.element.querySelector('.crypto-widget__currency-select');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.currency = e.target.value;
                this.loadCryptoData();
            });
        }

        // Обработчик обновления
        const refreshBtn = this.element.querySelector('.crypto-widget__refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadCryptoData());
        }
    }

    /**
     * Загружает данные о криптовалютах
     */
    async loadCryptoData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.update();

        try {
            // Запрос к реальному API CoinGecko
            const response = await fetch(this.getApiUrl());
            
            // Анализируем статус ответа
            if (response.status === 403) {
                throw new Error('Доступ к API запрещен. Попробуйте обновить страницу.');
            }
            
            if (response.status === 429) {
                throw new Error('Слишком много запросов. Попробуйте через минуту.');
            }
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Проверка структуры данных
            if (!data || Object.keys(data).length === 0) {
                throw new Error('Получен пустой ответ от API');
            }

            this.cryptoData = data;
            this.lastUpdate = new Date();
        } catch (error) {
            console.error('Ошибка загрузки данных о криптовалютах:', error);
            this.showError(error.message || 'Не удалось загрузить данные');
            this.cryptoData = null;
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
        
        const contentElement = this.element.querySelector('.crypto-widget__content');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="crypto-widget__error">
                    <div class="crypto-widget__error-icon">⚠️</div>
                    <div class="crypto-widget__error-message">${message}</div>
                    <button class="crypto-widget__retry-btn btn btn--secondary" style="margin-top: 10px">
                        Попробовать снова
                    </button>
                </div>
            `;
            
            const retryBtn = contentElement.querySelector('.crypto-widget__retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.loadCryptoData());
            }
        }
    }

    /**
     * Возвращает информацию о криптовалюте
     */
    getCryptoInfo(id) {
        const cryptoMap = {
            bitcoin: { name: 'Bitcoin', symbol: 'btc', emoji: '₿' },
            ethereum: { name: 'Ethereum', symbol: 'eth', emoji: 'Ξ' },
            binancecoin: { name: 'BNB', symbol: 'bnb', emoji: '🟡' },
            cardano: { name: 'Cardano', symbol: 'ada', emoji: '🔵' },
            solana: { name: 'Solana', symbol: 'sol', emoji: '☀️' }
        };
        return cryptoMap[id] || { name: 'Unknown', symbol: '???', emoji: '❓' };
    }

    /**
     * Форматирует цену для отображения
     */
    formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return '—';

        if (this.currency === 'rub') {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price);
        } else if (this.currency === 'eur') {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price);
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price);
        }
    }

    /**
     * Форматирует дату и время для отображения
     */
    formatDateTime(date) {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Инициализация виджета
     */
    async initialize() {
        await this.loadCryptoData();
        // Загружаем данные сразу при инициализации
        this.startAutoUpdate();
    }

    /**
     * Запускает автоматическое обновление
     */
    startAutoUpdate() {
        this.stopAutoUpdate();
        
        this.updateTimer = setInterval(() => {
            this.loadCryptoData();
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
