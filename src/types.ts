// Interfaces
interface Application {
    marca: string;
    serie: string;
    litros?: string;
    año: string;
    especificacion?: string;
    posicion?: string;
    [key: string]: any;
}

interface Product {
    _appId: string; // Changed from number to string for Firebase IDs
    aplicaciones: Application[];
    ref: string[];
    oem: string[];
    fmsi: string[];
    medidas: string[] | string;
    anchoNum: number;
    altoNum: number;
    posición?: string;
    imagen?: string;
    imagenes?: string[];
    _searchableText?: string;
    [key: string]: any;
}

interface FilterState {
    busqueda: string;
    marca: string;
    modelo: string;
    anio: string;
    oem: string;
    fmsi: string;
    ancho: number | null;
    alto: number | null;
    pos: string[];
    manufacturer: string | null;
    favorites: boolean;
}
