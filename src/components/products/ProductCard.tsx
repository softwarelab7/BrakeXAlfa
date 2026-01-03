import React from 'react';
import Bookmark from '../common/Bookmark';
import { ArrowRightLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Product } from '../../types';
import '../../styles/product-card.css';

interface ProductCardProps {
    product: Product;
}

const ProductCard = React.memo(({ product }: ProductCardProps) => {
    const isFavorite = useAppStore(state => state.favorites.includes(product.id));
    const isInComparison = useAppStore(state => state.comparisons.includes(product.id));

    const toggleFavorite = useAppStore(state => state.toggleFavorite);
    const toggleComparison = useAppStore(state => state.toggleComparison);
    const openProductDetailModal = useAppStore(state => state.openProductDetailModal);

    const formatApplications = () => {
        if (!product.aplicaciones || product.aplicaciones.length === 0) return 'Sin aplicaciones';

        const first = product.aplicaciones[0];
        const remaining = product.aplicaciones.length - 1;

        const brand = first.marca || '';
        const model = first.modelo && first.modelo !== 'undefined' ? first.modelo : '';

        let text = `${brand} ${model}`.trim();

        if (!text) {
            text = first.año ? `Año: ${first.año}` : 'Sin detalles';
        }

        if (remaining > 0) {
            text += `, +${remaining} más`;
        }

        return text;
    };

    // Determine actual position - check applications for both positions
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

        // Check root position for non-standard values or if we want to include it in the set for fallback logic
        if (product.posicion) {
            positions.add(product.posicion.toUpperCase());
        }

        // Check all applications
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

        // If has both positions, show DL-TR
        if (positions.has('DELANTERA') && positions.has('TRASERA')) {
            return { display: 'DL-TR', className: 'badge-ambas' };
        }

        // Otherwise show the single position
        if (positions.has('TRASERA')) {
            return { display: 'TRASERA', className: 'badge-trasera' };
        }

        if (positions.has('DELANTERA')) {
            return { display: 'DELANTERA', className: '' };
        }

        // Fallback
        return { display: product.posicion || 'N/A', className: '' };
    };

    const positionInfo = getActualPosition();

    const getBadgeClass = (ref: string) => {
        if (!ref) return '';
        const r = ref.toUpperCase();
        if (r.endsWith('BP')) return 'ref-badge-gray';
        if (r.startsWith('K')) return 'ref-badge-red';
        if (r.endsWith('BEX')) return 'ref-badge-lightblue';
        if (r.endsWith('SP')) return 'ref-badge-mint';
        return ''; // Default Blue
    };

    return (
        <div className="product-card" onClick={() => openProductDetailModal(product.id)}>
            {/* Header: Position and Actions */}
            <div className="card-header">
                <span className={`position-badge ${positionInfo.className}`}>
                    {positionInfo.display}
                </span>
                <div className="action-icons">
                    <div
                        className={`action-icon action-icon-compare animate-hover-swap ${isInComparison ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(product.id);
                        }}
                    >
                        <ArrowRightLeft size={20} />
                    </div>
                    <div className={`action-icon action-icon-favorite animate-hover-beat ${isFavorite ? 'active' : ''}`}>
                        <Bookmark
                            checked={isFavorite}
                            onChange={() => toggleFavorite(product.id)}
                            size={18}
                        />
                    </div>
                </div>
            </div>

            {/* Image */}
            <div className="image-container">
                <img
                    src={product.imagenes?.[0] || 'https://via.placeholder.com/200x150?text=Brake+Pad'}
                    alt={product.referencia}
                    className="product-image"
                    loading="lazy"
                />
            </div>

            {/* References */}
            <div className="ref-section">
                {(product.ref || [])
                    .flatMap(r => r.split(' ')) // Split space-separated strings
                    .filter(Boolean) // Remove empty strings
                    .map((reference) => (
                        <span
                            key={reference}
                            className={`ref-badge ${getBadgeClass(reference)}`}
                        >
                            {reference}
                        </span>
                    ))}
            </div>

            {/* Application Detail */}
            <div className="card-bottom">
                <p className="applications">{formatApplications()}</p>
            </div>
        </div>
    );
});

export default ProductCard;
