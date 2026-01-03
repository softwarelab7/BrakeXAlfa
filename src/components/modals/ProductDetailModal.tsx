import { ArrowRightLeft, X } from 'lucide-react';
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

    // Determine actual position - check applications for both positions (Matching ProductCard logic)
    const getActualPosition = () => {
        // Priority 1: Check root position explicit value
        if (product.posicion) {
            const rootPos = product.posicion.toUpperCase();
            if (rootPos === 'AMBAS') {
                return { display: 'DL-TR', className: 'badge-ambas' };
            }
            if (rootPos === 'TRASERA') {
                return { display: 'TRASERA', className: 'badge-trasera' };
            }
            if (rootPos === 'DELANTERA') {
                return { display: 'DELANTERA', className: '' };
            }
        }

        // Priority 2: Derive from applications (fallback)
        const positions = new Set<string>();

        if (product.posicion) {
            positions.add(product.posicion.toUpperCase());
        }

        if (Array.isArray(product.aplicaciones)) {
            product.aplicaciones.forEach(app => {
                if (app && app.posicion) {
                    const appPos = app.posicion.toUpperCase();
                    if (appPos === 'AMBAS') {
                        positions.add('DELANTERA');
                        positions.add('TRASERA');
                    } else {
                        positions.add(appPos);
                    }
                }
            });
        }

        if (positions.has('DELANTERA') && positions.has('TRASERA')) {
            return { display: 'DL-TR', className: 'badge-ambas' };
        }

        if (positions.has('TRASERA')) {
            return { display: 'TRASERA', className: 'badge-trasera' };
        }

        if (positions.has('DELANTERA')) {
            return { display: 'DELANTERA', className: '' };
        }

        return { display: product.posicion || 'N/A', className: '' };
    };

    const positionInfo = getActualPosition();

    // Helper to get badge class matching ProductCard logic
    const getBadgeClass = (ref: string) => {
        if (!ref) return '';
        const r = ref.toUpperCase();
        if (r.endsWith('BP')) return 'ref-badge-gray';
        if (r.startsWith('K')) return 'ref-badge-red';
        if (r.endsWith('BEX')) return 'ref-badge-lightblue';
        if (r.endsWith('SP')) return 'ref-badge-mint';
        return ''; // Default Blue
    };



    // Prepare all references (main + secondary) split by spaces, unique
    const allReferences = Array.from(new Set(
        [product.referencia, ...(product.ref || [])]
            .flatMap(r => r ? r.split(' ') : [])
            .filter(Boolean)
    ));

    // Initial 4 for top row, or all
    const topBadges = allReferences.slice(0, 4);

    return (
        <Modal
            isOpen={isProductDetailModalOpen}
            onClose={closeProductDetailModal}
            title={product.referencia}
            size="xl"
            hideHeader={true}
            noPadding={true}
        >
            <div className="detail-layout">
                {/* Top Right Actions Toolbar */}
                <div className="modal-actions-toolbar">
                    <button
                        className={`action-btn-toolbar ${isComparing ? 'active' : ''}`}
                        onClick={() => toggleComparison(product.id)}
                        title={isComparing ? "Quitar de comparar" : "Comparar"}
                    >
                        <ArrowRightLeft size={18} />
                    </button>
                    <button
                        className={`action-btn-toolbar ${isFavorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(product.id)}
                        title={isFavorite ? "Quitar de favoritos" : "Guardar"}
                    >
                        <Bookmark checked={isFavorite} onChange={() => { }} size={18} />
                    </button>
                    <div className="toolbar-divider"></div>
                    <button
                        className="close-btn-toolbar"
                        onClick={closeProductDetailModal}
                        title="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Left Column: Information */}
                <div className="detail-info-col">
                    {/* Position Badge */}
                    <div className="position-row">
                        <span className={`position-badge ${positionInfo.className}`}>
                            {positionInfo.display}
                        </span>
                    </div>

                    {/* Top Badges Row */}
                    <div className="badges-row">
                        {topBadges.map(r => (
                            <span key={r} className={`ref-badge ${getBadgeClass(r)}`}>{r}</span>
                        ))}
                        {allReferences.length > 4 && (
                            <span className="ref-badge ref-badge-gray">+{allReferences.length - 4}</span>
                        )}
                    </div>

                    {/* Applications List (Grouped by Brand) */}
                    <div className="applications-table-container">
                        {Object.entries((product.aplicaciones || []).reduce((acc, app) => {
                            const brand = app.marca || 'Otras';
                            if (!acc[brand]) acc[brand] = [];
                            acc[brand].push(app);
                            return acc;
                        }, {} as Record<string, typeof product.aplicaciones>)).sort((a, b) => a[0].localeCompare(b[0])).map(([brand, apps]) => (
                            <div key={brand} className="brand-group">
                                <h3 className="brand-header-in-list">{brand}</h3>
                                <table className="app-table">
                                    <tbody>
                                        {apps.map((app, idx) => (
                                            <tr key={idx}>
                                                <td className="app-model">{app.modelo} {app.serie}</td>
                                                <td className="app-year">{app.año}</td>
                                                <td className={`app-pos ${app.posicion === 'TRASERA' ? 'text-red' :
                                                    app.posicion === 'DELANTERA' ? 'text-blue' : 'text-purple'
                                                    }`}>
                                                    {app.posicion}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Specs Section */}
                    <div className="specs-section">
                        <h4 className="specs-header">ESPECIFICACIONES</h4>
                        <div className="specs-rows">


                            <div className="spec-row">
                                <span className="spec-key">Platina FMSI</span>
                                <span className="spec-val">{product.fmsi?.join(', ') || 'N/A'}</span>
                            </div>
                            <div className="spec-row">
                                <span className="spec-key">Medidas (mm)</span>
                                <span className="spec-val">
                                    Ancho: {product.medidas.ancho} x Alto: {product.medidas.alto}
                                </span>
                            </div>
                            <div className="spec-row">
                                <span className="spec-key">Especificación</span>
                                <span className="spec-val">N/A</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Image */}
                <div className="detail-image-col">
                    {/* Action Icons Floating */}
                    <div className="image-wrapper">
                        <img
                            src={product.imagenes[0]}
                            alt={product.referencia}
                            className="main-product-image"
                        />
                        <div className="measurements-overlay">
                            <div className="measure-box">L <span className="measure-val">{product.medidas.ancho}</span></div>
                            <div className="measure-box">W <span className="measure-val">{product.medidas.alto}</span></div>
                        </div>
                    </div>


                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailModal;
