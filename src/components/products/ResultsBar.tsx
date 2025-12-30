import { ArrowRightLeft, History } from 'lucide-react';
import Bookmark from '../common/Bookmark';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/results-bar.css';

interface ResultsBarProps {
    totalResults: number;
    currentStart: number;
    currentEnd: number;
}

const ResultsBar = ({ totalResults, currentStart, currentEnd }: ResultsBarProps) => {
    const filteredProducts = useAppStore(state => state.filteredProducts);
    const totalApplications = filteredProducts.reduce((acc, product) => acc + (product.aplicaciones?.length || 0), 0);
    const comparisonsCount = useAppStore(state => state.comparisons.length);
    const favoritesCount = useAppStore(state => state.favorites.length);
    const openCompareModal = useAppStore(state => state.openCompareModal);
    const toggleShowFavoritesOnly = useAppStore(state => state.toggleShowFavoritesOnly);
    const showFavoritesOnly = useAppStore(state => state.filters.showFavoritesOnly);
    const openHistoryModal = useAppStore(state => state.openHistoryModal);

    return (
        <div className="results-bar">
            <div className="results-text-container">
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
                            resultados y{' '}
                            <span className="results-count">{totalApplications}</span>{' '}
                            aplicaciones
                        </>
                    )}
                </p>
            </div>

            <div className="results-actions">
                <button
                    className={`results-action-btn animate-hover-swap ${comparisonsCount > 0 ? 'active' : ''}`}
                    onClick={openCompareModal}
                    title="Comparar productos"
                >
                    <ArrowRightLeft size={22} />
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
                            size={22}
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
                    onClick={openHistoryModal}
                    title="Historial de búsquedas"
                >
                    <History size={22} />
                </button>
            </div>
        </div>
    );
};

export default ResultsBar;
