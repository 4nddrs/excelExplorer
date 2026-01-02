# 📊 Excel Explorer

Aplicación web desarrollada con **React + TypeScript + Tailwind CSS** que permite cargar, visualizar, editar y exportar archivos Excel de forma interactiva.

## 🚀 Características

- ✅ **Subida de archivos Excel** (.xlsx, .xls)
- ✅ **Tabla interactiva dinámica** (se adapta a cualquier estructura de Excel)
- ✅ **Ordenamiento de columnas** (ascendente/descendente)
- ✅ **Filtrado por texto** en múltiples columnas simultáneamente
- ✅ **Edición inline** de celdas (haz clic para editar)
- ✅ **Exportación a Excel** manteniendo el formato
- ✅ **Compartir por WhatsApp** cada registro con un clic
- ✅ **Manejo de errores** robusto
- ✅ **Diseño responsivo** con Tailwind CSS

## 🧩 Stack Técnico

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server ultra rápido
- **Tailwind CSS** - Framework de CSS utility-first
- **xlsx** - Librería para leer/escribir archivos Excel
- **ESLint** - Linting de código

## 📂 Estructura del Proyecto

```
ExcelExplorer/
├── src/
│   ├── components/
│   │   ├── FileUploader.tsx      # Componente para subir archivos
│   │   └── ExcelTable.tsx        # Tabla interactiva con todas las funcionalidades
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript
│   ├── utils/
│   │   └── excelUtils.ts         # Utilidades para leer/escribir Excel
│   ├── App.tsx                   # Componente principal
│   ├── main.tsx                  # Punto de entrada
│   └── index.css                 # Estilos globales
├── public/                       # Archivos estáticos
├── index.html                    # HTML principal
├── package.json                  # Dependencias
├── tsconfig.json                 # Configuración TypeScript
├── tailwind.config.js            # Configuración Tailwind
├── vite.config.ts                # Configuración Vite
└── README.md                     # Este archivo
```

## 🛠️ Instalación y Ejecución

### Requisitos previos

- Node.js >= 16.x
- npm >= 8.x

### Pasos de instalación

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación se abrirá en `http://localhost:5173`

3. **Compilar para producción:**

   ```bash
   npm run build
   ```

4. **Previsualizar build de producción:**
   ```bash
   npm run preview
   ```

## 📖 Cómo Funciona

### 1. 📤 Lectura del archivo Excel

**Archivo:** `src/utils/excelUtils.ts` → función `readExcelFile()`

```typescript
// La función lee el archivo usando FileReader
const reader = new FileReader();
reader.readAsBinaryString(file);

// Luego usa la librería xlsx para parsear el contenido
const workbook = XLSX.read(data, { type: "binary" });
const worksheet = workbook.Sheets[firstSheetName];

// Convierte la hoja a JSON dinámicamente
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Separa encabezados y datos
const headers = jsonData[0]; // Primera fila
const rows = jsonData.slice(1); // Resto de filas
```

**¿Por qué es dinámico?**

- No hardcodea nombres de columnas
- Se adapta automáticamente a cualquier estructura
- Los encabezados se extraen de la primera fila del Excel

### 2. ✏️ Edición de celdas

**Archivo:** `src/components/ExcelTable.tsx` → `handleCellEdit()`

```typescript
// Al hacer clic en una celda, se activa el modo edición
onClick={() => setEditingCell({ rowIndex, column: header })}

// El input muestra el valor actual
<input
  value={row[header]}
  onChange={(e) => handleCellEdit(rowIndex, header, e.target.value)}
/>

// La función actualiza el estado inmediatamente
const handleCellEdit = (rowIndex, column, value) => {
  const newRows = [...data.rows];
  newRows[rowIndex][column] = value;
  onDataChange(newRows);  // Propaga el cambio al componente padre
};
```

**Características:**

- Edición inline (sin modales)
- Se guarda automáticamente al perder foco
- Presiona Enter o Escape para salir del modo edición
- Los cambios se mantienen en el estado de React

### 3. 🔍 Filtrado y ordenamiento

**Filtrado:**

```typescript
// Filtra por texto en cualquier columna
filtered = filtered.filter((row) => {
  const cellValue = row[column];
  return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
});
```

**Ordenamiento:**

```typescript
// Ordena dinámicamente por la columna seleccionada
filtered.sort((a, b) => {
  const aValue = a[sortConfig.key];
  const bValue = b[sortConfig.key];
  // Compara valores ascendente o descendentemente
  return sortConfig.direction === "asc" ? compare(a, b) : compare(b, a);
});
```

### 4. 📤 Exportación a Excel

**Archivo:** `src/utils/excelUtils.ts` → función `exportToExcel()`

