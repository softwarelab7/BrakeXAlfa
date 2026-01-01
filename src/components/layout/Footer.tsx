import { Zap, Mail, ArrowUpRight } from 'lucide-react';
import '../../styles/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-wrapper">
            {/* Visual Decorative Top Line */}
            <div className="footer-accent-line"></div>

            <div className="footer-content">
                {/* 1. Brand Section */}
                <div className="footer-brand-section">
                    <div className="brand-header">
                        <h2 className="footer-logo">Brake X</h2>
                        <span className="version-badge">v1.2 Beta</span>
                    </div>
                    <p className="footer-description">
                        Redefiniendo la búsqueda de autopartes.
                        Precisión técnica y velocidad para profesionales.
                    </p>
                    <button className="contact-btn">
                        <Mail size={14} />
                        <span>Contáctanos</span>
                    </button>
                </div>

                {/* 2. Quick Navigation */}
                <div className="footer-links-column">
                    <h4 className="column-title">Explorar</h4>
                    <nav className="footer-nav">
                        <a href="#" className="nav-item">Catálogo</a>
                        <a href="#" className="nav-item">Comparador</a>
                        <a href="#" className="nav-item">Historial</a>
                    </nav>
                </div>

                {/* 3. Powered By */}
                <div className="footer-social-column">
                    <h4 className="column-title">Powered By</h4>
                    <div className="social-cards">
                        <a href="#" className="social-card">
                            <div className="icon-box"><Zap size={18} /></div>
                            <div className="social-info">
                                <span className="social-name">Antigravity</span>
                                <span className="social-sub">Next-Gen AI Agent</span>
                            </div>
                            <ArrowUpRight size={14} className="arrow-icon" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bar">
                <div className="bar-content">
                    <p className="copyright">© {currentYear} Brake X Inc. Todos los derechos reservados.</p>
                    <div className="legal-links">
                        <a href="#">Privacidad</a>
                        <span className="dot">·</span>
                        <a href="#">Términos</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
