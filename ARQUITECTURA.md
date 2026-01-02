# 🏗️ Arquitectura y Decisiones Técnicas

## 📐 Principios de Diseño

### 1. Separación de Responsabilidades

La aplicación sigue el principio de **Single Responsibility Principle (SRP)**:

```
src/
├── components/        → Componentes visuales (UI)
├── types/            → Definiciones de tipos TypeScript
├── utils/            → Lógica de negocio y utilidades
└── App.tsx           → Orquestación y estado global
```

### 2. Composición de Componentes

```typescript
App
├── FileUploader      → Responsable solo de subir archivos
└── ExcelTable        → Responsable solo de mostrar/editar datos
```

Cada componente es **independiente** y **reutilizable**.

### 3. Unidirectional Data Flow

```
App (Estado Global)
  ↓ props
FileUploader / ExcelTable (Componentes)
  ↑ callbacks
App (Actualiza estado)
```

## 🧩 Decisiones Técnicas

### ¿Por qué TypeScript?

**Ventajas:**

- ✅ Detección de errores en tiempo de desarrollo
- ✅ Autocompletado inteligente
- ✅ Refactoring seguro
- ✅ Documentación viva del código

**Ejemplo:**

```typescript
// ❌ JavaScript: Error en runtime
const message = generateMessage(row.nombre); // Si no existe "nombre"

// ✅ TypeScript: Error en desarrollo
interface ExcelRow {
  [key: string]: string | number | boolean | null;
}
const message = generateMessage(row); // Tipado seguro
```

### ¿Por qué xlsx y no otra librería?

**Comparación:**

| Librería | Tamaño | Lectura | Escritura | Popularidad |
| -------- | ------ | ------- | --------- | ----------- |
| xlsx     | ~700KB | ✅      | ✅        | ⭐⭐⭐⭐⭐  |
| exceljs  | ~1.2MB | ✅      | ✅        | ⭐⭐⭐⭐    |
| sheetjs  | ~600KB | ✅      | ❌        | ⭐⭐⭐      |

**Decisión:** xlsx por su balance entre tamaño, funcionalidad y comunidad.

### ¿Por qué Tailwind CSS?

**Alternativas consideradas:**

- CSS Modules → Más verboso
- Styled Components → Bundle más pesado
- CSS puro → Menos productivo

**Ventajas de Tailwind:**

```tsx
// ❌ CSS tradicional
<button className="export-button">Exportar</button>
// Necesitas crear un archivo CSS aparte

// ✅ Tailwind
<button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
  Exportar
</button>
// Todo en un solo lugar, altamente componible
```

### ¿Por qué Vite?

**Comparación con Create React App:**

| Característica   | Vite        | CRA            |
| ---------------- | ----------- | -------------- |
| Tiempo de inicio | ~300ms      | ~3-5s          |
| HMR              | Instantáneo | 1-3s           |
| Build            | Rollup      | Webpack        |
| Tamaño config    | Mínimo      | Medio          |
| TypeScript       | Nativo      | Necesita setup |

**Decisión:** Vite por velocidad de desarrollo.

## 🎯 Patrones de Diseño Implementados

### 1. Controlled Components

```typescript
// Estado controlado por React
const [filters, setFilters] = useState<FilterConfig>({});

<input
  value={filters[header] || ""}
  onChange={(e) => handleFilterChange(header, e.target.value)}
/>;
```

**Ventaja:** React es la única fuente de verdad.

### 2. Lifting State Up

```typescript
// Estado en el componente padre
const [excelData, setExcelData] = useState<ExcelData | null>(null);

// Pasa callbacks a los hijos
<ExcelTable
  data={excelData}
  onDataChange={handleDataChange} // Callback
/>;
```

**Ventaja:** Un solo lugar maneja el estado global.

### 3. Render Props Pattern (implícito)

```typescript
// El componente recibe funciones como props
interface ExcelTableProps {
  data: ExcelData;
  onDataChange: (newRows: ExcelRow[]) => void; // Función
}
```

### 4. Custom Hooks (potencial mejora)

**Implementación futura:**

```typescript
// Hook personalizado para manejar Excel
const useExcelData = () => {
  const [data, setData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFile = async (file: File) => {
    setIsLoading(true);
    const result = await readExcelFile(file);
    setData(result);
    setIsLoading(false);
  };

  return { data, isLoading, loadFile };
};
```

## 🔄 Flujo de Datos

### 1. Carga de archivo

```
Usuario selecciona archivo
  ↓
FileUploader recibe File
  ↓
App.handleFileUpload()
  ↓
readExcelFile(file) en utils
  ↓
FileReader lee binario
  ↓
xlsx parsea contenido
  ↓
Formato ExcelData
  ↓
setExcelData() actualiza estado
  ↓
Re-render con datos
```

