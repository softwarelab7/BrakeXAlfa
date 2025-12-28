import { Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/sidebar.css';

// Brand list
const BRANDS = [
    'Mg', 'Ram', 'Acura', 'Jetour', 'Chevrolet', 'Nissan', 'Hyundai',
    'Kia', 'Ford', 'Toyota', 'Honda', 'Mazda', 'Volkswagen', 'Renault',
    'Fiat', 'Peugeot', 'Citroën'
];

const Sidebar = () => {
    const filters = useAppStore(state => state.filters);
    const setSearchQuery = useAppStore(state => state.setSearchQuery);
    const setSelectedBrand = useAppStore(state => state.setSelectedBrand);
    const setSelectedModel = useAppStore(state => state.setSelectedModel);
    const setSelectedYear = useAppStore(state => state.setSelectedYear);
    const setSelectedPosition = useAppStore(state => state.setSelectedPosition);
    const toggleBrandTag = useAppStore(state => state.toggleBrandTag);
    const setOemReference = useAppStore(state => state.setOemReference);
    const setFmsiReference = useAppStore(state => state.setFmsiReference);
    const setWidth = useAppStore(state => state.setWidth);
    const setHeight = useAppStore(state => state.setHeight);
    const clearFilters = useAppStore(state => state.clearFilters);

    return (
        <aside className="sidebar">
            {/* Quick Search */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Búsqueda Rápida</h3>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por referencia..."
                        value={filters.searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} className="search-icon" />
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Vehicle Details */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Detalles del Vehículo</h3>

                <div>
                    <label htmlFor="brand-select" className="sr-only">Marca</label>
                    <select
                        id="brand-select"
                        className="filter-select"
                        value={filters.selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                        <option value="">Marca</option>
                        <option value="chevrolet">Chevrolet</option>
                        <option value="nissan">Nissan</option>
                        <option value="hyundai">Hyundai</option>
                        <option value="kia">Kia</option>
                        <option value="ford">Ford</option>
                        <option value="toyota">Toyota</option>
                        <option value="honda">Honda</option>
                        <option value="mazda">Mazda</option>
                        <option value="volkswagen">Volkswagen</option>
                        <option value="renault">Renault</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="model-select" className="sr-only">Modelo</label>
                    <select
                        id="model-select"
                        className="filter-select"
                        value={filters.selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={!filters.selectedBrand}
                    >
                        <option value="">Modelo</option>
                        <option value="spark">Spark</option>
                        <option value="aveo">Aveo</option>
                        <option value="cruze">Cruze</option>
                        <option value="malibu">Malibu</option>
                        <option value="silverado">Silverado</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="year-select" className="sr-only">Año</label>
                    <select
                        id="year-select"
                        className="filter-select"
                        value={filters.selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={!filters.selectedModel}
                    >
                        <option value="">Año</option>
                        {Array.from({ length: 15 }, (_, i) => 2025 - i).map((year) => (
                            <option key={year} value={year.toString()}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Position */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Posición</h3>
                <div className="position-buttons">
                    <button
                        className={`position-btn ${filters.selectedPosition === 'delantera' ? 'active-delantera' : ''}`}
                        onClick={() => setSelectedPosition(filters.selectedPosition === 'delantera' ? null : 'delantera')}
                    >
                        Delantera
                    </button>
                    <button
                        className={`position-btn ${filters.selectedPosition === 'trasera' ? 'active-trasera' : ''}`}
                        onClick={() => setSelectedPosition(filters.selectedPosition === 'trasera' ? null : 'trasera')}
                    >
                        Trasera
                    </button>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Brand Tags */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Marcas</h3>
                <div className="brand-tags">
                    {BRANDS.map((brand) => (
                        <button
                            key={brand}
                            className={`brand-tag ${filters.selectedBrandTags.includes(brand) ? 'active' : ''}`}
                            onClick={() => toggleBrandTag(brand)}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* References */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Referencias</h3>

                <div>
                    <label htmlFor="oem-input" className="sr-only">OEM</label>
                    <input
                        id="oem-input"
                        type="text"
                        className="reference-input"
                        placeholder="OEM"
                        value={filters.oemReference}
                        onChange={(e) => setOemReference(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="fmsi-input" className="sr-only">FMSI</label>
                    <input
                        id="fmsi-input"
                        type="text"
                        className="reference-input"
                        placeholder="FMSI"
                        value={filters.fmsiReference}
                        onChange={(e) => setFmsiReference(e.target.value)}
                    />
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Measurements */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Medidas</h3>
                <div className="measurement-inputs">
                    <div className="measurement-input-wrapper">
                        <label htmlFor="width-input" className="sr-only">Ancho</label>
                        <input
                            id="width-input"
                            type="number"
                            className="measurement-input"
                            placeholder="Ancho"
                            value={filters.width}
                            onChange={(e) => setWidth(e.target.value)}
                        />
                        <span className="measurement-unit">mm</span>
                    </div>

                    <div className="measurement-input-wrapper">
                        <label htmlFor="height-input" className="sr-only">Alto</label>
                        <input
                            id="height-input"
                            type="number"
                            className="measurement-input"
                            placeholder="Alto"
                            value={filters.height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                        <span className="measurement-unit">mm</span>
                    </div>
                </div>
            </div>

            {/* Clear Filters Button */}
            <button className="clear-filters-btn" onClick={clearFilters}>
                <Trash2 size={18} />
                Borrar Filtros
            </button>
        </aside>
    );
};

export default Sidebar;
