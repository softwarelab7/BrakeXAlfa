import { HelpCircle, Search, Filter, Smartphone, MousePointer2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Modal from './Modal';

const GuideModal = () => {
    const isGuideModalOpen = useAppStore(state => state.ui.isGuideModalOpen);
    const closeGuideModal = useAppStore(state => state.closeGuideModal);

    const steps = [
        {
            icon: <Search size={24} style={{ color: 'var(--accent-primary)' }} />,
            title: 'Búsqueda Rápida',
            description: 'Usa la barra de búsqueda lateral para encontrar pastillas por referencia directa, código OEM o FMSI.'
        },
        {
            icon: <Filter size={24} style={{ color: 'var(--accent-secondary)' }} />,
            title: 'Filtros de Vehículo',
            description: 'Selecciona Marca, Modelo y Año para ver exactamente qué pastillas corresponden a tu vehículo.'
        },
        {
            icon: <MousePointer2 size={24} style={{ color: 'var(--color-success)' }} />,
            title: 'Detalles y Comparación',
            description: 'Haz clic en cualquier producto para ver sus medidas exactas y fotos. Úsalos para comparar hasta 4 modelos a la vez.'
        },
        {
            icon: <Smartphone size={24} style={{ color: 'var(--color-warning)' }} />,
            title: 'Acceso desde el Celular',
            description: 'Esta aplicación es una PWA. Puedes instalarla en tu celular desde el menú del navegador para usarla sin conexión.'
        }
    ];

    return (
        <Modal
            isOpen={isGuideModalOpen}
            onClose={closeGuideModal}
            title="Guía de Uso - Brake Xpert"
            size="large"
        >
            <div className="guide-content" style={{ padding: '0.5rem 0' }}>
                <style>{`
                    .guide-grid {
                        display: grid;
                        gap: 1rem;
                        grid-template-columns: 1fr;
                    }
                    @media (min-width: 640px) {
                        .guide-grid {
                            grid-template-columns: 1fr 1fr;
                        }
                    }
                `}</style>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                    <HelpCircle size={28} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Guía Rápida</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Encuentra tus frenos ideales en segundos.</p>
                    </div>
                </div>

                <div className="guide-grid">
                    {steps.map((step, index) => (
                        <div key={index} style={{ padding: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ padding: '6px', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', border: '1px solid var(--border-secondary)' }}>
                                    {step.icon}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{step.title}</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: '1.3', color: 'var(--text-secondary)' }}>{step.description}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-primary)', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>¿Necesitas soporte técnico?</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contáctanos para atención especializada.</p>
                </div>
            </div>
        </Modal>
    );
};

export default GuideModal;
