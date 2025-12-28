import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Wifi, ArrowRight } from 'lucide-react';
import '../styles/reload-prompt.css';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            r && setInterval(() => r.update(), 60 * 60 * 1000);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="ReloadPrompt-container">
            <div className="ReloadPrompt-overlay" />
            <div className="ReloadPrompt-toast">
                <div className="ReloadPrompt-icon-wrapper">
                    {offlineReady ? (
                        <Wifi size={32} />
                    ) : (
                        <RefreshCw size={32} className="spin-animate" />
                    )}
                </div>

                <div className="ReloadPrompt-message">
                    <h3>{offlineReady ? 'Modo Offline' : '¡Hay mejoras!'}</h3>
                    <p>
                        {offlineReady
                            ? 'La aplicación está lista para usarse sin conexión a internet.'
                            : 'Una nueva versión de Brake X está disponible con mejoras de rendimiento.'}
                    </p>
                </div>

                <div className="ReloadPrompt-actions">
                    {needRefresh && (
                        <button
                            className="ReloadPrompt-btn ReloadPrompt-btn-primary"
                            onClick={() => updateServiceWorker(true)}
                        >
                            Actualizar ahora <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </button>
                    )}
                    {offlineReady && !needRefresh && (
                        <button className="ReloadPrompt-btn ReloadPrompt-btn-primary" onClick={close}>
                            Entendido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReloadPrompt;
