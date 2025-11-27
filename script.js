// ================================================
// BRAKE X - Main Application Script
// ================================================

/**
 * Application Configuration
 * @const {Object} CONFIG
 */
const CONFIG = {
    // Pagination
    ITEMS_PER_PAGE: 24,
    MAX_HISTORY: 5,

    // Performance
    DEBOUNCE_DELAY: 400, // Increased from 300ms for better performance
    TOLERANCE: 1.0,
    LAZY_LOAD_ROOT_MARGIN: '50px',
    ENABLE_SEARCH_CACHE: true,
    CACHE_MAX_SIZE: 50,

    // Firebase Configuration
    // ⚠️ SECURITY NOTE: API keys in client-side code are normal for Firebase
    // but you should implement:
    // 1. Firebase App Check to prevent API abuse
    // 2. Firestore Security Rules to protect data
    // 3. Consider Cloud Functions for sensitive operations
    FIREBASE: {
        apiKey: "AIzaSyCha4S_wLxI_CZY1Tc9FOJNA3cUTggISpU",
        authDomain: "brakexadmin.firebaseapp.com",
        projectId: "brakexadmin",
        storageBucket: "brakexadmin.firebasestorage.app",
        messagingSenderId: "799264562947",
        appId: "1:799264562947:web:52d860ae41a5c4b8f75336"
    }
};

