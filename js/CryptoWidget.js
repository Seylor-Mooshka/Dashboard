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
        this.baseApiUrl = 'https://api.coingecko.com/api/v3/simple/price';
        this.cryptoIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
        this.currency = 'usd';
        this.useMock = true; // Переключатель: true — мок, false — реальный API
    }

    /**
     * Формирует URL для запроса к CoinGecko
     */
    getApiUrl() {
        const ids = this.cryptoIds.join(',');
        const currencies = this.currency;
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
                        <small>Обновлено: ${this.formatTime(this.lastUpdate)}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="crypto-widget__loading">
                <div class="crypto-widget__spinner"></div>
                <p>Получаем данные о криптовалютах...</p>
            </div>
        `;
    }

    renderCryptoList() {
        if (!this.cryptoData) {
            return `
                <div class="crypto-widget__placeholder">
                    <p>Нажмите "Обновить" чтобы получить данные о криптовалютах</p>
                </div>
            `;
        }

        // Сохраняем порядок из cryptoIds
        return this.cryptoIds.map(id => {
            const data = this.cryptoData[id];
            if (!data) return '';

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

    attachEventListeners() {
        super.attachEventListeners();
        
        if (!this.element) return;

        const currencySelect = this.element.querySelector('.crypto-widget__currency-select');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.currency = e.target.value;
                this.loadCryptoData();
            });
        }

        const refreshBtn = this.element.querySelector('.crypto-widget__refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadCryptoData());
        }
    }

    async loadCryptoData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.update();

        try {
            let data;

            if (this.useMock) {
                await new Promise(resolve => setTimeout(resolve, 800));

                data = {
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
            } else {
                const response = await fetch(this.getApiUrl());
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                data = await response.json();
            }

            this.cryptoData = data;
            this.lastUpdate = new Date();
        } catch (error) {
            console.error('Ошибка загрузки данных о криптовалютах:', error);
            this.cryptoData = null;
        } finally {
            this.isLoading = false;
            this.update();
        }
    }

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

    formatPrice(price) {
        if (typeof price !== 'number') return '—';

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

    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async initialize() {
        await this.loadCryptoData();
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        this.stopAutoUpdate();
        this.updateTimer = setInterval(() => {
            this.loadCryptoData();
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    onDestroy() {
        this.stopAutoUpdate();
    }
}
