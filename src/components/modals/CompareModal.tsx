import { Trash2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Modal from './Modal';
import '../../styles/compare-modal.css';

const CompareModal = () => {
    const isCompareModalOpen = useAppStore(state => state.ui.isCompareModalOpen);
    const comparisons = useAppStore(state => state.comparisons);
    const products = useAppStore(state => state.products);
    const closeCompareModal = useAppStore(state => state.closeCompareModal);
    const toggleComparison = useAppStore(state => state.toggleComparison);

    const comparisonProducts = products.filter(product => comparisons.includes(product.id));

    return (
        <Modal
            isOpen={isCompareModalOpen}
            onClose={closeCompareModal}
            title="Comparar Productos"
            size="xl"
        >
            {comparisonProducts.length === 0 ? (
                <div className="grid-empty">
                    <AlertCircle className="empty-icon" />
                    <h3 className="empty-title">Sin productos para comparar</h3>
                    <p className="empty-message">
                        Selecciona productos usando el icono de balanza (⚖) tarjeta.
                    </p>
                </div>
            ) : (
                <div className="compare-table-container">
                    <table className="compare-table">
                        <tbody>
                            {/* Image & Header Row */}
                            <tr>
                                <td className="compare-feature-header">Producto</td>
                                {comparisonProducts.map(product => (
                                    <td key={product.id} className="compare-product-col">
                                        <img src={product.imagenes[0]} alt={product.referencia} className="compare-image" />
                                        <div className="compare-ref-title">{product.referencia}</div>
                                        <div className="compare-manufacturer">{product.fabricante}</div>
                                        <button
                                            className="compare-remove-btn"
                                            onClick={() => toggleComparison(product.id)}
                                        >
                                            <Trash2 size={14} /> Quitar
                                        </button>
                                    </td>
                                ))}
                            </tr>

                            {/* Position Row */}
                            <tr>
                                <td className="compare-feature-header">Posición</td>
                                {comparisonProducts.map(product => (
                                    <td key={product.id} className="compare-product-col">
                                        <span className={`position-badge ${product.posicion === 'DELANTERA' ? 'position-badge-delantera' :
                                            product.posicion === 'TRASERA' ? 'position-badge-trasera' : 'position-badge-ambas'
                                            }`}>
                                            {product.posicion}
                                        </span>
                                    </td>
                                ))}
                            </tr>

                            {/* Measurements Row */}
                            <tr>
                                <td className="compare-feature-header">Medidas</td>
                                {comparisonProducts.map(product => (
                                    <td key={product.id} className="compare-product-col">
                                        <strong>Ancho:</strong> {product.medidas.ancho} mm <br />
                                        <strong>Alto:</strong> {product.medidas.alto} mm
                                    </td>
                                ))}
                            </tr>

                            {/* Refs Row */}
                            <tr>
                                <td className="compare-feature-header">FMSI / OEM</td>
                                {comparisonProducts.map(product => (
                                    <td key={product.id} className="compare-product-col">
                                        <div className="detail-refs">
                                            {product.fmsi.concat(product.oem).map(ref => (
                                                <span key={ref} className="ref-badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.7em' }}>
                                                    {ref}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Applications Row */}
                            <tr>
                                <td className="compare-feature-header">Aplicaciones</td>
                                {comparisonProducts.map(product => (
                                    <td key={product.id} className="compare-product-col">
                                        <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {product.aplicaciones.slice(0, 3).map((app, idx) => (
                                                <li key={idx}>
                                                    <strong>{app.marca}</strong> {app.modelo} {app.año ? `(${app.año})` : ''}
                                                </li>
                                            ))}
                                            {product.aplicaciones.length > 3 && (
                                                <li style={{ color: 'var(--text-tertiary)' }}>+{product.aplicaciones.length - 3} más...</li>
                                            )}
                                        </ul>
                                    </td>
                                ))}
                            </tr>

                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};

export default CompareModal;
