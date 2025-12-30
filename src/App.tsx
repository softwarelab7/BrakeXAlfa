import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { fetchProducts, isFirebaseConfigured, subscribeToProducts } from './services/firebase';
import Header from './components/layout/Header';

import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

import ResultsBar from './components/products/ResultsBar';
import ProductGrid from './components/products/ProductGrid';
import Pagination from './components/products/Pagination';
import ProductDetailModal from './components/modals/ProductDetailModal';
import CompareModal from './components/modals/CompareModal';
import HistoryModal from './components/modals/HistoryModal';
import GuideModal from './components/modals/GuideModal';
import NotificationPanel from './components/NotificationPanel';
import ReloadPrompt from './components/ReloadPrompt';
import './styles/global.css';
import './styles/app.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const filteredProducts = useAppStore(state => state.filteredProducts);
  const ui = useAppStore(state => state.ui);
  const setProducts = useAppStore(state => state.setProducts);
  const clearFilters = useAppStore(state => state.clearFilters);
  const setCurrentPage = useAppStore(state => state.setCurrentPage);

  // Load products on mount
  const loadProducts = useMemo(() => async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        try {
          const data = await fetchProducts();
          setProducts(data);
        } catch (firebaseError: unknown) {
          console.error('Error connecting to Firebase:', firebaseError);
          setProducts([]);
          const message = firebaseError instanceof Error ? firebaseError.message : 'Error desconocido';
          alert(`Error conectando a Firebase:\n${message}\n\nRevisa si tu base de datos Firestore está creada y si las Reglas de Seguridad permiten lectura (allow read: if true).`);
        }
      } else {
        console.error('Firebase not configured.');
        setProducts([]);
        alert("Firebase no está configurado. Por favor configura el archivo .env o edita src/services/firebase.ts");
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setProducts]);

  // Real-time updates subscription
  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadProducts();
      return;
    }

    let isInitialLoad = true;
    const unsubscribe = subscribeToProducts((newProducts, changes) => {
      setProducts(newProducts);
      if (isInitialLoad) {
        setIsLoading(false);
      }

      if (!isInitialLoad && changes) {
        const store = useAppStore.getState();

        changes.forEach((change) => {
          const data = change.doc.data();
          const pRef = data.referencia || (data.ref && data.ref[0]) || change.doc.id;

          if (change.type === 'added') {
            store.addNotification({
              type: 'data',
              title: `Referencia Agregada`,
              message: `Se ha añadido la referencia ${pRef} al catálogo.`
            });
          } else if (change.type === 'modified') {
            store.addNotification({
              type: 'data',
              title: `Referencia Actualizada`,
              message: `La referencia ${pRef} ha sido modificada.`
            });
          } else if (change.type === 'removed') {
            store.addNotification({
              type: 'data',
              title: 'Referencia Eliminada',
              message: `La referencia ${pRef} ha sido retirada.`
            });
          }
        });
      }
      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, [loadProducts, setProducts]);

  // Pagination
  const { currentPage, itemsPerPage } = ui;
  const totalResults = filteredProducts.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalResults);
  const paginatedProducts = useMemo(() =>
    filteredProducts.slice(startIndex, endIndex),
    [filteredProducts, startIndex, endIndex]
  );

  return (
    <div className="app">
      <Header />

      <div className="main-layout">
        <div className="filters-column">
          <Sidebar />
        </div>

        <main className="results-panel">
          <div className="content-wrapper">
            <ResultsBar
              totalResults={totalResults}
              currentStart={startIndex + 1}
              currentEnd={endIndex}
            />

            <ProductGrid
              products={paginatedProducts}
              loading={isLoading}
              onClearFilters={clearFilters}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>
      </div>

      <Footer />

      <NotificationPanel />
      <ReloadPrompt />

      {/* Modals */}
      <ProductDetailModal />
      <CompareModal />
      <HistoryModal />
      <GuideModal />
    </div>
  );
}

export default App;
