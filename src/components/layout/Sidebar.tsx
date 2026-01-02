import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
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

    const clearFilters = () => {
        store.clearFilters();
        setLocalQuery('');
        setLocalOem('');
        setLocalFmsi('');
        setLocalWidth('');
        setLocalHeight('');
    };

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

            <StyledWrapper>
                <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className={!hasActiveFilters ? 'disabled' : ''}
                >
                    BORRAR FILTROS
                    <span />
                </button>
            </StyledWrapper>
        </aside>
    );
};

export default Sidebar;

const StyledWrapper = styled.div`
  margin-top: 1rem; /* Lower the button */

  button {
    border: none;
    display: block;
    position: relative;
    padding: 0.65em 2em; /* Slightly taller */
    font-size: 13px;
    background: transparent;
    cursor: pointer;
    user-select: none;
    overflow: hidden;
    color: var(--color-danger);
    z-index: 1;
    font-family: inherit;
    font-weight: 700;
    border-radius: 50px;
    width: 100%;
  }

  button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
    pointer-events: none;
  }

  button span {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    z-index: -1;
    border: 3px solid var(--color-danger);
    border-radius: 50px;
  }

  button span::before {
    content: "";
    display: block;
    position: absolute;
    width: 20%; /* Increased from 8% for a bolder diagonal/better coverage start */
    height: 2000%; /* Increased drastically from 500% to ensure it covers the entire button width when rotated */
    background: var(--bg-primary);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-60deg);
    transition: transform 0.6s cubic-bezier(0.3, 1, 0.2, 1), background 0.6s ease; /* Added bezier for smoother feel */
  }

  button:hover:not(.disabled) span::before {
    transform: translate(-50%, -50%) rotate(-90deg);
    width: 100%;
    background: var(--color-danger);
  }

  button:hover:not(.disabled) {
    color: white;
  }

  button:active:not(.disabled) span::before {
    background: #dc2626; /* Darker red */
  }
`;
