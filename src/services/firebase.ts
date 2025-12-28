import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit, writeBatch, doc, onSnapshot, type DocumentChange } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Product } from '../types';

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Collections
export const productsCollection = collection(db, 'pastillas');

// Real-time subscription
export const subscribeToProducts = (callback: (products: Product[], changes: DocumentChange[]) => void) => {
    return onSnapshot(productsCollection, (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data() as Omit<Product, 'id'>
            });
        });
        callback(products, snapshot.docChanges());
    }, (error) => {
        console.error("Error subscribing to products:", error);
    });
};

// Seed Database with Mock Data
export const seedDatabase = async () => {
    const products = getMockProducts();
    const batchSize = 500; // Firebase batch limit
    const chunks = [];

    for (let i = 0; i < products.length; i += batchSize) {
        chunks.push(products.slice(i, i + batchSize));
    }

    let totalUploaded = 0;

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((product) => {
            const docRef = doc(productsCollection, product.id || undefined); // Use ID if present, otherwise auto-id
            // Remove helper properties if any, keep raw data
            const productData = { ...product };
            batch.set(docRef, productData);
        });
        await batch.commit();
        totalUploaded += chunk.length;
        console.log(`Uploaded batch of ${chunk.length} products. Total: ${totalUploaded}`);
    }

    return totalUploaded;
};

// Fetch all products
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const querySnapshot = await getDocs(productsCollection);
        const products: Product[] = [];

        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data() as Omit<Product, 'id'>
            });
        });

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Fetch products by position
export const fetchProductsByPosition = async (position: string): Promise<Product[]> => {
    try {
        const q = query(
            productsCollection,
            where('posicion', 'in', [position.toUpperCase(), 'AMBAS'])
        );

        const querySnapshot = await getDocs(q);
        const products: Product[] = [];

        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data() as Omit<Product, 'id'>
            });
        });

        return products;
    } catch (error) {
        console.error('Error fetching products by position:', error);
        throw error;
    }
};

// Search products by reference
export const searchByReference = async (reference: string): Promise<Product[]> => {
    try {
        const q = query(
            productsCollection,
            where('referencia', '>=', reference),
            where('referencia', '<=', reference + '\uf8ff'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const products: Product[] = [];

        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data() as Omit<Product, 'id'>
            });
        });

        return products;
    } catch (error) {
        console.error('Error searching by reference:', error);
        throw error;
    }
};

// Mock data for development (remove when Firebase is configured)
export const getMockProducts = (): Product[] => {
    return Array.from({ length: 723 }, (_, i) => ({
        id: `product-${i + 1}`,
        referencia: `D${100 + i}`,
        ref: [`${String(i + 1).padStart(6, '0')}INC`, `D${100 + i}`],
        oem: [`OEM-${i + 1}`, `OEM-${i + 2}`],
        fmsi: [`FMSI-${i + 1}`],
        fabricante: ['Autopar', 'Frasle', 'Jurid', 'Brembo', 'Bosch'][i % 5],
        posicion: ['DELANTERA', 'TRASERA', 'AMBAS'][i % 3] as 'DELANTERA' | 'TRASERA' | 'AMBAS',
        imagenes: [
            'https://via.placeholder.com/200x150?text=Brake+Pad',
            'https://via.placeholder.com/200x150?text=Detail+View'
        ],
        aplicaciones: [
            {
                marca: ['Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Toyota', 'Honda', 'Mazda', 'Volkswagen', 'Renault'][i % 10],
                modelo: ['Aveo', 'Spark', 'Cruze', 'Malibu', 'Silverado', 'Corolla', 'Civic', '3', 'Jetta', 'Logan'][i % 10],
                año: `${2010 + (i % 15)}`
            },
            {
                marca: ['Fiat', 'Peugeot', 'Citroën', 'Mg', 'Ram', 'Acura', 'Jetour'][i % 7],
                modelo: ['Uno', '208', 'C3', 'ZS', '1500', 'TLX', 'X70'][i % 7],
                año: `${2012 + (i % 12)}`
            }
        ],
        medidas: {
            ancho: 100 + (i % 50),
            alto: 40 + (i % 30)
        }
    }));
};
