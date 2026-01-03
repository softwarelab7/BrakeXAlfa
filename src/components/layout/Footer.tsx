import { Mail, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const clearFilters = useAppStore(state => state.clearFilters);
    const openCompareModal = useAppStore(state => state.openCompareModal);
    const openHistoryPanel = useAppStore(state => state.openHistoryPanel);

    const handleCatalogClick = (e: React.MouseEvent) => {
        e.preventDefault();
        clearFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCompareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openCompareModal();
    };

    const handleHistoryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openHistoryPanel();
    };

    const handleContactClick = () => {
        window.location.href = 'mailto:contacto@brakehubx.com';
    };

    return (
        <footer className="footer-wrapper">
            {/* Visual Decorative Top Line */}
            <div className="footer-accent-line"></div>

            <div className="footer-content">
                {/* 1. Brand Section */}
                <div className="footer-brand-section">
                    <div className="brand-header">
                        <h2 className="footer-logo">Brake Xpert</h2>
                        <span className="version-badge">v1.2 Beta</span>
                    </div>
                    <p className="footer-description">
                        Redefiniendo la búsqueda de autopartes.
                        Precisión técnica y velocidad para profesionales.
                    </p>
                    <button className="contact-btn" onClick={handleContactClick}>
                        <Mail size={14} />
                        <span>Contáctanos</span>
                    </button>
                </div>

                {/* 2. Quick Navigation */}
                <div className="footer-links-column">
                    <h4 className="column-title">Explorar</h4>
                    <nav className="footer-nav">
                        <a href="#" className="nav-item" onClick={handleCatalogClick}>Catálogo</a>
                        <a href="#" className="nav-item" onClick={handleCompareClick}>Comparador</a>
                        <a href="#" className="nav-item" onClick={handleHistoryClick}>Historial</a>
                    </nav>
                </div>

                {/* 3. Contact Info */}
                <div className="footer-social-column">
                    <h4 className="column-title">Contacto</h4>
                    <div className="social-cards">
                        <div className="social-card">
                            <div className="icon-box">
                                <Mail size={14} />
                            </div>
                            <div className="social-info">
                                <span className="social-name">Soporte</span>
                                <span className="social-sub">ventas@brakexpert.com</span>
                            </div>
                        </div>
                        <div className="social-card">
                            <div className="icon-box">
                                <Shield size={14} />
                            </div>
                            <div className="social-info">
                                <span className="social-name">Oficina</span>
                                <span className="social-sub">CDMX, México</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bar">
                <div className="bar-content">
                    <p className="copyright">© {currentYear} Brake Xpert Inc. Todos los derechos reservados.</p>
                    <div className="legal-links">
                        <a href="#">Privacidad</a>
                        <span className="dot">·</span>
                        <a href="#">Términos</a>
                        <span className="dot">·</span>
                        <a href="#admin" className="admin-link">
                            <Shield size={12} />
                            <span>Modo Admin</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