// ================================================
// Application Initialization
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // === Firebase Initialization ===
    firebase.initializeApp(CONFIG.FIREBASE);
    const db = firebase.firestore();

    // ================================================
    // Application State Management

    /**
     * Application State Manager
     * Manages global app state including data, filters, pagination, and favorites
     * @class AppState
     */
    class AppState {
        constructor() {
            this.data = [];
            this.filtered = [];
            this.currentPage = 1;
            this._favorites = new Set();
            this.isFavoritesMode = false;
            this.activeManufacturer = null;
            this._comparisonSelection = new Set();
            this.MAX_COMPARISON = 3;

            this._loadFavorites();
            this._loadComparisonSelection();
        }

        /**
         * Load favorites from localStorage
         * @private
         */
        _loadFavorites() {
            try {
                const favs = localStorage.getItem('brakeXFavorites');
                if (favs) {
                    this._favorites = new Set(JSON.parse(favs).map(Number));
                }
            } catch (e) {
                console.error("Error al cargar favoritos:", e);
                this._favorites = new Set();
            }
        }

        /**
         * Save favorites to localStorage
         * @private
         */
        _saveFavorites() {
            try {
                localStorage.setItem('brakeXFavorites', JSON.stringify([...this._favorites]));
            } catch (e) {
                console.error("Error al guardar favoritos:", e);
            }
        }

        /**
         * Toggle favorite status for an item
         * @param {number} itemId - Item ID to toggle
         */
        toggleFavorite(itemId) {
            if (this._favorites.has(itemId)) {
                this._favorites.delete(itemId);
            } else {
                this._favorites.add(itemId);
            }
            this._saveFavorites();
        }

        /**
         * Check if item is favorited
         * @param {number} itemId - Item ID to check
         * @returns {boolean}
         */
        isFavorite(itemId) {
            return this._favorites.has(itemId);
        }

        /**
         * Get all favorites
         * @returns {Set<number>}
         */
        get favorites() {
            return this._favorites;
        }

        /**
         * Load comparison selection from sessionStorage
         * @private
         */
        _loadComparisonSelection() {
            try {
                const selection = sessionStorage.getItem('brakeXComparison');
                if (selection) {
                    this._comparisonSelection = new Set(JSON.parse(selection).map(Number));
                }
            } catch (e) {
                console.error("Error al cargar selección de comparación:", e);
                this._comparisonSelection = new Set();
            }
        }

        /**
         * Save comparison selection to sessionStorage
         * @private
         */
        _saveComparisonSelection() {
            try {
                sessionStorage.setItem('brakeXComparison', JSON.stringify([...this._comparisonSelection]));
            } catch (e) {
                console.error("Error al guardar selección de comparación:", e);
            }
        }

        /**
         * Toggle comparison selection for an item
         * @param {number} itemId - Item ID to toggle
         * @returns {boolean} - true if added, false if removed or at limit
         */
        toggleComparison(itemId) {
            if (this._comparisonSelection.has(itemId)) {
                this._comparisonSelection.delete(itemId);
                this._saveComparisonSelection();
                return false;
            } else if (this._comparisonSelection.size < this.MAX_COMPARISON) {
                this._comparisonSelection.add(itemId);
                this._saveComparisonSelection();
                return true;
            }
            return false; // At limit
        }

        /**
         * Check if item is in comparison
         * @param {number} itemId
         * @returns {boolean}
         */
        isInComparison(itemId) {
            return this._comparisonSelection.has(itemId);
        }

        /**
         * Get all comparison selections
         * @returns {Set<number>}
         */
        get comparisonSelection() {
            return this._comparisonSelection;
        }

        /**
         * Clear all comparison selections
         */
        clearComparison() {
            this._comparisonSelection.clear();
            this._saveComparisonSelection();
        }

        /**
         * Get comparison items data
         * @returns {Array}
         */
        getComparisonItems() {
            return this.data.filter(item => this._comparisonSelection.has(item._appId));
        }
    }

    /**
     * Search Cache for Memoization
     * Caches filter results to improve performance on repeated searches
     * @class SearchCache
     */
    class SearchCache {
        constructor(maxSize = 50) {
            this.cache = new Map();
            this.maxSize = maxSize;
            this.hits = 0;
            this.misses = 0;
        }

        generateKey(filters) {
            return JSON.stringify(filters);
        }

        get(filters) {
            const key = this.generateKey(filters);
            if (this.cache.has(key)) {
                this.hits++;
                // Move to end for LRU
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            }
            this.misses++;
            return null;
        }

        set(filters, results) {
            const key = this.generateKey(filters);

            // LRU eviction - remove oldest (first) entry
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            this.cache.set(key, results);
        }

        clear() {
            this.cache.clear();
            this.hits = 0;
            this.misses = 0;
        }

        getStats() {
            const total = this.hits + this.misses;
            return {
                size: this.cache.size,
                hits: this.hits,
                misses: this.misses,
                hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
            };
        }
    }

    // Instanciar el estado global de la app
    const appState = new AppState();
    const searchCache = new SearchCache(CONFIG.CACHE_MAX_SIZE);

    // Make searchCache available globally for debugging
    window.searchCache = searchCache;

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
        menuBtn: document.getElementById('menuBtn'),
        sideMenu: document.getElementById('side-menu'),
        sideMenuOverlay: document.getElementById('side-menu-overlay'),
        menuCloseBtn: document.getElementById('menuCloseBtn'),
        openGuideLink: document.getElementById('open-guide-link'),
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
        datalistMarca: document.getElementById('marcas'),
        datalistModelo: document.getElementById('modelos'),
        datalistAnio: document.getElementById('anios'),
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
        manufacturerTagsContainer: document.getElementById('manufacturer-tags-container'),
        compareBtn: document.getElementById('compareBtn'),
        compareCount: document.getElementById('compareCount'),
        comparisonModal: document.getElementById('comparison-modal'),
        comparisonModalContent: document.querySelector('#comparison-modal .comparison-modal-content'),
        comparisonCloseBtn: document.getElementById('comparisonCloseBtn'),
        comparisonTableWrapper: document.getElementById('comparisonTableWrapper'),
        clearComparisonBtn: document.getElementById('clearComparisonBtn')
    };

    // === Gestión del historial de búsqueda ===
    function addToSearchHistory(query) {
        if (!query.trim()) return;
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        // Prevenir duplicados (ignorando mayúsculas/minúsculas)
        history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        history = history.slice(0, CONFIG.MAX_HISTORY);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function deleteFromSearchHistory(query) {
        if (!query.trim()) return;
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q !== query);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function getSearchHistory() {
        return JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
    }

    function removeFromSearchHistory(index) {
        let history = getSearchHistory();
        if (index >= 0 && index < history.length) {
            history.splice(index, 1);
            localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
            renderSearchHistory();
        }
    }

    // renderSearchHistory moved to line ~1011 with counter management

    // === Gestión de favoritos ===
    // REFACTORIZADO (MEJORA #4)
    const toggleFavorite = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const card = button.closest('.result-card');
        if (!card) return;
        const itemId = parseInt(card.dataset.id);
        if (isNaN(itemId)) return;

        // 1. Llama al método de la clase. Él se encarga de guardar.
        appState.toggleFavorite(itemId);

        // 2. Actualiza la UI del botón
        const isNowFavorite = appState.isFavorite(itemId);
        button.classList.toggle('active', isNowFavorite);
        button.setAttribute('aria-pressed', isNowFavorite);

        // 3. Actualiza el contador de favoritos
        updateFavoritesCounter();

        // 4. Refiltra si estamos en modo favoritos
        if (appState.isFavoritesMode) filterData();
    };

    /**
     * Update favorites counter badge
     */
    const updateFavoritesCounter = () => {
        const favCount = appState.favorites.size;
        const counterEl = document.getElementById('favoritesCount');
        const favBtn = els.filtroFavoritosBtn;

        if (counterEl && favBtn) {
            counterEl.textContent = favCount;

            if (favCount > 0) {
                // Show button and badge
                favBtn.style.display = 'flex';
                counterEl.style.display = 'inline-flex';

                // Trigger animation
                requestAnimationFrame(() => {
                    favBtn.style.opacity = '1';
                    favBtn.style.transform = 'scale(1)';
                });
            } else {
                // Hide button
                favBtn.style.opacity = '0';
                favBtn.style.transform = 'scale(0.95)';

                // After animation, hide completely
                setTimeout(() => {
                    if (appState.favorites.size === 0) {
                        favBtn.style.display = 'none';
                        counterEl.style.display = 'none';
                    }
                }, 250);
            }
        }
    };

    // === Utilidades ===
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // --- FUNCIÓN DE AYUDA (MEJORA #8) CON CACHÉ ---
    const normalizeTextCache = new Map();
    const MAX_NORMALIZE_CACHE = 1000;

    const normalizeText = (text = '') => {
        const textStr = String(text);

        // Check cache first
        if (normalizeTextCache.has(textStr)) {
            return normalizeTextCache.get(textStr);
        }

        // Normalize text
        const normalized = textStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // LRU eviction for cache
        if (normalizeTextCache.size >= MAX_NORMALIZE_CACHE) {
            const firstKey = normalizeTextCache.keys().next().value;
            normalizeTextCache.delete(firstKey);
        }

        // Store in cache
        normalizeTextCache.set(textStr, normalized);
        return normalized;
    };
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
    const handleFocusTrap = (e) => {
        if (e.key !== 'Tab') return;

        // 'e.currentTarget' es el modal o menú que tiene el listener
        const focusableElements = e.currentTarget.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select'
        );
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

    const fillDatalist = (datalist, values) => {
        datalist.innerHTML = values.map(v => `<option value="${v}">`).join('');
    };

    const getPositionFilter = () => {
        const activePositions = [];
        if (els.posDel.classList.contains('active')) activePositions.push('Delantera');
        if (els.posTras.classList.contains('active')) activePositions.push('Trasera');
        return activePositions;
    };

    // --- INICIO: MEJORA #3 (BADGES) ---
    const BADGE_CONFIG = {
        'K': { class: 'ref-k', test: (ref) => ref.startsWith('K') },
        'INC': { class: 'ref-inc', test: (ref) => ref.endsWith('INC') },
        'BP': { class: 'ref-bp', test: (ref) => ref.endsWith('BP') },
        'BEX': { class: 'ref-bex', test: (ref) => ref.endsWith('BEX') },
    };
    const getRefBadgeClass = (ref) => {
        if (typeof ref !== 'string') {
            return 'ref-default';
        }
        const upperRef = ref.toUpperCase();
        for (const key in BADGE_CONFIG) {
            if (BADGE_CONFIG[key].test(upperRef)) {
                return BADGE_CONFIG[key].class;
            }
        }
        return 'ref-default';
    };
    // --- FIN: MEJORA #3 ---

    const getSortableRefNumber = (refArray) => {
        if (!Array.isArray(refArray) || refArray.length === 0) return Infinity;
        let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
        if (!primaryRef) primaryRef = refArray[0];
        const match = String(primaryRef).match(/(\d+)/);
        return match ? parseInt(match[0], 10) : Infinity;
    };

    // === Filtrado y renderizado ===

    // --- INICIO: BLOQUE DE FILTRADO REFACTORIZADO (MEJORAS #8 Y CÓDIGO DE EJEMPLO) ---

    // Función de ayuda para obtener y normalizar todos los valores de los filtros
    const getActiveFilters = () => {
        const activePos = [];
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
                item._searchableText = normalizeText(`${allRefs} ${itemVehicles}`);
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

        // Filtro de Posición
        pos: (item, activePositions) => activePositions.length === 0 || activePositions.includes(item.posición),

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

        // Guardar en historial SÓLO SI hay un término de búsqueda (Mejora de Historial)
        if (filters.busqueda) {
            addToSearchHistory(els.busqueda.value.trim()); // Usamos el valor original sin normalizar
        }

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

        // El resto sigue igual
        appState.currentPage = 1;
        renderCurrentPage();
        updateURLWithFilters();
        renderDynamicBrandTags(appState.filtered, isFiltered);
    };

    // --- FIN: BLOQUE DE FILTRADO REFACTORIZADO ---


    const renderApplicationsList = (aplicaciones) => {
        const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
        const groupedApps = safeAplicaciones.reduce((acc, app) => {
            const marca = app.marca || 'N/A';
            if (!acc[marca]) acc[marca] = [];
            acc[marca].push(app);
            return acc;
        }, {});
        Object.keys(groupedApps).forEach(marca => {
            groupedApps[marca].sort((a, b) => {
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
                appListHTML += `<div class="app-detail-row"><div>${app.serie || ''}</div><div>${app.litros || ''}</div><div>${app.año || ''}</div></div>`;
            });
        }
        return appListHTML;
    };

    const renderSpecs = (item) => {
        let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div><div class="spec-details-grid">`;
        const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap(ref => String(ref).split(' '))
                .map(part => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na spec-ref-badge">N/A</span>';
        specsHTML += `<div class="spec-label"><strong>Referencias</strong></div><div class="spec-value modal-ref-container">${refsSpecsHTML}</div>`;
        specsHTML += `<div class="spec-label"><strong>OEM</strong></div><div class="spec-value">${(Array.isArray(item.oem) && item.oem.length > 0) ? item.oem.join(', ') : 'N/A'}</div>`;
        specsHTML += `<div class="spec-label"><strong>Platina FMSI</strong></div><div class="spec-value">${(Array.isArray(item.fmsi) && item.fmsi.length > 0) ? item.fmsi.join(', ') : 'N/A'}</div>`;
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
        specsHTML += `</div>`;
        return specsHTML;
    };

    // ================================================
    // COMPARISON FEATURE FUNCTIONS
    // ================================================

    /**
     * Update comparison counter badge
     */
    const updateComparisonCounter = () => {
        const count = appState.comparisonSelection.size;
        const counterEl = els.compareCount;
        const compareBtn = els.compareBtn;

        if (counterEl && compareBtn) {
            counterEl.textContent = count;

            if (count > 0) {
                // Show button and badge
                compareBtn.style.display = 'flex';
                counterEl.style.display = 'inline-flex';
                compareBtn.classList.add('has-selection');

                // Trigger animation
                requestAnimationFrame(() => {
                    compareBtn.style.opacity = '1';
                    compareBtn.style.transform = 'scale(1)';
                });
            } else {
                // Hide button
                compareBtn.classList.remove('has-selection');
                compareBtn.style.opacity = '0';
                compareBtn.style.transform = 'scale(0.95)';

                // After animation, hide completely
                setTimeout(() => {
                    if (appState.comparisonSelection.size === 0) {
                        compareBtn.style.display = 'none';
                        counterEl.style.display = 'none';
                    }
                }, 250);
            }
        }
    };

    /**
     * Toggle comparison selection for a card
     */
    const toggleComparisonSelection = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const card = button.closest('.result-card');
        if (!card) return;
        const itemId = parseInt(card.dataset.id);
        if (isNaN(itemId)) return;

        const wasAdded = appState.toggleComparison(itemId);

        // Update button state
        const isNowSelected = appState.isInComparison(itemId);
        button.classList.toggle('selected', isNowSelected);
        button.setAttribute('aria-pressed', isNowSelected);

        // Show feedback if at limit
        if (!wasAdded && !isNowSelected && appState.comparisonSelection.size >= appState.MAX_COMPARISON) {
            // Visual feedback: shake animation or notification
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        }

        // Update counter
        updateComparisonCounter();
    };

    /**
     * Render comparison table
     */
    const renderComparisonTable = (items) => {
        if (!items || items.length === 0) {
            els.comparisonTableWrapper.innerHTML = `
                <div class="comparison-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <p>No hay referencias seleccionadas</p>
                    <span>Selecciona hasta 3 referencias desde los resultados para compararlas</span>
                </div>
            `;
            return;
        }

        // Build table headers
        let tableHTML = '<table class="comparison-table"><thead><tr>';
        tableHTML += '<th>Campo</th>';
        items.forEach((item, index) => {
            const primaryRef = (Array.isArray(item.ref) && item.ref.length > 0) ? String(item.ref[0]).split(' ')[0] : `Ref ${index + 1}`;
            tableHTML += `<th>${primaryRef} <button class="comparison-remove-btn" data-remove-id="${item._appId}" aria-label="Quitar de la comparación">×</button></th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Row: Referencias
        tableHTML += '<tr><td data-label="Campo">Referencias</td>';
        items.forEach(item => {
            const refsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
                ? item.ref.flatMap(ref => String(ref).split(' '))
                    .map(part => `<span class="ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                    .join('')
                : '<span class="ref-badge ref-badge-na">N/A</span>';
            tableHTML += `<td data-label="Referencias"><div class="comparison-cell-refs">${refsHTML}</div></td>`;
        });
        tableHTML += '</tr>';

        // Row: Posición
        tableHTML += '<tr><td data-label="Campo">Posición</td>';
        items.forEach(item => {
            const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
            tableHTML += `<td data-label="Posición"><div class="comparison-cell-position"><span class="position-badge ${posBadgeClass}">${item.posición}</span></div></td>`;
        });
        tableHTML += '</tr>';

        // Row: Medidas
        tableHTML += '<tr><td data-label="Campo">Medidas (mm)</td>';
        items.forEach(item => {
            let medidasText = 'N/A';
            if (Array.isArray(item.medidas) && item.medidas.length > 0) {
                medidasText = item.medidas.map(m => {
                    const parts = String(m).split(/x/i).map(s => s.trim());
                    return `${parts[0] || 'N/A'} x ${parts[1] || 'N/A'}`;
                }).join('<br>');
            } else if (item.anchoNum || item.altoNum) {
                medidasText = `${item.anchoNum || 'N/A'} x ${item.altoNum || 'N/A'}`;
            }
            tableHTML += `<td data-label="Medidas">${medidasText}</td>`;
        });
        tableHTML += '</tr>';

        // Row: OEM
        tableHTML += '<tr><td data-label="Campo">OEM</td>';
        items.forEach(item => {
            const oemText = (Array.isArray(item.oem) && item.oem.length > 0) ? item.oem.join(', ') : 'N/A';
            tableHTML += `<td data-label="OEM">${oemText}</td>`;
        });
        tableHTML += '</tr>';

        // Row: FMSI
        tableHTML += '<tr><td data-label="Campo">Platina FMSI</td>';
        items.forEach(item => {
            const fmsiText = (Array.isArray(item.fmsi) && item.fmsi.length > 0) ? item.fmsi.join(', ') : 'N/A';
            tableHTML += `<td data-label="FMSI">${fmsiText}</td>`;
        });
        tableHTML += '</tr>';

        // Row: Imagen
        tableHTML += '<tr><td data-label="Campo">Imagen</td>';
        items.forEach(item => {
            let imageSrc = 'https://via.placeholder.com/150x100.png?text=No+Img';
            if (item.imagenes && item.imagenes.length > 0) {
                imageSrc = item.imagenes[0];
            } else if (item.imagen) {
                imageSrc = item.imagen.replace("text=", `text=Vista+1+`);
            }
            tableHTML += `<td data-label="Imagen"><div class="comparison-cell-image"><img src="${imageSrc}" alt="Imagen de referencia" loading="lazy"></div></td>`;
        });
        tableHTML += '</tr>';

        // Row: Aplicaciones (primeras 5)
        tableHTML += '<tr><td data-label="Campo">Aplicaciones</td>';
        items.forEach(item => {
            const apps = Array.isArray(item.aplicaciones) ? item.aplicaciones.slice(0, 5) : [];
            const appsHTML = apps.length > 0
                ? apps.map(app => `<div class="comparison-app-item">${app.marca} ${app.serie} ${app.año || ''}</div>`).join('')
                : '<div class="comparison-app-item">N/A</div>';
            const moreText = (item.aplicaciones && item.aplicaciones.length > 5) ? `<div style="margin-top:4px;font-size:0.75rem;opacity:0.7;">+${item.aplicaciones.length - 5} más</div>` : '';
            tableHTML += `<td data-label="Aplicaciones"><div class="comparison-cell-apps">${appsHTML}${moreText}</div></td>`;
        });
        tableHTML += '</tr>';

        tableHTML += '</tbody></table>';
        els.comparisonTableWrapper.innerHTML = tableHTML;

        // Add remove button listeners
        els.comparisonTableWrapper.querySelectorAll('.comparison-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = parseInt(btn.dataset.removeId);
                appState.toggleComparison(itemId);
                updateComparisonCounter();
                openComparisonModal(); // Re-render
                renderCurrentPage(); // Update cards
            });
        });
    };

    /**
     * Open comparison modal
     */
    const openComparisonModal = () => {
        const items = appState.getComparisonItems();
        renderComparisonTable(items);

        els.comparisonModalContent.classList.remove('closing');
        els.comparisonModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus trap
        lastFocusedElement = document.activeElement;
        els.comparisonModal.addEventListener('keydown', handleFocusTrap);
        els.comparisonCloseBtn.focus();
    };

    /**
     * Close comparison modal
     */
    const closeComparisonModal = () => {
        els.comparisonModalContent.classList.add('closing');
        setTimeout(() => {
            els.comparisonModal.style.display = 'none';
            document.body.style.overflow = '';
            if (lastFocusedElement) lastFocusedElement.focus();
            els.comparisonModal.removeEventListener('keydown', handleFocusTrap);
        }, 300);
    };

    /**
     * Clear all comparison selections
     */
    const clearComparisonSelection = () => {
        appState.clearComparison();
        updateComparisonCounter();
        renderCurrentPage(); // Update card states
        renderComparisonTable([]); // Clear table
    };

    // ================================================
    // END COMPARISON FEATURE
    // ================================================

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
        const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
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
        const startIndex = (appState.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
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
            const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
            const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;
            const refsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
                ? item.ref.flatMap(ref => String(ref).split(' '))
                    .map(part => `<span class="ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                    .join('')
                : '<span class="ref-badge ref-badge-na">N/A</span>';
            let firstImageSrc = 'https://via.placeholder.com/300x200.png?text=No+Img';
            if (item.imagenes && item.imagenes.length > 0) {
                firstImageSrc = item.imagenes[0];
            } else if (item.imagen) {
                firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
            }
            const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
            const appSummaryItems = safeAplicaciones.slice(0, 3).map(app => `${app.marca} ${app.serie}`).filter((value, index, self) => self.indexOf(value) === index);
            let appSummaryHTML = appSummaryItems.length > 0
                ? `<div class="card-app-summary">${appSummaryItems.join(', ')}${safeAplicaciones.length > 3 ? ', ...' : ''}</div>`
                : '';
            const primaryRefForData = (Array.isArray(item.ref) && item.ref.length > 0) ? String(item.ref[0]).split(' ')[0] : 'N/A';

            // REFACTORIZADO (MEJORA #4)
            const isFavorite = appState.isFavorite(item._appId);

            const favoriteBtnHTML = `
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${item._appId}" aria-label="Marcar como favorito" aria-pressed="${isFavorite}">
                    <svg class="heart-icon" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
            `;

            // COMPARISON FEATURE: Add comparison checkbox
            const isInComparison = appState.isInComparison(item._appId);
            const compareCheckboxHTML = `
                <button class="compare-checkbox-btn ${isInComparison ? 'selected' : ''}" data-id="${item._appId}" aria-label="Agregar a comparación" aria-pressed="${isInComparison}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
            `;

            return `
                <div class="result-card" data-id="${item._appId}" style="animation-delay: ${index * 50}ms" tabindex="0" role="button" aria-haspopup="dialog">
                    ${favoriteBtnHTML}
                    ${compareCheckboxHTML}
                    <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRefForData}" class="result-image" loading="lazy"></div>
                    <div class="card-content-wrapper">
                        <div class="card-details">
                            <div class="card-ref-container">${refsHTML}</div>
                            ${posBadge}
                        </div>
                        ${appSummaryHTML}
                    </div>
                </div>`;
        }).join('');
        els.results.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', toggleFavorite);
        });
        els.results.querySelectorAll('.compare-checkbox-btn').forEach(btn => {
            btn.addEventListener('click', toggleComparisonSelection);
        });
        setupPagination(totalResults);
        updateComparisonCounter(); // Update counter on page render
    };

    function renderSearchHistory() {
        if (!els.searchHistoryContainer) return;

        const history = getSearchHistory();
        const historyCount = history.length;

        // Update counter badge and button visibility
        const counterEl = document.getElementById('historyCount');
        const historyBtn = els.historialBtn;

        if (counterEl && historyBtn) {
            counterEl.textContent = historyCount;

            if (historyCount > 0) {
                // Show button and badge
                historyBtn.style.display = 'flex';
                counterEl.style.display = 'inline-flex';

                // Trigger animation
                requestAnimationFrame(() => {
                    historyBtn.style.opacity = '1';
                    historyBtn.style.transform = 'scale(1)';
                });
            } else {
                // Hide button
                historyBtn.style.opacity = '0';
                historyBtn.style.transform = 'scale(0.95)';

                // After animation, hide completely
                setTimeout(() => {
                    const currentHistory = getSearchHistory();
                    if (currentHistory.length === 0) {
                        historyBtn.style.display = 'none';
                        counterEl.style.display = 'none';
                    }
                }, 250);
            }
        }

        if (history.length === 0) {
            els.searchHistoryContainer.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.6; font-size: 0.9rem;">No hay búsquedas recientes</p>';
            return;
        }

        let html = '';
        history.forEach((query, index) => {
            html += `
                <div class="history-item" data-query="${query}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <span class="history-query">${query}</span>
                    <button class="history-remove-btn" data-index="${index}" aria-label="Eliminar de historial">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        });
        els.searchHistoryContainer.innerHTML = html;

        // Click en ítem del historial
        els.searchHistoryContainer.querySelectorAll('.history-item .history-query').forEach(el => {
            el.addEventListener('click', (e) => {
                const query = e.target.closest('.history-item').dataset.query;
                els.busqueda.value = query;
                els.historialBtn.click(); // Cerrar historial
                filterData();
            });
        });

        // Botones de eliminar
        els.searchHistoryContainer.querySelectorAll('.history-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                removeFromSearchHistory(index);
                renderSearchHistory();
            });
        });
    }


    function renderDynamicBrandTags(data, isFiltered) {
        if (!els.brandTagsContainer) return;
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
    function handleCardClick(event) {
        if (event.target.closest('.favorite-btn')) return;
        const card = event.target.closest('.result-card');
        if (card) {
            const itemId = card.dataset.id;
            const itemData = appState.data.find(item => item._appId == itemId);
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

    function openModal(item) {
        const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap(ref => String(ref).split(' '))
                .map(part => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';
        els.modalRef.innerHTML = `<div class="modal-header-ref-container">${refsHeaderHTML}</div>`;
        const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
        els.modalPosition.innerHTML = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;
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
            ` : ''}
        `;
        els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const direction = parseInt(e.currentTarget.dataset.direction);
                navigateCarousel(els.modalCarousel, direction);
            };
        });
        if (images.length > 1) {
            els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1/${images.length}</span>`;
        } else {
            els.modalCounterWrapper.innerHTML = '';
        }
        els.modalAppsSpecs.innerHTML = `<div class="applications-list-container">${renderApplicationsList(item.aplicaciones)}${renderSpecs(item)}</div>`;
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

                // Setup gesture support for carousel
                setupCarouselGestures(els.modalCarousel);
            }, 100);
        });
    }

    function navigateCarousel(carouselContainer, direction) {
        const track = carouselContainer.querySelector('.image-track');
        const images = carouselContainer.querySelectorAll('.result-image');
        const counter = els.modalCounterWrapper.querySelector('.carousel-counter');
        if (!track || images.length <= 1) return;
        let currentIndex = parseInt(track.dataset.currentIndex) || 0;
        const totalImages = images.length;
        let newIndex = currentIndex + direction;
        if (newIndex >= totalImages) newIndex = 0;
        else if (newIndex < 0) newIndex = totalImages - 1;
        track.style.transform = `translateX(-${newIndex * 100}%)`;
        track.dataset.currentIndex = newIndex;
        if (counter) counter.textContent = `${newIndex + 1}/${totalImages}`;
    }

    // === Touch Gesture Support for Carousel ===
    function setupCarouselGestures(carouselContainer) {
        const track = carouselContainer.querySelector('.image-track');
        if (!track) return;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTransform = 0;

        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            isDragging = true;
            startX = e.touches[0].clientX;
            currentX = startX;

            // Get current transform value
            const currentIndex = parseInt(track.dataset.currentIndex) || 0;
            startTransform = -currentIndex * 100;

            track.style.transition = 'none';
            carouselContainer.style.cursor = 'grabbing';
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scroll while swiping

            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            const percentMove = (deltaX / carouselContainer.offsetWidth) * 100;

            track.style.transform = `translateX(${startTransform + percentMove}%)`;
        };

        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            track.style.transition = '';
            carouselContainer.style.cursor = '';

            const deltaX = currentX - startX;
            const threshold = carouselContainer.offsetWidth * 0.25; // 25% threshold

            if (Math.abs(deltaX) > threshold) {
                // Swipe detected
                const direction = deltaX > 0 ? -1 : 1;
                navigateCarousel(carouselContainer, direction);
            } else {
                // Return to current position
                const currentIndex = parseInt(track.dataset.currentIndex) || 0;
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
            }
        };

        // Touch events
        carouselContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        carouselContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        carouselContainer.addEventListener('touchend', handleTouchEnd);
        carouselContainer.addEventListener('touchcancel', handleTouchEnd);

        // Mouse events for desktop drag (optional)
        carouselContainer.addEventListener('mousedown', (e) => {
            handleTouchStart({ touches: [{ clientX: e.clientX }] });
        });
        carouselContainer.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleTouchMove({ touches: [{ clientX: e.clientX }], preventDefault: () => { } });
            }
        });
        carouselContainer.addEventListener('mouseup', handleTouchEnd);
        carouselContainer.addEventListener('mouseleave', handleTouchEnd);
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
        lastFocusedElement = document.activeElement;
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
    function openSideMenu() {
        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        lastFocusedElement = document.activeElement;
        // --- FIN: MEJORA #7 ---
        els.sideMenu.classList.add('open');
        els.sideMenu.setAttribute('aria-hidden', 'false');
        els.sideMenuOverlay.style.display = 'block';
        requestAnimationFrame(() => {
            els.sideMenuOverlay.classList.add('visible');
        });
        els.menuBtn.setAttribute('aria-expanded', 'true');
        els.menuCloseBtn.focus();
        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        els.sideMenu.addEventListener('keydown', handleFocusTrap);
        // --- FIN: MEJORA #7 ---
    }

    function closeSideMenu() {
        els.sideMenu.classList.remove('open');
        els.sideMenu.setAttribute('aria-hidden', 'true');
        els.sideMenuOverlay.classList.remove('visible');
        els.menuBtn.setAttribute('aria-expanded', 'false');

        // --- INICIO: MEJORA #7 (ACCESIBILIDAD) ---
        if (lastFocusedElement) lastFocusedElement.focus();
        els.sideMenu.removeEventListener('keydown', handleFocusTrap);
        // --- FIN: MEJORA #7 ---

        els.sideMenuOverlay.addEventListener('transitionend', () => {
            if (!els.sideMenuOverlay.classList.contains('visible')) {
                els.sideMenuOverlay.style.display = 'none';
            }
        }, { once: true });
    }

    const clearAllFilters = () => {
        // Trigger animation
        if (els.clearBtn) {
            els.clearBtn.classList.add('animating');
            setTimeout(() => {
                els.clearBtn.classList.remove('animating');
            }, 800); // Duration of animation
        }

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
        if (ripple) ripple.remove();
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

        [els.darkBtn, els.upBtn, els.menuBtn, els.orbitalBtn, els.clearBtn].forEach(btn => btn?.addEventListener('click', createRippleEffect));
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
        els.menuBtn.addEventListener('click', openSideMenu);
        els.menuCloseBtn.addEventListener('click', closeSideMenu);
        els.sideMenuOverlay.addEventListener('click', closeSideMenu);
        els.openGuideLink.addEventListener('click', () => {
            closeSideMenu();
            setTimeout(openGuideModal, 50);
        });

        // --- INICIO: CORRECCIÓN BUG ESCAPE (keydown) ---
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Prioritiza cerrar la capa superior primero.
                // Usamos "else if" para que solo cierre una cosa a la vez.

                if (els.comparisonModal && els.comparisonModal.style.display === 'flex') {
                    closeComparisonModal();
                } else if (els.sideMenu.classList.contains('open')) {
                    closeSideMenu();
                } else if (els.guideModal.style.display === 'flex') {
                    closeGuideModal();
                } else if (els.modal.style.display === 'flex') {
                    closeModal();
                }
            }
        });
        // --- FIN: CORRECCIÓN BUG ESCAPE ---

        // --- COMPARISON FEATURE: Event Listeners ---
        if (els.compareBtn) {
            els.compareBtn.addEventListener('click', () => {
                if (appState.comparisonSelection.size > 0) {
                    openComparisonModal();
                } else {
                    // Optional: Show a message if no items selected
                    console.log('No hay referencias seleccionadas para comparar');
                }
            });
        }

        if (els.comparisonCloseBtn) {
            els.comparisonCloseBtn.addEventListener('click', closeComparisonModal);
        }

        if (els.comparisonModal) {
            els.comparisonModal.addEventListener('click', (e) => {
                if (e.target === els.comparisonModal) {
                    closeComparisonModal();
                }
            });
        }

        if (els.clearComparisonBtn) {
            els.clearComparisonBtn.addEventListener('click', () => {
                clearComparisonSelection();
            });
        }
        // --- END COMPARISON FEATURE EVENT LISTENERS ---


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
            els.searchContainer.classList.toggle('active', e.target.value.trim() !== '');
            debouncedFilter();
        });

        [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input =>
            input.addEventListener('input', debouncedFilter)
        );

        [els.posDel, els.posTras].forEach(btn => btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filterData();
        }));

        els.clearBtn.addEventListener('click', () => {
            if (els.clearBtn.disabled) return;

            // Agregar clase animating que dispara todas las animaciones CSS
            els.clearBtn.classList.add('animating');
            els.clearBtn.disabled = true;

            // Crear sparkles effect
            createSparks(els.clearBtn);

            // Limpiar filtros
            clearAllFilters();

            // Remover clase y habilitar botón después de la animación
            setTimeout(() => {
                els.clearBtn.classList.remove('animating');
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
                const tag = e.target.closest('.brand-tag');
                if (!tag) return;
                els.marca.value = tag.classList.contains('active') ? '' : tag.dataset.brand;
                filterData();
            });
        }

        if (els.manufacturerTagsContainer) {
            els.manufacturerTagsContainer.addEventListener('click', (e) => {
                const tag = e.target.closest('.brand-tag');
                if (!tag) return;
                const manufacturer = tag.dataset.manufacturer;
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
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled || btn.classList.contains('active')) return;
            const newPage = parseInt(btn.dataset.page);
            if (newPage) {
                appState.currentPage = newPage;
                renderCurrentPage();
                els.resultsHeaderCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        document.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-history-item');
            if (deleteBtn) {
                e.stopPropagation();
                deleteFromSearchHistory(deleteBtn.dataset.queryDelete);
            } else {
                const historyItem = e.target.closest('.search-history-item');
                if (historyItem) {
                    const query = historyItem.dataset.query;
                    els.busqueda.value = query;
                    addToSearchHistory(query);
                    filterData();
                    els.busqueda.focus();
                }
            }
        });

        // Modales
        els.modalCloseBtn.addEventListener('click', closeModal);
        els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
        els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
        els.guideModal.addEventListener('click', (e) => { if (e.target === els.guideModal) closeGuideModal(); });
    }

    // === Inicialización ===
    async function inicializarApp() {
        showSkeletonLoader();
        // appState.loadFavorites(); // ELIMINADO (MEJORA #4) - La clase AppState lo hace
        renderSearchHistory();
        els.searchHistoryCard.style.display = 'none';
        try {
            const snapshot = await db.collection('pastillas').get();
            if (snapshot.empty) throw new Error("No se encontraron documentos en la colección 'pastillas'.");
            let data = [];
            snapshot.forEach(doc => data.push(doc.data()));
            data = data.map((item, index) => {
                if (item.imagen && (!item.imagenes || item.imagenes.length === 0)) {
                    item.imagenes = [
                        item.imagen.replace("text=", `text=Vista+1+`),
                        item.imagen.replace("text=", `text=Vista+2+`),
                        item.imagen.replace("text=", `text=Vista+3+`)
                    ];
                }
                let medidaString = null;
                if (Array.isArray(item.medidas) && item.medidas.length > 0) {
                    medidaString = String(item.medidas[0]);
                } else if (typeof item.medidas === 'string') {
                    medidaString = item.medidas;
                }
                const partes = medidaString ? medidaString.split(/x/i).map(s => parseFloat(s.trim())) : [0, 0];
                const safeRefs = Array.isArray(item.ref) ? item.ref.map(String) : [];
                const safeOems = Array.isArray(item.oem) ? item.oem.map(String) : [];
                const safeFmsis = Array.isArray(item.fmsi) ? item.fmsi.map(String) : [];
                const aplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
                return {
                    ...item,
                    aplicaciones,
                    _appId: index,
                    ref: safeRefs,
                    oem: safeOems,
                    fmsi: safeFmsis,
                    anchoNum: partes[0] || 0,
                    altoNum: partes[1] || 0
                };
            });
            data.sort((a, b) => getSortableRefNumber(a.ref) - getSortableRefNumber(b.ref));
            appState.data = data;
            const getAllApplicationValues = (key) => {
                const allValues = new Set();
                appState.data.forEach(item => {
                    item.aplicaciones.forEach(app => {
                        const prop = key === 'modelo' ? 'serie' : key;
                        if (app[prop]) allValues.add(String(app[prop]));
                    });
                });
                return [...allValues].sort();
            };
            fillDatalist(els.datalistMarca, getAllApplicationValues('marca'));
            fillDatalist(els.datalistModelo, getAllApplicationValues('modelo'));
            fillDatalist(els.datalistAnio, getAllApplicationValues('año'));
            const allOems = [...new Set(appState.data.flatMap(i => i.oem || []))].filter(Boolean).sort();
            const allFmsis = [...new Set(appState.data.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
            fillDatalist(els.datalistOem, allOems);
            fillDatalist(els.datalistFmsi, allFmsis);

            // ELIMINADO: Lógica de brandColorMap

            renderDynamicBrandTags(appState.data, false);

            // CRÍTICO: Configurar event listeners antes de filtrar
            setupEventListeners();
            applyFiltersFromURL();
            filterData();

            els.results.classList.remove('loading');

            // Actualizar contador de favoritos inicial
            updateFavoritesCounter();
        } catch (error) {
            console.error('Error al inicializar la app:', error);
            showGlobalError('Error al cargar datos', 'No se pudieron cargar las pastillas. Por favor, recarga la página.');
            els.results.classList.remove('loading');
        }
    }

    inicializarApp();
});