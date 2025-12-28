import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Filters, Theme, SearchHistory, UIState } from '../types';

interface AppState {
    // Products
    products: Product[];
    filteredProducts: Product[];

    // Filters
    filters: Filters;

    // Collections
    favorites: string[]; // product IDs
    comparisons: string[]; // product IDs (max 4)
    searchHistory: SearchHistory[];

    // UI
    theme: Theme;
    ui: UIState;
    notificationMessage: string | null;
    pwaUpdateAvailable: boolean;

    // Product Actions
    setProducts: (products: Product[]) => void;
    setFilteredProducts: (products: Product[]) => void;
    setNotificationMessage: (message: string | null) => void;
    setPwaUpdateAvailable: (available: boolean) => void;

    // Filter Actions
    setSearchQuery: (query: string) => void;
    setSelectedBrand: (brand: string) => void;
    setSelectedModel: (model: string) => void;
    setSelectedYear: (year: string) => void;
    setSelectedPosition: (position: 'delantera' | 'trasera' | null) => void;
    toggleBrandTag: (brand: string) => void;
    setOemReference: (ref: string) => void;
    setFmsiReference: (ref: string) => void;
    setWidth: (width: string) => void;
    setHeight: (height: string) => void;
    clearFilters: () => void;

    // Collection Actions
    toggleFavorite: (id: string) => void;
    toggleComparison: (id: string) => void;
    addToSearchHistory: (entry: Omit<SearchHistory, 'id'>) => void;
    clearSearchHistory: () => void;

    // Theme Actions
    setTheme: (theme: Theme) => void;

    // UI Actions
    setCurrentPage: (page: number) => void;
    openCompareModal: () => void;
    closeCompareModal: () => void;
    openFavoritesModal: () => void;
    closeFavoritesModal: () => void;
    openHistoryModal: () => void;
    closeHistoryModal: () => void;
    openProductDetailModal: (productId: string) => void;
    closeProductDetailModal: () => void;
    addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;

    // Notification Panel
    isNotificationPanelOpen: boolean;
    toggleNotificationPanel: () => void;
    closeNotificationPanel: () => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAllNotifications: () => void;
}

const applyFilters = (products: Product[], filters: Filters): Product[] => {
    if (!products.length) return [];

    return products.filter((product) => {
        // Search query filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesRef = (product.referencia || '').toLowerCase().includes(query);
            const matchesRefs = (product.ref || []).some((ref) =>
                (ref || '').toLowerCase().includes(query)
            );
            const matchesOem = (product.oem || []).some((oem) =>
                (oem || '').toLowerCase().includes(query)
            );
            const matchesFmsi = (product.fmsi || []).some((fmsi) =>
                (fmsi || '').toLowerCase().includes(query)
            );

            if (!matchesRef && !matchesRefs && !matchesOem && !matchesFmsi) {
                return false;
            }
        }

        // Position filter
        if (filters.selectedPosition) {
            const position = filters.selectedPosition.toUpperCase();
            if (product.posicion !== position && product.posicion !== 'AMBAS') {
                return false;
            }
        }

        // Vehicle details filter (Brand/Model/Year)
        if (filters.selectedBrand) {
            const hasBrand = product.aplicaciones.some(app =>
                app.marca.toLowerCase() === filters.selectedBrand.toLowerCase()
            );
            if (!hasBrand) return false;

            if (filters.selectedModel) {
                const hasModel = product.aplicaciones.some(app =>
                    app.marca.toLowerCase() === filters.selectedBrand.toLowerCase() &&
                    app.modelo.toLowerCase() === filters.selectedModel.toLowerCase()
                );
                if (!hasModel) return false;

                if (filters.selectedYear) {
                    const hasYear = product.aplicaciones.some(app =>
                        app.marca.toLowerCase() === filters.selectedBrand.toLowerCase() &&
                        app.modelo.toLowerCase() === filters.selectedModel.toLowerCase() &&
                        app.año === filters.selectedYear
                    );
                    if (!hasYear) return false;
                }
            }
        }

        // Brand tags filter
        if (filters.selectedBrandTags.length > 0) {
            const hasMatchingBrand = product.aplicaciones.some((app) =>
                filters.selectedBrandTags.some(
                    (tag) => tag.toLowerCase() === app.marca.toLowerCase()
                )
            );
            if (!hasMatchingBrand) return false;
        }

        // OEM reference filter
        if (filters.oemReference) {
            const matchesOem = (product.oem || []).some((oem) =>
                (oem || '').toLowerCase().includes(filters.oemReference.toLowerCase())
            );
            if (!matchesOem) return false;
        }

        // FMSI reference filter
        if (filters.fmsiReference) {
            const matchesFmsi = (product.fmsi || []).some((fmsi) =>
                (fmsi || '').toLowerCase().includes(filters.fmsiReference.toLowerCase())
            );
            if (!matchesFmsi) return false;
        }

        // Width filter
        if (filters.width) {
            const width = parseFloat(filters.width);
            if (product.medidas.ancho !== width) return false;
        }

        // Height filter
        if (filters.height) {
            const height = parseFloat(filters.height);
            if (product.medidas.alto !== height) return false;
        }

        return true;
    });
};

