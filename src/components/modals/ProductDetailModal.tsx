import { Scale, Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Modal from './Modal';
import Bookmark from '../common/Bookmark';
import '../../styles/modals.css';

const ProductDetailModal = () => {
    const isProductDetailModalOpen = useAppStore(state => state.ui.isProductDetailModalOpen);
    const selectedProductId = useAppStore(state => state.ui.selectedProductId);
    const products = useAppStore(state => state.products);
    const closeProductDetailModal = useAppStore(state => state.closeProductDetailModal);
    const toggleFavorite = useAppStore(state => state.toggleFavorite);
    const toggleComparison = useAppStore(state => state.toggleComparison);
    const favorites = useAppStore(state => state.favorites);
    const comparisons = useAppStore(state => state.comparisons);

    const product = products.find(p => p.id === selectedProductId);

    if (!product) return null;

    const isFavorite = favorites.includes(product.id);
    const isComparing = comparisons.includes(product.id);

    return (
        <Modal
            isOpen={isProductDetailModalOpen}
            onClose={closeProductDetailModal}
            title={`Detalles del Producto - ${product.referencia}`}
            size="large"
        >
            <div className="detail-grid">
                {/* Left Column: Image */}
                <div className="detail-image-section">
                    <img
                        src={product.imagenes[0]}
                        alt={product.referencia}
                        className="detail-image"
                    />

                    <div className="action-icons" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                        <button
                            className={`action-icon action-icon-compare ${isComparing ? 'active' : ''}`}
                            onClick={() => toggleComparison(product.id)}
                            title="Comparar"
                        >
                            <Scale size={20} />
                        </button>
                        <div
                            className={`action-icon action-icon-favorite ${isFavorite ? 'active' : ''}`}
                            onClick={() => toggleFavorite(product.id)}
                            title="Favorito"
                        >
                            <Bookmark
                                checked={isFavorite}
                                onChange={() => { }}
                                size={20}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Info */}
                <div className="detail-info-section">
                    {/* Main position badge */}
                    <div>
                        <span className={`position-badge ${product.posicion === 'DELANTERA' ? 'position-badge-delantera' :
                            product.posicion === 'TRASERA' ? 'position-badge-trasera' : 'position-badge-ambas'
                            }`}>
                            {product.posicion}
                        </span>
                    </div>

                    {/* References */}
                    <div className="detail-specs-grid">
                        <div className="spec-item">
                            <span className="spec-label">Fabricante</span>
                            <span className="spec-value">{product.fabricante}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">Referencia Principal</span>
                            <span className="spec-value">{product.referencia}</span>
                        </div>
                    </div>

                    <div className="spec-item">
                        <span className="spec-label">Referencias FMSI / OEM</span>
                        <div className="detail-refs">
                            {product.fmsi.map(ref => (
                                <span key={ref} className="ref-badge ref-badge-green">{ref}</span>
                            ))}
                            {product.oem.map(ref => (
                                <span key={ref} className="ref-badge ref-badge-yellow">{ref}</span>
                            ))}
                        </div>
                    </div>

                    {/* Measurements */}
                    <div className="spec-item" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <span className="spec-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Medidas</span>
                        <div className="detail-specs-grid">
                            <div>
                                <span className="spec-label">Ancho</span>
                                <span className="spec-value">{product.medidas.ancho} mm</span>
                            </div>
                            <div>
                                <span className="spec-label">Alto</span>
                                <span className="spec-value">{product.medidas.alto} mm</span>
                            </div>
                        </div>
                    </div>

                    {/* Applications */}
                    <div className="spec-item">
                        <span className="spec-label">Aplicaciones</span>
                        <ul style={{ listStyle: 'none', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {product.aplicaciones.map((app, idx) => (
                                <li key={idx} className="spec-value" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Search size={14} className="text-tertiary" />
                                    <span>
                                        <strong>{app.marca}</strong> {app.modelo} {app.año ? `(${app.año})` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailModal;
