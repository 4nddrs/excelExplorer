# 📋 Guía de Uso - Excel Explorer

## 🎯 Inicio Rápido

### 1. Instalar dependencias

```bash
cd c:\Proyects\ExcelExplorer
npm install
```

### 2. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación se abrirá automáticamente en tu navegador en `http://localhost:5173`

## 📚 Flujo de Uso

### Paso 1: Subir archivo Excel

1. Haz clic en el área de carga o arrastra un archivo .xlsx o .xls
2. El archivo se procesará automáticamente
3. Verás los datos en una tabla interactiva

### Paso 2: Explorar los datos

- **Ordenar:** Haz clic en el encabezado de cualquier columna
- **Filtrar:** Escribe en el campo de filtro debajo de cada encabezado
- **Ver registros:** La tabla muestra cuántos registros coinciden con tus filtros

### Paso 3: Editar datos

1. Haz clic en cualquier celda para editarla
2. Escribe el nuevo valor
3. Presiona Enter o haz clic fuera para guardar
4. Los cambios se guardan automáticamente en memoria

### Paso 4: Compartir por WhatsApp

1. Encuentra el botón 🟢 en cada fila
2. Haz clic para abrir WhatsApp
3. El mensaje incluirá todos los datos de ese registro
4. Puedes editar el mensaje antes de enviarlo

### Paso 5: Exportar Excel

1. Haz clic en el botón "Exportar Excel"
2. El archivo se descargará con tus cambios
3. El nombre incluirá "\_editado" al final
4. El formato original se mantiene

### Paso 6: Cargar otro archivo

1. Haz clic en "Nuevo archivo"
2. Se limpiará la tabla actual
3. Podrás cargar un nuevo archivo

## 📊 Ejemplo de archivo Excel

Puedes probar la aplicación con cualquier archivo Excel. Aquí un ejemplo:

### Estructura sugerida:

```
| Nombre        | Email              | Teléfono      | Ciudad        | Estado  |
|---------------|-------------------|---------------|---------------|---------|
| Juan Pérez    | juan@example.com  | +54111234567  | Buenos Aires  | Activo  |
| María García  | maria@example.com | +54117654321  | Córdoba       | Activo  |
| Carlos López  | carlos@test.com   | +54119876543  | Rosario       | Inactivo|
```

## 🎨 Funcionalidades Detalladas

### Ordenamiento

- **Un clic:** Ordena ascendente (A→Z, 0→9)
- **Dos clics:** Ordena descendente (Z→A, 9→0)
- **Indicador visual:** Flechas muestran la dirección actual

### Filtrado

- **Búsqueda en tiempo real:** Los resultados se actualizan al escribir
- **Múltiples filtros:** Puedes filtrar por varias columnas a la vez
- **Case insensitive:** No distingue mayúsculas de minúsculas
- **Contador:** Muestra cuántos registros coinciden

### Edición Inline

- **Clic para editar:** No necesitas botones adicionales
- **Auto-focus:** El input se selecciona automáticamente
- **Múltiples salidas:**
  - Enter: Guarda y sale
  - Escape: Sale sin cambios
  - Click fuera: Guarda y sale

### WhatsApp

El mensaje generado tiene este formato:

```
*Nombre:* Juan Pérez
*Email:* juan@example.com
*Teléfono:* +54 11 1234-5678
*Ciudad:* Buenos Aires
*Estado:* Activo
```

## 🐛 Solución de Problemas

### El archivo no se carga

- ✅ Verifica que sea .xlsx o .xls
- ✅ Asegúrate de que tenga datos
- ✅ Revisa que la primera fila sean encabezados

### La tabla no se muestra

- ✅ Verifica que el archivo tenga al menos una fila de datos
- ✅ Revisa la consola del navegador (F12) por errores

### Los cambios no se guardan

- ✅ Asegúrate de presionar Enter o hacer clic fuera de la celda
- ✅ Los cambios están en memoria, exporta el Excel para guardarlos permanentemente

### WhatsApp no se abre

- ✅ Verifica que WhatsApp esté instalado o que uses WhatsApp Web
- ✅ El navegador puede bloquear pop-ups, revisa la configuración

## 💡 Tips y Trucos

1. **Filtrado múltiple:** Combina filtros en varias columnas para búsquedas precisas
2. **Orden antes de filtrar:** Ordena primero para ver mejor los resultados filtrados
3. **Exporta frecuentemente:** Guarda tus cambios exportando el archivo
4. **Copia de seguridad:** Mantén una copia del archivo original

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Compila para producción
npm run preview      # Previsualiza el build

# Linting
npm run lint         # Revisa el código
```

## 📦 Archivos Generados

- `*_editado.xlsx` - Archivo exportado con tus cambios
- Los archivos se descargan en tu carpeta de Descargas predeterminada

## 🎓 Conceptos Clave

### Dinámica vs Hardcodeada

Esta aplicación es **dinámica**, lo que significa:

- ✅ Funciona con cualquier Excel
- ✅ No importa cuántas columnas tenga
- ✅ No importa cómo se llamen las columnas
- ✅ Se adapta automáticamente

### Estado en React

Los datos editados se mantienen en el estado de React:

- Mientras la app esté abierta, los cambios persisten
- Si recargas la página, se pierden
- Para guardar permanentemente, exporta el archivo

### Formato Original

Al exportar, se mantiene:

- ✅ Nombres de columnas
- ✅ Orden de columnas
- ✅ Datos editados
- ✅ Formato Excel (.xlsx)

## 📞 Soporte

Si encuentras algún error o tienes sugerencias:

1. Revisa esta guía primero
2. Consulta el README.md para detalles técnicos
3. Revisa la consola del navegador (F12) para errores
4. Crea un issue con la descripción del problema

---

**¡Disfruta usando Excel Explorer! 📊✨**
