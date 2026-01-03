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
    togglePosition: (position: string) => void;
    toggleBrandTag: (brand: string) => void;
    setOemReference: (ref: string) => void;
    setFmsiReference: (ref: string) => void;
    setWidth: (width: string) => void;
    setHeight: (height: string) => void;
    toggleShowFavoritesOnly: () => void;
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
    setItemsPerPage: (count: number) => void;
    setGridDensity: (density: 'compact' | 'normal' | 'comfortable') => void;
    openCompareModal: () => void;
    closeCompareModal: () => void;
    openHistoryPanel: () => void;
    closeHistoryPanel: () => void;
    openProductDetailModal: (productId: string) => void;
    closeProductDetailModal: () => void;
    openGuideModal: () => void;
    closeGuideModal: () => void;
    addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;

    // Notification Panel
    isNotificationPanelOpen: boolean;
    toggleNotificationPanel: () => void;
    closeNotificationPanel: () => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAllNotifications: () => void;
}

import { FILTER_STRATEGIES, getSortableRefNumber } from '../utils/search';

const applyFilters = (products: Product[], filters: Filters, favorites: string[]): Product[] => {
    if (!products || !Array.isArray(products) || !products.length) return [];
    if (!filters) return products;

    const filtered = products.filter((product) => {
        return Object.entries(filters).every(([key, value]) => {
            // Map store filter keys to strategy keys if needed, or ensure they match
            // Using direct mapping based on the provided strategy implementation
            const strategy = FILTER_STRATEGIES[key];
            if (strategy) {
                // Pass context (favorites) for strategies that need it
                return strategy(product, value, { favorites });
            }
            return true;
        });
    });

    // Sort by reference number if no search query is active
    if (!filters.searchQuery) {
        filtered.sort((a, b) => {
            return getSortableRefNumber(a.ref) - getSortableRefNumber(b.ref);
        });
    }

    return filtered;
};

const initialFilters: Filters = {
    searchQuery: '',
    selectedBrand: '',
    selectedModel: '',
    selectedYear: '',
    selectedPositions: [],
    selectedBrandTags: [],
    oemReference: '',
    fmsiReference: '',
    width: '',
    height: '',
    showFavoritesOnly: false,
};

const initialUIState: UIState = {
    currentPage: 1,
    itemsPerPage: 24,
    gridDensity: 'normal',
    isCompareModalOpen: false,
    isHistoryPanelOpen: false,
    isProductDetailModalOpen: false,
    isGuideModalOpen: false,
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
                filteredProducts: applyFilters(products, get().filters, get().favorites)
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
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedBrand: (brand) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedBrand: brand };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedModel: (model) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedModel: model };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setSelectedYear: (year) =>
                set((state) => {
                    const newFilters = { ...state.filters, selectedYear: year };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            togglePosition: (position) =>
                set((state) => {
                    const currentPositions = state.filters.selectedPositions || [];
                    const isSelected = currentPositions.includes(position);
                    const newPositions = isSelected
                        ? currentPositions.filter(p => p !== position)
                        : [...currentPositions, position];

                    console.log('🔄 Toggle Position:', {
                        clicked: position,
                        before: currentPositions,
                        after: newPositions
                    });

                    const newFilters = { ...state.filters, selectedPositions: newPositions };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
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
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setOemReference: (ref) =>
                set((state) => {
                    const newFilters = { ...state.filters, oemReference: ref };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setFmsiReference: (ref) =>
                set((state) => {
                    const newFilters = { ...state.filters, fmsiReference: ref };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setWidth: (width) =>
                set((state) => {
                    const newFilters = { ...state.filters, width };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            setHeight: (height) =>
                set((state) => {
                    const newFilters = { ...state.filters, height };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            toggleShowFavoritesOnly: () =>
                set((state) => {
                    const newFilters = { ...state.filters, showFavoritesOnly: !state.filters.showFavoritesOnly };
                    return {
                        filters: newFilters,
                        filteredProducts: applyFilters(state.products, newFilters, state.favorites),
                        ui: { ...state.ui, currentPage: 1 }
                    };
                }),

            clearFilters: () =>
                set((state) => ({
                    filters: initialFilters,
                    filteredProducts: applyFilters(state.products, initialFilters, state.favorites),
                    ui: { ...state.ui, currentPage: 1 },
                })),

            // Collection Actions
            toggleFavorite: (id) =>
                set((state) => {
                    const favorites = state.favorites.includes(id)
                        ? state.favorites.filter((fav) => fav !== id)
                        : [...state.favorites, id];

                    // If we're filtering by favorites, we need to re-apply the filter
                    const filteredProducts = state.filters.showFavoritesOnly
                        ? applyFilters(state.products, state.filters, favorites)
                        : state.filteredProducts;

                    return { favorites, filteredProducts };
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

            setItemsPerPage: (itemsPerPage) =>
                set((state) => ({
                    ui: { ...state.ui, itemsPerPage, currentPage: 1 },
                })),

            setGridDensity: (gridDensity) =>
                set((state) => ({
                    ui: { ...state.ui, gridDensity },
                })),

            openCompareModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isCompareModalOpen: true },
                })),

            closeCompareModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isCompareModalOpen: false },
                })),

            openHistoryPanel: () =>
                set((state) => ({
                    ui: { ...state.ui, isHistoryPanelOpen: true },
                })),

            closeHistoryPanel: () =>
                set((state) => ({
                    ui: { ...state.ui, isHistoryPanelOpen: false },
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

            openGuideModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isGuideModalOpen: true },
                })),

            closeGuideModal: () =>
                set((state) => ({
                    ui: { ...state.ui, isGuideModalOpen: false },
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
                itemsPerPage: state.ui.itemsPerPage,
                gridDensity: state.ui.gridDensity,
                // Do not persist notifications to start fresh, or persist if desired. 
                // Given user request for "system", usually persist is good but maybe not for high volume.
                // Assuming not persisting ui.notifications is safer for now or let it be (it's not listed in partialize).
            }),
        }
    )
);
