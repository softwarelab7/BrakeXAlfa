import { ArrowLeftRight, History } from 'lucide-react';
import Bookmark from '../common/Bookmark';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/results-bar.css';

interface ResultsBarProps {
    totalResults: number;
    currentStart: number;
    currentEnd: number;
}

const ResultsBar = ({ totalResults, currentStart, currentEnd }: ResultsBarProps) => {
    const comparisonsCount = useAppStore(state => state.comparisons.length);
    const favoritesCount = useAppStore(state => state.favorites.length);
    const openCompareModal = useAppStore(state => state.openCompareModal);
    const openFavoritesModal = useAppStore(state => state.openFavoritesModal);
    const openHistoryModal = useAppStore(state => state.openHistoryModal);

    return (
        <div className="results-bar">
            <p className="results-text">
                Mostrando{' '}
                <span className="results-count">
                    {currentStart}-{currentEnd}
                </span>{' '}
                de{' '}
                <span className="results-count">{totalResults}</span>{' '}
                resultados
            </p>

            <div className="results-actions">
                <button
                    className={`results-action-btn ${comparisonsCount > 0 ? 'active' : ''}`}
                    onClick={openCompareModal}
                    title="Comparar productos"
                >
                    <ArrowLeftRight size={20} />
                    {comparisonsCount > 0 && (
                        <span className="action-badge">
                            {comparisonsCount}
                        </span>
                    )}
                </button>

                <button
                    className={`results-action-btn ${favoritesCount > 0 ? 'active' : ''}`}
                    onClick={openFavoritesModal}
                    title="Ver favoritos"
                >
                    <Bookmark checked={favoritesCount > 0} onChange={() => { }} size={20} />
                    {favoritesCount > 0 && (
                        <span className="action-badge">
                            {favoritesCount}
                        </span>
                    )}
                </button>

                <button
                    className="results-action-btn"
                    onClick={openHistoryModal}
                    title="Historial de búsquedas"
                >
                    <History size={20} />
                </button>
            </div>
        </div>
    );
};

export default ResultsBar;
