import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Bookmark from '../common/Bookmark';
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

    return (
        <div className="product-card" onClick={() => openProductDetailModal(product.id)}>
            {/* Header: Position and Actions */}
            <div className="card-header">
                <span className="position-badge">
                    {product.posicion}
                </span>
                <div className="action-icons">
                    <button
                        className={`action-icon action-icon-compare animate-hover-swap ${isInComparison ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(product.id);
                        }}
                        title="Comparar"
                    >
                        <ArrowRightLeft size={18} />
                    </button>
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
                {(product.ref || []).map((reference, index) => (
                    <span
                        key={reference}
                        className={`ref-badge ${index === 0 ? '' : index === 1 ? 'ref-badge-alt' : 'ref-badge-danger'}`}
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