### 2. Edición de celda

```
Usuario hace clic en celda
  ↓
ExcelTable.setEditingCell()
  ↓
Usuario escribe nuevo valor
  ↓
ExcelTable.handleCellEdit()
  ↓
onDataChange callback
  ↓
App.handleDataChange()
  ↓
setExcelData() actualiza estado
  ↓
Re-render con cambios
```

### 3. Exportación

```
Usuario hace clic en "Exportar"
  ↓
App.handleExport()
  ↓
exportToExcel() en utils
  ↓
xlsx genera workbook
  ↓
XLSX.writeFile() descarga
```

## 🎨 Optimizaciones Implementadas

### 1. useMemo para datos procesados

```typescript
const processedData = useMemo(() => {
  // Filtra y ordena
  let filtered = [...data.rows];
  // ... lógica de procesamiento
  return filtered;
}, [data.rows, filters, sortConfig]); // Solo recalcula si cambian estas deps
```

**Impacto:** Evita reprocesar datos en cada render.

### 2. Estado local para edición

```typescript
// Estado local, no dispara re-render global
const [editingCell, setEditingCell] = useState<...>(null);
```

**Impacto:** Editar una celda no re-renderiza toda la tabla.

### 3. Event Delegation (implícito en React)

React usa event delegation internamente, pero nosotros lo aprovechamos:

```typescript
// Un solo handler en la fila padre
<tr onClick={handleRowClick}>{/* Múltiples celdas */}</tr>
```

### 4. Lazy Loading del archivo

```typescript
// FileReader es asíncrono, no bloquea el UI
reader.readAsBinaryString(file);
```

## 🔒 Manejo de Errores

### Estrategia de Defensa en Profundidad

```typescript
// Nivel 1: Validación en UI
if (!validExtensions.includes(fileExtension)) {
  alert("Archivo inválido");
  return;
}

// Nivel 2: Try-catch en operaciones
try {
  const data = await readExcelFile(file);
} catch (err) {
  setError(err.message);
}

// Nivel 3: Validación de datos
if (jsonData.length === 0) {
  throw new Error("Excel vacío");
}

// Nivel 4: Valores por defecto
const value = row[header] ?? "N/A";
```

## 📊 TypeScript: Tipos y Interfaces

### Tipo vs Interface

**Regla:** Usamos `interface` para objetos y `type` para uniones/intersecciones.

```typescript
// Interface para objetos
interface ExcelData {
  headers: string[];
  rows: ExcelRow[];
}

// Type para mapeos dinámicos
type ExcelRow = Record<string, string | number | boolean | null>;
type FilterConfig = Record<string, string>;
```

### Genéricos (potencial mejora)

```typescript
// Función genérica para ordenar cualquier array
function sortArray<T>(arr: T[], key: keyof T): T[] {
  return arr.sort((a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  });
}
```

## 🚀 Mejoras Futuras

### 1. Context API para estado global

```typescript
// ExcelContext.tsx
const ExcelContext = createContext<ExcelContextType | null>(null);

export const ExcelProvider = ({ children }) => {
  const [data, setData] = useState<ExcelData | null>(null);

  return (
    <ExcelContext.Provider value={{ data, setData }}>
      {children}
    </ExcelContext.Provider>
  );
};
```

### 2. React Query para caching

```typescript
const { data, isLoading } = useQuery(
  ["excel", fileId],
  () => readExcelFile(file),
  { staleTime: 5 * 60 * 1000 } // Cache por 5 minutos
);
```

### 3. Virtualization para tablas grandes

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// Renderiza solo las filas visibles
const virtualizer = useVirtualizer({
  count: data.rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Altura de fila
});
```

### 4. Web Workers para parsing

```typescript
// excelWorker.ts
self.onmessage = (e) => {
  const result = XLSX.read(e.data, { type: "binary" });
  self.postMessage(result);
};

// En el componente
const worker = new Worker("./excelWorker.ts");
worker.postMessage(fileData);
```

## 📈 Métricas de Rendimiento

### Lighthouse Score (objetivo)

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 85

### Core Web Vitals

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## 🧪 Testing (sugerencias)

### Unit Tests

```typescript
// excelUtils.test.ts
describe("readExcelFile", () => {
  it("should read valid Excel file", async () => {
    const file = new File([mockData], "test.xlsx");
    const result = await readExcelFile(file);
    expect(result.headers).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// App.test.tsx
it("should load and display Excel data", async () => {
  render(<App />);
  const file = new File([mockExcel], "test.xlsx");
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => {
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
  });
});
```

## 📚 Referencias

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Este documento está vivo y debe actualizarse con cada decisión técnica importante.**