```typescript
// Reconstruye el formato original del Excel
const worksheetData = [
  data.headers, // Encabezados
  ...data.rows.map(
    (row) => data.headers.map((header) => row[header] ?? "") // Datos editados
  ),
];

// Crea la hoja de trabajo
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Ajusta anchos de columna automáticamente
worksheet["!cols"] = colWidths;

// Genera y descarga el archivo
XLSX.writeFile(workbook, `${fileName}.xlsx`);
```

**Mantiene el formato:**

- ✅ Estructura de columnas original
- ✅ Nombres de encabezados
- ✅ Datos editados
- ✅ Ajuste automático de ancho de columnas

### 5. 💬 Compartir por WhatsApp

**Archivo:** `src/utils/excelUtils.ts` → `generateWhatsAppLink()`

```typescript
// Genera el mensaje con todos los campos del registro
const generateWhatsAppMessage = (row, headers) => {
  return headers
    .map((header) => `*${header}:* ${row[header] ?? "N/A"}`)
    .join("\n"); // Saltos de línea entre campos
};

// Crea el enlace de WhatsApp con el mensaje codificado
const generateWhatsAppLink = (row, headers) => {
  const message = generateWhatsAppMessage(row, headers);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
};
```

**Ejemplo de mensaje generado:**

```
*Nombre:* Juan Pérez
*Email:* juan@example.com
*Teléfono:* +54 11 1234-5678
*Ciudad:* Buenos Aires
```

**En la tabla:**

```tsx
<a
  href={generateWhatsAppLink(row, data.headers)}
  target="_blank"
  rel="noopener noreferrer"
>
  🟢
</a>
```

## 🎨 Componentes Principales

### `App.tsx`

- Componente raíz de la aplicación
- Gestiona el estado global (datos del Excel, errores, loading)
- Coordina la comunicación entre componentes
- Maneja la exportación y el reset

### `FileUploader.tsx`

- Componente de carga de archivos
- Soporta drag & drop y click
- Valida formato de archivo (.xlsx, .xls)
- Muestra estado de carga

### `ExcelTable.tsx`

- Tabla interactiva completa
- Gestiona ordenamiento, filtrado y edición
- Totalmente dinámica (no hardcodeada)
- Genera enlaces de WhatsApp para cada fila

## 🧠 Características Avanzadas

### Solución dinámica

La aplicación **NO** está hardcodeada para columnas específicas:

```typescript
// ❌ MAL: Hardcodeado
<td>{row.nombre}</td>
<td>{row.email}</td>

// ✅ BIEN: Dinámico
{data.headers.map(header => (
  <td key={header}>{row[header]}</td>
))}
```

Esto permite que funcione con **cualquier archivo Excel**, sin importar:

- Cantidad de columnas
- Nombres de columnas
- Tipo de datos

### Manejo de errores

```typescript
// Validación de formato
if (!validExtensions.includes(fileExtension)) {
  alert("Archivo no válido");
  return;
}

// Try-catch en operaciones críticas
try {
  const data = await readExcelFile(file);
  setExcelData(data);
} catch (err) {
  setError(err.message);
}

// Validación de datos vacíos
if (jsonData.length === 0) {
  throw new Error("Excel vacío");
}
```

### Optimizaciones

1. **useMemo** para datos procesados (evita recalcular en cada render)
2. **Estado local** para edición (no re-renderiza toda la tabla)
3. **Lazy rendering** con virtualización (para archivos muy grandes, se puede implementar)

## 🐛 Manejo de Errores

La aplicación maneja los siguientes casos:

- ❌ Archivo con formato inválido (no Excel)
- ❌ Archivo Excel vacío
- ❌ Hoja sin datos
- ❌ Error de lectura del archivo
- ❌ Error de exportación
- ✅ Muestra mensajes de error claros al usuario
- ✅ No rompe la aplicación

## 🚀 Próximas Mejoras (Opcional)

- [ ] Soporte para múltiples hojas
- [ ] Exportar a CSV
- [ ] Deshacer/Rehacer cambios
- [ ] Validación de tipos de datos
- [ ] Paginación para archivos muy grandes
- [ ] Gráficos y estadísticas
- [ ] Guardar en localStorage

## 📝 Notas Técnicas

### ¿Por qué Vite y no Create React App?

- ⚡ Vite es mucho más rápido (usa ESBuild)
- 🔥 Hot Module Replacement instantáneo
- 📦 Bundles más pequeños
- 🎯 Configuración mínima

### ¿Por qué xlsx?

- 📊 Librería más popular para Excel en JavaScript
- ✅ Soporta lectura y escritura
- 🔧 Mantiene el formato original
- 📖 Excelente documentación

### ¿Por qué Tailwind CSS?

- 🎨 Utility-first (rápido desarrollo)
- 📱 Responsivo por defecto
- 🎯 No hay CSS custom innecesario
- 🔧 Altamente configurable

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado como ejemplo de aplicación React + TypeScript profesional.

---

**¿Preguntas o sugerencias?** Abre un issue en el repositorio.
