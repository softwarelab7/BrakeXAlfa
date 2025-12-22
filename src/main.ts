/// <reference path="types.ts" />
/// <reference path="utils.ts" />
/// <reference path="ui.ts" />
/// <reference path="state.ts" />

declare const firebase: any;
// Final cleanup of redundant declarations
declare var appState: any;


// Globals
var els: any = {};
(window as any).els = els;

// Firebase configuration
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

// Filter Logic
const FILTER_STRATEGIES: Record<string, (item: Product, value: any) => boolean> = {
    busqueda: (item, value) => {
        if (!value) return true;
        const searchTerm = normalizeText(value);
        if (item._searchableText && item._searchableText.includes(searchTerm)) return true;
        const searchableText = normalizeText([
            item.ref ? item.ref.join(' ') : '',
            item.oem ? item.oem.join(' ') : '',
            item.fmsi ? item.fmsi.join(' ') : '',
            item.wva || '',
            (item.aplicaciones || []).map(a => `${a.marca} ${a.modelo} ${a.año}`).join(' ')
        ].join(' '));
        item._searchableText = searchableText;
        return searchableText.includes(searchTerm);
    },
    marca: (item, value) => !value || (item.aplicaciones || []).some(app => normalizeText(app.marca || '').includes(normalizeText(value))),
    modelo: (item, value) => !value || (item.aplicaciones || []).some(app => normalizeText(app.modelo || '').includes(normalizeText(value))),
    anio: (item, value) => !value || (item.aplicaciones || []).some(app => String(app.año || '').includes(value)),
    oem: (item, value) => !value || (item.oem || []).some(o => normalizeText(o || '').includes(normalizeText(value))),
    fmsi: (item, value) => !value || (item.fmsi || []).some(f => normalizeText(f || '').includes(normalizeText(value))),
    ancho: (item, value) => !value || Math.abs((item.anchoNum || 0) - parseFloat(value)) <= 2,
    alto: (item, value) => !value || Math.abs((item.altoNum || 0) - parseFloat(value)) <= 2,
    pos: (item, activePositions) => {
        if (!activePositions || activePositions.length === 0) return true;
        const safeApps = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const globalPos = (item.posición || '').toLowerCase();
        const resolvedPositions = safeApps.map(a => {
            const p = (a.posicion || '').toLowerCase();
            return (p && p !== 'n/a') ? p : globalPos;
        }).filter(p => p && p !== 'n/a');
        const positionsToCheck = resolvedPositions.length ? resolvedPositions : [globalPos];
        return activePositions.some((filterPos: string) => {
            const filterLower = filterPos.toLowerCase();
            return positionsToCheck.some(p => p.includes(filterLower) || p.includes('ambas') || (p.includes('del') && p.includes('tras')));
        });
    },
    favorites: (item, isFavMode) => !isFavMode || appState.isFavorite(String(item._appId)),
    manufacturer: (item, value) => !value || (item.aplicaciones || []).some(app => normalizeText(app.marca) === normalizeText(value))
};

const getActiveFilters = (): FilterState => {
    return {
        busqueda: els.busqueda.value.trim(),
        marca: els.marca.value.trim(),
        modelo: els.modelo.value.trim(),
        anio: els.anio.value.trim(),
        oem: els.oem.value.trim(),
        fmsi: els.fmsi.value.trim(),
        ancho: els.medidasAncho.value ? parseFloat(els.medidasAncho.value) : null,
        alto: els.medidasAlto.value ? parseFloat(els.medidasAlto.value) : null,
        pos: getPositionFilter(),
        manufacturer: appState.activeManufacturer,
        favorites: appState.isFavoritesMode
    };
};

