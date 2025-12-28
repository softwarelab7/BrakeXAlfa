import { History, Clock, Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Modal from './Modal';
import type { Filters } from '../../types';

const HistoryModal = () => {
    const isHistoryModalOpen = useAppStore(state => state.ui.isHistoryModalOpen);
    const searchHistory = useAppStore(state => state.searchHistory);
    const closeHistoryModal = useAppStore(state => state.closeHistoryModal);
    const setSearchQuery = useAppStore(state => state.setSearchQuery);
    const clearFilters = useAppStore(state => state.clearFilters);
    const setSelectedBrand = useAppStore(state => state.setSelectedBrand);
    const setSelectedModel = useAppStore(state => state.setSelectedModel);
    const setSelectedYear = useAppStore(state => state.setSelectedYear);

    const restoreSearch = (filtersToRestore: Partial<Filters>) => {
        clearFilters();
        if (filtersToRestore.searchQuery) setSearchQuery(filtersToRestore.searchQuery);
        if (filtersToRestore.selectedBrand) setSelectedBrand(filtersToRestore.selectedBrand);
        if (filtersToRestore.selectedModel) setSelectedModel(filtersToRestore.selectedModel);
        if (filtersToRestore.selectedYear) setSelectedYear(filtersToRestore.selectedYear);
        closeHistoryModal();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            isOpen={isHistoryModalOpen}
            onClose={closeHistoryModal}
            title="Historial de Búsqueda"
            size="default"
        >
            {searchHistory.length === 0 ? (
                <div className="grid-empty">
                    <History className="empty-icon" />
                    <h3 className="empty-title">Historial Vacío</h3>
                    <p className="empty-message">
                        Tus búsquedas recientes aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {searchHistory.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => restoreSearch(entry.filters)}
                            className="history-item"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Search size={20} className="text-secondary" />
                                <div>
                                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {entry.summary || 'Búsqueda General'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                        {entry.resultCount} resultados encontrados
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                <Clock size={14} />
                                {formatDate(entry.timestamp)}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default HistoryModal;
