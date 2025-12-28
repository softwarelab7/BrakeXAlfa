import React from 'react';
import { Scale, Heart } from 'lucide-react';
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

    const getPositionClass = (position: string) => {
        if (position === 'DELANTERA') return 'position-badge-delantera';
        if (position === 'TRASERA') return 'position-badge-trasera';
        return 'position-badge-ambas';
    };

    const formatApplications = () => {
        if (!product.aplicaciones || product.aplicaciones.length === 0) return 'Sin aplicaciones';

        const first = product.aplicaciones[0];
        const remaining = product.aplicaciones.length - 1;

        let text = `${first.marca} ${first.modelo}`;
        if (first.año) text += ` (${first.año})`;

        if (remaining > 0) {
            text += `, +${remaining} más`;
        }

        return text;
    };

    return (
        <div className="product-card">
            {/* Header Bar */}
            <div className="card-header">
                <span className={`position-badge ${getPositionClass(product.posicion)}`}>
                    {product.posicion}
                </span>
                <div className="action-icons">
                    <button
                        className={`action-icon action-icon-compare ${isInComparison ? 'active' : ''}`}
                        onClick={() => toggleComparison(product.id)}
                        title={isInComparison ? 'Quitar de comparación' : 'Agregar a comparación'}
                        aria-label="Comparar"
                    >
                        <Scale size={16} />
                    </button>
                    <button
                        className={`action-icon action-icon-favorite ${isFavorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(product.id)}
                        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        aria-label="Favorito"
                    >
                        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Image */}
            <div className="image-container" onClick={() => openProductDetailModal(product.id)}>
                <img
                    src={product.imagenes?.[0] || 'https://via.placeholder.com/200x150?text=Brake+Pad'}
                    alt={`Pastilla de freno ${product.referencia}`}
                    className="product-image"
                    loading="lazy"
                />
            </div>

            {/* Reference Badges */}
            <div className="ref-badges">
                {(product.ref || []).map((ref, index) => (
                    <span
                        key={ref}
                        className={`ref-badge ${index % 2 === 0 ? 'ref-badge-blue' : 'ref-badge-red'}`}
                    >
                        {ref}
                    </span>
                ))}
            </div>

            {/* Content */}
            <div className="card-content">
                <p className="manufacturer">{product.fabricante}</p>
                <p className="applications">{formatApplications()}</p>

                {product.medidas && (
                    <div className="measurements">
                        <span className="measurement-item">
                            Ancho: {product.medidas.ancho}mm
                        </span>
                        <span className="measurement-item">
                            Alto: {product.medidas.alto}mm
                        </span>
                    </div>
                )}

                <button
                    className="view-details-btn"
                    onClick={() => openProductDetailModal(product.id)}
                >
                    Ver Detalles
                </button>
            </div>
        </div>
    );
});

export default ProductCard;
