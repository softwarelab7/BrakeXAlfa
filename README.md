# 🚗 BRAKE X HUB - React Application

Una aplicación web moderna para consulta de pastillas de freno, construida con React, TypeScript, y Vite.

![BRAKE X HUB](https://img.shields.io/badge/BRAKE-X_HUB-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)

## 📋 Descripción

**BRAKE X HUB** es una aplicación web profesional diseñada para facilitar la búsqueda y consulta de pastillas de freno. Ofrece un catálogo completo con más de 700 productos, filtros avanzados, y una experiencia de usuario excepcional.

### ✨ Características Principales

- 🔍 **Búsqueda Inteligente**: Busca por referencia, OEM, FMSI
- 🚙 **Filtros Avanzados**: Marca, modelo, año, posición
- ❤️ **Sistema de Favoritos**: Guarda tus productos preferidos
- ⚖️ **Comparación**: Compara hasta 4 productos simultáneamente
- 🕒 **Historial**: Registro de búsquedas anteriores
- 🎨 **Temas**: Light y Dark Mode
- 📱 **Responsive**: Diseño adaptable a todos los dispositivos
- 💎 **Glassmorphism**: Efectos visuales modernos

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3 | Framework UI |
| TypeScript | 5.6 | Tipado estático |
| Vite | 5.4 | Build tool |
| Zustand | 5.0 | State management |
| Firebase | 11.0 | Backend & Database |
| Lucide React | 0.468 | Iconos |

## 📁 Estructura del Proyecto

```
brake-x-react/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── FloatingButtons.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ResultsBar.tsx
│   │   │   └── Pagination.tsx
│   │   └── filters/
│   │       ├── SearchBox.tsx
│   │       ├── VehicleFilters.tsx
│   │       └── BrandTags.tsx
│   ├── store/
│   │   └── useAppStore.ts
│   ├── services/
│   │   └── firebase.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── header.css
│   │   ├── sidebar.css
│   │   ├── product-card.css
│   │   └── [otros...]
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd brake-x-react

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Scripts Disponibles

```bash
npm run dev          # Iniciar desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de build
npm run lint         # Ejecutar linter
```

## 🎨 Temas

La aplicación incluye 2 temas personalizados:

### 🌞 Light Mode
- Fondo claro (#f8fafc)
- Bordes suaves
- Contraste óptimo para luz diurna

### 🌙 Dark Mode
- Fondo oscuro (#0f172a)
- Reducción de fatiga visual
- Perfecto para uso nocturno


## 🔧 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Copia las credenciales de configuración
3. Actualiza `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

4. Estructura de la colección `products`:

```javascript
{
  referencia: string,
  ref: string[],
  oem: string[],
  fmsi: string[],
  fabricante: string,
  posicion: "DELANTERA" | "TRASERA" | "AMBAS",
  imagenes: string[],
  aplicaciones: [
    { marca: string, modelo: string, año: string }
  ],
  medidas: { ancho: number, alto: number }
}
```

## 📊 Características de Filtrado

### Búsqueda Rápida
- Busca por cualquier referencia (REF, OEM, FMSI)
- Resultados en tiempo real
- Sin límites de caracteres

### Filtros de Vehículo
- **Marca**: Selecciona la marca del vehículo
- **Modelo**: Modelos disponibles para la marca
- **Año**: Rango de años 2010-2025

### Posición
- Delantera
- Trasera
- Ambas (muestra ambas posiciones)

### Brand Tags
17 marcas principales disponibles:
- Mg, Ram, Acura, Jetour
- Chevrolet, Nissan, Hyundai, Kia
- Ford, Toyota, Honda, Mazda
- Volkswagen, Renault, Fiat, Peugeot, Citroën

### Referencias
- **OEM**: Código del fabricante original
- **FMSI**: Friction Material Standards Institute

### Medidas
- **Ancho**: En milímetros
- **Alto**: En milímetros

## 🎯 Estado de la Aplicación (Zustand)

El estado global se maneja con Zustand y persiste en localStorage:

```typescript
{
  products: Product[],           // Todos los productos
  filteredProducts: Product[],   // Productos filtrados
  filters: Filters,              // Estado de filtros
  favorites: string[],           // IDs de favoritos
  comparisons: string[],         // IDs en comparación (max 4)
  searchHistory: SearchHistory[], // Historial
  theme: Theme,                  // Tema actual
  ui: UIState                    // Estado UI
}
```

## 💾 Persistencia

Los siguientes datos se guardan en localStorage:
- ✅ Favoritos
- ✅ Productos en comparación
- ✅ Historial de búsquedas
- ✅ Tema seleccionado

## 🎨 Colores de la Marca

```css
/* Badges */
--badge-notification: #f97316  /* Naranja */
--badge-compare: #06b6d4       /* Cyan */
--badge-favorite: #FF3040      /* Rojo */

/* Posiciones */
--badge-delantera-bg: #3b82f6  /* Azul */
--badge-trasera-bg: #ef4444    /* Rojo */

/* Referencias */
--badge-blue: #3b82f6
--badge-red: #ef4444
--badge-green: #10b981
--badge-yellow: #f59e0b
```

## 📱 Responsive Design

Breakpoints:
- **Mobile**: < 480px
- **Tablet**: 768px
- **Desktop**: 1024px
- **Large**: 1200px

## 🔗 API de Componentes

### ProductCard

```tsx
<ProductCard product={product} />
```

**Props:**
- `product`: Objeto Product completo

**Características:**
- Header con badge de posición
- Iconos de comparar y favoritos
- Imagen del producto
- Badges de referencias
- Lista de aplicaciones
- Medidas
- Botón "Ver Detalles"

### ProductGrid

```tsx
<ProductGrid 
  products={products}
  onClearFilters={handleClear}
/>
```

**Props:**
- `products`: Array de productos a mostrar
- `onClearFilters`: Callback para limpiar filtros

### ResultsBar

```tsx
<ResultsBar
  totalResults={723}
  currentStart={1}
  currentEnd={24}
/>
```

**Props:**
- `totalResults`: Total de productos
- `currentStart`: Índice inicial
- `currentEnd`: Índice final

## 🌐 SEO

Meta tags implementados:
- ✅ Title
- ✅ Description
- ✅ Keywords
- ✅ Author
- ✅ Theme Color
- ✅ Lang (es)

## 🚧 Próximas Funcionalidades

- [ ] Modal de detalles de producto
- [ ] Modal de comparación
- [ ] Modal de favoritos
- [ ] Modal de historial
- [ ] Paginación completa
- [ ] Exportar a PDF/Excel
- [ ] Compartir productos
- [ ] Notificaciones toast
- [ ] Autenticación de usuarios
- [ ] Sistema de reviews

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

**Brake X Team**
- GitHub: [@brake-x](https://github.com)
- Email: contact@brakex.com

## 🙏 Agradecimientos

- **Google Gemini** - AI Assistant
- **Vite Team** - Amazing build tool
- **React Team** - Framework
- **Lucide** - Beautiful icons

## 📸 Screenshots


---

**Made with ❤️ by Brake X Team**

*Consulta rápida. Frenado seguro.*
