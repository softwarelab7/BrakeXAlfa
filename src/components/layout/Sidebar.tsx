import { useMemo, useState, useEffect } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Product } from '../../types';
import AnimatedSearch from '../common/AnimatedSearch';
import '../../styles/sidebar.css';

const Sidebar = () => {
    const store = useAppStore();
    const { filters, products, filteredProducts } = store;

    // Local state for smooth typing
    const [localQuery, setLocalQuery] = useState(filters.searchQuery);
    const [localOem, setLocalOem] = useState(filters.oemReference);
    const [localFmsi, setLocalFmsi] = useState(filters.fmsiReference);
    const [localWidth, setLocalWidth] = useState(filters.width);
    const [localHeight, setLocalHeight] = useState(filters.height);

    // Sync local state when global filters are cleared
    useEffect(() => {
        setLocalQuery(filters.searchQuery);
        setLocalOem(filters.oemReference);
        setLocalFmsi(filters.fmsiReference);
        setLocalWidth(filters.width);
        setLocalHeight(filters.height);
    }, [filters.searchQuery, filters.oemReference, filters.fmsiReference, filters.width, filters.height]);

    // Debounce effects to update global store
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localQuery !== filters.searchQuery) store.setSearchQuery(localQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [localQuery, filters.searchQuery, store]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localOem !== filters.oemReference) {
                store.setOemReference(localOem);
                if (localOem && localQuery) setLocalQuery('');
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localOem, filters.oemReference, localQuery, store]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localFmsi !== filters.fmsiReference) {
                store.setFmsiReference(localFmsi);
                if (localFmsi && localQuery) setLocalQuery('');
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localFmsi, filters.fmsiReference, localQuery, store]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localWidth !== filters.width) store.setWidth(localWidth);
        }, 300);
        return () => clearTimeout(timer);
    }, [localWidth, filters.width, store]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localHeight !== filters.height) store.setHeight(localHeight);
        }, 300);
        return () => clearTimeout(timer);
    }, [localHeight, filters.height, store]);

    // Track when to add to history
    useEffect(() => {
        // Only record if filters are not empty
        const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
            if (key === 'showFavoritesOnly') return false;
            if (Array.isArray(value)) return value.length > 0;
            return !!value;
        });

        if (!hasActiveFilters) return;

        const timer = setTimeout(() => {
            // Generate summary
            const parts = [];
            if (filters.searchQuery) parts.push(filters.searchQuery);
            if (filters.selectedBrand) parts.push(filters.selectedBrand);
            if (filters.selectedModel) parts.push(filters.selectedModel);
            if (filters.selectedYear) parts.push(filters.selectedYear);
            if (filters.oemReference) parts.push(`OEM: ${filters.oemReference}`);
            if (filters.fmsiReference) parts.push(`FMSI: ${filters.fmsiReference}`);
            if (filters.width || filters.height) parts.push(`${filters.width || '?'}x${filters.height || '?'}`);

            const summary = parts.join(' • ') || 'Nueva Búsqueda';

            store.addToSearchHistory({
                timestamp: Date.now(),
                filters: { ...filters },
                resultCount: filteredProducts.length,
                summary
            });
        }, 1500); // 1.5s delay to "commit" to history

        return () => clearTimeout(timer);
    }, [filters, filteredProducts.length, store]);

    // Faceted logic
    const brands = useMemo(() => {
        const brandMap = new Map<string, number>();
        products.forEach((p: Product) => {
            if (p.aplicaciones && Array.isArray(p.aplicaciones)) {
                p.aplicaciones.forEach((app: any) => {
                    if (app && app.marca) {
                        brandMap.set(app.marca, (brandMap.get(app.marca) || 0) + 1);
                    }
                });
            }
        });
        return Array.from(brandMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [products]);

    const models = useMemo(() => {
        const modelMap = new Map<string, number>();
        products.forEach((p: Product) => {
            if (p.aplicaciones && Array.isArray(p.aplicaciones)) {
                p.aplicaciones.forEach((app: any) => {
                    if (app && app.modelo) {
                        modelMap.set(app.modelo, (modelMap.get(app.modelo) || 0) + 1);
                    }
                });
            }
        });
        return Array.from(modelMap.keys()).sort((a, b) => a.localeCompare(b));
    }, [products]);

    const years = useMemo(() => {
        const yearSet = new Set<string>();
        products.forEach((p: Product) => {
            if (p.aplicaciones && Array.isArray(p.aplicaciones)) {
                p.aplicaciones.forEach((app: any) => {
                    if (app && app.año) {
                        yearSet.add(String(app.año));
                    }
                });
            }
        });
        return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    }, [products]);

    const hasActiveFilters = filteredProducts.length !== products.length;

    return (
        <aside className="sidebar">
            <div className="filter-section">
                <div className="section-header">
                    <h3 className="filter-section-title">Búsqueda Rápida</h3>
                </div>
                <AnimatedSearch
                    value={localQuery}
                    onChange={setLocalQuery}
                    placeholder="Buscar..."
                />
            </div>

            <div className="filter-section">
                <div className="section-header">
                    <h3 className="filter-section-title">Detalles del Vehículo</h3>
                </div>
                <div className="vehicle-details-grid">
                    <div className={`searchable-filter ${filters.selectedBrand ? 'has-value' : ''}`}>
                        <input
                            list="brands-list"
                            className="filter-select"
                            placeholder="Marca"
                            value={filters.selectedBrand || ''}
                            onChange={(e) => {
                                store.setSelectedBrand(e.target.value);
                                if (e.target.value) setLocalQuery('');
                            }}
                        />
                        <datalist id="brands-list">
                            {brands.map(([name]) => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>

                    <div className={`searchable-filter ${filters.selectedModel ? 'has-value' : ''}`}>
                        <input
                            list="models-list"
                            className="filter-select"
                            placeholder="Modelo/Serie"
                            value={filters.selectedModel || ''}
                            onChange={(e) => {
                                store.setSelectedModel(e.target.value);
                                if (e.target.value) setLocalQuery('');
                            }}
                        />
                        <datalist id="models-list">
                            {models.map(name => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>

                    <div className={`searchable-filter ${filters.selectedYear ? 'has-value' : ''}`}>
                        <input
                            list="years-list"
                            className="filter-select"
                            placeholder="Año"
                            value={filters.selectedYear || ''}
                            onChange={(e) => {
                                store.setSelectedYear(e.target.value);
                                if (e.target.value) setLocalQuery('');
                            }}
                        />
                        <datalist id="years-list">
                            {years.map(year => (
                                <option key={year} value={year} />
                            ))}
                        </datalist>
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <div className="section-header">
                    <h3 className="filter-section-title">Posición</h3>
                </div>
                <div className="position-grid">
                    <button
                        className={`position-pill pill-blue ${filters.selectedPositions.includes('delantera') ? 'active' : ''
                            } ${filters.selectedPositions.includes('delantera') && filters.selectedPositions.includes('trasera') ? 'both-active' : ''
                            }`}
                        onClick={() => {
                            store.togglePosition('delantera');
                            setLocalQuery('');
                        }}
                    >
                        <span>Delantera</span>
                    </button>
                    <button
                        className={`position-pill pill-red ${filters.selectedPositions.includes('trasera') ? 'active' : ''
                            } ${filters.selectedPositions.includes('delantera') && filters.selectedPositions.includes('trasera') ? 'both-active' : ''
                            }`}
                        onClick={() => {
                            store.togglePosition('trasera');
                            setLocalQuery('');
                        }}
                    >
                        <span>Trasera</span>
                    </button>
                </div>
            </div>

            <div className="filter-section">
                <div className="section-header">
                    <h3 className="filter-section-title">Referencias</h3>
                </div>
                <div className="references-grid">
                    <div className={`ref-input-wrapper ${localOem ? 'has-value' : ''}`}>
                        <input
                            type="text"
                            className="ref-input"
                            placeholder="OEM"
                            value={localOem}
                            onChange={(e) => setLocalOem(e.target.value)}
                        />
                    </div>
                    <div className={`ref-input-wrapper ${localFmsi ? 'has-value' : ''}`}>
                        <input
                            type="text"
                            className="ref-input"
                            placeholder="FMSI"
                            value={localFmsi}
                            onChange={(e) => setLocalFmsi(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <div className="section-header">
                    <h3 className="filter-section-title">Medidas (mm)</h3>
                </div>
                <div className="measurements-grid">
                    <div className={`measure-input-wrapper ${localWidth ? 'has-value' : ''}`}>
                        <input
                            type="number"
                            className="measure-input"
                            placeholder="Ancho"
                            step="0.1"
                            value={localWidth}
                            onChange={(e) => setLocalWidth(e.target.value)}
                        />
                    </div>
                    <div className={`measure-input-wrapper ${localHeight ? 'has-value' : ''}`}>
                        <input
                            type="number"
                            className="measure-input"
                            placeholder="Alto"
                            step="0.1"
                            value={localHeight}
                            onChange={(e) => setLocalHeight(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="action-buttons-container">
                <button
                    className={`borrar-filtros-btn ${hasActiveFilters ? 'btn-active' : 'btn-disabled'}`}
                    onClick={() => {
                        store.clearFilters();
                        setLocalQuery('');
                        setLocalOem('');
                        setLocalFmsi('');
                        setLocalWidth('');
                        setLocalHeight('');
                    }}
                    disabled={!hasActiveFilters}
                >
                    {hasActiveFilters ? <Sparkles size={16} /> : <Trash2 size={16} />}
                    <span>{hasActiveFilters ? `LIMPIAR (${filteredProducts.length})` : 'SIN FILTROS'}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
