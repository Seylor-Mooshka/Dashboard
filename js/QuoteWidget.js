import { UIComponent } from './UIComponent.js';

/**
 * Виджет для отображения случайных цитат
 * Получает данные с внешнего API
 */
export class QuoteWidget extends UIComponent {
    constructor(config = {}) {
        super({
            ...config,
            title: config.title || '💭 Случайная цитата',
            type: 'quote'
        });
        
        this.currentQuote = null;
        this.isLoading = false;
        this.apiUrl = 'https://api.quotable.io/random';
        
        // Локальные цитаты как fallback
        this.fallbackQuotes = [
            {
                content: "Жизнь — это то, что происходит с тобой, пока ты строишь планы.",
                author: "Джон Леннон"
            },
            {
                content: "Единственный способ делать великую работу — это любить то, что ты делаешь.",
                author: "Стив Джобс"
            },
            {
                content: "Будущее принадлежит тем, кто верит в красоту своих мечтаний.",
                author: "Элеонора Рузвельт"
            },
            {
                content: "Успех — это способность переходить от одной неудачи к другой, не теряя энтузиазма.",
                author: "Уинстон Черчилль"
            },
            {
                content: "Не бойтесь отказываться от хорошего ради великого.",
                author: "Джон Рокфеллер"
            }
        ];
    }

    /**
     * Рендерит содержимое виджета цитат
     */
    renderContent() {
        return `
            <div class="quote-widget">
                <div class="quote-widget__content">
                    ${this.isLoading ? this.renderLoading() : this.renderQuote()}
                </div>
                
                <div class="quote-widget__actions">
                    <button class="quote-widget__refresh-btn btn btn--primary" ${this.isLoading ? 'disabled' : ''}>
                        ${this.isLoading ? '⏳ Загрузка...' : '🔄 Новая цитата'}
                    </button>
                </div>
                
                <div class="quote-widget__info">
                    <small>Цитаты предоставлены <a href="https://quotable.io" target="_blank" rel="noopener">Quotable API</a></small>
                </div>
            </div>
        `;
    }

    /**
     * Рендерит состояние загрузки
     */
    renderLoading() {
        return `
            <div class="quote-widget__loading">
                <div class="quote-widget__spinner"></div>
                <p>Загружаем вдохновляющую цитату...</p>
            </div>
        `;
    }

    /**
     * Рендерит текущую цитату
     */
    renderQuote() {
        if (!this.currentQuote) {
            return `
                <div class="quote-widget__placeholder">
                    <p>Нажмите "Новая цитата" чтобы получить вдохновение!</p>
                </div>
            `;
        }

        return `
            <blockquote class="quote-widget__quote">
                <p class="quote-widget__text">"${this.escapeHtml(this.currentQuote.content)}"</p>
                <footer class="quote-widget__author">
                    — <cite>${this.escapeHtml(this.currentQuote.author)}</cite>
                </footer>
            </blockquote>
        `;
    }

    /**
     * Привязывает обработчики событий
     */
    attachEventListeners() {
        super.attachEventListeners();
        
        if (!this.element) return;

        const refreshBtn = this.element.querySelector('.quote-widget__refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadNewQuote());
        }
    }

    /**
     * Загружает новую цитату с API
     */
    async loadNewQuote() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.update();

        try {
            // Пытаемся получить цитату с API
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentQuote = {
                content: data.content,
                author: data.author
            };

        } catch (error) {
            console.warn('Не удалось загрузить цитату с API, используем локальную:', error);
            
            // Используем случайную локальную цитату как fallback
            const randomIndex = Math.floor(Math.random() * this.fallbackQuotes.length);
            this.currentQuote = this.fallbackQuotes[randomIndex];
        } finally {
            this.isLoading = false;
            this.update();
        }
    }

    /**
     * Экранирует HTML для безопасности
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Инициализация виджета - загружаем первую цитату
     */
    async initialize() {
        await this.loadNewQuote();
    }
}
