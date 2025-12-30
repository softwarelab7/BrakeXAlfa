import { Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/sidebar.css';


const Sidebar = () => {
    const filters = useAppStore(state => state.filters);
    const setSearchQuery = useAppStore(state => state.setSearchQuery);
    const setSelectedBrand = useAppStore(state => state.setSelectedBrand);
    const setSelectedModel = useAppStore(state => state.setSelectedModel);
    const setSelectedYear = useAppStore(state => state.setSelectedYear);
    const setSelectedPosition = useAppStore(state => state.setSelectedPosition);
    const setOemReference = useAppStore(state => state.setOemReference);
    const setFmsiReference = useAppStore(state => state.setFmsiReference);
    const setWidth = useAppStore(state => state.setWidth);
    const setHeight = useAppStore(state => state.setHeight);
    const clearFilters = useAppStore(state => state.clearFilters);

    const products = useAppStore(state => state.products);

    // Dynamically get brands from products
    const brands = Array.from(new Set(
        products.flatMap(p => p.aplicaciones.map(app => app.marca))
    )).sort();

    // Dynamically get models based on selected brand
    const models = filters.selectedBrand
        ? Array.from(new Set(
            products.flatMap(p =>
                p.aplicaciones
                    .filter(app => app.marca.toLowerCase() === filters.selectedBrand.toLowerCase())
                    .map(app => app.modelo)
            )
        )).sort()
        : [];

    // Dynamically get years based on selected model
    const years = (filters.selectedBrand && filters.selectedModel)
        ? Array.from(new Set(
            products.flatMap(p =>
                p.aplicaciones
                    .filter(app =>
                        app.marca.toLowerCase() === filters.selectedBrand.toLowerCase() &&
                        app.modelo.toLowerCase() === filters.selectedModel.toLowerCase()
                    )
                    .map(app => app.año)
            )
        )).filter(Boolean).sort((a, b) => parseInt(b || '0') - parseInt(a || '0'))
        : [];

    return (
        <aside className="sidebar">
            {/* Quick Search */}
            <div className="filter-section">
                <h3 className="filter-section-title">Búsqueda Rápida</h3>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Marca, Serie, Ref, OEM..."
                        value={filters.searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} className="search-icon" />
                </div>
            </div>



            {/* Vehicle Details */}
            <div className="filter-section">
                <h3 className="filter-section-title">Detalles del Vehículo</h3>
                <div className="vehicle-details-grid">
                    <select
                        className="filter-select"
                        value={filters.selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                        <option value="">Marca</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand.toLowerCase()}>{brand}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={filters.selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={!filters.selectedBrand}
                    >
                        <option value="">Modelo/Serie</option>
                        {models.map(model => (
                            <option key={model} value={model.toLowerCase()}>{model}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={filters.selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={!filters.selectedModel}
                    >
                        <option value="">Año</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>



            {/* Position */}
            <div className="filter-section">
                <h3 className="filter-section-title">Posición</h3>
                <div className="position-grid">
                    <button
                        className={`position-toggle-btn ${filters.selectedPosition === 'delantera' ? 'active' : ''}`}
                        onClick={() => setSelectedPosition(filters.selectedPosition === 'delantera' ? null : 'delantera')}
                    >
                        Delantera
                    </button>
                    <button
                        className={`position-toggle-btn ${filters.selectedPosition === 'trasera' ? 'active' : ''}`}
                        onClick={() => setSelectedPosition(filters.selectedPosition === 'trasera' ? null : 'trasera')}
                    >
                        Trasera
                    </button>
                </div>
            </div>



            {/* References */}
            <div className="filter-section">
                <h3 className="filter-section-title">Referencias</h3>
                <div className="references-grid">
                    <div className="ref-input-group">
                        <input
                            type="text"
                            className="ref-input"
                            placeholder="OEM"
                            value={filters.oemReference}
                            onChange={(e) => setOemReference(e.target.value)}
                        />
                    </div>
                    <div className="ref-input-group">
                        <input
                            type="text"
                            className="ref-input"
                            placeholder="FMSI"
                            value={filters.fmsiReference}
                            onChange={(e) => setFmsiReference(e.target.value)}
                        />
                    </div>
                </div>
            </div>



            {/* Measurements */}
            <div className="filter-section">
                <h3 className="filter-section-title">Medidas (mm)</h3>
                <div className="measurements-grid">
                    <input
                        type="number"
                        className="measure-input"
                        placeholder="Ancho"
                        value={filters.width}
                        onChange={(e) => setWidth(e.target.value)}
                    />
                    <input
                        type="number"
                        className="measure-input"
                        placeholder="Alto"
                        value={filters.height}
                        onChange={(e) => setHeight(e.target.value)}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-container">
                <button className="borrar-filtros-btn" onClick={clearFilters}>
                    <Trash2 size={18} />
                    BORRAR FILTROS
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
