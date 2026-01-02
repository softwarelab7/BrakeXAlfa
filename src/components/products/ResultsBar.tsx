import { ArrowRightLeft, History, Grid3x3, LayoutGrid, Maximize } from 'lucide-react';
import Bookmark from '../common/Bookmark';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/results-bar.css';
import CustomSelect from '../common/CustomSelect';

interface ResultsBarProps {
    totalResults: number;
    currentStart: number;
    currentEnd: number;
}

const ResultsBar = ({ totalResults, currentStart, currentEnd }: ResultsBarProps) => {
    const comparisonsCount = useAppStore(state => state.comparisons.length);
    const favoritesCount = useAppStore(state => state.favorites.length);
    const openCompareModal = useAppStore(state => state.openCompareModal);
    const toggleShowFavoritesOnly = useAppStore(state => state.toggleShowFavoritesOnly);
    const showFavoritesOnly = useAppStore(state => state.filters.showFavoritesOnly);
    const openHistoryPanel = useAppStore(state => state.openHistoryPanel);
    const { itemsPerPage, gridDensity } = useAppStore(state => state.ui);
    const setItemsPerPage = useAppStore(state => state.setItemsPerPage);
    const setGridDensity = useAppStore(state => state.setGridDensity);

    const handleItemsPerPageChange = (newValue: number) => {
        setItemsPerPage(Number(newValue));
    };

    return (
        <div className="results-bar">
            {/* Left: Status Text */}
            <p className="results-text">
                {totalResults === 0 ? (
                    'Sin resultados'
                ) : (
                    <>
                        Mostrando{' '}
                        <span className="results-count">
                            {currentStart}-{currentEnd}
                        </span>{' '}
                        de{' '}
                        <span className="results-count">{totalResults}</span>{' '}
                        resultados
                    </>
                )}
            </p>

            {/* Right: Controls & Actions */}
            <div className="results-actions-wrapper">

                {/* Visual Settings Group */}
                <div className="control-group">
                    {/* Density Selector */}
                    <div className="density-selector">
                        <button
                            onClick={() => setGridDensity('compact')}
                            className={`density-btn ${gridDensity === 'compact' ? 'active' : ''}`}
                            title="Vista Compacta"
                        >
                            <Grid3x3 size={16} />
                        </button>
                        <button
                            onClick={() => setGridDensity('normal')}
                            className={`density-btn ${gridDensity === 'normal' ? 'active' : ''}`}
                            title="Vista Normal"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setGridDensity('comfortable')}
                            className={`density-btn ${gridDensity === 'comfortable' ? 'active' : ''}`}
                            title="Vista Cómoda"
                        >
                            <Maximize size={16} />
                        </button>
                    </div>

                    {/* Items Page Selector */}
                    <div className="items-selector">
                        <CustomSelect
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            options={[
                                { value: 24, label: '24 / pág' },
                                { value: 48, label: '48 / pág' },
                                { value: 72, label: '72 / pág' },
                                { value: 96, label: '96 / pág' },
                            ]}
                        />
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="control-divider" />

                {/* Tools Group */}
                <div className="tools-group">
                    <button
                        className={`results-action-btn results-action-btn-compare animate-hover-swap ${comparisonsCount > 0 ? 'active' : ''}`}
                        onClick={openCompareModal}
                        title="Comparar productos"
                    >
                        <ArrowRightLeft size={20} />
                        {comparisonsCount > 0 && (
                            <span className="action-badge badge-compare">
                                {comparisonsCount}
                            </span>
                        )}
                    </button>

                    <button
                        className={`results-action-btn animate-hover-beat ${showFavoritesOnly ? 'active' : ''}`}
                        onClick={toggleShowFavoritesOnly}
                        title={showFavoritesOnly ? "Ver todos los resultados" : "Ver solo favoritos"}
                    >
                        <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bookmark
                                checked={showFavoritesOnly}
                                onChange={() => { }}
                                size={20}
                                animate={false}
                            />
                        </div>
                        {favoritesCount > 0 && (
                            <span className="action-badge badge-favorite">
                                {favoritesCount}
                            </span>
                        )}
                    </button>

                    <button
                        className="results-action-btn animate-hover-history"
                        onClick={openHistoryPanel}
                        title="Historial de búsquedas"
                    >
                        <History size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsBar;
