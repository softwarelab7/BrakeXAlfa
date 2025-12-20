"use strict";
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
    // === INICIO: MEJORA #4 (AppState Class) ===
    // === Estado de la aplicación ===
    class AppState {
        constructor() {
            this.data = [];
            this.filtered = [];
            this.currentPage = 1;
            this._favorites = new Set(); // Renombrado a "privado"
            this._comparisons = new Set();
            this.isFavoritesMode = false;
            this.activeManufacturer = null;
            this._loadFavorites(); // Carga los favoritos automáticamente al iniciar
            this._loadComparisons();
            this._notifications = []; // Initialize notifications
            // Simular notificaciones
            this._notifications = [
                { id: 1, title: 'Bienvenido', body: 'Bienvenido a Brake X', read: false }
            ];
        }
        // Carga los favoritos desde localStorage
        _loadFavorites() {
            try {
                const favs = localStorage.getItem('brakeXFavorites');
                if (favs) {
                    this._favorites = new Set(JSON.parse(favs).map(Number));
                }
            }
            catch (e) {
                console.error("Error al cargar favoritos:", e); // Error no crítico, solo log
                this._favorites = new Set();
            }
        }
        // Guarda los favoritos en localStorage
        _saveFavorites() {
            try {
                localStorage.setItem('brakeXFavorites', JSON.stringify([...this._favorites]));
            }
            catch (e) {
                console.error("Error al guardar favoritos:", e); // Error no crítico, solo log
            }
        }
        // Método público para alternar un favorito
        toggleFavorite(itemId) {
            if (this._favorites.has(itemId)) {
                this._favorites.delete(itemId);
            }
            else {
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
        isFavorite(itemId) {
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
                }
                else {
                    badge.classList.add('hidden');
                }
            }
        }
        // --- Comparaciones Logic ---
        _loadComparisons() {
            try {
                const comps = localStorage.getItem('brakeXComparisons');
                if (comps)
                    this._comparisons = new Set(JSON.parse(comps));
            }
            catch (e) {
                console.error("Error loading comparisons:", e);
                this._comparisons = new Set();
            }
        }
        _saveComparisons() {
            localStorage.setItem('brakeXComparisons', JSON.stringify([...this._comparisons]));
        }
        toggleComparison(itemId) {
            if (this._comparisons.has(itemId)) {
                this._comparisons.delete(itemId);
            }
            else {
                if (this._comparisons.size >= 4) {
                    alert("Máximo 4 productos para comparar"); // Simple validación
                    return false;
                }
                this._comparisons.add(itemId);
            }
            this._saveComparisons();
            this.updateComparisonBadge();
            return this._comparisons.has(itemId);
        }
        isComparison(itemId) {
            return this._comparisons.has(itemId);
        }
        get comparisons() { return this._comparisons; }
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
        markAllAsRead() {
            if (this._notifications) {
                this._notifications.forEach(n => n.read = true);
                this.updateNotificationBadge();
                // Persistencia de notificaciones? Por ahora no lo pidió, pero sería ideal.
                // localStorage.setItem('brakeXNotifications', JSON.stringify(this._notifications));
            }
        }

        addNotification(title, body) {
            this._notifications.unshift({
                id: Date.now(),
                title,
                body,
                read: false
            });
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
                }
                else {
                    panel.innerHTML = this._notifications.map(n => `
                        <div class="notif-item ${n.read ? '' : 'unread'}">
                            <div class="notif-icon">🔔</div>
                            <div class="notif-content">
                                <h4>${n.title}</h4>
                                <p>${n.body}</p>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    }
    // Instanciar el estado global de la app
    const appState = new AppState();
    window.toggleComparisonGlobally = (id) => appState.toggleComparison(id);
    const toggleComparisonGlobally = (id) => appState.toggleComparison(id);
    // === FIN: MEJORA #4 ===
    const itemsPerPage = 24;
    const MAX_HISTORY = 5;
    // --- CORRECCIÓN: Movido al ámbito global ---
    let lastFocusedElement = null;
    // === Referencias a elementos del DOM ===
    const els = {
        body: document.body,
        headerX: document.querySelector('.header-x'),
        darkBtn: document.getElementById('darkBtn'),
        sunIcon: document.querySelector('.lp-icon-sun'),
        moonIcon: document.querySelector('.lp-icon-moon'),
        orbitalBtn: document.getElementById('orbitalBtn'),
        upBtn: document.getElementById('upBtn'),
        // menuBtn removed
        // sideMenu removed
        // sideMenuOverlay removed
        // menuCloseBtn removed
        // openGuideLink removed
        busqueda: document.getElementById('busquedaRapida'),
        marca: document.getElementById('filtroMarca'),
        modelo: document.getElementById('filtroModelo'),
        anio: document.getElementById('filtroAnio'),
        oem: document.getElementById('filtroOem'),
        fmsi: document.getElementById('filtroFmsi'),
        medidasAncho: document.getElementById('medidasAncho'),
        medidasAlto: document.getElementById('medidasAlto'),
        posDel: document.getElementById('positionDelantera'),
        posTras: document.getElementById('positionTrasera'),
        clearBtn: document.getElementById('clearFiltersBtn'),
        datalistMarca: document.getElementById('listaMarcas'),
        datalistModelo: document.getElementById('listaModelos'),
        datalistAnio: document.getElementById('listaAnios'),
        datalistOem: document.getElementById('oemList'),
        datalistFmsi: document.getElementById('fmsiList'),
        results: document.getElementById('results-container'),
        countContainer: document.getElementById('result-count-container'),
        paginationContainer: document.getElementById('pagination-container'),
        resultsHeaderCard: document.getElementById('results-header-card'),
        brandTagsContainer: document.getElementById('brand-tags-container'),
        footer: document.getElementById('footerBanner'),
        modal: document.getElementById('card-modal'),
        modalContent: document.querySelector('#card-modal .modal-content'),
        modalCloseBtn: document.querySelector('#card-modal .modal-close-btn'),
        modalCarousel: document.querySelector('#card-modal .modal-image-carousel'),
        modalRef: document.querySelector('#card-modal .modal-ref'),
        modalPosition: document.querySelector('#card-modal .modal-position'),
        searchContainer: document.getElementById('searchContainer'),
        modalAppsSpecs: document.querySelector('#card-modal .modal-apps-specs'),
        modalDetailsWrapper: document.getElementById('modalDetailsWrapper'),
        modalDetailsContent: document.getElementById('modalDetailsContent'),
        modalCounterWrapper: document.getElementById('modalCounterWrapper'),
        guideModal: document.getElementById('guide-modal'),
        guideModalContent: document.querySelector('#guide-modal .modal-content'),
        guideModalCloseBtn: document.querySelector('#guide-modal .modal-close-btn'),
        filtroFavoritosBtn: document.getElementById('filtroFavoritosBtn'),
        historialBtn: document.getElementById('historialBtn'),
        searchHistoryContainer: document.getElementById('searchHistoryContainer'),
        searchHistoryCard: document.getElementById('searchHistoryCard'),
        manufacturerTagsContainer: document.getElementById('manufacturer-tags-container')
    };
    // === Gestión del historial de búsqueda ===
    function addToSearchHistory(query) {
        if (!query.trim())
            return;
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        // Prevenir duplicados (ignorando mayúsculas/minúsculas)
        history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        history = history.slice(0, MAX_HISTORY);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }
    function deleteFromSearchHistory(query) {
        if (!query.trim())
            return;
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q !== query);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }
    function renderSearchHistory() {
        const history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const container = els.searchHistoryContainer;
        if (!container)
            return;
        container.innerHTML = history.map(q => `<button class="search-history-item" data-query="${q}">
                ${q}
                <span class="delete-history-item" data-query-delete="${q}" role="button" aria-label="Eliminar ${q}">&times;</span>
            </button>`).join('');
    }
    // === Gestión de favoritos ===
    // REFACTORIZADO (MEJORA #4)
    // REFACTORIZADO (MEJORA #4)
    const toggleFavorite = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const card = button.closest('.product-card');
        if (!card)
            return;
        const itemId = parseInt(card.dataset.id || '0');
        if (isNaN(itemId))
            return;
        // 1. Llama al método de la clase. Él se encarga de guardar.
        appState.toggleFavorite(itemId);
        // 2. Actualiza la UI del botón
        const isNowFavorite = appState.isFavorite(itemId);
        button.classList.toggle('active', isNowFavorite);
        button.setAttribute('aria-pressed', isNowFavorite ? 'true' : 'false');
        // 3. Refiltra si estamos en modo favoritos
        if (appState.isFavoritesMode)
            filterData();
    };
    // Handler global para comparación
    const toggleComparison = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const card = button.closest('.product-card');
        if (!card)
            return;
        const itemId = parseInt(card.dataset.id || '0');
        if (isNaN(itemId))
            return;
        appState.toggleComparison(itemId);
        const isNowActive = appState.isComparison(itemId);
        button.classList.toggle('active', isNowActive);
    };
    // === Utilidades ===
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };
    // --- FUNCIÓN DE AYUDA (MEJORA #8) ---
    const normalizeText = (text = '') => String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // --- FIN FUNCIÓN ---
    // --- INICIO: MEJORA #5 (MANEJO DE ERRORES) ---
    const showGlobalError = (title, message) => {
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
    const handleFocusTrap = (e) => {
        if (e.key !== 'Tab')
            return;
        // 'e.currentTarget' es el modal o menú que tiene el listener
        const target = e.currentTarget;
        const focusableElements = target.querySelectorAll('a[href], button:not([disabled]), textarea, input, select');
        if (focusableElements.length === 0)
            return; // No hay nada enfocable
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) { // Si es Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        }
        else { // Si es solo Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    // --- FIN CORRECCIÓN ---
    // --- INICIO: UTILIDAD DE IMAGEN (MEJORA: NO EXTERNAL DEPS) ---
    const getPlaceholderImage = (text) => {
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
    // Helper para scroll automático
    const scrollToSelected = (list) => {
        // Usamos requestAnimationFrame para asegurar que el renderizado esté listo
        requestAnimationFrame(() => {
            const selected = list.querySelector('.selected');
            if (selected) {
                // Centrar el elemento seleccionado en la vista
                list.scrollTop = selected.offsetTop - (list.clientHeight / 2) + (selected.clientHeight / 2);
            }
        });
    };
    const setupCustomDropdown = (inputId, listId, items, onSelect) => {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        const container = input.closest('.custom-select-container');
        if (!input || !list || !container)
            return;
        // Función para renderizar la lista
        const renderList = (filterText = '') => {
            const normalizedFilter = normalizeText(filterText);
            const filteredItems = items.filter(item => normalizeText(item).includes(normalizedFilter));
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
                    input.value = li.innerText; // Set value
                    list.classList.remove('show'); // Hide list
                    list.classList.add('hidden');
                    // Trigger change event manually so filters update
                    if (onSelect) {
                        onSelect(input.value);
                    }
                    else {
                        // Disparar evento de input para que filterData lo detecte si hay listener
                        input.dispatchEvent(new Event('input'));
                    }
                    filterData(); // Force filter update
                });
            });
        };
        // 1. Evento Input: Filtrar lista mientras escribes
        input.addEventListener('input', () => {
            const val = input.value;
            renderList(val);
            list.classList.remove('hidden');
            list.classList.add('show');
            // No auto-scroll on typing, user is searching
        });
        // 2. Evento Focus: Mostrar lista completa (o filtrada si ya hay texto)
        input.addEventListener('focus', () => {
            renderList(input.value); // Render fresh to ensure 'selected' class is correct
            list.classList.remove('hidden');
            list.classList.add('show');
            scrollToSelected(list); // Scroll to selection on open
        });
        // 3. Click Outside: Cerrar
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                list.classList.remove('show');
                list.classList.add('hidden');
            }
        });
        // Inicializar vacía
        // renderList(''); 
    };
    // Reemplazo de la antigua fillDatalist
    // Ahora esta función configura el dropdown completo
    const updateDropdown = (listId, items) => {
        // Encontraremos el input asociado basándonos en el ID de la lista
        // Convención: listaMarcas -> filtroMarca
        let inputId = '';
        if (listId === 'listaMarcas')
            inputId = 'filtroMarca';
        else if (listId === 'listaModelos')
            inputId = 'filtroModelo';
        else if (listId === 'listaAnios')
            inputId = 'filtroAnio';
        else if (listId === 'oemList' || listId === 'listaOem')
            inputId = 'filtroOem'; // Handle ID change/vars
        else if (listId === 'fmsiList' || listId === 'listaFmsi')
            inputId = 'filtroFmsi';
        if (inputId) {
            setupCustomDropdown(inputId, listId, items);
        }
    };
    // --- FIN: CUSTOM DROPDOWNS ---
    const getPositionFilter = () => {
        const activePositions = [];
        if (els.posDel.classList.contains('active'))
            activePositions.push('Delantera');
        if (els.posTras.classList.contains('active'))
            activePositions.push('Trasera');
        return activePositions;
    };
    const BADGE_CONFIG = {
        'K': { class: 'ref-k', test: (ref) => ref.startsWith('K') },
        'SP': { class: 'ref-sp', test: (ref) => ref.startsWith('SP') },
        'INC': { class: 'ref-inc', test: (ref) => ref.endsWith('INC') },
        'BP': { class: 'ref-bp', test: (ref) => ref.endsWith('BP') },
        'BEX': { class: 'ref-bex', test: (ref) => ref.endsWith('BEX') },
    };
    const getRefBadgeClass = (ref) => {
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
    const getSortableRefNumber = (refArray) => {
        if (!Array.isArray(refArray) || refArray.length === 0)
            return Infinity;
        let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
        if (!primaryRef)
            primaryRef = refArray[0];
        const match = String(primaryRef).match(/(\d+)/);
        return match ? parseInt(match[0], 10) : Infinity;
    };
    // === Filtrado y renderizado ===
    // --- INICIO: BLOQUE DE FILTRADO REFACTORIZADO (MEJORAS #8 Y CÓDIGO DE EJEMPLO) ---
    // Función de ayuda para obtener y normalizar todos los valores de los filtros
    const getActiveFilters = () => {
        const activePos = [];
        if (els.posDel.classList.contains('active'))
            activePos.push('Delantera');
        if (els.posTras.classList.contains('active'))
            activePos.push('Trasera');
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
    const FILTER_STRATEGIES = {
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
        modelo: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.serie).includes(value)),
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
            if (activePositions.length === 0)
                return true;
            // Si el item tiene "Delantera y Trasera", debe aparecer si seleccionamos Delantera O Trasera
            const itemPos = (item.posición || '').toLowerCase();
            return activePositions.some((pos) => itemPos.includes(pos.toLowerCase()));
        },
        // Filtro de Fabricante (Tag)
        manufacturer: (item, manuf) => {
            const allRefParts = (item.ref || []).flatMap(refStr => String(refStr).toUpperCase().split(' '));
            return allRefParts.some(refPart => {
                if (manuf === 'K')
                    return refPart.startsWith('K');
                if (manuf === 'INC')
                    return refPart.endsWith('INC');
                if (manuf === 'BP')
                    return refPart.endsWith('BP');
                if (manuf === 'B')
                    return refPart.endsWith('BEX');
                return false;
            });
        },
        // Filtro de Favoritos (REFACTORIZADO - MEJORA #4)
        favorites: (item, isFavoritesMode) => !isFavoritesMode || appState.isFavorite(item._appId)
    };
    // Nueva función `filterData` refactorizada
    const filterData = () => {
        if (!appState.data.length)
            return;
        const filters = getActiveFilters();
        // Guardar en historial SÓLO SI hay un término de búsqueda (Mejora de Historial)
        if (filters.busqueda) {
            addToSearchHistory(els.busqueda.value.trim()); // Usamos el valor original sin normalizar
        }
        const isFiltered = Object.values(filters).some(v => v !== null && v !== false &&
            (!Array.isArray(v) || v.length > 0) &&
            (typeof v !== 'string' || v.trim() !== ''));
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
        // El resto sigue igual
        // --- ORDENAMIENTO PERSONALIZADO (Mejora: Prioridad "Ambas") ---
        if (filters.pos && filters.pos.length === 2) {
            appState.filtered.sort((a, b) => {
                // --- LÓGICA REFINADA PARA ORDENAMIENTO: POSICIÓN RESUELTA (App || Global) ---
                const getIsBoth = (item) => {
                    const globalPos = (item.posición || '').toLowerCase();
                    const apps = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
                    const reFront = /\bdel/i;
                    const reRear = /\btras/i;
                    // 1. Resolver posición para cada aplicación (Prioridad App > Global)
                    const resolvedPositions = apps.map(a => {
                        const appPos = (a.posicion || '').toLowerCase();
                        return (appPos && appPos !== 'n/a') ? appPos : globalPos;
                    }).filter(p => p && p !== 'n/a');
                    // 2. Analizar el set de posiciones resueltas (o global si no hay apps)
                    const positionsToAnalyze = resolvedPositions.length > 0 ? resolvedPositions : [globalPos];
                    const hasFront = positionsToAnalyze.some(p => reFront.test(p));
                    const hasRear = positionsToAnalyze.some(p => reRear.test(p));
                    return hasFront && hasRear;
                };
                const aIsBoth = getIsBoth(a);
                const bIsBoth = getIsBoth(b);
                if (aIsBoth && !bIsBoth)
                    return -1; // a va primero
                if (!aIsBoth && bIsBoth)
                    return 1; // b va primero
                return 0;
            });
        }
        appState.currentPage = 1;
        renderCurrentPage();
        updateURLWithFilters();
        renderDynamicBrandTags(appState.filtered, isFiltered);
    };
    // --- FIN: BLOQUE DE FILTRADO REFACTORIZADO ---
    const renderApplicationsList = (aplicaciones, defaultPos) => {
        const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
        const groupedApps = safeAplicaciones.reduce((acc, app) => {
            const marca = app.marca || 'N/A';
            if (!acc[marca])
                acc[marca] = [];
            acc[marca].push(app);
            return acc;
        }, {});
        Object.keys(groupedApps).forEach(marca => {
            groupedApps[marca].sort((a, b) => {
                const serieA = a.serie || '';
                const serieB = b.serie || '';
                if (serieA !== serieB)
                    return serieA < serieB ? -1 : 1;
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
                }
                else if (posLower.includes('delantera')) {
                    posClass = 'delantera';
                }
                else if (posLower.includes('trasera')) {
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
    const renderSpecs = (item) => {
        let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div><div class="spec-details-grid">`;
        // Referencias
        const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap((ref) => String(ref).split(' '))
                .map((part) => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
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
        }
        else {
            const anchoVal = item.anchoNum || 'N/A';
            const altoVal = item.altoNum || 'N/A';
            medidasHTML = `<div>Ancho: ${anchoVal} x Alto: ${altoVal}</div>`;
        }
        specsHTML += `<div class="spec-label"><strong>Medidas (mm)</strong></div><div class="spec-value">${medidasHTML}</div>`;
        // Especificaciones Completas
        const specsSet = new Set();
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
        }
        else {
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
    function setupPagination(totalItems) {
        els.paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1)
            return;
        let paginationHTML = '';
        paginationHTML += `<button class="page-btn" data-page="${appState.currentPage - 1}" ${appState.currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);
        let startPage, endPage;
        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        }
        else if (appState.currentPage <= halfPages + 1) {
            startPage = 1;
            endPage = maxPagesToShow;
        }
        else if (appState.currentPage >= totalPages - halfPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        }
        else {
            startPage = appState.currentPage - halfPages;
            endPage = appState.currentPage + halfPages;
        }
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2)
                paginationHTML += `<button class="page-btn" disabled>...</button>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === appState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1)
                paginationHTML += `<button class="page-btn" disabled>...</button>`;
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
        els.results.innerHTML = paginatedData.map((item, index) => {
            const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
            // --- LÓGICA REFINADA: POSICIÓN RESUELTA (App || Global) ---
            const posText = (item.posición || '').toLowerCase();
            const reFront = /\bdel/i;
            const reRear = /\btras/i;
            const resolvedPositions = safeAplicaciones.map(a => {
                const appPos = (a.posicion || '').toLowerCase();
                return (appPos && appPos !== 'n/a') ? appPos : posText;
            }).filter(p => p && p !== 'n/a');
            const positionsToAnalyze = resolvedPositions.length > 0 ? resolvedPositions : [posText];
            const effectiveIsFront = positionsToAnalyze.some(p => reFront.test(p));
            const effectiveIsRear = positionsToAnalyze.some(p => reRear.test(p));
            const isAmbasCalculated = effectiveIsFront && effectiveIsRear;
            let positionBadgesHTML = '';
            // Standardized Logic: Single Badge for 'Ambas' (Mixed)
            if (isAmbasCalculated) {
                // Use the 'ambas' class for the specific gradient
                positionBadgesHTML = `<span class="position-badge-premium ambas">delantera/trasera</span>`;
            }
            else if (effectiveIsFront) {
                positionBadgesHTML = `<span class="position-badge-premium delantera">Delantera</span>`;
            }
            else if (effectiveIsRear) {
                positionBadgesHTML = `<span class="position-badge-premium trasera">Trasera</span>`;
            }
            else {
                // Fallback for unknown but present position
                if (item.posición && item.posición !== 'N/A') {
                    positionBadgesHTML = `<span class="position-badge-premium">${item.posición}</span>`;
                }
            }
            // --- RESTORED LOGIC ---
            let firstImageSrc = getPlaceholderImage('Sin Imagen');
            if (item.imagenes && item.imagenes.length > 0) {
                firstImageSrc = item.imagenes[0];
            }
            else if (item.imagen) {
                // Si hay una imagen singular antigua, intentamos construir la URL de vistas
                // Solo si es una URL real, si no, fallback
                if (item.imagen.includes('http')) {
                    firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
                }
                else {
                    firstImageSrc = item.imagen; // Asumimos que es válida si no es placeholder
                }
            }
            // Mostramos un resumen más limpio de aplicaciones
            const appSummaryItems = safeAplicaciones
                .map(app => `${app.marca} ${app.serie}`)
                .filter((value, index, self) => self.indexOf(value) === index)
                .slice(0, 3);
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
                    
                    <div class="product-card__header-bar">
                        <div class="product-card__position-wrapper">
                            ${positionBadgesHTML}
                        </div>
                        <div class="product-card__actions-wrapper">
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
                const targetBtn = e.currentTarget;
                const card = targetBtn.closest('.product-card');
                if (card && card.dataset.id) {
                    const id = parseInt(card.dataset.id);
                    // Feedback inmediato en la interfaz
                    const isNowComparison = appState.toggleComparison(id);
                    targetBtn.classList.toggle('active', isNowComparison);
                    targetBtn.setAttribute('aria-pressed', isNowComparison ? 'true' : 'false');
                }
            });
        });
        setupPagination(totalResults);
    };
    function renderDynamicBrandTags(data, isFiltered) {
        if (!els.brandTagsContainer)
            return;
        const allBrandsList = data.flatMap(item => (item.aplicaciones || []).map(app => app.marca)).filter(Boolean);
        const brandFrequencies = allBrandsList.reduce((counts, brand) => {
            counts[brand] = (counts[brand] || 0) + 1;
            return counts;
        }, {});
        let brandsToShow = [];
        if (isFiltered) {
            brandsToShow = Object.entries(brandFrequencies)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 10)
                .map(([brand]) => brand);
        }
        else {
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
    function handleCardClick(event) {
        const target = event.target;
        if (!target || target.closest('.product-card__favorite-btn'))
            return;
        const card = target.closest('.product-card');
        if (card) {
            const itemId = card.dataset.id;
            const itemData = appState.data.find(item => String(item._appId) === itemId);
            if (itemData)
                openModal(itemData);
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
    function openModal(item) {
        const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap((ref) => String(ref).split(' '))
                .map((part) => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';
        els.modalRef.innerHTML = `<div class="modal-header-ref-container">${refsHeaderHTML}</div>`;
        // --- LÓGICA REFINADA PARA MODAL: POSICIÓN RESUELTA (App || Global) ---
        const safeAppsModal = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const posTextModal = (item.posición || '').toLowerCase();
        const reFront = /\bdel/i;
        const reRear = /\btras/i;
        const resolvedPositionsModal = safeAppsModal.map((a) => {
            const appPos = (a.posicion || '').toLowerCase();
            return (appPos && appPos !== 'n/a') ? appPos : posTextModal;
        }).filter(p => p && p !== 'n/a');
        const positionsToAnalyzeModal = resolvedPositionsModal.length > 0 ? resolvedPositionsModal : [posTextModal];
        const effectiveIsFront = positionsToAnalyzeModal.some(p => reFront.test(p));
        const effectiveIsRear = positionsToAnalyzeModal.some(p => reRear.test(p));
        const isAmbasCalculated = effectiveIsFront && effectiveIsRear;
        let posBadgeClass = '';
        let posBadgeText = item.posición || 'N/A';
        if (isAmbasCalculated) {
            posBadgeClass = 'ambas';
            posBadgeText = 'delantera/trasera';
        }
        else if (effectiveIsFront) {
            posBadgeClass = 'delantera';
            if (!posBadgeText || posBadgeText === 'N/A' || !reFront.test(posBadgeText))
                posBadgeText = 'Delantera';
        }
        else if (effectiveIsRear) {
            posBadgeClass = 'trasera';
            if (!posBadgeText || posBadgeText === 'N/A' || !reRear.test(posBadgeText))
                posBadgeText = 'Trasera';
        }
        els.modalPosition.innerHTML = `<span class="position-badge-premium ${posBadgeClass}">${posBadgeText}</span>`;
        let images = [];
        if (item.imagenes && item.imagenes.length > 0) {
            images = item.imagenes;
        }
        else if (item.imagen) {
            images = [
                item.imagen.replace("text=", `text=Vista+1+`),
                item.imagen.replace("text=", `text=Vista+2+`),
                item.imagen.replace("text=", `text=Vista+3+`)
            ];
        }
        else {
            images = ['https://via.placeholder.com/300x200.png?text=No+Img'];
        }
        const imageTrackHTML = images.map((imgSrc, i) => `<img src="${imgSrc}" alt="Referencia ${item.ref?.[0] || 'N/A'} Vista ${i + 1}" class="result-image">`).join('');
        els.modalCarousel.innerHTML = `
        <div class="image-track" style="display:flex;" data-current-index="0">${imageTrackHTML}</div>
            ${images.length > 1 ? `
                <button class="carousel-nav-btn" data-direction="-1" aria-label="Imagen anterior">‹</button>
                <button class="carousel-nav-btn" data-direction="1" aria-label="Siguiente imagen">›</button>
            ` : ''}
    `;
        els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const current = e.currentTarget;
                const direction = parseInt(current.dataset.direction || '0');
                navigateCarousel(els.modalCarousel, direction);
            };
        });
        if (images.length > 1) {
            els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1 / ${images.length}</span>`;
        }
        else {
            els.modalCounterWrapper.innerHTML = '';
        }
        els.modalAppsSpecs.innerHTML = `<div class="applications-list-container">${renderApplicationsList(item.aplicaciones, item.posición || '')}${renderSpecs(item)}</div>`;
        els.modalContent.classList.remove('closing');
        els.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        lastFocusedElement = document.activeElement;
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
    function navigateCarousel(carouselContainer, direction) {
        const track = carouselContainer.querySelector('.image-track');
        const images = carouselContainer.querySelectorAll('.result-image');
        const counter = els.modalCounterWrapper.querySelector('.carousel-counter');
        if (!track || images.length <= 1)
            return;
        let currentIndex = parseInt(track.dataset.currentIndex || '0') || 0;
        const totalImages = images.length;
        let newIndex = currentIndex + direction;
        if (newIndex >= totalImages)
            newIndex = 0;
        else if (newIndex < 0)
            newIndex = totalImages - 1;
        track.style.transform = `translateX(-${newIndex * 100}%)`;
        track.dataset.currentIndex = String(newIndex);
        if (counter)
            counter.textContent = `${newIndex + 1}/${totalImages}`;
    }
    function closeModal() {
        els.modalContent.classList.add('closing');
        els.modalDetailsContent.removeEventListener('scroll', updateScrollIndicator);
        els.modalDetailsWrapper.classList.remove('scrollable');
        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        els.modal.removeEventListener('keydown', handleFocusTrap);
        if (lastFocusedElement)
            lastFocusedElement.focus();
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
        lastFocusedElement = document.activeElement;
        els.guideModal.addEventListener('keydown', handleFocusTrap);
        els.guideModalCloseBtn.focus();
        // --- FIN: MEJORA #7 ---
    }
    function closeGuideModal() {
        els.guideModalContent.classList.add('closing');
        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        els.guideModal.removeEventListener('keydown', handleFocusTrap);
        if (lastFocusedElement)
            lastFocusedElement.focus();
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
    const createRippleEffect = (event) => {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - (rect.left + radius)}px`;
        circle.style.top = `${event.clientY - (rect.top + radius)}px`;
        circle.classList.add('ripple');
        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple)
            ripple.remove();
        button.appendChild(circle);
    };
    const updateURLWithFilters = () => {
        const params = new URLSearchParams();
        const filters = {
            busqueda: els.busqueda.value.trim(),
            marca: els.marca.value.trim(),
            modelo: els.modelo.value.trim(),
            anio: els.anio.value.trim(),
            oem: els.oem.value.trim(),
            fmsi: els.fmsi.value.trim(),
            ancho: els.medidasAncho.value.trim(),
            alto: els.medidasAlto.value.trim()
        };
        for (const key in filters)
            if (filters[key])
                params.set(key, filters[key]);
        const activePositions = getPositionFilter();
        if (activePositions.length)
            params.set('pos', activePositions.join(','));
        if (appState.isFavoritesMode)
            params.set('favorites', 'true');
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
        [els.darkBtn, els.upBtn, els.orbitalBtn, els.clearBtn].forEach(btn => btn?.addEventListener('click', (e) => createRippleEffect(e)));
        // Temas
        const applyLightTheme = () => {
            els.body.classList.remove('lp-dark', 'modo-orbital');
            els.darkBtn.setAttribute('aria-pressed', 'false');
            els.darkBtn.setAttribute('aria-label', 'Activar modo oscuro');
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
            case 'orbital':
                els.orbitalBtn ? applyOrbitalTheme() : applyLightTheme();
                break;
            case 'dark':
                applyAmoledDarkTheme();
                break;
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
                }
                else if (els.modal.style.display === 'flex') {
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
            if (!isActive)
                els.searchHistoryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        els.busqueda.addEventListener('input', (e) => {
            const target = e.target;
            els.searchContainer.classList.toggle('active', target.value.trim() !== '');
            debouncedFilter();
        });
        [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input => input.addEventListener('input', debouncedFilter));
        [els.posDel, els.posTras].forEach(btn => btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filterData();
        }));
        els.clearBtn.addEventListener('click', () => {
            if (els.clearBtn.disabled)
                return;
            els.clearBtn.disabled = true;
            const trashLid = els.clearBtn.querySelector('.trash-lid');
            const trashBody = els.clearBtn.querySelector('.trash-body');
            if (trashLid)
                trashLid.classList.add('animate-lid');
            if (trashBody)
                trashBody.classList.add('animate-body');
            createSparks(els.clearBtn);
            clearAllFilters();
            setTimeout(() => {
                if (trashLid)
                    trashLid.classList.remove('animate-lid');
                if (trashBody)
                    trashBody.classList.remove('animate-body');
                els.clearBtn.disabled = false;
            }, 900);
        });
        function createSparks(button) {
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
                const target = e.target;
                const tag = target ? target.closest('.brand-tag') : null;
                if (!tag)
                    return;
                els.marca.value = tag.classList.contains('active') ? '' : tag.dataset.brand || '';
                filterData();
            });
        }
        if (els.manufacturerTagsContainer) {
            els.manufacturerTagsContainer.addEventListener('click', (e) => {
                const target = e.target;
                const tag = target ? target.closest('.brand-tag') : null;
                if (!tag)
                    return;
                const manufacturer = tag.dataset.manufacturer || '';
                const isActive = tag.classList.contains('active');
                els.manufacturerTagsContainer.querySelectorAll('.brand-tag.active').forEach(t => {
                    if (t !== tag)
                        t.classList.remove('active');
                });
                if (isActive) {
                    tag.classList.remove('active');
                    appState.activeManufacturer = null;
                }
                else {
                    tag.classList.add('active');
                    appState.activeManufacturer = manufacturer;
                }
                filterData();
            });
        }
        els.paginationContainer.addEventListener('click', (e) => {
            const target = e.target;
            const btn = target ? target.closest('.page-btn') : null;
            if (!btn || btn.disabled || btn.classList.contains('active'))
                return;
            const newPage = parseInt(btn.dataset.page || '0');
            if (newPage) {
                appState.currentPage = newPage;
                renderCurrentPage();
                els.resultsHeaderCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target)
                return;
            const deleteBtn = target.closest('.delete-history-item');
            if (deleteBtn) {
                e.stopPropagation();
                deleteFromSearchHistory(deleteBtn.dataset.queryDelete || '');
            }
            else {
                const historyItem = target.closest('.search-history-item');
                if (historyItem) {
                    const query = historyItem.dataset.query || '';
                    els.busqueda.value = query;
                    addToSearchHistory(query);
                    filterData();
                    els.busqueda.focus();
                }
            }
        });
        // Modales
        els.modalCloseBtn.addEventListener('click', closeModal);
        els.modal.addEventListener('click', (e) => {
            if (e.target === els.modal)
                closeModal();
        });
        els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
        els.guideModal.addEventListener('click', (e) => {
            if (e.target === els.guideModal)
                closeGuideModal();
        });
    }
    function setupComparisonModal() {
        const compareBtn = document.getElementById('compareBtn');
        const comparisonModal = document.getElementById('comparisonModal');
        const closeComparisonModal = document.getElementById('closeComparisonModal');
        if (compareBtn && comparisonModal) {
            compareBtn.addEventListener('click', () => {
                if (appState.comparisons.size < 2) {
                    alert("Selecciona al menos 2 productos para comparar.");
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
        if (!container)
            return;
        const items = appState.data.filter(item => appState.comparisons.has(item._appId));
        container.innerHTML = items.map(item => `
            <div class="comparison-column" style="min-width: 300px; max-width: 350px; display: flex; flex-direction: column; gap: 1rem; border-right: 1px solid var(--material-surface-border); padding-right: 1rem;">
                <div class="comp-header">
                    <img src="${item.imagenes && item.imagenes[0] ? item.imagenes[0] : 'https://via.placeholder.com/300'}" style="width: 100%; height: 200px; object-fit: contain;">
                    <h3 style="margin-top: 1rem;">${item.ref ? item.ref[0] : 'N/A'}</h3>
                    <span class="position-badge-premium ${item.posicion ? item.posicion.toLowerCase() : ''}">${item.posicion || 'N/A'}</span>
                </div>
                <div class="comp-specs">
                    <div class="spec-row"><strong>Medidas:</strong> ${item.anchoNum} x ${item.altoNum} mm</div>
                    <div class="spec-row"><strong>Espesor:</strong> ${item.espesor || '-'} mm</div>
                    <div class="spec-row"><strong>WVA:</strong> ${item.wva || '-'}</div>
                    <div class="spec-row"><strong>Sistema:</strong> ${item.sistema || '-'}</div>
                </div>
                <div class="comp-apps" style="flex: 1; overflow-y: auto;">
                    <strong>Aplicaciones:</strong>
                    <ul style="font-size: 0.8rem; padding-left: 1.2rem;">
                        ${item.aplicaciones.slice(0, 5).map(app => `<li>${app.marca} ${app.modelo} ${app.año}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }
    // === Inicialización ===
    // === Inicialización Real-time con Notificaciones ===
    function inicializarApp() {
        showSkeletonLoader();
        renderSearchHistory();
        els.searchHistoryCard.style.display = 'none';

        db.collection('pastillas').onSnapshot((snapshot) => {
            let isInitialLoad = appState.data.length === 0;
            let changesCount = 0;

            snapshot.docChanges().forEach((change) => {
                const docData = change.doc.data();
                const docId = change.doc.id;

                // Normalización de imagen
                if (docData.imagen && (!docData.imagenes || docData.imagenes.length === 0)) {
                    docData.imagenes = [
                        docData.imagen.replace("text=", `text=Vista+1+`),
                        docData.imagen.replace("text=", `text=Vista+2+`),
                        docData.imagen.replace("text=", `text=Vista+3+`)
                    ];
                }

                let medidaString = null;
                if (Array.isArray(docData.medidas) && docData.medidas.length > 0) {
                    medidaString = String(docData.medidas[0]);
                } else if (typeof docData.medidas === 'string') {
                    medidaString = docData.medidas;
                }
                const partes = medidaString ? medidaString.split(/x/i).map((s) => parseFloat(s.trim())) : [0, 0];
                const safeRefs = Array.isArray(docData.ref) ? docData.ref : [];
                const safeOems = Array.isArray(docData.oem) ? docData.oem : [];
                const safeFmsis = Array.isArray(docData.fmsi) ? docData.fmsi : [];
                const aplicaciones = Array.isArray(docData.aplicaciones) ? docData.aplicaciones : [];

                const item = {
                    ...docData,
                    aplicaciones,
                    _appId: docId,
                    ref: safeRefs,
                    oem: safeOems,
                    fmsi: safeFmsis,
                    anchoNum: docData.anchoNum || partes[0] || 0,
                    altoNum: docData.altoNum || partes[1] || 0
                };

                if (change.type === "added") {
                    appState.data.push(item);
                    if (!isInitialLoad) {
                        const refName = safeRefs.length > 0 ? safeRefs[0] : 'Desconocida';
                        appState.addNotification("Nueva Referencia", `Se ha agregado ${refName}.`);
                        changesCount++;
                    }
                }
                if (change.type === "modified") {
                    const index = appState.data.findIndex(p => p._appId === docId);
                    if (index !== -1) {
                        appState.data[index] = item;
                        const refName = safeRefs.length > 0 ? safeRefs[0] : 'Desconocida';
                        appState.addNotification("Actualización", `Referencia ${refName} actualizada.`);
                        changesCount++;
                    }
                }
                if (change.type === "removed") {
                    appState.data = appState.data.filter(p => p._appId !== docId);
                    changesCount++;
                }
            });

            if (isInitialLoad || changesCount > 0) {
                // Reordenar
                appState.data.sort((a, b) => getSortableRefNumber(a.ref) - getSortableRefNumber(b.ref));

                // Actualizar filtros dropdowns
                const getAllApplicationValues = (key) => {
                    const allValues = new Set();
                    appState.data.forEach(item => {
                        item.aplicaciones.forEach(app => {
                            const prop = key === 'modelo' ? 'serie' : key;
                            if (app[prop])
                                allValues.add(String(app[prop]));
                        });
                    });
                    return [...allValues].sort();
                };
                updateDropdown('listaMarcas', getAllApplicationValues('marca'));
                updateDropdown('listaModelos', getAllApplicationValues('modelo'));
                updateDropdown('listaAnios', getAllApplicationValues('año'));
                const allOems = [...new Set(appState.data.flatMap(i => i.oem || []))].filter(Boolean).sort();
                const allFmsis = [...new Set(appState.data.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
                updateDropdown('oemList', allOems);
                updateDropdown('fmsiList', allFmsis);

                if (isInitialLoad) {
                    applyFiltersFromURL();
                    setupEventListeners();
                    setupComparisonModal();
                }

                // Siempre refrescar datos y tags
                filterData();
                renderDynamicBrandTags(appState.data, false);
            }
        }, (error) => {
            console.error('Error al inicializar la app:', error);
            showGlobalError('Error al cargar datos', 'No se pudo conectar con la base de datos.');
        });
    }
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
    }
    inicializarApp();
});
//# sourceMappingURL=script.js.map