function filterData() {
    const filters = getActiveFilters();
    appState.filtered = appState.data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            return FILTER_STRATEGIES[key] ? FILTER_STRATEGIES[key](item, value) : true;
        });
    });

    // Sort priority
    if (filters.busqueda) {
        // Keep order
    } else {
        appState.filtered.sort((a, b) => {
            const getRefNum = (item: Product) => getSortableRefNumber(item.ref);
            return getRefNum(a) - getRefNum(b);
        });
    }

    if (filters.pos && filters.pos.length > 0) {
        // Custom sort for pos (implementation omitted for brevity, keeping simple sort)
    }

    // Update Dropdowns
    const uniqueBrands = Array.from(new Set(appState.filtered.flatMap((i: Product) => (i.aplicaciones || []).map(a => a.marca || '')))).sort() as string[];
    updateDropdown('listaMarcas', uniqueBrands);

    // Render
    appState.currentPage = 1;
    renderCurrentPage();
    renderDynamicBrandTags(appState.filtered, (filters.marca !== '' || filters.manufacturer !== null));
    updateURLWithFilters();

    // Save to history if search is valid
    if (filters.busqueda && filters.busqueda.length >= 3) {
        addToSearchHistory(filters.busqueda);
    }
}

function inicializarApp() {
    showSkeletonLoader();
    renderSearchHistory();
    els.searchHistoryCard.style.display = 'none';

    db.collection('pastillas').onSnapshot((snapshot: any) => {
        let isInitialLoad = appState.data.length === 0;
        let changesCount = 0;
        let addedItems: any[] = [];

        snapshot.docChanges().forEach((change: any) => {
            const docData = change.doc.data() as Product;
            const docId = change.doc.id;

            if (docData.imagen && (!docData.imagenes || docData.imagenes.length === 0)) {
                docData.imagenes = [
                    docData.imagen.replace("text=", `text=Vista+1+`),
                    docData.imagen.replace("text=", `text=Vista+2+`),
                    docData.imagen.replace("text=", `text=Vista+3+`)
                ];
            }

            const item: Product = {
                ...docData,
                _appId: docId,
                aplicaciones: Array.isArray(docData.aplicaciones) ? docData.aplicaciones : [],
                ref: Array.isArray(docData.ref) ? docData.ref : [],
                oem: Array.isArray(docData.oem) ? docData.oem : [],
                fmsi: Array.isArray(docData.fmsi) ? docData.fmsi : [],
                anchoNum: docData.anchoNum || 0,
                altoNum: docData.altoNum || 0
            };

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
                if (isInitialLoad) addedItems.push(item);
                else {
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

        if (isInitialLoad && addedItems.length > 0) {
            const recentItems = addedItems.slice(-25).reverse();
            recentItems.forEach(item => {
                const refName = Array.isArray(item.ref) && item.ref.length > 0 ? item.ref[0] : 'Desconocida';
                appState.addNotification("Referencia en catálogo", `${refName}`);
            });
        }

        if (isInitialLoad || changesCount > 0) {
            filterData();
            renderDynamicBrandTags(appState.data, false);
        }
    }, (error: any) => {
        console.error("Error obteniendo datos en tiempo real:", error);
        showGlobalError("Error de Conexión", "No se pudieron cargar los datos. Intenta recargar la página.");
    });

    setupEventListeners();
    setupComparisonModal();
}

function setupEventListeners() {
    // No sparks animation as requested
    // [els.darkBtn, els.upBtn, els.orbitalBtn, els.clearBtn].forEach(btn => btn?.addEventListener('click', (e: MouseEvent) => createSparks(e.currentTarget as HTMLElement)));

    const debouncedFilter = debounce(filterData, 300);

    els.busqueda.addEventListener('input', (e: any) => {
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

    els.filtroFavoritosBtn.addEventListener('click', () => {
        appState.isFavoritesMode = !appState.isFavoritesMode;
        els.filtroFavoritosBtn.classList.toggle('active', appState.isFavoritesMode);
        els.filtroFavoritosBtn.setAttribute('aria-pressed', appState.isFavoritesMode ? 'true' : 'false');
        filterData();
    });

    els.historialBtn.addEventListener('click', () => {
        const isVisible = els.searchHistoryCard.style.display !== 'none';
        els.searchHistoryCard.style.display = isVisible ? 'none' : 'block';
        els.historialBtn.classList.toggle('active', !isVisible);
    });

    els.compareBtn.addEventListener('click', () => {
        renderComparisonView();
        const modal = document.getElementById('comparisonModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    });

    els.clearBtn.addEventListener('click', () => {
        // Clear logic
        [els.busqueda, els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input => input.value = '');
        els.posDel.classList.remove('active');
        els.posTras.classList.remove('active');
        if (els.manufacturerTagsContainer) els.manufacturerTagsContainer.querySelectorAll('.brand-tag.active').forEach((el: Element) => el.classList.remove('active'));
        appState.activeManufacturer = null;
        appState.isFavoritesMode = false;
        els.filtroFavoritosBtn.classList.remove('active');
        els.filtroFavoritosBtn.setAttribute('aria-pressed', 'false');
        filterData();
    });

    els.results.addEventListener('click', handleCardClick);

    // Pagination clicks (delegated)
    els.paginationContainer.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const btn = target ? target.closest('.page-btn') as HTMLButtonElement : null;
        if (!btn || btn.disabled || btn.classList.contains('active')) return;
        const newPage = parseInt(btn.dataset.page || '0');
        if (newPage) {
            appState.currentPage = newPage;
            renderCurrentPage();
            els.resultsHeaderCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // History items clicks (delegated)
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target) return;
        const deleteBtn = target.closest('.delete-history-item') as HTMLElement;
        if (deleteBtn) {
            e.stopPropagation();
            deleteFromSearchHistory(deleteBtn.dataset.queryDelete || '');
        } else {
            const historyItem = target.closest('.search-history-item') as HTMLElement;
            if (historyItem) {
                const query = historyItem.dataset.query || '';
                els.busqueda.value = query;
                addToSearchHistory(query);
                filterData();
                els.busqueda.focus();
            }
        }
    });

    // Modal Close Listeners
    els.modalCloseBtn?.addEventListener('click', closeModal);
    els.guideModalCloseBtn?.addEventListener('click', closeGuideModal);

    // Close on backdrop click
    els.modal?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === els.modal) closeModal();
    });
    els.guideModal?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === els.guideModal) closeGuideModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (els.modal?.style.display === 'flex') closeModal();
            if (els.guideModal?.style.display === 'flex') closeGuideModal();
            if (els.notificationsPanel && !els.notificationsPanel.classList.contains('hidden')) {
                els.notificationsPanel.classList.add('hidden');
            }
        }
    });
}

