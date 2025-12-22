/// <reference path="types.ts" />

// Declare external UI functions
declare function showToastNotification(title: string, body: string): void;

class AppState {
    data: Product[];
    filtered: Product[];
    currentPage: number;
    private _favorites: Set<string>;
    isFavoritesMode: boolean;
    activeManufacturer: string | null;
    private _comparisons: Set<string>;
    private _notifications: any[];

    constructor() {
        this.data = [];
        this.filtered = [];
        this.currentPage = 1;
        this._favorites = new Set<string>();
        this._comparisons = new Set<string>();
        this.isFavoritesMode = false;
        this.activeManufacturer = null;

        this._loadFavorites();
        this._loadComparisons();
        this._notifications = [];
        this._loadNotifications();

        // Initialize badges
        this.updateFavoriteBadge();
        this.updateComparisonBadge();
        this.updateNotificationBadge();
    }

    // --- Favorites Logic ---
    _loadFavorites() {
        try {
            const favs = localStorage.getItem('brakeXFavorites');
            if (favs) {
                const parsed = JSON.parse(favs);
                // Ensure all IDs are strings
                const stringFavs = Array.isArray(parsed) ? parsed.map(p => String(p)) : [];
                this._favorites = new Set(stringFavs);
            }
        } catch (e) {
            console.error("Error al cargar favoritos:", e);
            this._favorites = new Set();
        }
    }

    _saveFavorites() {
        try {
            localStorage.setItem('brakeXFavorites', JSON.stringify([...this._favorites]));
        } catch (e) {
            console.error("Error al guardar favoritos:", e);
        }
    }

    toggleFavorite(itemId: string): boolean {
        if (this._favorites.has(itemId)) {
            this._favorites.delete(itemId);
        } else {
            this._favorites.add(itemId);
        }
        this._saveFavorites();
        this.updateFavoriteBadge();
        this.updateComparisonBadge();
        this.updateNotificationBadge();
        return this._favorites.has(itemId);
    }

    isFavorite(itemId: string): boolean {
        return this._favorites.has(itemId);
    }

    get favorites() {
        return this._favorites;
    }

    updateFavoriteBadge() {
        const badge = document.getElementById('favCountBadge');
        if (badge) {
            const count = this._favorites.size;
            badge.innerText = count.toString();
            badge.classList.remove('pop');
            void badge.offsetWidth;
            badge.classList.add('pop');
            if (count > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // --- Comparisons Logic ---
    _loadComparisons() {
        try {
            const comps = localStorage.getItem('brakeXComparisons');
            if (comps) {
                const parsed = JSON.parse(comps);
                const stringComps = Array.isArray(parsed) ? parsed.map(p => String(p)) : [];
                this._comparisons = new Set(stringComps);
            }
        } catch (e) {
            console.error("Error loading comparisons:", e);
            this._comparisons = new Set<string>();
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
                alert("Máximo 4 productos para comparar");
                return false;
            }
            this._comparisons.add(itemId);
        }
        this._saveComparisons();
        this.updateComparisonBadge();
        return this._comparisons.has(itemId);
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
                const parsed = JSON.parse(notifs);
                this._notifications = Array.isArray(parsed) ? parsed : [];
            } else {
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
        if (this._notifications.length > 25) {
            this._notifications = this._notifications.slice(0, 25);
        }
        this._saveNotifications();
        this.updateNotificationBadge();

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
                            ${!n.read ? `<button class="notif-action-btn mark-read" title="Marcar como leída">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>` : ''}
                            <button class="notif-action-btn delete" title="Eliminar">
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