const initialFilters: Filters = {
    searchQuery: '',
    selectedBrand: '',
    selectedModel: '',
    selectedYear: '',
    selectedPosition: null,
    selectedBrandTags: [],
    oemReference: '',
    fmsiReference: '',
    width: '',
    height: '',
};

const initialUIState: UIState = {
    currentPage: 1,
    itemsPerPage: 24,
    isCompareModalOpen: false,
    isFavoritesModalOpen: false,
    isHistoryModalOpen: false,
    isProductDetailModalOpen: false,
    selectedProductId: null,
    notifications: [],
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial State
            products: [],
            filteredProducts: [],
            filters: initialFilters,
            favorites: [],
            comparisons: [],
            searchHistory: [],
            theme: 'dark',
            ui: initialUIState,
            isNotificationPanelOpen: false,
            toggleNotificationPanel: () => set((state) => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
            closeNotificationPanel: () => set({ isNotificationPanelOpen: false }),

            notificationMessage: null,
            pwaUpdateAvailable: false,

            // Product Actions
            setProducts: (products) => set({
                products,
                filteredProducts: applyFilters(products, get().filters)
            }),
            setFilteredProducts: (filteredProducts) => set({ filteredProducts }),
            setNotificationMessage: (message) => set({ notificationMessage: message }),
            setPwaUpdateAvailable: (available) => set({ pwaUpdateAvailable: available }),

            // Filter Actions
            setSearchQuery: (query) =>
                set((state) => {
                    const newFilters = { ...state.filters, searchQuery: query };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedBrand: (brand) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedBrand: brand, selectedModel: '', selectedYear: '' };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedModel: (model) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedModel: model, selectedYear: '' };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedYear: (year) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedYear: year };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedPosition: (position) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedPosition: position };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            toggleBrandTag: (brand) =>
                set((state) => {
                    const tags = state.filters.selectedBrandTags;
                    const newTags = tags.includes(brand)
                        ? tags.filter((b) => b !== brand)
                        : [...tags, brand];
                    const newFilters = { ...state.filters, selectedBrandTags: newTags };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setOemReference: (ref) =>
                set((state) => {
                    const newFilters = { ...state.filters, oemReference: ref };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setFmsiReference: (ref) =>
                set((state) => {
                    const newFilters = { ...state.filters, fmsiReference: ref };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setWidth: (width) =>
                set((state) => {
                    const newFilters = { ...state.filters, width };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setHeight: (height) =>
                set((state) => {
                    const newFilters = { ...state.filters, height };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            clearFilters: () =>
                set((state) => ({
                    filters: initialFilters,
                    filteredProducts: state.products, // Reset to all products when filters are cleared
                    ui: { ...state.ui, currentPage: 1 },
                })),

            // Collection Actions
            toggleFavorite: (id) =>
                set((state) => {
                    const favorites = state.favorites.includes(id)
                        ? state.favorites.filter((fav) => fav !== id)
                        : [...state.favorites, id];
                    return { favorites };
                }),

            toggleComparison: (id) =>
                set((state) => {
                    const comparisons = state.comparisons.includes(id)
                        ? state.comparisons.filter((comp) => comp !== id)
                        : state.comparisons.length < 4
                            ? [...state.comparisons, id]
                            : state.comparisons;

                    // Show notification if max reached
                    if (state.comparisons.length >= 4 && !state.comparisons.includes(id)) {
                        const notification = {
                            type: 'system' as const,
                            title: 'Límite de comparación',
                            message: 'Máximo 4 productos para comparar',
                        };
                        get().addNotification(notification);
                    }

                    return { comparisons };
                }),

            addToSearchHistory: (entry) =>
                set((state) => {
                    const newEntry: SearchHistory = {
                        ...entry,
                        id: Date.now().toString(),
                    };
                    // Keep only last 10 searches
                    const history = [newEntry, ...state.searchHistory].slice(0, 10);
                    return { searchHistory: history };
                }),

            clearSearchHistory: () => set({ searchHistory: [] }),

            // Theme Actions
            setTheme: (theme) => {
                set({ theme });
                // Apply theme to document
                document.documentElement.setAttribute('data-theme', theme);
            },

            // UI Actions
            setCurrentPage: (page) =>
                set((state) => ({
                    ui: { ...state.ui, currentPage: page },
                })),

            openCompareModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isCompareModalOpen: true },
                })),

            closeCompareModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isCompareModalOpen: false },
                })),

            openFavoritesModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isFavoritesModalOpen: true },
                })),

            closeFavoritesModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isFavoritesModalOpen: false },
                })),

            openHistoryModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isHistoryModalOpen: true },
                })),

            closeHistoryModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isHistoryModalOpen: false },
                })),

            openProductDetailModal: (productId) =>
                set((state) => ({
                    ui: {
                        ...state.ui,
                        isProductDetailModalOpen: true,
                        selectedProductId: productId,
                    },
                })),

            closeProductDetailModal: () =>
                set((state) => ({
                    ui: {
                        ...state.ui,
                        isProductDetailModalOpen: false,
                        selectedProductId: null,
                    },
                })),

            addNotification: (notification) =>
                set((state) => {
                    const newNotification = {
                        ...notification,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        timestamp: Date.now(),
                        read: false,
                    };
                    // Keep only last 50 notifications
                    const notifications = [newNotification, ...state.ui.notifications].slice(0, 50);
                    return {
                        ui: {
                            ...state.ui,
                            notifications,
                        },
                    };
                }),

            removeNotification: (id) =>
                set((state) => ({
                    ui: {
                        ...state.ui,
                        notifications: state.ui.notifications.filter((n) => n.id !== id),
                    },
                })),

            markAsRead: (id) =>
                set((state) => ({
                    ui: {
                        ...state.ui,
                        notifications: state.ui.notifications.map((n) =>
                            n.id === id ? { ...n, read: true } : n
                        ),
                    },
                })),

            clearAllNotifications: () =>
                set((state) => ({
                    ui: {
                        ...state.ui,
                        notifications: [],
                    },
                })),
        }),
        {
            name: 'brake-x-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                comparisons: state.comparisons,
                searchHistory: state.searchHistory,
                theme: state.theme,
                // Do not persist notifications to start fresh, or persist if desired. 
                // Given user request for "system", usually persist is good but maybe not for high volume.
                // Assuming not persisting ui.notifications is safer for now or let it be (it's not listed in partialize).
            }),
        }
    )
);
