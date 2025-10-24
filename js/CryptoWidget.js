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
        
        // API URL для CoinGecko
        this.apiUrl = 'https://api.coingecko.com/api/v3/simple/price';
        this.cryptoIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
        this.currency = 'usd';
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

        return Object.entries(this.cryptoData).map(([id, data]) => {
            const crypto = this.getCryptoInfo(id);
            const price = data[this.currency];
            const change24h = data[`${this.currency}_24h_change`] || 0;
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
                            ${this.formatPrice(price)}
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
            // Для демо используем моковые данные, так как API может быть недоступен
            await new Promise(resolve => setTimeout(resolve, 1500)); // Имитация загрузки
            
            // Моковые данные для демонстрации
            this.cryptoData = {
                bitcoin: {
                    usd: 45000 + Math.random() * 10000,
                    eur: 40000 + Math.random() * 8000,
                    rub: 3000000 + Math.random() * 500000,
                    usd_24h_change: (Math.random() - 0.5) * 10,
                    eur_24h_change: (Math.random() - 0.5) * 10,
                    rub_24h_change: (Math.random() - 0.5) * 10
                },
                ethereum: {
                    usd: 3000 + Math.random() * 2000,
                    eur: 2500 + Math.random() * 1500,
                    rub: 200000 + Math.random() * 100000,
                    usd_24h_change: (Math.random() - 0.5) * 15,
                    eur_24h_change: (Math.random() - 0.5) * 15,
                    rub_24h_change: (Math.random() - 0.5) * 15
                },
                binancecoin: {
                    usd: 300 + Math.random() * 200,
                    eur: 250 + Math.random() * 150,
                    rub: 20000 + Math.random() * 10000,
                    usd_24h_change: (Math.random() - 0.5) * 20,
                    eur_24h_change: (Math.random() - 0.5) * 20,
                    rub_24h_change: (Math.random() - 0.5) * 20
                },
                cardano: {
                    usd: 0.5 + Math.random() * 0.5,
                    eur: 0.4 + Math.random() * 0.4,
                    rub: 30 + Math.random() * 30,
                    usd_24h_change: (Math.random() - 0.5) * 25,
                    eur_24h_change: (Math.random() - 0.5) * 25,
                    rub_24h_change: (Math.random() - 0.5) * 25
                },
                solana: {
                    usd: 100 + Math.random() * 100,
                    eur: 80 + Math.random() * 80,
                    rub: 6000 + Math.random() * 6000,
                    usd_24h_change: (Math.random() - 0.5) * 30,
                    eur_24h_change: (Math.random() - 0.5) * 30,
                    rub_24h_change: (Math.random() - 0.5) * 30
                }
            };

            this.lastUpdate = new Date();

        } catch (error) {
            console.error('Ошибка загрузки данных о криптовалютах:', error);
            this.cryptoData = null;
        } finally {
            this.isLoading = false;
            this.update();
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
        if (this.currency === 'rub') {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
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
        await this.loadCryptoData();
        
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
