# 💻 Snippets y Ejemplos de Código

## 📚 Índice

1. [Lectura de Excel](#lectura-de-excel)
2. [Escritura de Excel](#escritura-de-excel)
3. [WhatsApp Integration](#whatsapp-integration)
4. [Filtrado y Ordenamiento](#filtrado-y-ordenamiento)
5. [Edición Inline](#edición-inline)
6. [Manejo de Errores](#manejo-de-errores)
7. [Custom Hooks](#custom-hooks)
8. [Utilidades](#utilidades)

---

## 📖 Lectura de Excel

### Método 1: Usando FileReader

```typescript
const readExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Obtener primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Procesar datos
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: unknown[]) => {
          const rowData: ExcelRow = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] ?? null;
          });
          return rowData;
        });

        resolve({ headers, rows, originalFileName: file.name });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsBinaryString(file);
  });
};
```

### Método 2: Usando ArrayBuffer (más moderno)

```typescript
const readExcelModern = async (file: File): Promise<ExcelData> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a JSON con headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return {
    headers: Object.keys(jsonData[0] || {}),
    rows: jsonData,
    originalFileName: file.name,
  };
};
```

### Leer múltiples hojas

```typescript
const readAllSheets = (file: File): Promise<Record<string, ExcelData>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: "binary" });
      const allSheets: Record<string, ExcelData> = {};

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: unknown[]) => {
          const rowData: ExcelRow = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] ?? null;
          });
          return rowData;
        });

        allSheets[sheetName] = { headers, rows };
      });

      resolve(allSheets);
    };

    reader.readAsBinaryString(file);
  });
};
```

---

## 📝 Escritura de Excel

### Exportar con estilos

```typescript
const exportWithStyles = (data: ExcelData, fileName: string) => {
  const workbook = XLSX.utils.book_new();

  // Crear datos
  const worksheetData = [
    data.headers,
    ...data.rows.map((row) => data.headers.map((h) => row[h] ?? "")),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Aplicar estilos (requiere xlsx-style)
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);

  // Estilo para encabezados
  for (let col = range.s.c; col <= range.e.c; col++) {
    const address = XLSX.utils.encode_col(col) + "1";
    if (!worksheet[address]) continue;

    worksheet[address].s = {
      fill: { fgColor: { rgb: "4472C4" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // Ajustar anchos
  worksheet["!cols"] = data.headers.map((h) => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
```

### Exportar a CSV

```typescript
const exportToCSV = (data: ExcelData, fileName: string) => {
  // Crear CSV manualmente
  const csvContent = [
    data.headers.join(","), // Headers
    ...data.rows.map((row) =>
      data.headers
        .map((h) => {
          const value = row[h];
          // Escapar comas y comillas
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
};
```

### Exportar con fórmulas

```typescript
const exportWithFormulas = (data: ExcelData) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([data.headers]);

  // Agregar datos
  data.rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 porque empezamos en fila 2

    data.headers.forEach((header, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: colIdx });
      worksheet[cell] = { v: row[header] };
    });
  });

  // Agregar fila de totales con fórmulas
  const totalRow = data.rows.length + 2;
  worksheet[`A${totalRow}`] = { v: "TOTAL" };
  worksheet[`B${totalRow}`] = {
    f: `SUM(B2:B${data.rows.length + 1})`, // Fórmula
    t: "n",
  };

  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, "data_with_formulas.xlsx");
};
```

---

## 💬 WhatsApp Integration

### Mensaje simple

```typescript
const generateSimpleMessage = (row: ExcelRow, headers: string[]): string => {
  return headers.map((h) => `${h}: ${row[h]}`).join("\n");
};

const shareOnWhatsApp = (row: ExcelRow, headers: string[]) => {
  const message = generateSimpleMessage(row, headers);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
};
```

### Mensaje con formato personalizado

```typescript
const generateFormattedMessage = (row: ExcelRow): string => {
  return `
🔔 *Nuevo Contacto*

📝 Nombre: ${row.nombre}
📧 Email: ${row.email}
📱 Teléfono: ${row.telefono}
📍 Ciudad: ${row.ciudad}

---
_Enviado desde Excel Explorer_
  `.trim();
};
```

### Enviar a número específico

```typescript
const shareToNumber = (phoneNumber: string, message: string) => {
  // Formato: código país + número sin espacios
  // Ejemplo: 5491112345678
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, "_blank");
};
```

### Mensaje con imágenes (usando API de WhatsApp Business)

```typescript
const shareWithImage = async (row: ExcelRow, imageUrl: string) => {
  const message = generateSimpleMessage(row, Object.keys(row));

  // Esto requiere WhatsApp Business API
  const response = await fetch("YOUR_WHATSAPP_API_ENDPOINT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: row.telefono,
      message,
      media: imageUrl,
    }),
  });

  return response.json();
};
```

---

## 🔍 Filtrado y Ordenamiento

### Filtro múltiple avanzado

```typescript
const advancedFilter = (
  rows: ExcelRow[],
  filters: FilterConfig,
  mode: "AND" | "OR" = "AND"
): ExcelRow[] => {
  return rows.filter((row) => {
    const matches = Object.entries(filters).map(([column, filterValue]) => {
      if (!filterValue) return true;

      const cellValue = row[column];
      if (cellValue === null || cellValue === undefined) return false;

      return String(cellValue)
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });

    return mode === "AND"
      ? matches.every((m) => m) // Todos deben coincidir
      : matches.some((m) => m); // Al menos uno debe coincidir
  });
};
```

### Ordenamiento con tipos mixtos

```typescript
const smartSort = (
  rows: ExcelRow[],
  column: string,
  direction: "asc" | "desc"
): ExcelRow[] => {
  return [...rows].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];

    // Manejar nulos
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    // Detectar tipo de dato
    const aIsNumber = typeof aVal === "number" || !isNaN(Number(aVal));
    const bIsNumber = typeof bVal === "number" || !isNaN(Number(bVal));

    if (aIsNumber && bIsNumber) {
      // Comparación numérica
      const diff = Number(aVal) - Number(bVal);
      return direction === "asc" ? diff : -diff;
    }

    // Comparación de strings
    const comparison = String(aVal).localeCompare(String(bVal));
    return direction === "asc" ? comparison : -comparison;
  });
};
```

### Búsqueda global

```typescript
const globalSearch = (rows: ExcelRow[], searchTerm: string): ExcelRow[] => {
  const term = searchTerm.toLowerCase();

  return rows.filter((row) => {
    // Busca en todos los valores de la fila
    return Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
};
```

---

## ✏️ Edición Inline

### Componente de celda editable

```typescript
const EditableCell: React.FC<{
  value: string | number | null;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
}> = ({ value, onChange, type = "text" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setLocalValue(String(value ?? ""));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
    >
      {value ?? "—"}
    </div>
  );
};
```

### Validación en edición

```typescript
const validateCell = (
  value: string,
  column: string,
  validationRules: Record<string, (v: string) => boolean>
): { valid: boolean; error?: string } => {
  const rule = validationRules[column];

  if (!rule) return { valid: true };

  if (!rule(value)) {
    return {
      valid: false,
      error: `Valor inválido para ${column}`,
    };
  }

  return { valid: true };
};

// Ejemplo de reglas
const rules = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  telefono: (v: string) => /^\+?[\d\s-()]+$/.test(v),
  edad: (v: string) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 120,
};
```

### Deshacer/Rehacer cambios

```typescript
const useUndoRedo = (initialData: ExcelRow[]) => {
  const [data, setData] = useState(initialData);
  const [history, setHistory] = useState<ExcelRow[][]>([initialData]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateData = (newData: ExcelRow[]) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setData(newData);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setData(history[currentIndex - 1]);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setData(history[currentIndex + 1]);
    }
  };

  return {
    data,
    updateData,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};
```

---

## 🚨 Manejo de Errores

### Error Boundary para React

```typescript
class ExcelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error en Excel Explorer:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Algo salió mal</h2>
          <p className="mt-4 text-gray-600">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Toast notifications

```typescript
const useToast = () => {
  const [toasts, setToasts] = useState<
    Array<{
      id: number;
      message: string;
      type: "success" | "error" | "info";
    }>
  >([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return { toasts, showToast };
};
```

---

## 🪝 Custom Hooks

### useDebounce

```typescript
const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Uso en filtros
const [filter, setFilter] = useState("");
const debouncedFilter = useDebounce(filter, 500);

useEffect(() => {
  // Solo filtra después de 500ms sin escribir
  applyFilter(debouncedFilter);
}, [debouncedFilter]);
```

### useLocalStorage

```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};

// Uso
const [excelData, setExcelData] = useLocalStorage<ExcelData | null>(
  "excelData",
  null
);
```

---

## 🛠️ Utilidades

### Formateo de datos

```typescript
const formatters = {
  currency: (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value),

  date: (value: string | Date) =>
    new Intl.DateTimeFormat("es-AR").format(new Date(value)),

  percentage: (value: number) => `${(value * 100).toFixed(2)}%`,

  phone: (value: string) => value.replace(/(\d{2})(\d{4})(\d{4})/, "+$1 $2-$3"),
};
```

### Copiar al portapapeles

```typescript
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores antiguos
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
};
```

### Descarga de archivo genérica

```typescript
const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

---

## 🎯 Snippets VSCode

Crea un archivo `.vscode/snippets.code-snippets` con:

```json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ $3 }) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ]
  }
}
```

---

**¡Estos snippets acelerarán tu desarrollo! 🚀**