function setupNotifications() {
    console.log("Setting up notifications panel listeners...");
    if (!els.notificacionesBtn) {
        console.error("notificacionesBtn not found in DOM");
        return;
    }

    els.notificacionesBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        console.log("Notification button clicked, toggling panel");
        els.notificationsPanel?.classList.toggle('hidden');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
        if (els.notificationsPanel && !els.notificationsPanel.contains(e.target as Node) && e.target !== els.notificacionesBtn) {
            els.notificationsPanel.classList.add('hidden');
        }
    });

    els.markAllReadBtn?.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        appState.markAllAsRead();
    });

    els.deleteAllNotifsBtn?.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        if (confirm("¿Borrar todas las notificaciones?")) {
            appState.deleteAllNotifications();
        }
    });

    // Event delegation for notification items
    els.notificationsList?.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const markReadBtn = target.closest('.mark-read') as HTMLElement;
        const deleteBtn = target.closest('.delete') as HTMLElement;
        const notifItem = target.closest('.notif-item') as HTMLElement;

        if (markReadBtn) {
            e.stopPropagation();
            const id = parseInt(markReadBtn.closest('.notif-item')?.getAttribute('data-notif-id') || '0');
            console.log("Marking notification as read:", id);
            if (id) appState.markAsRead(id);
        } else if (deleteBtn) {
            e.stopPropagation();
            const id = parseInt(deleteBtn.closest('.notif-item')?.getAttribute('data-notif-id') || '0');
            console.log("Deleting notification:", id);
            if (id) appState.deleteNotification(id);
        } else if (notifItem) {
            const productId = notifItem.dataset.productId;
            if (productId) {
                console.log("Opening product from notification:", productId);
                const product = appState.data.find((p: Product) => p._appId === productId);
                if (product) openModal(product);
            }
            const id = parseInt(notifItem.getAttribute('data-notif-id') || '0');
            if (id) appState.markAsRead(id);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    els.body = document.body;
    els.headerX = document.querySelector('.header-x');
    els.darkBtn = document.getElementById('darkBtn');
    els.sunIcon = document.querySelector('.lp-icon-sun');
    els.moonIcon = document.querySelector('.lp-icon-moon');
    els.orbitalBtn = document.getElementById('orbitalBtn');
    els.busqueda = document.getElementById('busquedaRapida');
    els.searchContainer = document.getElementById('searchContainer');
    els.searchHistoryContainer = document.getElementById('searchHistoryContainer');
    els.searchHistoryCard = document.getElementById('searchHistoryCard');
    els.marca = document.getElementById('filtroMarca');
    els.modelo = document.getElementById('filtroModelo');
    els.anio = document.getElementById('filtroAnio');
    els.oem = document.getElementById('filtroOem');
    els.fmsi = document.getElementById('filtroFmsi');
    els.medidasAncho = document.getElementById('medidasAncho');
    els.medidasAlto = document.getElementById('medidasAlto');
    els.posDel = document.getElementById('positionDelantera');
    els.posTras = document.getElementById('positionTrasera');
    els.filtroFavoritosBtn = document.getElementById('filtroFavoritosBtn');
    els.historialBtn = document.getElementById('historialBtn');
    els.compareBtn = document.getElementById('compareBtn');
    els.clearBtn = document.getElementById('clearFiltersBtn');
    els.results = document.getElementById('results-container');
    els.resultsHeaderCard = document.querySelector('.results-header-card'); // Verify selector
    els.countContainer = document.getElementById('result-count-container');
    els.paginationContainer = document.getElementById('pagination-container');
    els.brandTagsContainer = document.getElementById('brandTagsContainer');
    els.manufacturerTagsContainer = document.getElementById('manufacturerTagsContainer');
    els.upBtn = document.getElementById('upBtn');
    els.notificacionesBtn = document.getElementById('notificacionesBtn');
    els.notificationsPanel = document.getElementById('notificationsPanel');
    els.notificationsList = document.getElementById('notificationsList');
    els.notificationBadge = document.getElementById('notificationBadge');
    els.markAllReadBtn = document.getElementById('markNotificationsReadBtn');
    els.deleteAllNotifsBtn = document.getElementById('deleteAllNotificationsBtn');

    // Modales
    els.modal = document.getElementById('card-modal');
    els.modalContent = els.modal?.querySelector('.modal-content');
    els.modalDetailsContent = document.getElementById('modalDetailsContent');
    els.modalDetailsWrapper = document.getElementById('modalDetailsWrapper');
    els.modalRef = document.getElementById('modal-title');
    els.modalPosition = els.modal?.querySelector('.modal-position');
    els.modalCarousel = els.modal?.querySelector('.modal-image-carousel');
    els.modalCounterWrapper = document.getElementById('modalCounterWrapper');
    els.modalAppsSpecs = els.modal?.querySelector('.modal-apps-specs');
    els.modalCloseBtn = els.modal?.querySelector('.modal-close-btn');

    els.guideModal = document.getElementById('guide-modal');
    els.guideModalContent = els.guideModal?.querySelector('.modal-content');
    els.guideModalCloseBtn = els.guideModal?.querySelector('.modal-close-btn');

    appState = new AppState();
    (window as any).appState = appState;
    (window as any).toggleComparisonGlobally = (id: string) => appState.toggleComparison(id);

    // --- Theme Management ---
    const applyLightTheme = () => {
        console.log("Applying Light Theme");
        els.body.classList.remove('lp-dark', 'modo-orbital');
        if (els.darkBtn) {
            els.darkBtn.setAttribute('aria-pressed', 'false');
            els.darkBtn.setAttribute('aria-label', 'Activar modo oscuro');
        }
        if (els.sunIcon) els.sunIcon.style.opacity = '1';
        if (els.moonIcon) els.moonIcon.style.opacity = '0';
        if (els.orbitalBtn) {
            els.orbitalBtn.classList.remove('active');
            els.orbitalBtn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('themePreference', 'light');
    };

    const applyAmoledDarkTheme = () => {
        console.log("Applying Amoled Dark Theme");
        els.body.classList.add('lp-dark');
        els.body.classList.remove('modo-orbital');
        if (els.darkBtn) {
            els.darkBtn.setAttribute('aria-pressed', 'true');
            els.darkBtn.setAttribute('aria-label', 'Activar modo claro');
        }
        if (els.sunIcon) els.sunIcon.style.opacity = '0';
        if (els.moonIcon) els.moonIcon.style.opacity = '1';
        if (els.orbitalBtn) {
            els.orbitalBtn.classList.remove('active');
            els.orbitalBtn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('themePreference', 'dark');
    };

    const applyOrbitalTheme = () => {
        console.log("Applying Orbital Theme");
        els.body.classList.add('modo-orbital');
        els.body.classList.remove('lp-dark');
        if (els.darkBtn) {
            els.darkBtn.setAttribute('aria-pressed', 'false');
            els.darkBtn.setAttribute('aria-label', 'Activar modo claro');
        }
        if (els.sunIcon) els.sunIcon.style.opacity = '1';
        if (els.moonIcon) els.moonIcon.style.opacity = '0';
        if (els.orbitalBtn) {
            els.orbitalBtn.classList.add('active');
            els.orbitalBtn.setAttribute('aria-pressed', 'true');
        }
        localStorage.setItem('themePreference', 'orbital');
    };

    const initializeTheme = () => {
        console.log("Initializing Theme Logic");
        if (els.darkBtn) {
            els.darkBtn.addEventListener('click', () => {
                console.log("Dark button clicked");
                if (els.headerX) {
                    els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if (els.headerX) els.headerX.style.animation = ''; }, 600);
                }
                if (els.body.classList.contains('modo-orbital') || els.body.classList.contains('lp-dark')) {
                    applyLightTheme();
                } else {
                    applyAmoledDarkTheme();
                }
            });
        }

        if (els.orbitalBtn) {
            els.orbitalBtn.addEventListener('click', () => {
                console.log("Orbital button clicked");
                if (els.headerX) {
                    els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if (els.headerX) els.headerX.style.animation = ''; }, 600);
                }
                if (els.body.classList.contains('modo-orbital')) {
                    applyLightTheme();
                } else {
                    applyOrbitalTheme();
                }
            });
        }

        const savedTheme = localStorage.getItem('themePreference');
        console.log("Saved theme preference:", savedTheme);
        switch (savedTheme) {
            case 'orbital': applyOrbitalTheme(); break;
            case 'dark': applyAmoledDarkTheme(); break;
            default: applyLightTheme();
        }
    };

    // Initialize theme BEFORE app data/filters to ensure it works even if Firestore fails
    initializeTheme();

    try {
        inicializarApp();
        setupNotifications();
    } catch (e) {
        console.error("Error in inicializarApp:", e);
    }

    // Apply URL filters
    try {
        applyFiltersFromURL();
    } catch (e) {
        console.error("Error in applyFiltersFromURL:", e);
    }
});

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
    if (els.posDel) els.posDel.classList.toggle('active', Boolean(posParam?.includes('Delantera')));
    if (els.posTras) els.posTras.classList.toggle('active', Boolean(posParam?.includes('Trasera')));
    const isFavMode = params.get('favorites') === 'true';
    appState.isFavoritesMode = isFavMode;
    if (els.filtroFavoritosBtn) {
        els.filtroFavoritosBtn.classList.toggle('active', isFavMode);
        els.filtroFavoritosBtn.setAttribute('aria-pressed', isFavMode ? 'true' : 'false');
    }
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
