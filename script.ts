declare const firebase: any;

interface Application {
    marca: string;
    serie: string;
    litros?: string;
    año: string;
    especificacion?: string;
    posicion?: string;
    [key: string]: any;
}

interface Product {
    _appId: string; // Changed from number to string for Firebase IDs
    aplicaciones: Application[];
    ref: string[];
    oem: string[];
    fmsi: string[];
    medidas: string[] | string;
    anchoNum: number;
    altoNum: number;
    posición?: string;
    imagen?: string;
    imagenes?: string[];
    _searchableText?: string;
    [key: string]: any;
}

interface FilterState {
    busqueda: string;
    marca: string;
    modelo: string;
    anio: string;
    oem: string;
    fmsi: string;
    ancho: number | null;
    alto: number | null;
    pos: string[];
    manufacturer: string | null;
    favorites: boolean;
}

document.addEventListener('DOMContentLoaded', () => {
    // === Configuración de Firebase ===
    const firebaseConfig = {
        apiKey: "AIzaSyCha4S_wLxI_CZY1Tc9FOJNA3cUTggISpU",
        authDomain: "brakexadmin.firebaseapp.com",
        projectId: "brakexadmin",
        storageBucket: "brakexadmin.firebasestorage.app",
        messagingSenderId: "799264562947",
        appId: "1:799264562947:web:52d860ae41a5c4b8f75336"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // === FUNCIONES DE TOAST NOTIFICATIONS (ANTES DE AppState) ===
    function showToastNotification(title: string, body: string) {
        console.log('🔔 Toast called:', title, body);
        const container = document.getElementById('toastContainer');
        console.log('📦 Container:', container);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';

        toast.innerHTML = `
            <div class="toast-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-body">${body}</div>
            </div>
            <button class="toast-close" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            removeToast(toast);
        });

        toast.addEventListener('click', () => {
            const panel = document.getElementById('notificationsPanel');
            panel?.classList.remove('hidden');
            removeToast(toast);
        });

        setTimeout(() => removeToast(toast), 4000);
    }

    function removeToast(toast: HTMLElement) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }

    // === INICIO: MEJORA #4 (AppState Class) ===
    // === Estado de la aplicación ===
    class AppState {
        data: Product[];
        filtered: Product[];
        currentPage: number;
        private _favorites: Set<string>; // Changed to store string IDs
        isFavoritesMode: boolean;
        activeManufacturer: string | null;
        private _comparisons: Set<string>; // Changed to store string IDs
        private _notifications: any[]; // Array de notificaciones

        constructor() {
            this.data = [];
            this.filtered = [];
            this.currentPage = 1;
            this._favorites = new Set<string>();
            this._comparisons = new Set<string>();
            this.isFavoritesMode = false;
            this.activeManufacturer = null;

            this._loadFavorites(); // Carga los favoritos automáticamente al iniciar
            this._loadComparisons();
            this._notifications = []; // Initialize notifications
            this._loadNotifications(); // Cargar notificaciones desde localStorage
        }

        // Carga los favoritos desde localStorage
        _loadFavorites() {
            try {
                const favs = localStorage.getItem('brakeXFavorites');
                if (favs) {
                    this._favorites = new Set(JSON.parse(favs));
                }
            } catch (e) {
                console.error("Error al cargar favoritos:", e); // Error no crítico, solo log
                this._favorites = new Set();
            }
        }

        validateFavorites() {
            if (this.data.length === 0) return;
            const currentIds = new Set(this.data.map(i => i._appId));
            let changed = false;
            this._favorites.forEach(id => {
                if (!currentIds.has(id)) {
                    this._favorites.delete(id);
                    changed = true;
                }
            });
            if (changed) {
                this._saveFavorites();
                this.updateFavoriteBadge();
            }
        }

        // Guarda los favoritos en localStorage
        _saveFavorites() {
            try {
                localStorage.setItem('brakeXFavorites', JSON.stringify([...this._favorites]));
            } catch (e) {
                console.error("Error al guardar favoritos:", e); // Error no crítico, solo log
            }
        }

        // Método público para alternar un favorito
        toggleFavorite(itemId: string): boolean {
            if (this._favorites.has(itemId)) {
                this._favorites.delete(itemId);
            } else {
                this._favorites.add(itemId);
            }
            this._saveFavorites(); // Guarda automáticamente al cambiar
            // Inicializar contador de favoritos después de que DOM esté listo
            this.updateFavoriteBadge();
            this.updateComparisonBadge(); // Actualiza el badge
            this.updateNotificationBadge();
            return this._favorites.has(itemId);
        }

        // Método público para verificar si es favorito
        isFavorite(itemId: string): boolean {
            return this._favorites.has(itemId);
        }

        // Getter para acceder a los favoritos
        get favorites() {
            return this._favorites;
        }

        // Método para actualizar el badge de favoritos en el UI
        updateFavoriteBadge() {
            const badge = document.getElementById('favCountBadge');
            if (badge) {
                const count = this._favorites.size;
                badge.innerText = count.toString(); // Use innerText for text content

                // Animación "Pop" para feedback visual
                badge.classList.remove('pop');
                void badge.offsetWidth; // Trigger reflow
                badge.classList.add('pop');

                if (count > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }

        // --- Comparaciones Logic ---
        _loadComparisons() {
            try {
                const comps = localStorage.getItem('brakeXComparisons');
                if (comps) this._comparisons = new Set(JSON.parse(comps));
            } catch (e) {
                console.error("Error loading comparisons:", e);
                this._comparisons = new Set();
            }
        }

        _saveComparisons() {
            localStorage.setItem('brakeXComparisons', JSON.stringify([...this._comparisons]));
        }

        toggleComparison(itemId: string): boolean {
            if (this._comparisons.has(itemId)) {
                this._comparisons.delete(itemId);
            } else {
                if (this._comparisons.size >= 4) {
                    showToastNotification("Límite Alcanzado", "Máximo 4 productos para comparar.");
                    return false;
                }
                this._comparisons.add(itemId);
            }
            this._saveComparisons();
            this.updateComparisonBadge();
            return this._comparisons.has(itemId);
        }

        validateComparisons() {
            if (this.data.length === 0) return;
            const currentIds = new Set(this.data.map(i => i._appId));
            let changed = false;
            this._comparisons.forEach(id => {
                if (!currentIds.has(id)) {
                    this._comparisons.delete(id);
                    changed = true;
                }
            });
            if (changed) {
                this._saveComparisons();
                this.updateComparisonBadge();
            }
        }

        isComparison(itemId: string): boolean {
            return this._comparisons.has(itemId);
        }

        get comparisons() { return this._comparisons; }

        // --- Notifications Logic ---
        _loadNotifications() {
            try {
                const notifs = localStorage.getItem('brakeXNotifications');
                if (notifs) {
                    this._notifications = JSON.parse(notifs);
                } else {
                    // Notificación de bienvenida por defecto
                    this._notifications = [
                        { id: Date.now(), title: 'Bienvenido', body: 'Bienvenido a Brake X', read: false }
                    ];
                    this._saveNotifications();
                }
            } catch (e) {
                console.error("Error loading notifications:", e);
                this._notifications = [
                    { id: Date.now(), title: 'Bienvenido', body: 'Bienvenido a Brake X', read: false }
                ];
            }
        }

        _saveNotifications() {
            try {
                localStorage.setItem('brakeXNotifications', JSON.stringify(this._notifications));
            } catch (e) {
                console.error("Error saving notifications:", e);
            }
        }

        updateComparisonBadge() {
            const badge = document.getElementById('compareCountBadge');
            if (badge) {
                const count = this._comparisons.size;
                badge.innerText = count.toString();
                badge.classList.remove('pop');
                void badge.offsetWidth;
                badge.classList.add('pop');
                count > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
            }
        }

        addNotification(title: string, body: string, productId?: string) {
            this._notifications.unshift({
                id: Date.now(),
                title,
                body,
                productId: productId || null,
                read: false
            });
            // Límite de 25 notificaciones (FIFO)
            if (this._notifications.length > 25) {
                this._notifications = this._notifications.slice(0, 25);
            }
            this._saveNotifications();
            this.updateNotificationBadge();

            // Mostrar toast solo si no es carga inicial
            if (productId) {
                showToastNotification(title, body);
            }
        }


        markAllAsRead() {
            if (this._notifications) {
                this._notifications.forEach(n => n.read = true);
                this._saveNotifications();
                this.updateNotificationBadge();
            }
        }

        markAsRead(notifId: number) {
            const notif = this._notifications.find(n => n.id === notifId);
            if (notif) {
                notif.read = true;
                this._saveNotifications();
                this.updateNotificationBadge();
            }
        }

        deleteNotification(notifId: number) {
            this._notifications = this._notifications.filter(n => n.id !== notifId);
            this._saveNotifications();
            this.updateNotificationBadge();
        }

        deleteAllNotifications() {
            this._notifications = [];
            this._saveNotifications();
            this.updateNotificationBadge();
        }

        updateNotificationBadge() {
            const badge = document.getElementById('notificationBadge');
            const panel = document.getElementById('notificationsList');

            if (badge) {
                const unread = this._notifications ? this._notifications.filter(n => !n.read).length : 0;
                badge.innerText = unread.toString();
                // Animación Pop
                badge.classList.remove('pop');
                void badge.offsetWidth;
                badge.classList.add('pop');
                unread > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
            }

            if (panel) {
                if (!this._notifications || this._notifications.length === 0) {
                    panel.innerHTML = '<div class="notif-empty">Sin nuevas notificaciones</div>';
                } else {
                    panel.innerHTML = this._notifications.map(n => `
                        <div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" data-product-id="${n.productId || ''}">
                            <div class="notif-icon">
                                <svg class="notif-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </div>
                            <div class="notif-content">
                                <h4>${n.title}</h4>
                                <p>${n.body}</p>
                            </div>
                            <div class="notif-actions">
                                ${!n.read ? `<button class="notif-action-btn mark-read" onclick="appState.markAsRead(${n.id})" title="Marcar como leída">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </button>` : ''}
                                <button class="notif-action-btn delete" onclick="appState.deleteNotification(${n.id})" title="Eliminar">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    }

    // Instanciar el estado global de la app
    const appState = new AppState();
    (window as any).appState = appState; // Exponer globalmente para onclick
    (window as any).toggleComparisonGlobally = (id: string) => appState.toggleComparison(id);
    const toggleComparisonGlobally = (id: string) => appState.toggleComparison(id);
    // === FIN: MEJORA #4 ===

    const itemsPerPage = 24;
    const MAX_HISTORY = 5;

    // --- CORRECCIÓN: Movido al ámbito global ---
    let lastFocusedElement: HTMLElement | null = null;

    // === Referencias a elementos del DOM ===
    const els = {
        body: document.body as HTMLElement,
        headerX: document.querySelector('.header-x') as HTMLElement,
        darkBtn: document.getElementById('darkBtn') as HTMLElement,
        sunIcon: document.querySelector('.lp-icon-sun') as HTMLElement,
        moonIcon: document.querySelector('.lp-icon-moon') as HTMLElement,
        orbitalBtn: document.getElementById('orbitalBtn') as HTMLElement,
        upBtn: document.getElementById('upBtn') as HTMLElement,
        // menuBtn removed
        // sideMenu removed
        // sideMenuOverlay removed
        // menuCloseBtn removed
        // openGuideLink removed
        busqueda: document.getElementById('busquedaRapida') as HTMLInputElement,
        marca: document.getElementById('filtroMarca') as HTMLInputElement,
        modelo: document.getElementById('filtroModelo') as HTMLInputElement,
        anio: document.getElementById('filtroAnio') as HTMLInputElement,
        oem: document.getElementById('filtroOem') as HTMLInputElement,
        fmsi: document.getElementById('filtroFmsi') as HTMLInputElement,
        medidasAncho: document.getElementById('medidasAncho') as HTMLInputElement,
        medidasAlto: document.getElementById('medidasAlto') as HTMLInputElement,
        posDel: document.getElementById('positionDelantera') as HTMLElement,
        posTras: document.getElementById('positionTrasera') as HTMLElement,
        clearBtn: document.getElementById('clearFiltersBtn') as HTMLButtonElement,
        datalistMarca: document.getElementById('listaMarcas') as HTMLElement,
        datalistModelo: document.getElementById('listaModelos') as HTMLElement,
        datalistAnio: document.getElementById('listaAnios') as HTMLElement,
        datalistOem: document.getElementById('oemList') as HTMLElement,
        datalistFmsi: document.getElementById('fmsiList') as HTMLElement,
        results: document.getElementById('results-container') as HTMLElement,
        countContainer: document.getElementById('result-count-container') as HTMLElement,
        paginationContainer: document.getElementById('pagination-container') as HTMLElement,
        resultsHeaderCard: document.getElementById('results-header-card') as HTMLElement,
        brandTagsContainer: document.getElementById('brand-tags-container') as HTMLElement,
        footer: document.getElementById('footerBanner') as HTMLElement,
        modal: document.getElementById('card-modal') as HTMLElement,
        modalContent: document.querySelector('#card-modal .modal-content') as HTMLElement,
        modalCloseBtn: document.querySelector('#card-modal .modal-close-btn') as HTMLElement,
        modalCarousel: document.querySelector('#card-modal .modal-image-carousel') as HTMLElement,
        modalRef: document.querySelector('#card-modal .modal-ref') as HTMLElement,
        modalPosition: document.querySelector('#card-modal .modal-position') as HTMLElement,
        searchContainer: document.getElementById('searchContainer') as HTMLElement,
        modalAppsSpecs: document.querySelector('#card-modal .modal-apps-specs') as HTMLElement,
        modalDetailsWrapper: document.getElementById('modalDetailsWrapper') as HTMLElement,
        modalDetailsContent: document.getElementById('modalDetailsContent') as HTMLElement,
        modalCounterWrapper: document.getElementById('modalCounterWrapper') as HTMLElement,
        guideModal: document.getElementById('guide-modal') as HTMLElement,
        guideModalContent: document.querySelector('#guide-modal .modal-content') as HTMLElement,
        guideModalCloseBtn: document.querySelector('#guide-modal .modal-close-btn') as HTMLElement,
        filtroFavoritosBtn: document.getElementById('filtroFavoritosBtn') as HTMLElement,
        historialBtn: document.getElementById('historialBtn') as HTMLElement,
        searchHistoryContainer: document.getElementById('searchHistoryContainer') as HTMLElement,
        searchHistoryCard: document.getElementById('searchHistoryCard') as HTMLElement,
        manufacturerTagsContainer: document.getElementById('manufacturer-tags-container') as HTMLElement
    };

    // === Smart History System (State-Based with Intelligence) ===
    interface HistoryItem {
        id: string;
        summary: string;
        filters: {
            busqueda?: string;
            marca?: string;
            modelo?: string;
            anio?: string;
            oem?: string;
            fmsi?: string;
        };
        timestamp: number;
        frequency: number;
        resultCount?: number;
    }

    const generateHistoryId = (f: HistoryItem['filters']) => {
        return Object.entries(f).sort().map(([k, v]) => `${k}:${v}`).join('|');
    };

    const getRelativeTime = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return new Date(timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    };

    function saveCurrentStateToHistory(resultCount?: number) {
        const activeFilters: HistoryItem['filters'] = {};
        const summaries: string[] = [];

        if (els.busqueda.value.trim()) {
            activeFilters.busqueda = els.busqueda.value.trim();
            summaries.push(`🔍 ${els.busqueda.value.trim()}`);
        }
        if (els.marca.value.trim()) {
            activeFilters.marca = els.marca.value.trim();
            summaries.push(`🏷️ ${els.marca.value.trim()}`);
        }
        if (els.modelo.value.trim()) {
            activeFilters.modelo = els.modelo.value.trim();
            summaries.push(`🚗 ${els.modelo.value.trim()}`);
        }
        if (els.anio.value.trim()) {
            activeFilters.anio = els.anio.value.trim();
            summaries.push(`📅 ${els.anio.value.trim()}`);
        }
        if (els.oem.value.trim()) {
            activeFilters.oem = els.oem.value.trim();
            summaries.push(`#️⃣ ${els.oem.value.trim()}`);
        }
        if (els.fmsi.value.trim()) {
            activeFilters.fmsi = els.fmsi.value.trim();
            summaries.push(`📄 ${els.fmsi.value.trim()}`);
        }

        if (summaries.length === 0) return;

        const id = generateHistoryId(activeFilters);
        const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');

        let history: HistoryItem[] = rawHistory.map((item: any) => {
            if (typeof item === 'string') return { id: item, summary: item, filters: { busqueda: item }, timestamp: Date.now(), frequency: 1 };
            if (item.query && item.type) return { id: item.query, summary: item.query, filters: { [item.type === 'general' ? 'busqueda' : item.type]: item.query }, timestamp: Date.now(), frequency: 1 };
            return item;
        });

        const existing = history.find(h => h.id === id);

        if (existing) {
            existing.frequency = (existing.frequency || 1) + 1;
            existing.timestamp = Date.now();
            if (resultCount !== undefined) existing.resultCount = resultCount;
            history = history.filter(h => h.id !== id);
            history.unshift(existing);
        } else {
            history.unshift({
                id,
                summary: summaries.join(' · '),
                filters: activeFilters,
                timestamp: Date.now(),
                frequency: 1,
                resultCount
            });
        }

        history = history.slice(0, 8);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function deleteFromSearchHistory(id: string) {
        const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const history = rawHistory.filter((h: any) => (h.id || h.query || h) !== id);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const container = els.searchHistoryContainer;
        if (!container) return;

        const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const history: HistoryItem[] = rawHistory.map((item: any) => {
            if (typeof item === 'string') return { id: item, summary: item, filters: { busqueda: item }, timestamp: Date.now(), frequency: 1 };
            if (item.query && item.type) return { id: item.query, summary: item.query, filters: { [item.type === 'general' ? 'busqueda' : item.type]: item.query }, timestamp: Date.now(), frequency: 1 };
            return item;
        });

        if (history.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; padding:12px; text-align:center; opacity:0.7;">Tu historial está vacío. Realiza una búsqueda para empezar.</p>';
            return;
        }

        container.innerHTML = history.map(h => `
            <div class="smart-history-card" data-history-id="${h.id}">
                <div class="history-card-header">
                    <div class="history-card-summary">${h.summary}</div>
                    <button class="history-delete-btn" data-id-delete="${h.id}" aria-label="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="history-card-meta">
                    <span class="history-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${getRelativeTime(h.timestamp)}
                    </span>
                    ${h.frequency && h.frequency > 1 ? `
                        <span class="history-meta-item frequency">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${h.frequency}x
                        </span>
                    ` : ''}
                    ${h.resultCount !== undefined ? `
                        <span class="history-meta-item results">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h7v7H3z"></path>
                                <path d="M14 3h7v7h-7z"></path>
                                <path d="M14 14h7v7h-7z"></path>
                                <path d="M3 14h7v7H3z"></path>
                            </svg>
                            ${h.resultCount}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // === Gestión de favoritos ===
    // REFACTORIZADO (MEJORA #4)
    // REFACTORIZADO (MEJORA #4)
    const toggleFavorite = (e: Event) => {
        e.preventDefault(); // Evitar navegación si fuera un link
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        // Intentar obtener ID directamente del botón (caso Modal) o de la tarjeta padre (caso Lista)
        let itemId = button.dataset.id;

        if (!itemId) {
            const card = button.closest('.product-card') as HTMLElement;
            if (card) itemId = card.dataset.id;
        }

        if (!itemId) return;

        // 1. Llama al método de la clase. Él se encarga de guardar.
        appState.toggleFavorite(itemId);

        // 2. Actualiza la UI del botón (y potencialmente otros botones con el mismo ID)
        const isNowFavorite = appState.isFavorite(itemId);

        // Actualizar el botón clickeado
        button.classList.toggle('active', isNowFavorite);
        button.setAttribute('aria-pressed', isNowFavorite ? 'true' : 'false');

        // Sincronizar otros botones del mismo producto en la UI (ej. si estoy en modal, actualizar card, y viceversa)
        const allButtonsForId = document.querySelectorAll(`.favorite-btn[data-id="${itemId}"], .product-card[data-id="${itemId}"] .product-card__favorite-btn`);
        allButtonsForId.forEach(btn => {
            if (btn !== button) {
                btn.classList.toggle('active', isNowFavorite);
                btn.setAttribute('aria-pressed', isNowFavorite ? 'true' : 'false');
            }
        });

        // 3. Refiltra si estamos en modo favoritos
        if (appState.isFavoritesMode) filterData();
    };

    // Handler global para comparación
    const toggleComparison = (e: Event) => {
        e.stopPropagation();
        const button = e.currentTarget as HTMLElement;
        const card = button.closest('.product-card') as HTMLElement;
        if (!card) return;
        const itemId = card.dataset.id || '';
        if (!itemId) return;

        appState.toggleComparison(itemId);

        const isNowActive = appState.isComparison(itemId);
        button.classList.toggle('active', isNowActive);
    };

    // === Utilidades ===
    const debounce = (func: Function, delay: number) => {
        let timeout: number;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    // --- FUNCIÓN DE AYUDA (MEJORA #8) ---
    const normalizeText = (text: string = '') =>
        String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // --- FIN FUNCIÓN ---

    // --- INICIO: MEJORA #5 (MANEJO DE ERRORES) ---
    const showGlobalError = (title: string, message: string) => {
        els.results.innerHTML = `<div class="no-results-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>${title}</p>
            <span>${message}</span>
        </div>`;
        els.paginationContainer.innerHTML = '';
        els.countContainer.innerHTML = '0 resultados';
    };
    // --- FIN: MEJORA #5 ---

    // --- CORRECCIÓN: Movida al ámbito global ---
    // Función de ayuda para la "trampa de foco" (Mejora #7)
    // Función de ayuda para la "trampa de foco" (Mejora #7)
    const handleFocusTrap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        // 'e.currentTarget' es el modal o menú que tiene el listener
        const target = e.currentTarget as HTMLElement;
        const focusableElements = target.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select'
        ) as NodeListOf<HTMLElement>;
        if (focusableElements.length === 0) return; // No hay nada enfocable

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Si es Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Si es solo Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    // --- FIN CORRECCIÓN ---

    // --- INICIO: UTILIDAD DE IMAGEN (MEJORA: NO EXTERNAL DEPS) ---
    const getPlaceholderImage = (text: string) => {
        const svg = `
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <text x="50%" y="50%" font-family="'Inter', sans-serif" font-size="16" fill="#9ca3af" dy=".3em" text-anchor="middle">
                ${text}
            </text>
        </svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };
    // --- FIN: UTILIDAD DE IMAGEN ---

    // --- INICIO: MEJORA - CUSTOM DROPDOWNS ---
    const dropdownMap = new Map<string, string[]>(); // Almacena los items actuales por ID de lista

    // Helper para scroll automático
    const scrollToSelected = (list: HTMLElement) => {
        requestAnimationFrame(() => {
            const selected = list.querySelector('.selected') as HTMLElement;
            if (selected) {
                list.scrollTop = selected.offsetTop - (list.clientHeight / 2) + (selected.clientHeight / 2);
            }
        });
    };

    const setupCustomDropdown = (
        inputId: string,
        listId: string,
        items: string[],
        onSelect?: (value: string) => void
    ) => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        const list = document.getElementById(listId) as HTMLUListElement;
        const container = input.closest('.custom-select-container') as HTMLElement;

        if (!input || !list || !container) return;

        // 1. Actualizar siempre los datos más recientes en el mapa
        dropdownMap.set(listId, items);

        if (input.dataset.dropdownInitialized === 'true') {
            return;
        }

        // Marcar como inicializado
        input.dataset.dropdownInitialized = 'true';

        // Función para renderizar la lista usando los datos ACTUALES del mapa
        const renderList = (filterText: string = '') => {
            const currentItems = dropdownMap.get(listId) || []; // Obtener items frescos
            const normalizedFilter = normalizeText(filterText);
            const filteredItems = currentItems.filter(item =>
                normalizeText(item).includes(normalizedFilter)
            );

            // Si no hay items o todos están filtrados
            if (filteredItems.length === 0) {
                list.innerHTML = '<li style="pointer-events: none; opacity: 0.6; font-style: italic; font-size: 0.8em; padding: 8px 12px;">Sin resultados</li>';
                return;
            }

            const currentValNormalized = normalizeText(input.value);

            list.innerHTML = filteredItems.map(item => {
                const isSelected = normalizeText(item) === currentValNormalized;
                return `<li class="${isSelected ? 'selected' : ''}">${item}</li>`;
            }).join('');

            // Re-attach click events to new items
            Array.from(list.children).forEach((li) => {
                li.addEventListener('click', () => {
                    input.value = (li as HTMLElement).innerText; // Set value
                    list.classList.remove('show'); // Hide list
                    list.classList.add('hidden'); // Ensure CSS hides it

                    // Trigger change event manually so filters update
                    if (onSelect) {
                        onSelect(input.value);
                    } else {
                        // Disparar evento de input para que filterData lo detecte si hay listener
                        input.dispatchEvent(new Event('input'));
                    }
                    // Importante: filterData() se llamará por el evento 'input' adjunto en main
                });
            });
        };

        // Evento Input: Filtrar lista mientras escribes
        input.addEventListener('input', (e) => {
            // Ignorar eventos generados por script (al seleccionar una opción)
            if (!e.isTrusted) return;

            const val = input.value;
            renderList(val);
            list.classList.remove('hidden');
            list.classList.add('show');
        });

        // Evento Focus: Mostrar lista completa (o filtrada si ya hay texto)
        input.addEventListener('focus', () => {
            renderList(input.value);
            list.classList.remove('hidden');
            list.classList.add('show');
            scrollToSelected(list);
        });

        // Evento Click en Input: Si ya tiene foco pero estaba cerrado, abrirlo
        input.addEventListener('click', () => {
            // Solo re-abrir si está oculto y tiene el foco
            if (document.activeElement === input && list.classList.contains('hidden')) {
                renderList(input.value);
                list.classList.remove('hidden');
                list.classList.add('show');
                scrollToSelected(list);
            }
        });

        // Click Outside: Cerrar
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target as Node)) {
                list.classList.remove('show');
                list.classList.add('hidden');
            }
        });

        // Icon click to toggle
        const icon = container.querySelector('.chevron-icon');
        if (icon) {
            icon.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar comportamientos por defecto
                e.stopPropagation(); // Evitar cierre inmediato por click outside

                // Toggle logic
                if (list.classList.contains('show')) {
                    list.classList.remove('show');
                    list.classList.add('hidden');
                } else {
                    input.focus(); // El evento focus abrirá la lista si no está focused
                    // Si ya estaba focused, el evento focus no dispara, así que forzamos apertura
                    if (document.activeElement === input) {
                        renderList(input.value);
                        list.classList.remove('hidden');
                        list.classList.add('show');
                        scrollToSelected(list);
                    }
                }
            });
        }
    };

    // Reemplazo de la antigua fillDatalist
    // Ahora esta función configura el dropdown completo
    const updateDropdown = (listId: string, items: string[]) => {
        // Encontraremos el input asociado basándonos en el ID de la lista
        // Convención: listaMarcas -> filtroMarca
        let inputId = '';
        if (listId === 'listaMarcas') inputId = 'filtroMarca';
        else if (listId === 'listaModelos') inputId = 'filtroModelo';
        else if (listId === 'listaAnios') inputId = 'filtroAnio';
        else if (listId === 'oemList' || listId === 'listaOem') inputId = 'filtroOem'; // Handle ID change/vars
        else if (listId === 'fmsiList' || listId === 'listaFmsi') inputId = 'filtroFmsi';

        if (inputId) {
            setupCustomDropdown(inputId, listId, items);
        }
    };
    // --- FIN: CUSTOM DROPDOWNS ---

    const getPositionFilter = () => {
        const activePositions = [];
        if (els.posDel.classList.contains('active')) activePositions.push('Delantera');
        if (els.posTras.classList.contains('active')) activePositions.push('Trasera');
        return activePositions;
    };

    // --- INICIO: MEJORA #3 (BADGES) ---
    interface BadgeConfigItem {
        class: string;
        test: (ref: string) => boolean;
    }
    const BADGE_CONFIG: Record<string, BadgeConfigItem> = {
        'K': { class: 'ref-k', test: (ref) => ref.startsWith('K') },
        'SP': { class: 'ref-sp', test: (ref) => ref.startsWith('SP') },
        'INC': { class: 'ref-inc', test: (ref) => ref.endsWith('INC') },
        'BP': { class: 'ref-bp', test: (ref) => ref.endsWith('BP') },
        'BEX': { class: 'ref-bex', test: (ref) => ref.endsWith('BEX') },
    };
    const getRefBadgeClass = (ref: any) => {
        if (typeof ref !== 'string') {
            return 'ref-default';
        }
        const upperRef = ref.toUpperCase();
        // Check prefixes/suffixes FIRST (before numeric check)
        for (const key in BADGE_CONFIG) {
            if (BADGE_CONFIG[key].test(upperRef)) {
                return BADGE_CONFIG[key].class;
            }
        }
        // Only check numeric if no suffix/prefix matched
        if (/^\d/.test(upperRef)) {
            return 'ref-num';
        }
        return 'ref-default';
    };
    // --- FIN: MEJORA #3 ---

    const getSortableRefNumber = (refArray: any[]) => {
        if (!Array.isArray(refArray) || refArray.length === 0) return Infinity;
        let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
        if (!primaryRef) primaryRef = refArray[0];
        const match = String(primaryRef).match(/(\d+)/);
        return match ? parseInt(match[0], 10) : Infinity;
    };

    // === Filtrado y renderizado ===

    // --- INICIO: BLOQUE DE FILTRADO REFACTORIZADO (MEJORAS #8 Y CÓDIGO DE EJEMPLO) ---

    // Función de ayuda para obtener y normalizar todos los valores de los filtros
    const getActiveFilters = (): FilterState => {
        const activePos: string[] = [];
        if (els.posDel.classList.contains('active')) activePos.push('Delantera');
        if (els.posTras.classList.contains('active')) activePos.push('Trasera');

        return {
            busqueda: normalizeText(els.busqueda.value),
            marca: normalizeText(els.marca.value),
            modelo: normalizeText(els.modelo.value),
            anio: normalizeText(els.anio.value),
            oem: normalizeText(els.oem.value),
            fmsi: normalizeText(els.fmsi.value),
            ancho: parseFloat(els.medidasAncho.value) || null,
            alto: parseFloat(els.medidasAlto.value) || null,
            pos: activePos,
            manufacturer: appState.activeManufacturer,
            favorites: appState.isFavoritesMode
        };
    };

    // Objeto con la lógica de cada filtro (Mejora de Código de Ejemplo)
    const FILTER_STRATEGIES: Record<string, (item: Product, value: any) => boolean> = {
        // Búsqueda Rápida (Mejora #8 aplicada)
        busqueda: (item, value) => {
            if (!item._searchableText) {
                const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
                const itemVehicles = safeAplicaciones
                    .map(app => `${app.marca} ${app.serie} ${app.litros} ${app.año} ${app.especificacion}`)
                    .join(' ');
                const allRefs = [
                    ...(item.ref || []),
                    ...(item.oem || []),
                    ...(item.fmsi || [])
                ].join(' ');
                // Incluimos la posición en el texto buscable
                const posicion = item.posición || '';
                item._searchableText = normalizeText(`${allRefs} ${itemVehicles} ${posicion}`);
            }
            return item._searchableText.includes(value);
        },
        // Filtros de Aplicación (Mejora #8 aplicada)
        marca: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.marca).includes(value)),
        modelo: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.serie || '').includes(value) || normalizeText(app.modelo || '').includes(value)),
        anio: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.año).includes(value)),

        // Filtros de Referencia (Mejora #8 aplicada)
        oem: (item, value) => (item.oem || []).some(o => normalizeText(o).includes(value)),
        fmsi: (item, value) => (item.fmsi || []).some(f => normalizeText(f).includes(value)),

        // Filtros de Medidas (con tolerancia)
        ancho: (item, value) => {
            const TOLERANCIA = 1.0;
            return (item.anchoNum >= value - TOLERANCIA && item.anchoNum <= value + TOLERANCIA);
        },
        alto: (item, value) => {
            const TOLERANCIA = 1.0;
            return (item.altoNum >= value - TOLERANCIA && item.altoNum <= value + TOLERANCIA);
        },

        // Filtro de Posición (Actualizado para coincidencia parcial)
        pos: (item, activePositions) => {
            if (activePositions.length === 0) return true;
            // Si el item tiene "Delantera y Trasera", debe aparecer si seleccionamos Delantera O Trasera
            const itemPos = (item.posición || '').toLowerCase();
            return activePositions.some((pos: string) => itemPos.includes(pos.toLowerCase()));
        },

        // Filtro de Fabricante (Tag)
        manufacturer: (item, manuf) => {
            const allRefParts = (item.ref || []).flatMap(refStr => String(refStr).toUpperCase().split(' '));
            return allRefParts.some(refPart => {
                if (manuf === 'K') return refPart.startsWith('K');
                if (manuf === 'INC') return refPart.endsWith('INC');
                if (manuf === 'BP') return refPart.endsWith('BP');
                if (manuf === 'B') return refPart.endsWith('BEX');
                return false;
            });
        },

        // Filtro de Favoritos (REFACTORIZADO - MEJORA #4)
        favorites: (item, isFavoritesMode) => !isFavoritesMode || appState.isFavorite(item._appId)
    };

    // Nueva función `filterData` refactorizada
    const filterData = () => {
        if (!appState.data.length) return;

        const filters = getActiveFilters();

        const isFiltered = Object.values(filters).some(v =>
            v !== null && v !== false &&
            (!Array.isArray(v) || v.length > 0) &&
            (typeof v !== 'string' || v.trim() !== '')
        );

        // Filtramos los datos
        appState.filtered = appState.data.filter(item => {
            // 'every' se asegura de que el item pase TODOS los filtros activos
            return Object.entries(filters).every(([key, value]) => {
                // Si el filtro no está activo (valor es null, '', 0, o false), lo ignora
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    return true;
                }
                // Si el filtro está activo, ejecuta la estrategia correspondiente
                return FILTER_STRATEGIES[key] ? FILTER_STRATEGIES[key](item, value) : true;
            });
        });

        els.countContainer.innerHTML = appState.filtered.length === 1
            ? '1 resultado'
            : `${appState.filtered.length} resultados`;

        // El resto sigue igual
        // --- ORDENAMIENTO PERSONALIZADO (Mejora: Prioridad "Ambas") ---
        if (filters.pos && filters.pos.length === 2) {
            appState.filtered.sort((a, b) => {
                // --- LÓGICA REFINADA PARA ORDENAMIENTO: POSICIÓN RESUELTA (App || Global) ---
                const getIsBoth = (item: Product) => {
                    const globalPos = (item.posición || '').toLowerCase();
                    const apps = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
                    const reFront = /\bdel(antera)?\b/i;
                    const reRear = /\btras(era)?\b/i;

                    // 1. Resolver posición para cada aplicación (Prioridad App > Global)
                    const resolvedPositions = apps.map(a => {
                        const appPos = (a.posicion || '').toLowerCase();
                        // Si la app tiene posición, la usamos. Si es 'n/a' o vacía, usamos la global.
                        return (appPos && appPos !== 'n/a') ? appPos : globalPos;
                    }).filter(p => p && p !== 'n/a');

                    // 2. Analizar el set de posiciones resueltas (o global si no hay apps)
                    const positionsToAnalyze = resolvedPositions.length > 0 ? resolvedPositions : [globalPos];

                    const hasFront = positionsToAnalyze.some(p => reFront.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
                    const hasRear = positionsToAnalyze.some(p => reRear.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));

                    return hasFront && hasRear;
                };

                const aIsBoth = getIsBoth(a);
                const bIsBoth = getIsBoth(b);

                if (aIsBoth && !bIsBoth) return -1; // a va primero
                if (!aIsBoth && bIsBoth) return 1;  // b va primero
                return 0;
            });
        }
        appState.currentPage = 1;
        renderCurrentPage();
        updateURLWithFilters();
        renderDynamicBrandTags(appState.filtered, isFiltered);

        // --- INICIO: POBLAR DROPDOWNS (Corrección "No sale nada") ---
        // Recolectar datos únicos de los productos filtrados para llenar las listas
        const uniqueMarcas = new Set<string>();
        const uniqueModelos = new Set<string>();
        const uniqueAnios = new Set<string>();
        const uniqueOems = new Set<string>();
        const uniqueFmsis = new Set<string>();

        // Usamos appState.data si no hay filtros, o appState.filtered.
        // MEJOR: Usar appState.filtered para que sean "inteligentes", 
        // pero si el filtro actual es el causante de la restricción, cuidado.
        // Para simplificar y asegurar que aparezcan opciones:: 
        // Si el usuario está escribiendo en "Marca", no queremos restringir "Marca" a solo lo que ha escrito hasta que borre.
        // PERO el comportamiento estándar es que el dropdown muestre opciones válidas.

        const sourceData = appState.filtered.length > 0 ? appState.filtered : appState.data;

        sourceData.forEach(p => {
            if (Array.isArray(p.aplicaciones)) {
                p.aplicaciones.forEach(app => {
                    if (app.marca) uniqueMarcas.add(app.marca);
                    // Combinamos modelo y serie como se ve en tu interfaz
                    const mod = app.serie || app.modelo;
                    if (mod) uniqueModelos.add(mod);
                    if (app.año) uniqueAnios.add(app.año);
                });
            }
            if (Array.isArray(p.oem)) p.oem.forEach(o => uniqueOems.add(String(o)));
            if (Array.isArray(p.fmsi)) p.fmsi.forEach(f => uniqueFmsis.add(String(f)));
        });

        const sortAlpha = (a: string, b: string) => a.localeCompare(b);
        // Actualizamos los Mapas de opciones
        updateDropdown('listaMarcas', Array.from(uniqueMarcas).sort(sortAlpha));
        updateDropdown('listaModelos', Array.from(uniqueModelos).sort(sortAlpha));
        updateDropdown('listaAnios', Array.from(uniqueAnios).sort((a, b) => b.localeCompare(a))); // Años descendente
        updateDropdown('oemList', Array.from(uniqueOems).sort(sortAlpha));
        updateDropdown('fmsiList', Array.from(uniqueFmsis).sort(sortAlpha));
        // --- FIN: POBLAR DROPDOWNS ---

        // Save to smart history with result count (only if there are active filters)
        const hasActiveFilters = Object.values(filters).some(v =>
            v !== null && v !== false &&
            (!Array.isArray(v) || v.length > 0) &&
            (typeof v !== 'string' || v.trim() !== '')
        );
        if (hasActiveFilters) {
            saveCurrentStateToHistory(appState.filtered.length);
        }
    };

    // --- FIN: BLOQUE DE FILTRADO REFACTORIZADO ---


    const renderApplicationsList = (aplicaciones: Application[], defaultPos: string) => {
        const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
        const groupedApps = safeAplicaciones.reduce((acc: Record<string, Application[]>, app: Application) => {
            const marca = app.marca || 'N/A';
            if (!acc[marca]) acc[marca] = [];
            acc[marca].push(app);
            return acc;
        }, {} as Record<string, Application[]>);
        Object.keys(groupedApps).forEach(marca => {
            groupedApps[marca].sort((a: Application, b: Application) => {
                const serieA = a.serie || '';
                const serieB = b.serie || '';
                if (serieA !== serieB) return serieA < serieB ? -1 : 1;
                const anioA = a.año || '';
                const anioB = b.año || '';
                return anioA < anioB ? -1 : anioA > anioB ? 1 : 0;
            });
        });
        let appListHTML = '';
        for (const marca in groupedApps) {
            appListHTML += `<div class="app-brand-header">${marca.toUpperCase()}</div>`;
            groupedApps[marca].forEach(app => {
                // Usamos la posición específica de la aplicación si existe, sino la global
                const posToDisplay = app.posicion || defaultPos || '';

                let posClass = '';
                const posLower = posToDisplay.toLowerCase();
                if (posLower.includes('delantera') && posLower.includes('trasera')) {
                    posClass = 'ambas';
                } else if (posLower.includes('delantera')) {
                    posClass = 'delantera';
                } else if (posLower.includes('trasera')) {
                    posClass = 'trasera';
                }

                appListHTML += `<div class="app-detail-row">
                <div>${app.serie || ''}</div>
                <div>${app.litros || ''}</div>
                <div>${app.año || ''}</div>
                <div class="app-pos-cell ${posClass}" title="${posToDisplay}">${posToDisplay}</div>
            </div>`;
            });
        }
        return appListHTML;
    };

    const renderSpecs = (item: Product) => {
        let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div><div class="spec-details-grid">`;

        // Referencias
        const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap((ref: any) => String(ref).split(' '))
                .map((part: string) => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na spec-ref-badge">N/A</span>';
        specsHTML += `<div class="spec-label"><strong>Referencias</strong></div><div class="spec-value modal-ref-container">${refsSpecsHTML}</div>`;

        // OEM
        specsHTML += `<div class="spec-label"><strong>OEM</strong></div><div class="spec-value">${(Array.isArray(item.oem) && item.oem.length > 0) ? item.oem.join(', ') : 'N/A'}</div>`;

        // FMSI
        specsHTML += `<div class="spec-label"><strong>Platina FMSI</strong></div><div class="spec-value">${(Array.isArray(item.fmsi) && item.fmsi.length > 0) ? item.fmsi.join(', ') : 'N/A'}</div>`;

        // Medidas
        let medidasHTML = '';
        if (Array.isArray(item.medidas) && item.medidas.length > 0) {
            medidasHTML = item.medidas.map(medida => {
                const partes = String(medida).split(/x/i).map(s => s.trim());
                const ancho = partes[0] || 'N/A';
                const alto = partes[1] || 'N/A';
                return `<div>Ancho: ${ancho} x Alto: ${alto}</div>`;
            }).join('');
        } else {
            const anchoVal = item.anchoNum || 'N/A';
            const altoVal = item.altoNum || 'N/A';
            medidasHTML = `<div>Ancho: ${anchoVal} x Alto: ${altoVal}</div>`;
        }
        specsHTML += `<div class="spec-label"><strong>Medidas (mm)</strong></div><div class="spec-value">${medidasHTML}</div>`;

        // Especificaciones Completas
        const specsSet = new Set<string>();
        if (Array.isArray(item.aplicaciones)) {
            item.aplicaciones.forEach(app => {
                if (app.especificacion && app.especificacion.trim() !== '') {
                    specsSet.add(app.especificacion.trim());
                }
            });
        }

        if (specsSet.size > 0) {
            const uniqueSpecs = Array.from(specsSet).sort();
            const specsContent = uniqueSpecs.length > 1
                ? `<ul class="spec-list"><li>${uniqueSpecs.join('</li><li>')}</li></ul>`
                : uniqueSpecs[0];
            specsHTML += `<div class="spec-label"><strong>Especificación</strong></div><div class="spec-value specs-highlight">${specsContent}</div>`;
        } else {
            specsHTML += `<div class="spec-label"><strong>Especificación</strong></div><div class="spec-value">N/A</div>`;
        }

        specsHTML += `</div>`;
        return specsHTML;
    };

    const showSkeletonLoader = (count = 6) => {
        let skeletonHTML = '';
        for (let i = 0; i < count; i++) {
            skeletonHTML += `<div class="skeleton-card"><div class="skeleton-line long"></div><div class="skeleton-line short"></div><div class="skeleton-box"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
        }
        els.results.innerHTML = skeletonHTML;
        els.paginationContainer.innerHTML = '';
    };

    function setupPagination(totalItems: number) {
        els.paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;
        let paginationHTML = '';
        paginationHTML += `<button class="page-btn" data-page="${appState.currentPage - 1}" ${appState.currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);
        let startPage, endPage;
        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else if (appState.currentPage <= halfPages + 1) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (appState.currentPage >= totalPages - halfPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = appState.currentPage - halfPages;
            endPage = appState.currentPage + halfPages;
        }
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) paginationHTML += `<button class="page-btn" disabled>...</button>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === appState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<button class="page-btn" disabled>...</button>`;
            paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        paginationHTML += `<button class="page-btn" data-page="${appState.currentPage + 1}" ${appState.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
        els.paginationContainer.innerHTML = paginationHTML;
    }

    const renderCurrentPage = () => {
        const totalResults = appState.filtered.length;
        const startIndex = (appState.currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = appState.filtered.slice(startIndex, endIndex);
        const startNum = totalResults === 0 ? 0 : startIndex + 1;
        const endNum = Math.min(endIndex, totalResults);
        els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;
        if (totalResults === 0) {
            const message = appState.isFavoritesMode ? 'No tienes favoritos guardados' : 'No se encontraron pastillas';
            const subMessage = appState.isFavoritesMode ? 'Haz clic en el corazón de una pastilla para guardarla.' : 'Intenta ajustar tus filtros de búsqueda.';
            els.results.innerHTML = `<div class="no-results-container"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"></path><path d="M21 21L16.65 16.65"></path><path d="M11 8V11L13 13"></path></svg><p>${message}</p><span>${subMessage}</span></div>`;
            els.paginationContainer.innerHTML = '';
            return;
        }
        els.results.innerHTML = paginatedData.map((item: Product, index: number) => {
            const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];

            // --- LÓGICA REFINADA: POSICIÓN RESUELTA (App || Global) ---
            const posText = (item.posición || '').toLowerCase();
            const reFront = /\bdel(antera)?\b/i;
            const reRear = /\btras(era)?\b/i;

            const resolvedPositions = safeAplicaciones.map(a => {
                const appPos = (a.posicion || '').toLowerCase();
                return (appPos && appPos !== 'n/a') ? appPos : posText;
            }).filter(p => p && p !== 'n/a');

            const positionsToAnalyze = resolvedPositions.length > 0 ? resolvedPositions : [posText];

            const effectiveIsFront = positionsToAnalyze.some(p => reFront.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
            const effectiveIsRear = positionsToAnalyze.some(p => reRear.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
            const isAmbasCalculated = effectiveIsFront && effectiveIsRear;

            let positionBadgesHTML = '';

            // Standardized Logic: Single Badge for 'Ambas' (Mixed)
            if (isAmbasCalculated) {
                // Use the 'ambas' class for the specific gradient
                positionBadgesHTML = `<span class="position-badge-premium ambas">delantera/trasera</span>`;
            } else if (effectiveIsFront) {
                positionBadgesHTML = `<span class="position-badge-premium delantera">Delantera</span>`;
            } else if (effectiveIsRear) {
                positionBadgesHTML = `<span class="position-badge-premium trasera">Trasera</span>`;
            } else {
                // Fallback for unknown but present position
                if (item.posición && item.posición !== 'N/A') {
                    positionBadgesHTML = `<span class="position-badge-premium">${item.posición}</span>`;
                }
            }

            // --- RESTORED LOGIC ---

            let firstImageSrc = getPlaceholderImage('Sin Imagen');
            if (item.imagenes && item.imagenes.length > 0) {
                firstImageSrc = item.imagenes[0];
            } else if (item.imagen) {
                // Si hay una imagen singular antigua, intentamos construir la URL de vistas
                // Solo si es una URL real, si no, fallback
                if (item.imagen.includes('http')) {
                    firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
                } else {
                    firstImageSrc = item.imagen; // Asumimos que es válida si no es placeholder
                }
            }

            // Mostramos un resumen más limpio de aplicaciones (Reduced)
            const uniqueApps = safeAplicaciones
                .map(app => `${app.marca} ${app.serie}`)
                .filter((value, index, self) => self.indexOf(value) === index);

            const displayApps = uniqueApps.slice(0, 2);
            if (uniqueApps.length > 2) {
                displayApps.push(`+${uniqueApps.length - 2} más`);
            }
            const appSummaryItems = displayApps;

            const primaryRefForData = (Array.isArray(item.ref) && item.ref.length > 0) ? String(item.ref[0]).split(' ')[0] : 'N/A';

            const isFavorite = appState.isFavorite(item._appId);
            const isComparison = appState.isComparison(item._appId); // Asumiendo que isComparison existe en AppState

            const favoriteBtnHTML = `
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${item._appId}" aria-label="Marcar como favorito" aria-pressed="${isFavorite}">
                    <svg class="heart-icon" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
            `;

            const compareBtnHTML = `
                <button class="compare-btn ${isComparison ? 'active' : ''}" data-id="${item._appId}" aria-label="Comparar" aria-pressed="${isComparison}">
                     <svg class="compare-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 10h14l-4-4" />
                        <path d="M17 14H3l4 4" />
                    </svg>
                </button>
            `;

            // Generate ALL reference badges
            const allRefsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
                ? item.ref.flatMap(ref => String(ref).split(' '))
                    .slice(0, 5)
                    .map(ref => `<span class="ref-badge card-ref-badge ${getRefBadgeClass(ref)}">${ref}</span>`)
                    .join('')
                : '<span class="ref-badge ref-badge-na card-ref-badge">N/A</span>';
            // --- END RESTORED LOGIC ---

            return `
                <article class="product-card search-result-item" data-id="${item._appId}" style="animation-delay: ${index * 50}ms" role="button" tabindex="0">
                    
                    <div class="product-card__header-bar" style="display: flex; justify-content: space-between; padding: 10px 10px 5px 10px;">
                        <div class="product-card__position-wrapper">
                            ${positionBadgesHTML}
                        </div>
                        <div class="product-card__actions-wrapper" style="display: flex; gap: 8px;">
                            ${compareBtnHTML.replace('compare-btn', 'product-card__compare-btn')}
                            ${favoriteBtnHTML.replace('favorite-btn', 'product-card__favorite-btn')}
                        </div>
                    </div>
                    
                    <div class="product-card__image-container">
                         <img src="${firstImageSrc}" alt="${primaryRefForData}" class="product-card__image" loading="lazy">
                    </div>

                    <div class="product-card__body">
                        <div class="product-card__refs">
                            ${allRefsHTML}
                        </div>
                        <footer class="product-card__footer">
                            <p class="product-card__apps">
                                ${appSummaryItems.length > 0 ? appSummaryItems.join(', ') : 'Aplicaciones no disponibles'}
                            </p>
                        </footer>
                    </div>
                </article>
            `;
        }).join('');

        // Listeners para Favoritos
        els.results.querySelectorAll('.product-card__favorite-btn').forEach(btn => {
            btn.addEventListener('click', toggleFavorite);
        });

        // Listeners para Comparar
        els.results.querySelectorAll('.product-card__compare-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const targetBtn = e.currentTarget as HTMLElement;
                const card = targetBtn.closest('.product-card') as HTMLElement;

                if (card && card.dataset.id) {
                    const id = card.dataset.id;
                    // Feedback inmediato en la interfaz
                    const isNowComparison = appState.toggleComparison(id);
                    targetBtn.classList.toggle('active', isNowComparison);
                    targetBtn.setAttribute('aria-pressed', isNowComparison ? 'true' : 'false');
                }
            });
        });

        setupPagination(totalResults);
    };

    function renderDynamicBrandTags(data: Product[], isFiltered: boolean) {
        if (!els.brandTagsContainer) return;
        const allBrandsList = data.flatMap(item => (item.aplicaciones || []).map(app => app.marca)).filter(Boolean);
        const brandFrequencies = allBrandsList.reduce((counts: Record<string, number>, brand) => {
            counts[brand] = (counts[brand] || 0) + 1;
            return counts;
        }, {});
        let brandsToShow: string[] = [];
        if (isFiltered) {
            brandsToShow = Object.entries(brandFrequencies)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 10)
                .map(([brand]) => brand);
        } else {
            const allUniqueBrands = Object.keys(brandFrequencies);
            const shuffled = [...allUniqueBrands].sort(() => 0.5 - Math.random());
            brandsToShow = shuffled.slice(0, 10);
        }
        const activeBrandFilter = els.marca.value.trim().toLowerCase();

        // MODIFICADO: Eliminado el style="" y la lógica de colorVar
        els.brandTagsContainer.innerHTML = brandsToShow.map(brand => {
            const isActive = brand.toLowerCase() === activeBrandFilter;
            return `<button class="brand-tag ${isActive ? 'active' : ''}" data-brand="${brand}">${brand}</button>`;
        }).join('');

        els.brandTagsContainer.style.display = brandsToShow.length ? 'flex' : 'none';
    }

    // === Modal ===
    // === Modal ===
    function handleCardClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target || target.closest('.product-card__favorite-btn')) return;
        const card = target.closest('.product-card') as HTMLElement;
        if (card) {
            const itemId = card.dataset.id;
            const itemData = appState.data.find(item => String(item._appId) === itemId);
            if (itemData) openModal(itemData);
        }
    }

    function updateScrollIndicator() {
        const wrapper = els.modalDetailsWrapper;
        const content = els.modalDetailsContent;
        if (wrapper && content) {
            const isScrollable = content.scrollHeight > content.clientHeight;
            const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 5;
            wrapper.classList.toggle('scrollable', isScrollable && !isAtBottom);
        }
    }

    function openModal(item: Product) {
        const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap((ref: any) => String(ref).split(' '))
                .map((part: string) => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';
        els.modalRef.innerHTML = `<div class="modal-header-ref-container">${refsHeaderHTML}</div>`;

        // --- LÓGICA REFINADA PARA MODAL: POSICIÓN RESUELTA (App || Global) ---
        const safeAppsModal = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const posTextModal = (item.posición || '').toLowerCase();
        const reFront = /\bdel(antera)?\b/i;
        const reRear = /\btras(era)?\b/i;

        const resolvedPositionsModal = safeAppsModal.map((a: Application) => {
            const appPos = (a.posicion || '').toLowerCase();
            return (appPos && appPos !== 'n/a') ? appPos : posTextModal;
        }).filter(p => p && p !== 'n/a');

        const positionsToAnalyzeModal = resolvedPositionsModal.length > 0 ? resolvedPositionsModal : [posTextModal];

        const effectiveIsFront = positionsToAnalyzeModal.some(p => reFront.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
        const effectiveIsRear = positionsToAnalyzeModal.some(p => reRear.test(p) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
        const isAmbasCalculated = effectiveIsFront && effectiveIsRear;

        let posBadgeClass = '';
        let posBadgeText = item.posición || 'N/A';

        if (isAmbasCalculated) {
            posBadgeClass = 'ambas';
            posBadgeText = 'delantera/trasera';
        } else if (effectiveIsFront) {
            posBadgeClass = 'delantera';
            if (!posBadgeText || posBadgeText === 'N/A' || !reFront.test(posBadgeText)) posBadgeText = 'Delantera';
        } else if (effectiveIsRear) {
            posBadgeClass = 'trasera';
            if (!posBadgeText || posBadgeText === 'N/A' || !reRear.test(posBadgeText)) posBadgeText = 'Trasera';
        }

        els.modalPosition.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <span class="position-badge-premium ${posBadgeClass}">${posBadgeText}</span>
                <div class="modal-actions" style="display: flex; gap: 10px;">
                    <button class="product-card__compare-btn ${appState.isComparison(item._appId) ? 'active' : ''}" data-id="${item._appId}" aria-label="Comparar">
                        <svg class="compare-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 10h14l-4-4" />
                            <path d="M17 14H3l4 4" />
                        </svg>
                    </button>
                    <button class="product-card__favorite-btn ${appState.isFavorite(item._appId) ? 'active' : ''}" data-id="${item._appId}" aria-label="Marcar como favorito">
                        <svg class="heart-icon" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Attach listeners for modal buttons
        const modalFavBtn = els.modalPosition.querySelector('.product-card__favorite-btn');
        if (modalFavBtn) {
            modalFavBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // We use the global toggleFavorite which expects logic to handle button state updates elsewhere, 
                // but here we need to update THIS button manually or re-check.
                // Re-using the logic from renderCards:
                toggleFavorite(e);
            });
        }

        const modalCompBtn = els.modalPosition.querySelector('.product-card__compare-btn');
        if (modalCompBtn) {
            modalCompBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetBtn = e.currentTarget as HTMLElement;
                const isNowComparison = appState.toggleComparison(item._appId);
                targetBtn.classList.toggle('active', isNowComparison);
            });
        }
        let images = [];
        if (item.imagenes && item.imagenes.length > 0) {
            images = item.imagenes;
        } else if (item.imagen) {
            images = [
                item.imagen.replace("text=", `text=Vista+1+`),
                item.imagen.replace("text=", `text=Vista+2+`),
                item.imagen.replace("text=", `text=Vista+3+`)
            ];
        } else {
            images = ['https://via.placeholder.com/300x200.png?text=No+Img'];
        }
        const imageTrackHTML = images.map((imgSrc, i) =>
            `<img src="${imgSrc}" alt="Referencia ${item.ref?.[0] || 'N/A'} Vista ${i + 1}" class="result-image">`
        ).join('');
        els.modalCarousel.innerHTML = `
        <div class="image-track" style="display:flex;" data-current-index="0">${imageTrackHTML}</div>
            ${images.length > 1 ? `
                <button class="carousel-nav-btn" data-direction="-1" aria-label="Imagen anterior">‹</button>
                <button class="carousel-nav-btn" data-direction="1" aria-label="Siguiente imagen">›</button>
            ` : ''
            }
    `;
        els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach(btn => {
            (btn as HTMLElement).onclick = (e) => {
                e.stopPropagation();
                const current = e.currentTarget as HTMLElement;
                const direction = parseInt(current.dataset.direction || '0');
                navigateCarousel(els.modalCarousel, direction);
            };
        });
        if (images.length > 1) {
            els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1 / ${images.length}</span>`;
        } else {
            els.modalCounterWrapper.innerHTML = '';
        }
        els.modalAppsSpecs.innerHTML = `<div class="applications-list-container">${renderApplicationsList(item.aplicaciones, item.posición || '')}${renderSpecs(item)}</div>`;
        els.modalContent.classList.remove('closing');
        els.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        lastFocusedElement = document.activeElement as HTMLElement;
        els.modal.addEventListener('keydown', handleFocusTrap);
        els.modalCloseBtn.focus(); // Pone el foco en el botón de cerrar
        // --- FIN: MEJORA #7 ---

        requestAnimationFrame(() => {
            setTimeout(() => {
                updateScrollIndicator();
                els.modalDetailsContent.addEventListener('scroll', updateScrollIndicator);
            }, 100);
        });
    }

    function navigateCarousel(carouselContainer: HTMLElement, direction: number) {
        const track = carouselContainer.querySelector('.image-track') as HTMLElement;
        const images = carouselContainer.querySelectorAll('.result-image');
        const counter = els.modalCounterWrapper.querySelector('.carousel-counter');
        if (!track || images.length <= 1) return;
        let currentIndex = parseInt(track.dataset.currentIndex || '0') || 0;
        const totalImages = images.length;
        let newIndex = currentIndex + direction;
        if (newIndex >= totalImages) newIndex = 0;
        else if (newIndex < 0) newIndex = totalImages - 1;
        track.style.transform = `translateX(-${newIndex * 100}%)`;
        track.dataset.currentIndex = String(newIndex);
        if (counter) counter.textContent = `${newIndex + 1}/${totalImages}`;
    }

    function closeModal() {
        els.modalContent.classList.add('closing');
        els.modalDetailsContent.removeEventListener('scroll', updateScrollIndicator);
        els.modalDetailsWrapper.classList.remove('scrollable');

        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        els.modal.removeEventListener('keydown', handleFocusTrap);
        if (lastFocusedElement) lastFocusedElement.focus();
        // --- FIN: MEJORA #7 ---

        setTimeout(() => {
            els.modal.style.display = 'none';
            document.body.style.overflow = '';
            els.modalCarousel.innerHTML = '';
            els.modalRef.innerHTML = '';
            els.modalPosition.innerHTML = '';
            els.modalAppsSpecs.innerHTML = '';
            els.modalCounterWrapper.innerHTML = '';
            els.modalContent.classList.remove('closing');
        }, 220);
    }

    function openGuideModal() {
        els.guideModalContent.classList.remove('closing');
        els.guideModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        lastFocusedElement = document.activeElement as HTMLElement;
        els.guideModal.addEventListener('keydown', handleFocusTrap);
        els.guideModalCloseBtn.focus();
        // --- FIN: MEJORA #7 ---
    }

    function closeGuideModal() {
        els.guideModalContent.classList.add('closing');

        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        els.guideModal.removeEventListener('keydown', handleFocusTrap);
        if (lastFocusedElement) lastFocusedElement.focus();
        // --- FIN: MEJORA #7 ---

        setTimeout(() => {
            els.guideModal.style.display = 'none';
            document.body.style.overflow = '';
            els.guideModalContent.classList.remove('closing');
        }, 220);
    }

    // === UI Interactions ===
    // openSideMenu and closeSideMenu removed as they were dead code referring to removed elements


    const clearAllFilters = () => {
        [els.busqueda, els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input => input.value = '');
        els.posDel.classList.remove('active');
        els.posTras.classList.remove('active');
        if (els.manufacturerTagsContainer) {
            els.manufacturerTagsContainer.querySelectorAll('.brand-tag.active').forEach(el => el.classList.remove('active'));
        }
        appState.activeManufacturer = null;
        appState.isFavoritesMode = false;
        els.filtroFavoritosBtn.classList.remove('active');
        els.filtroFavoritosBtn.setAttribute('aria-pressed', 'false');
        els.historialBtn.classList.remove('active');
        els.historialBtn.setAttribute('aria-pressed', 'false');
        els.searchHistoryCard.style.display = 'none';
        filterData();
    };

    const createRippleEffect = (event: MouseEvent) => {
        const button = event.currentTarget as HTMLElement;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - (rect.left + radius)}px`;
        circle.style.top = `${event.clientY - (rect.top + radius)}px`;
        circle.classList.add('ripple');
        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) ripple.remove();
        button.appendChild(circle);
    };

    const updateURLWithFilters = () => {
        const params = new URLSearchParams();
        const filters: Record<string, string> = {
            busqueda: els.busqueda.value.trim(),
            marca: els.marca.value.trim(),
            modelo: els.modelo.value.trim(),
            anio: els.anio.value.trim(),
            oem: els.oem.value.trim(),
            fmsi: els.fmsi.value.trim(),
            ancho: els.medidasAncho.value.trim(),
            alto: els.medidasAlto.value.trim()
        };
        for (const key in filters) if (filters[key]) params.set(key, filters[key]);
        const activePositions = getPositionFilter();
        if (activePositions.length) params.set('pos', activePositions.join(','));
        if (appState.isFavoritesMode) params.set('favorites', 'true');
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({}, '', newUrl);
    };

    const applyFiltersFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        els.busqueda.value = params.get('busqueda') || '';
        els.marca.value = params.get('marca') || '';
        els.modelo.value = params.get('modelo') || '';
        els.anio.value = params.get('anio') || '';
        els.oem.value = params.get('oem') || '';
        els.fmsi.value = params.get('fmsi') || '';
        els.medidasAncho.value = params.get('ancho') || '';
        els.medidasAlto.value = params.get('alto') || '';
        const posParam = params.get('pos');
        // --- INICIO: CORRECCIÓN BUG BOTONES DE POSICIÓN ---
        // Se usa Boolean() para asegurar que el resultado sea true/false, no undefined
        els.posDel.classList.toggle('active', Boolean(posParam?.includes('Delantera')));
        els.posTras.classList.toggle('active', Boolean(posParam?.includes('Trasera')));
        // --- FIN: CORRECCIÓN BUG BOTONES DE POSICIÓN ---
        const isFavMode = params.get('favorites') === 'true';
        appState.isFavoritesMode = isFavMode;
        els.filtroFavoritosBtn.classList.toggle('active', isFavMode);
        els.filtroFavoritosBtn.setAttribute('aria-pressed', isFavMode ? 'true' : 'false');
    };

    // === Event Listeners ===
    function setupEventListeners() {

        [els.darkBtn, els.upBtn, els.orbitalBtn, els.clearBtn].forEach(btn => btn?.addEventListener('click', (e) => createRippleEffect(e as MouseEvent)));
        // Temas
        const applyLightTheme = () => {
            els.body.classList.remove('lp-dark', 'modo-orbital');
            els.darkBtn.setAttribute('aria-pressed', 'false');
            els.darkBtn.setAttribute('aria-label', 'Activar modo oscuro');
            // Toggle icons: show sun, hide moon
            const sunIcon = els.darkBtn.querySelector('.lp-icon-sun') as HTMLElement;
            const moonIcon = els.darkBtn.querySelector('.lp-icon-moon') as HTMLElement;
            if (sunIcon) sunIcon.style.opacity = '1';
            if (moonIcon) moonIcon.style.opacity = '0';
            if (els.orbitalBtn) {
                els.orbitalBtn.classList.remove('active');
                els.orbitalBtn.setAttribute('aria-pressed', 'false');
            }
            localStorage.setItem('themePreference', 'light');
        };
        const applyAmoledDarkTheme = () => {
            els.body.classList.add('lp-dark');
            els.body.classList.remove('modo-orbital');
            els.darkBtn.setAttribute('aria-pressed', 'true');
            els.darkBtn.setAttribute('aria-label', 'Activar modo claro');
            // Toggle icons: hide sun, show moon
            const sunIcon = els.darkBtn.querySelector('.lp-icon-sun') as HTMLElement;
            const moonIcon = els.darkBtn.querySelector('.lp-icon-moon') as HTMLElement;
            if (sunIcon) sunIcon.style.opacity = '0';
            if (moonIcon) moonIcon.style.opacity = '1';
            if (els.orbitalBtn) {
                els.orbitalBtn.classList.remove('active');
                els.orbitalBtn.setAttribute('aria-pressed', 'false');
            }
            localStorage.setItem('themePreference', 'dark');
        };
        const applyOrbitalTheme = () => {
            els.body.classList.add('modo-orbital');
            els.body.classList.remove('lp-dark');
            els.darkBtn.setAttribute('aria-pressed', 'false');
            els.darkBtn.setAttribute('aria-label', 'Activar modo claro');
            // Toggle icons: show sun, hide moon (orbital is a dark theme variant)
            const sunIcon = els.darkBtn.querySelector('.lp-icon-sun') as HTMLElement;
            const moonIcon = els.darkBtn.querySelector('.lp-icon-moon') as HTMLElement;
            if (sunIcon) sunIcon.style.opacity = '1';
            if (moonIcon) moonIcon.style.opacity = '0';
            if (els.orbitalBtn) {
                els.orbitalBtn.classList.add('active');
                els.orbitalBtn.setAttribute('aria-pressed', 'true');
            }
            localStorage.setItem('themePreference', 'orbital');
        };
        els.darkBtn.addEventListener('click', () => {
            els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
            setTimeout(() => els.headerX.style.animation = '', 600);
            els.body.classList.contains('modo-orbital') || els.body.classList.contains('lp-dark')
                ? applyLightTheme()
                : applyAmoledDarkTheme();
        });
        if (els.orbitalBtn) {
            els.orbitalBtn.addEventListener('click', () => {
                els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                setTimeout(() => els.headerX.style.animation = '', 600);
                els.body.classList.contains('modo-orbital')
                    ? applyLightTheme()
                    : applyOrbitalTheme();
            });
        }
        const savedTheme = localStorage.getItem('themePreference');
        switch (savedTheme) {
            case 'orbital': els.orbitalBtn ? applyOrbitalTheme() : applyLightTheme(); break;
            case 'dark': applyAmoledDarkTheme(); break;
            default: applyLightTheme();
        }

        // Botón Subir
        els.upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // --- INICIO: MEJORA #10 (SCROLL DEBOUNCE) ---
        // 1. Creamos la función que actualiza el botón
        const handleScroll = () => {
            els.upBtn.classList.toggle('show', window.scrollY > 300);
        };

        // 2. Creamos una versión "debounced" de esa función
        const debouncedScroll = debounce(handleScroll, 150);

        // 3. Usamos la versión debounced en el listener
        window.addEventListener('scroll', debouncedScroll);
        // --- FIN: MEJORA #10 ---

        // Menú lateral
        // Menu listeners removed

        // --- INICIO: CORRECCIÓN BUG ESCAPE (keydown) ---
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Prioritiza cerrar la capa superior primero.
                // Usamos "else if" para que solo cierre una cosa a la vez.

                if (els.guideModal.style.display === 'flex') {
                    closeGuideModal();
                } else if (els.modal.style.display === 'flex') {
                    // Esta es la línea que faltaba
                    closeModal();
                }
            }
        });
        // --- FIN: CORRECCIÓN BUG ESCAPE ---

        // Clic en Tarjetas
        els.results.addEventListener('click', handleCardClick);

        // Filtros
        const debouncedFilter = debounce(filterData, 300);

        els.filtroFavoritosBtn.addEventListener('click', () => {
            appState.isFavoritesMode = !appState.isFavoritesMode;
            els.filtroFavoritosBtn.classList.toggle('active', appState.isFavoritesMode);
            els.filtroFavoritosBtn.setAttribute('aria-pressed', appState.isFavoritesMode ? 'true' : 'false');
            filterData();
        });

        els.historialBtn?.addEventListener('click', () => {
            const isActive = els.historialBtn.getAttribute('aria-pressed') === 'true';
            els.historialBtn.classList.toggle('active', !isActive);
            els.historialBtn.setAttribute('aria-pressed', !isActive ? 'true' : 'false');
            els.searchHistoryCard.style.display = !isActive ? 'block' : 'none';
            if (!isActive) els.searchHistoryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        els.busqueda.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            els.searchContainer.classList.toggle('active', target.value.trim() !== '');
            debouncedFilter();
        });

        // === Smart History System (State-Based with Intelligence) ===
        interface HistoryItem {
            id: string;
            summary: string;
            filters: {
                busqueda?: string;
                marca?: string;
                modelo?: string;
                anio?: string;
                oem?: string;
                fmsi?: string;
            };
            timestamp: number;
            frequency: number; // How many times used
            resultCount?: number; // How many results it returned
        }

        const generateHistoryId = (f: HistoryItem['filters']) => {
            return Object.entries(f).sort().map(([k, v]) => `${k}:${v}`).join('|');
        };

        const getRelativeTime = (timestamp: number): string => {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Ahora';
            if (minutes < 60) return `Hace ${minutes} min`;
            if (hours < 24) return `Hace ${hours}h`;
            if (days === 1) return 'Ayer';
            if (days < 7) return `Hace ${days} días`;
            return new Date(timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        };

        function saveCurrentStateToHistory(resultCount?: number) {
            const activeFilters: HistoryItem['filters'] = {};
            const summaries: string[] = [];

            if (els.busqueda.value.trim()) {
                activeFilters.busqueda = els.busqueda.value.trim();
                summaries.push(`🔍 ${els.busqueda.value.trim()}`);
            }
            if (els.marca.value.trim()) {
                activeFilters.marca = els.marca.value.trim();
                summaries.push(`🏷️ ${els.marca.value.trim()}`);
            }
            if (els.modelo.value.trim()) {
                activeFilters.modelo = els.modelo.value.trim();
                summaries.push(`🚗 ${els.modelo.value.trim()}`);
            }
            if (els.anio.value.trim()) {
                activeFilters.anio = els.anio.value.trim();
                summaries.push(`📅 ${els.anio.value.trim()}`);
            }
            if (els.oem.value.trim()) {
                activeFilters.oem = els.oem.value.trim();
                summaries.push(`#️⃣ ${els.oem.value.trim()}`);
            }
            if (els.fmsi.value.trim()) {
                activeFilters.fmsi = els.fmsi.value.trim();
                summaries.push(`📄 ${els.fmsi.value.trim()}`);
            }

            if (summaries.length === 0) return;

            const id = generateHistoryId(activeFilters);
            const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');

            let history: HistoryItem[] = rawHistory.map((item: any) => {
                if (typeof item === 'string') return { id: item, summary: item, filters: { busqueda: item }, timestamp: Date.now(), frequency: 1 };
                if (item.query && item.type) return { id: item.query, summary: item.query, filters: { [item.type === 'general' ? 'busqueda' : item.type]: item.query }, timestamp: Date.now(), frequency: 1 };
                return item;
            });

            const existing = history.find(h => h.id === id);

            if (existing) {
                // Update existing: increment frequency, update timestamp and result count
                existing.frequency = (existing.frequency || 1) + 1;
                existing.timestamp = Date.now();
                if (resultCount !== undefined) existing.resultCount = resultCount;
                // Move to top
                history = history.filter(h => h.id !== id);
                history.unshift(existing);
            } else {
                // New item
                history.unshift({
                    id,
                    summary: summaries.join(' · '),
                    filters: activeFilters,
                    timestamp: Date.now(),
                    frequency: 1,
                    resultCount
                });
            }

            history = history.slice(0, 8); // Keep last 8
            localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
            renderSearchHistory();
        }

        function deleteFromSearchHistory(id: string) {
            const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
            const history = rawHistory.filter((h: any) => (h.id || h.query || h) !== id);
            localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
            renderSearchHistory();
        }

        function renderSearchHistory() {
            const container = els.searchHistoryContainer;
            if (!container) return;

            const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
            const history: HistoryItem[] = rawHistory.map((item: any) => {
                if (typeof item === 'string') return { id: item, summary: item, filters: { busqueda: item }, timestamp: Date.now(), frequency: 1 };
                if (item.query && item.type) return { id: item.query, summary: item.query, filters: { [item.type === 'general' ? 'busqueda' : item.type]: item.query }, timestamp: Date.now(), frequency: 1 };
                return item;
            });

            if (history.length === 0) {
                container.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; padding:12px; text-align:center; opacity:0.7;">Tu historial está vacío. Realiza una búsqueda para empezar.</p>';
                return;
            }

            container.innerHTML = history.map(h => `
            <div class="smart-history-card" data-history-id="${h.id}">
                <div class="history-card-header">
                    <div class="history-card-summary">${h.summary}</div>
                    <button class="history-delete-btn" data-id-delete="${h.id}" aria-label="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="history-card-meta">
                    <span class="history-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${getRelativeTime(h.timestamp)}
                    </span>
                    ${h.frequency && h.frequency > 1 ? `
                        <span class="history-meta-item frequency">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${h.frequency}x
                        </span>
                    ` : ''}
                    ${h.resultCount !== undefined ? `
                        <span class="history-meta-item results">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h7v7H3z"></path>
                                <path d="M14 3h7v7h-7z"></path>
                                <path d="M14 14h7v7h-7z"></path>
                                <path d="M3 14h7v7H3z"></path>
                            </svg>
                            ${h.resultCount}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
        }

        // ... Inside SetupEventListeners ...

        // Trigger Smart Save on Change of ANY filter
        [els.busqueda, els.marca, els.modelo, els.anio, els.oem, els.fmsi].forEach(input => {
            input.addEventListener('change', () => saveCurrentStateToHistory());
        });

        // ... Updated Click Handler ...

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target) return;

            // Delete Action (Updated selector)
            const deleteBtn = target.closest('.history-delete-btn') as HTMLElement;
            if (deleteBtn) {
                e.stopPropagation();
                deleteFromSearchHistory(deleteBtn.dataset.idDelete || '');
                return;
            }

            // Restore Action (Updated selector)
            const historyCard = target.closest('.smart-history-card') as HTMLElement;
            if (historyCard && !deleteBtn) { // Don't trigger if clicking delete
                const id = historyCard.dataset.historyId;
                const rawHistory = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');

                // Find data
                let item = rawHistory.find((h: any) => (h.id || h.query || h) === id);

                // Normalize if finding old legacy item
                if (typeof item === 'string') item = { filters: { busqueda: item } };
                else if (item.query && item.type) item = { filters: { [item.type === 'general' ? 'busqueda' : item.type]: item.query } };

                if (item && item.filters) {
                    // Restore State
                    els.busqueda.value = item.filters.busqueda || '';
                    els.marca.value = item.filters.marca || '';
                    els.modelo.value = item.filters.modelo || '';
                    els.anio.value = item.filters.anio || '';
                    els.oem.value = item.filters.oem || '';
                    els.fmsi.value = item.filters.fmsi || '';

                    // Trigger Filter
                    filterData();

                    // Move to top
                    saveCurrentStateToHistory();
                }
            }
        });

        // Position filter buttons
        [els.posDel, els.posTras].forEach(btn => btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filterData();
        }));

        // Input debounced filtering
        [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input =>
            input.addEventListener('input', debouncedFilter)
        );



        // Modern Pulse Effect
        const createPulse = (btn: HTMLElement) => {
            const ripple = document.createElement('span');
            ripple.classList.add('btn-pulse-effect');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${rect.width / 2 - size / 2}px`;
            ripple.style.top = `${rect.height / 2 - size / 2}px`;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };

        els.clearBtn.addEventListener('click', () => {
            if (els.clearBtn.disabled) return;
            els.clearBtn.disabled = true;
            const trashLid = els.clearBtn.querySelector('.trash-lid');
            const trashBody = els.clearBtn.querySelector('.trash-body');
            if (trashLid) trashLid.classList.add('animate-lid');
            if (trashBody) trashBody.classList.add('animate-body');

            // Modern pulse instead of sparks
            createPulse(els.clearBtn);

            clearAllFilters();
            setTimeout(() => {
                if (trashLid) trashLid.classList.remove('animate-lid');
                if (trashBody) trashBody.classList.remove('animate-body');
                els.clearBtn.disabled = false;
            }, 900);
        });

        function createSparks(button: HTMLElement) {
            const NUM_SPARKS = 10;
            const SPARK_COLORS = ['#00ffff', '#ff00ff', '#00ff7f', '#ffc700', '#ff5722'];
            for (let i = 0; i < NUM_SPARKS; i++) {
                const spark = document.createElement('div');
                spark.classList.add('spark');
                const size = Math.random() * 4 + 3;
                spark.style.width = `${size}px`;
                spark.style.height = `${size}px`;
                spark.style.backgroundColor = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
                spark.style.left = `calc(50% + ${Math.random() * 20 - 10}px)`;
                spark.style.top = `calc(50% + ${Math.random() * 20 - 10}px)`;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 25 + 20;
                spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
                spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
                button.appendChild(spark);
                spark.addEventListener('animationend', () => spark.remove(), { once: true });
            }
        }

        if (els.brandTagsContainer) {
            els.brandTagsContainer.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tag = target ? target.closest('.brand-tag') as HTMLElement : null;
                if (!tag) return;
                els.marca.value = tag.classList.contains('active') ? '' : tag.dataset.brand || '';
                filterData();
            });
        }

        if (els.manufacturerTagsContainer) {
            els.manufacturerTagsContainer.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tag = target ? target.closest('.brand-tag') as HTMLElement : null;
                if (!tag) return;
                const manufacturer = tag.dataset.manufacturer || '';
                const isActive = tag.classList.contains('active');
                els.manufacturerTagsContainer.querySelectorAll('.brand-tag.active').forEach(t => {
                    if (t !== tag) t.classList.remove('active');
                });
                if (isActive) {
                    tag.classList.remove('active');
                    appState.activeManufacturer = null;
                } else {
                    tag.classList.add('active');
                    appState.activeManufacturer = manufacturer;
                }
                filterData();
            });
        }

        els.paginationContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const btn = target ? target.closest('.page-btn') as HTMLButtonElement : null;
            if (!btn || btn.disabled || btn.classList.contains('active')) return;
            const newPage = parseInt(btn.dataset.page || '0');
            if (newPage) {
                appState.currentPage = newPage;
                renderCurrentPage();
                els.resultsHeaderCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });



        // Modales
        els.modalCloseBtn.addEventListener('click', closeModal);
        els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
        els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
        els.guideModal.addEventListener('click', (e) => { if (e.target === els.guideModal) closeGuideModal(); });
    }


    function setupComparisonModal() {
        const compareBtn = document.getElementById('compareBtn');
        const comparisonModal = document.getElementById('comparisonModal');
        const closeComparisonModal = document.getElementById('closeComparisonModal');

        if (compareBtn && comparisonModal) {
            compareBtn.addEventListener('click', () => {
                if (appState.comparisons.size < 2) {
                    showToastNotification("Información", "Selecciona al menos 2 productos para comparar.");
                    return;
                }
                renderComparisonView();
                comparisonModal.style.display = 'flex';
                comparisonModal.classList.remove('hidden');
            });

            closeComparisonModal?.addEventListener('click', () => {
                comparisonModal.style.display = 'none';
                comparisonModal.classList.add('hidden');
            });

            comparisonModal.addEventListener('click', (e) => {
                if (e.target === comparisonModal) {
                    comparisonModal.style.display = 'none';
                    comparisonModal.classList.add('hidden');
                }
            });
        }
    }

    function renderComparisonView() {
        const container = document.getElementById('comparisonContent');
        if (!container) return;

        const items = appState.data.filter(item => appState.comparisons.has(item._appId));

        if (items.length === 0) {
            container.innerHTML = '<p style="padding: 2rem; text-align: center;">No hay elementos para comparar.</p>';
            return;
        }

        // Estructura de Tabla Compacta V2
        let tableHTML = `
        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <colgroup>
                    <col class="label-col">
                    ${items.map(() => '<col class="data-col">').join('')}
                </colgroup>
                <thead>
                    <tr>
                        <th style="text-align:left;">PRODUCTO</th>
                        ${items.map(item => `
                            <th>
                                <div class="comp-product-header">
                                    <span class="comp-ref-title" title="${item.ref?.[0] || ''}">
                                        ${item.ref && item.ref[0] ? item.ref[0] : 'N/A'}
                                    </span>
                                    <button class="comp-remove-btn" onclick="(window as any).toggleComparisonGlobally('${item._appId}'); document.getElementById('compareBtn').click();" title="Quitar">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M18 6L6 18M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>IMAGEN</td>
                        ${items.map(item => `
                            <td>
                                <div class="comparison-image-container">
                                    <img src="${item.imagenes && item.imagenes[0] ? item.imagenes[0] : (item.imagen || '')}" class="comparison-image" alt="Producto">
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>POSICIÓN</td>
                        ${items.map(item => {
            let posClass = 'default';
            const posLower = (item.posición || '').toLowerCase();
            if (posLower.includes('delantera') && posLower.includes('trasera')) posClass = 'ambas';
            else if (posLower.includes('delantera')) posClass = 'delantera';
            else if (posLower.includes('trasera')) posClass = 'trasera';

            return `
                                <td style="text-align:center;">
                                    <span class="position-badge-premium ${posClass}">
                                        ${item.posición || 'N/A'}
                                    </span>
                                </td>
                            `;
        }).join('')}
                    </tr>
                    <tr>
                        <td>MEDIDAS</td>
                        ${items.map(item => `
                            <td class="comp-value-bold" style="text-align:center;">${item.anchoNum || '-'} x ${item.altoNum || '-'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>FMSI</td>
                        ${items.map(item => `
                            <td class="comp-value-dim" style="text-align:center;">${Array.isArray(item.fmsi) ? item.fmsi[0] : (item.fmsi || '-')}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>OEM</td>
                        ${items.map(item => `
                            <td class="comp-value-dim" style="font-size:0.85rem;">
                                ${Array.isArray(item.oem) ? item.oem.slice(0, 5).join(', ') + (item.oem.length > 5 ? '...' : '') : '-'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td>APLICACIONES</td>
                        ${items.map(item => `
                            <td>
                                <ul class="apps-list-compact">
                                    ${(item.aplicaciones || []).slice(0, 4).map(app => `
                                        <li><strong>${app.marca}</strong> ${app.modelo} ${app.año}</li>
                                    `).join('')}
                                    ${(item.aplicaciones || []).length > 4 ? '<li style="color:#999; font-style:italic;">+ más...</li>' : ''}
                                </ul>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
        `;

        container.innerHTML = tableHTML;
    }

    // === Inicialización Real-time con Notificaciones ===
    function inicializarApp() {
        showSkeletonLoader();
        renderSearchHistory();
        els.searchHistoryCard.style.display = 'none';

        // Escucha en tiempo real
        db.collection('pastillas').onSnapshot((snapshot: any) => {
            let isInitialLoad = appState.data.length === 0;
            let changesCount = 0;
            let addedItems: any[] = []; // Para almacenar items agregados en carga inicial

            // Procesar cambios
            snapshot.docChanges().forEach((change: any) => {
                const docData = change.doc.data() as Product;
                const docId = change.doc.id;

                // Normalizar datos (igual que antes)
                if (docData.imagen && (!docData.imagenes || docData.imagenes.length === 0)) {
                    docData.imagenes = [
                        docData.imagen.replace("text=", `text=Vista+1+`),
                        docData.imagen.replace("text=", `text=Vista+2+`),
                        docData.imagen.replace("text=", `text=Vista+3+`)
                    ];
                }

                // Procesar medidas y aplicar ID del documento
                const item: Product = {
                    ...docData,
                    _appId: docId, // Usamos ID de Firebase
                    aplicaciones: Array.isArray(docData.aplicaciones) ? docData.aplicaciones : [],
                    // Asegurar arrays seguros
                    ref: Array.isArray(docData.ref) ? docData.ref : [],
                    oem: Array.isArray(docData.oem) ? docData.oem : [],
                    fmsi: Array.isArray(docData.fmsi) ? docData.fmsi : [],
                    anchoNum: docData.anchoNum || 0,
                    altoNum: docData.altoNum || 0
                };

                // Calcular medidas si no existen numéricas (lógica original simplificada)
                if (!item.anchoNum || !item.altoNum) {
                    let medidaString = null;
                    if (Array.isArray(item.medidas) && item.medidas.length > 0) {
                        medidaString = String(item.medidas[0]);
                    } else if (typeof item.medidas === 'string') {
                        medidaString = item.medidas;
                    }
                    const partes = medidaString ? medidaString.split(/x/i).map((s: string) => parseFloat(s.trim())) : [0, 0];
                    item.anchoNum = partes[0] || 0;
                    item.altoNum = partes[1] || 0;
                }

                if (change.type === "added") {
                    appState.data.push(item);
                    if (isInitialLoad) {
                        // Guardar para procesar después
                        addedItems.push(item);
                    } else {
                        const refName = Array.isArray(item.ref) && item.ref.length > 0 ? item.ref[0] : 'Desconocida';
                        appState.addNotification("Nueva Referencia", `Se ha agregado la pastilla ${refName}.`, item._appId);
                        changesCount++;
                    }
                }
                if (change.type === "modified") {
                    const index = appState.data.findIndex(p => p._appId === docId);
                    if (index !== -1) {
                        appState.data[index] = item;
                        const refName = Array.isArray(item.ref) && item.ref.length > 0 ? item.ref[0] : 'Desconocida';
                        appState.addNotification("Actualización", `La referencia ${refName} ha sido actualizada.`, item._appId);
                        changesCount++;
                    }
                }
                if (change.type === "removed") {
                    appState.data = appState.data.filter(p => p._appId !== docId);
                    changesCount++;
                }
            });

            // Si es carga inicial, generar notificaciones de las últimas 25 modificaciones
            if (isInitialLoad && addedItems.length > 0) {
                // Tomar las últimas 25 (o menos si hay menos de 25)
                const recentItems = addedItems.slice(-25).reverse();
                recentItems.forEach(item => {
                    const refName = Array.isArray(item.ref) && item.ref.length > 0 ? item.ref[0] : 'Desconocida';
                    appState.addNotification("Referencia en catálogo", `${refName}`);
                });
            }

            // Si hubo cambios o es carga inicial, re-renderizar
            if (isInitialLoad || changesCount > 0) {
                // Mejora: Limpiar favoritos huérfanos tras actualizar datos
                appState.validateFavorites();
                appState.validateComparisons();

                filterData();
                renderDynamicBrandTags(appState.data, false);
            }
        }, (error: any) => {
            console.error("Error obteniendo datos en tiempo real:", error);
            els.results.innerHTML = `<div class="error-container"><p>Error cargando datos. Por favor intenta recargar.</p></div>`;
            els.paginationContainer.innerHTML = '';
        });

        // Configurar event listeners
        setupEventListeners();
        setupComparisonModal();
    }
    // Fin de inicializarApp


    // Inicializar contadores y badges después de que DOM esté listo
    appState.updateFavoriteBadge();
    appState.updateComparisonBadge();
    appState.updateNotificationBadge();

    // Toggle Notifications
    const notifBtn = document.getElementById('notificacionesBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.getElementById('notificationsPanel');
            panel?.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            document.getElementById('notificationsPanel')?.classList.add('hidden');
        });
        document.getElementById('notificationsPanel')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        // Listener para "Marcar leídas"
        const markReadBtn = document.getElementById('markNotificationsReadBtn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                appState.markAllAsRead();
            });
        }

        // Listener para "Borrar Todas"
        const deleteAllBtn = document.getElementById('deleteAllNotificationsBtn');
        const confirmModal = document.getElementById('confirmModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');

        if (deleteAllBtn && confirmModal && confirmDeleteBtn && confirmCancelBtn) {
            deleteAllBtn.addEventListener('click', () => {
                // Mostrar modal de confirmación
                confirmModal.style.display = 'flex';
            });

            confirmDeleteBtn.addEventListener('click', () => {
                appState.deleteAllNotifications();
                confirmModal.style.display = 'none';
            });

            confirmCancelBtn.addEventListener('click', () => {
                confirmModal.style.display = 'none';
            });

            // Cerrar modal al hacer click fuera
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    confirmModal.style.display = 'none';
                }
            });

            // Cerrar modal con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
                    confirmModal.style.display = 'none';
                }
            });
        }

        // Listener para notificaciones clickeables
        let currentNotificationProduct: Product | null = null;

        document.addEventListener('click', (e) => {
            const notifItem = (e.target as HTMLElement).closest('.notif-item');
            if (notifItem) {
                console.log('📌 Notification clicked!');
                const productId = notifItem.getAttribute('data-product-id');
                const notifId = parseInt(notifItem.getAttribute('data-notif-id') || '0');
                console.log('🆔 Product ID:', productId, 'Notif ID:', notifId);

                // Marcar como leída
                if (notifId) {
                    appState.markAsRead(notifId);
                }

                // Mostrar modal de acción si tiene productId
                if (productId && productId !== 'null' && productId !== '') {
                    const product = appState.data.find(p => p._appId === productId);
                    console.log('🔍 Product found:', product);
                    if (product) {
                        currentNotificationProduct = product;

                        // Obtener título y mensaje de la notificación
                        const titleEl = notifItem.querySelector('.notif-content h4');
                        const bodyEl = notifItem.querySelector('.notif-content p');
                        const title = titleEl?.textContent || 'Notificación';
                        const body = bodyEl?.textContent || '';

                        // Actualizar contenido del modal
                        const actionModal = document.getElementById('notificationActionModal');
                        const actionTitle = document.getElementById('notifActionTitle');
                        const actionMessage = document.getElementById('notifActionMessage');

                        if (actionTitle) actionTitle.textContent = title;
                        if (actionMessage) actionMessage.textContent = body;

                        // Mostrar modal de acción
                        if (actionModal) {
                            actionModal.style.display = 'flex';
                            // Cerrar panel de notificaciones
                            document.getElementById('notificationsPanel')?.classList.add('hidden');
                        }
                    } else {
                        console.error('❌ Product not found with ID:', productId);
                    }
                }
            }
        });

        // Event listeners para el modal de acción
        const notifActionModal = document.getElementById('notificationActionModal');
        const notifActionView = document.getElementById('notifActionView');
        const notifActionDismiss = document.getElementById('notifActionDismiss');
        const notifActionClose = document.getElementById('notifActionCloseBtn');

        if (notifActionView) {
            notifActionView.addEventListener('click', () => {
                if (currentNotificationProduct) {
                    notifActionModal!.style.display = 'none';
                    openModal(currentNotificationProduct);
                    currentNotificationProduct = null;
                }
            });
        }

        if (notifActionDismiss) {
            notifActionDismiss.addEventListener('click', () => {
                notifActionModal!.style.display = 'none';
                currentNotificationProduct = null;
            });
        }

        if (notifActionClose) {
            notifActionClose.addEventListener('click', () => {
                notifActionModal!.style.display = 'none';
                currentNotificationProduct = null;
            });
        }

        // Cerrar modal al hacer click fuera
        if (notifActionModal) {
            notifActionModal.addEventListener('click', (e) => {
                if (e.target === notifActionModal) {
                    notifActionModal.style.display = 'none';
                    currentNotificationProduct = null;
                }
            });
        }

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notifActionModal?.style.display === 'flex') {
                notifActionModal.style.display = 'none';
                currentNotificationProduct = null;
            }
        });
    }

    inicializarApp();
});
