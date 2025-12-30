// Product Types
export interface Product {
  id: string;
  referencia: string;
  ref: string[];
  oem: string[];
  fmsi: string[];
  fabricante: string;
  posicion: 'DELANTERA' | 'TRASERA' | 'AMBAS';
  imagenes: string[];
  aplicaciones: VehicleApplication[];
  medidas: {
    ancho: number;
    alto: number;
  };
}

export interface VehicleApplication {
  marca: string;
  modelo: string;
  año: string;
}

// Filter Types
export interface Filters {
  searchQuery: string;
  selectedBrand: string;
  selectedModel: string;
  selectedYear: string;
  selectedPosition: 'delantera' | 'trasera' | null;
  selectedBrandTags: string[];
  oemReference: string;
  fmsiReference: string;
  width: string;
  height: string;
  showFavoritesOnly: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark';

// Search History
export interface SearchHistory {
  id: string;
  timestamp: number;
  filters: Partial<Filters>;
  resultCount: number;
  summary: string;
}

// UI State
export interface UIState {
  currentPage: number;
  itemsPerPage: number;
  isCompareModalOpen: boolean;
  isHistoryModalOpen: boolean;
  isProductDetailModalOpen: boolean;
  isGuideModalOpen: boolean;
  selectedProductId: string | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'update' | 'data' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}
