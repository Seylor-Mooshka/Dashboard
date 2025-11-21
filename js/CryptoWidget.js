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
     * Рендерит список криптовалют в правильном порядке
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
            const data = this.cryptoData[id];
            if (!data) return '';

            const crypto = this.getCryptoInfo(id);
            const price = data[this.currency];
            const change24h = data[`${this.currency}_24h_change`] || 0;
            const isPositive = change24h >= 0;

            // Защита от отсутствующей цены
            if (price == null) {
                return `
                    <div class="crypto-widget__item">
                        <div class="crypto-widget__crypto-info">
                            <div class="crypto-widget__crypto-icon">${crypto.emoji}</div>
                            <div class="crypto-widget__crypto-details">
                                <div class="crypto-widget__crypto-name">${crypto.name}</div>
                                <div class="crypto-widget__crypto-symbol">${crypto.symbol.toUpperCase()}</div>
                            </div>
                        </div>
                        <div class="crypto-widget__crypto-price">
                            <div class="crypto-widget__price">—</div>
                            <div class="crypto-widget__change">—</div>
                        </div>
                    </div>
                `;
            }

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
           
