
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import '../../styles/admin.css';
import { Plus, Search, LogOut, Activity, Database, Edit3, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, History, FileClock, Menu } from 'lucide-react';
import ProductForm from './ProductForm';
import AdminLogin from './AdminLogin';
import ThemeToggle from '../layout/ThemeToggle';
import type { Product } from '../../types';
import { updateProduct, addProduct, auth, addHistoryLog, fetchHistoryLogs, type HistoryLog } from '../../services/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: (error: any) => React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    componentDidCatch(error: any, errorInfo: any) { console.error("Form Error Caught Deep:", error, errorInfo); }
    render() {
        if (this.state.hasError) return this.props.fallback(this.state.error);
        return this.props.children;
    }
}

const AdminPanel: React.FC = () => {
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [activeTab, setActiveTab] = useState<'catalog' | 'new' | 'edit' | 'audit' | 'history'>('catalog');
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            setIsLoadingHistory(true);
            fetchHistoryLogs(100).then(logs => {
                setHistoryLogs(logs);
                setIsLoadingHistory(false);
            });
        }
    }, [activeTab]);

    const handleLogout = React.useCallback(async () => {
        await signOut(auth);
        window.location.hash = '#search';
    }, []);

    // Session Timeout (20 minutes)
    useEffect(() => {
        const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes
        let timeoutId: ReturnType<typeof setTimeout>;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleLogout();
                alert('Sesión cerrada por inactividad (20 min).');
            }, TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        // Initialize
        resetTimer();

        // Listeners for user activity
        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [handleLogout]);

    const products = useAppStore(state => state.products);

    if (!user) {
        return <AdminLogin onLoginSuccess={() => setActiveTab('catalog')} />;
    }

    const filteredProducts = products.filter(p => {
        const refMatch = p.referencia?.toLowerCase().includes(searchTerm.toLowerCase());
        const otherRefMatch = Array.isArray(p.ref) && p.ref.some(r => String(r).toLowerCase().includes(searchTerm.toLowerCase()));
        return refMatch || otherRefMatch;
    }).slice(0, 20);

    const handleEdit = (product: Product) => {
        console.log("Starting edit for product:", product.id);
        setEditingProduct(product);
        setActiveTab('edit');
    };

    const handleNew = () => {
        setEditingProduct(undefined);
        setActiveTab('new');
    };

    const handleBack = () => {
        setActiveTab('catalog');
        setEditingProduct(undefined);
    };

    const handleSave = async (data: Partial<Product>) => {
        setIsSaving(true);
        try {
            if (activeTab === 'edit' && editingProduct?.id) {
                // Calculate diff
                const changes: { field: string, old: any, new: any }[] = [];
                Object.keys(data).forEach(key => {
                    const k = key as keyof Product;
                    if (JSON.stringify(editingProduct[k]) !== JSON.stringify(data[k])) {
                        changes.push({ field: k, old: editingProduct[k], new: data[k] });
                    }
                });

                await updateProduct(editingProduct.id, data);

                // Log History
                await addHistoryLog({
                    productId: editingProduct.id,
                    productRef: (data.ref?.[0] || data.referencia || editingProduct.referencia),
                    action: 'UPDATE',
                    changes,
                    user: user?.email || 'unknown',
                });

                showNotification('¡Producto actualizado con éxito!');
            } else {
                const newId = await addProduct(data);

                // Log History
                await addHistoryLog({
                    productId: newId,
                    productRef: (data.ref?.[0] || data.referencia || 'N/A'),
                    action: 'CREATE',
                    changes: [],
                    user: user?.email || 'unknown',
                });

                showNotification('¡Nuevo producto agregado con éxito!');
            }
            setTimeout(handleBack, 800);
        } catch (error) {
            console.error('Error saving:', error);
            showNotification('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-layout">
            {isMobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}
            {notification && (
                <div className={`toast-notification ${notification.type}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {notification.message}
                </div>
            )}
            <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="admin-brand">
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity color="#3b82f6" /> BRAKE X ADMIN
                    </h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
                    <button
                        onClick={() => { setActiveTab('catalog'); setIsMobileMenuOpen(false); }}
                        className={`admin-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
                    >
                        <Database size={20} /> Catálogo
                    </button>
                    <button
                        onClick={() => { handleNew(); setIsMobileMenuOpen(false); }}
                        className={`admin-nav-btn ${activeTab === 'new' ? 'active' : ''}`}
                    >
                        <Plus size={20} /> Nueva Pastilla
                    </button>
                    <button
                        onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
                        className={`admin-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
                    >
                        <AlertTriangle size={20} /> Auditoría
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                        className={`admin-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
                    >
                        <History size={20} /> Historial
                    </button>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div>
                            {activeTab === 'edit' && (
                                <button onClick={handleBack} className="back-btn">
                                    <ArrowLeft size={16} /> Volver al catálogo
                                </button>
                            )}
                            <h1 className="admin-title" style={{ marginTop: activeTab === 'edit' ? '0.5rem' : 0 }}>
                                {activeTab === 'catalog' ? 'Panel de Control' :
                                    activeTab === 'new' ? 'Nueva Referencia' :
                                        activeTab === 'edit' ? 'Editando Referencia' :
                                            activeTab === 'audit' ? 'Panel de Auditoría' : 'Historial de Cambios'}
                            </h1>
                        </div>
                    </div>
                    <ThemeToggle />
                </header>

                {activeTab === 'catalog' && (
                    <div className="admin-card">
                        <div className="admin-section-header">
                            <h3 style={{ margin: 0, color: 'var(--admin-text)', fontSize: '1.1rem' }}>Listado de Productos</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                                <input
                                    className="admin-input"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="Buscar por referencia..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Referencia</th>
                                        <th>Aplicaciones</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.id}>
                                            <td data-label="Referencia"><strong>{p.referencia || p.ref[0]}</strong></td>
                                            <td data-label="Aplicaciones">{p.aplicaciones.length} vehículos</td>
                                            <td data-label="Acciones" style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleEdit(p)} className="edit-action-btn">
                                                    <Edit3 size={16} /> Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="admin-card">
                        <h3 style={{ color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <AlertTriangle color="var(--admin-danger)" /> Referencias con Datos Inconsistentes
                        </h3>
                        <p style={{ color: 'var(--admin-text-muted)', marginBottom: '2rem' }}>
                            Estas referencias tienen marcada una posición global que no coincide con sus aplicaciones.
                        </p>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Referencia</th>
                                        <th>Problema Detectado</th>
                                        <th style={{ textAlign: 'right' }}>Corregir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.filter(p => {
                                        if (!p.posicion) return false;
                                        const root = p.posicion.toUpperCase();
                                        if (root === 'AMBAS') return false;

                                        return p.aplicaciones.some(app => {
                                            const appPos = app.posicion?.toUpperCase();
                                            if (!appPos) return false;
                                            if (root === 'DELANTERA' && appPos === 'TRASERA') return true;
                                            if (root === 'TRASERA' && appPos === 'DELANTERA') return true;
                                            return false;
                                        });
                                    }).map(p => (
                                        <tr key={p.id}>
                                            <td data-label="Referencia"><strong>{p.referencia || p.ref[0]}</strong></td>
                                            <td data-label="Problema" style={{ color: 'var(--admin-danger)' }}>
                                                {p.posicion === 'DELANTERA' ? 'Tiene apps TRASERAS' : 'Tiene apps DELANTERAS'}
                                            </td>
                                            <td data-label="Acción" style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleEdit(p)} className="edit-action-btn" style={{ borderColor: 'var(--admin-danger)', color: 'var(--admin-text)' }}>
                                                    <Edit3 size={16} /> Corregir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="admin-card">
                        <h3 style={{ color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <FileClock color="var(--admin-accent)" /> Historial de Cambios
                        </h3>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Producto</th>
                                        <th>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingHistory ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando historial...</td></tr>
                                    ) : historyLogs.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No hay cambios registrados aún.</td></tr>
                                    ) : historyLogs.map(log => (
                                        <tr key={log.id}>
                                            <td data-label="Fecha" style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td data-label="Usuario">{log.user}</td>
                                            <td data-label="Acción">
                                                <span className={`pos-badge ${log.action === 'CREATE' ? 'success' : 'delantera'}`}
                                                    style={{ background: log.action === 'CREATE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: log.action === 'CREATE' ? '#34d399' : '#60a5fa' }}>
                                                    {log.action === 'CREATE' ? 'CREACIÓN' : 'EDICIÓN'}
                                                </span>
                                            </td>
                                            <td data-label="Producto"><strong>{log.productRef || 'Sin Ref'}</strong></td>
                                            <td data-label="Detalles" style={{ fontSize: '0.85rem', maxWidth: '300px' }}>
                                                {log.changes?.length ? (
                                                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                                        {log.changes.map((c, i) => {
                                                            const vFormat = (v: any) => {
                                                                if (typeof v === 'object' && v !== null) {
                                                                    if ('ancho' in v && 'alto' in v) return `${v.ancho} x ${v.alto}`;
                                                                    return JSON.stringify(v);
                                                                }
                                                                return String(v);
                                                            };
                                                            return (
                                                                <li key={i}>
                                                                    <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>{c.field}:</span> {vFormat(c.old).substring(0, 30)} ➝ <span style={{ color: 'var(--admin-text)' }}>{vFormat(c.new).substring(0, 30)}</span>
                                                                </li>
                                                            );
                                                        }).slice(0, 3)}
                                                        {log.changes.length > 3 && <li>...</li>}
                                                    </ul>
                                                ) : <span style={{ color: 'var(--admin-text-muted)' }}>Sin cambios detectados</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(activeTab === 'new' || activeTab === 'edit') && (
                    <div style={{ opacity: isSaving ? 0.7 : 1, pointerEvents: isSaving ? 'none' : 'auto' }}>
                        <ErrorBoundary fallback={(error) => (
                            <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <AlertTriangle size={48} color="var(--admin-danger)" style={{ marginBottom: '1rem' }} />
                                <h2 style={{ color: 'var(--admin-text)' }}>Error al cargar el formulario</h2>
                                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>
                                    {error?.message || "Esta referencia podría tener datos corruptos o incompatibles."}
                                </p>
                                <pre style={{ color: '#64748b', fontSize: '0.7rem', background: '#000', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', maxWidth: '100%', marginBottom: '2rem' }}>
                                    {error?.stack}
                                </pre>
                                <button onClick={handleBack} className="save-all-btn" style={{ padding: '1rem 2rem' }}>
                                    Volver al catálogo
                                </button>
                            </div>
                        )}>
                            <ProductForm
                                initialData={editingProduct}
                                onSave={handleSave}
                            />
                        </ErrorBoundary>
                    </div>
                )}
            </main>

            <style>{`
                .admin-nav-btn {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border: none;
                    background: transparent;
                    color: var(--admin-text-muted);
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: left;
                    font-weight: 500;
                    width: 100%;
                }
                .admin-nav-btn:hover { background: var(--admin-glass-hover); color: var(--admin-text); }
                .admin-nav-btn.active {
                    background: var(--admin-accent);
                    color: #fff;
                    box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
                }
                .admin-logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--admin-danger);
                    background: transparent;
                    border: 1px solid var(--admin-border);
                    padding: 0.75rem 1rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    width: 100%;
                }
                .admin-table-container { overflow-x: auto; }
                .admin-table { width: 100%; border-collapse: collapse; }
                .admin-table th { text-align: left; padding: 0.75rem; color: var(--admin-text-muted); border-bottom: 1px solid var(--admin-border); }
                .admin-table td { padding: 0.75rem; border-bottom: 1px solid var(--admin-border); color: var(--admin-text); }
                .edit-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--admin-glass);
                    border: 1px solid var(--admin-border);
                    color: var(--admin-text);
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .edit-action-btn:hover { background: var(--admin-accent); border-color: transparent; }
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: none;
                    color: var(--admin-accent);
                    cursor: pointer;
                    padding: 0;
                    font-weight: 500;
                }
                .toast-notification {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    padding: 1rem 1.5rem;
                    border-radius: 1rem;
                    background: var(--admin-card-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--admin-border);
                    color: var(--admin-text);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 10000;
                    animation: slideIn 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
                }
                .toast-notification.success { border-left: 4px solid #10b981; }
                .toast-notification.error { border-left: 4px solid #ef4444; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AdminPanel;
