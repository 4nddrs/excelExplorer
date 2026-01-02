import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { ExcelData, ExcelRow, SPECIAL_COLUMNS } from "../types";

/**
 * Convierte un buffer de bytes a base64 en el navegador
 */
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Normaliza el valor de estado al leer del Excel
 */
const normalizeStatusValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return (
      lower === "✅" ||
      lower === "true" ||
      lower === "si" ||
      lower === "sí" ||
      lower === "1" ||
      lower === "activo"
    );
  }
  if (typeof value === "number") return value === 1;
  return false; // Por defecto false (✖️)
};

/**
 * Lee un archivo Excel y lo convierte a un formato manejable, incluyendo imágenes
 * @param file - Archivo Excel (.xlsx, .xls)
 * @returns Promesa con los datos del Excel
 */
export const readExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("El archivo Excel está vacío");
      }

      // Extraer imágenes del workbook (aunque no estén asociadas a celdas específicas)
      const imagesByRow = new Map<number, string>();
      const images = worksheet.getImages();

      console.log("Total de imágenes en worksheet:", images.length);
      console.log("Total de media en workbook:", workbook.model.media.length);

      // Si worksheet.getImages() está vacío pero hay media en el workbook,
      // intentar asignar imágenes por orden de filas altas (que suelen contener imágenes)
      if (images.length === 0 && workbook.model.media.length > 0) {
        console.log(
          "Usando método alternativo: asignando imágenes por orden de filas"
        );

        // Obtener filas con altura mayor a 50 (probablemente tienen imágenes)
        const tallRows: number[] = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1 && row.height && row.height > 50) {
            tallRows.push(rowNumber);
          }
        });

        console.log("Filas altas detectadas:", tallRows);

        // Asignar imágenes a filas altas en orden
        tallRows.forEach((rowNum, index) => {
          if (index < workbook.model.media.length) {
            const img = workbook.model.media[index];
            if (img && img.buffer) {
              const base64 = bufferToBase64(img.buffer);
              const extension = img.extension || "png";
              const mimeType =
                extension === "png"
                  ? "image/png"
                  : extension === "jpg" || extension === "jpeg"
                  ? "image/jpeg"
                  : extension === "gif"
                  ? "image/gif"
                  : "image/png";
              const dataUrl = `data:${mimeType};base64,${base64}`;

              console.log("Asignando imagen", index, "a fila", rowNum);
              imagesByRow.set(rowNum, dataUrl);
            }
          }
        });
      } else {
        // Método original para imágenes correctamente vinculadas
        images.forEach((imageData) => {
          const imageId = Number(imageData.imageId);
          if (isNaN(imageId) || imageId < 1) return;

          const img = workbook.model.media[imageId - 1];

          if (img && img.buffer) {
            const base64 = bufferToBase64(img.buffer);
            const extension = img.extension || "png";
            const mimeType =
              extension === "png"
                ? "image/png"
                : extension === "jpg" || extension === "jpeg"
                ? "image/jpeg"
                : extension === "gif"
                ? "image/gif"
                : "image/png";
            const dataUrl = `data:${mimeType};base64,${base64}`;

            const rowNum = imageData.range.tl.nativeRow;
            console.log(
              "Imagen mapeada a fila:",
              rowNum,
              "Tamaño base64:",
              base64.length
            );
            imagesByRow.set(rowNum, dataUrl);
          }
        });
      }

      // Obtener headers de la primera fila
      const firstRow = worksheet.getRow(1);
      const headers: string[] = [];
      const photoColumnIndex = new Map<number, string>();

      firstRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const headerName = String(cell.value || `Columna ${colNumber}`);
        headers[colNumber - 1] = headerName;

        // Detectar columnas de fotos
        const lower = headerName.toLowerCase();
        if (
          lower.includes("foto") ||
          lower.includes("imagen") ||
          lower.includes("picture") ||
          lower.includes("image")
        ) {
          photoColumnIndex.set(colNumber - 1, headerName);
        }
      });

      // Si no existe la columna "estado", agregarla
      const hasStatusColumn = headers.some(
        (h) => h && h.toLowerCase() === SPECIAL_COLUMNS.STATUS
      );
      if (!hasStatusColumn) {
        headers.push(SPECIAL_COLUMNS.STATUS);
      }

      // Leer las filas de datos
      const rows: ExcelRow[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: ExcelRow = {};
        let hasData = false;

        headers.forEach((header, colIndex) => {
          if (!header) return;

          const cell = row.getCell(colIndex + 1);

          // Manejo especial para columnas de fotos
          if (photoColumnIndex.has(colIndex)) {
            // Primero verificar si hay imagen embebida en esta fila
            if (imagesByRow.has(rowNumber)) {
              const imageUrl = imagesByRow.get(rowNumber)!;
              console.log(
                "✅ Asignando imagen a fila",
                rowNumber,
                "columna",
                header,
                "tamaño:",
                imageUrl.substring(0, 50) + "..."
              );
              rowData[header] = imageUrl;
              hasData = true;
            } else {
              // Si no hay imagen embebida, intentar leer el valor de la celda
              const value = cell.value;

              if (value && typeof value === "object" && "error" in value) {
                // Celda con error - marcar como sin foto
                console.log(
                  "⚠️ Celda de foto con error en fila",
                  rowNumber,
                  "- asignando null"
                );
                rowData[header] = null;
              } else if (value && typeof value === "string") {
                // Puede ser una URL o path de archivo
                if (
                  value.startsWith("http://") ||
                  value.startsWith("https://") ||
                  value.startsWith("data:image/")
                ) {
                  rowData[header] = value;
                  hasData = true;
                } else {
                  // Path de archivo local - no se puede mostrar en web
                  console.log("📁 Path de archivo local detectado:", value);
                  rowData[header] = null;
                }
              } else if (value && typeof value === "object") {
                // Si es un objeto diferente, registrarlo y asignar null
                console.log("❌ Objeto no manejado en celda foto:", value);
                rowData[header] = null;
              } else {
                rowData[header] = null;
              }
            }
          } else if (header.toLowerCase() === SPECIAL_COLUMNS.STATUS) {
            rowData[header] = normalizeStatusValue(cell.value);
            // No contamos estado como "hasData"
          } else {
            const value = cell.value;
            let cellValue: string | number | boolean | null = null;

            if (value !== null && value !== undefined) {
              // Manejar errores de Excel
              if (typeof value === "object" && "error" in value) {
                cellValue = null;
              } else if (typeof value === "object" && "text" in value) {
                cellValue = (value as any).text;
              } else if (typeof value === "object" && "result" in value) {
                cellValue = (value as any).result;
              } else {
                cellValue = value as string | number | boolean;
              }

              if (
                cellValue !== null &&
                cellValue !== "" &&
                cellValue !== undefined
              ) {
                hasData = true;
              }
            }

            rowData[header] = cellValue;
          }
        });

        // Si no tenía columna estado, inicializar en false
        if (!hasStatusColumn) {
          rowData[SPECIAL_COLUMNS.STATUS] = false;
        }

        // Solo agregar filas que tengan al menos un dato
        if (hasData) {
          rows.push(rowData);
        }
      });

      resolve({
        headers,
        rows,
        originalFileName: file.name,
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Exporta datos a un archivo Excel manteniendo el formato
 * @param data - Datos a exportar
 * @param fileName - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (
  data: ExcelData,
  fileName: string = "exported_data"
) => {
  try {
    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new();

    // Convertir los datos a formato de array de arrays
    const worksheetData = [
      data.headers, // Primera fila: encabezados
      ...data.rows.map((row) =>
        data.headers.map((header) => {
          const value = row[header];
          // Convertir estado a emoji para Excel
          if (header.toLowerCase() === SPECIAL_COLUMNS.STATUS) {
            return value ? "✅" : "✖️";
          }
          return value ?? "";
        })
      ),
    ];

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajustar el ancho de las columnas automáticamente
    const colWidths = data.headers.map((header) => {
      const maxLength = Math.max(
        header.length,
        ...data.rows.map((row) => {
          const value = row[header];
          return value ? String(value).length : 0;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Máximo 50 caracteres
    });
    worksheet["!cols"] = colWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    // Generar el archivo y descargarlo
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    throw new Error("No se pudo exportar el archivo Excel");
  }
};

/**
 * Genera un mensaje formateado con los datos de una fila para WhatsApp
 * @param row - Fila de datos
 * @param headers - Encabezados de las columnas
 * @returns Mensaje formateado
 */
export const generateWhatsAppMessage = (
  row: ExcelRow,
  headers: string[]
): string => {
  // Crear el mensaje concatenando todos los campos (excepto imágenes base64)
  const message = headers
    .map((header) => {
      const value = row[header];
      const headerLower = header.toLowerCase();

      // Saltar columnas de foto con imágenes base64 (muy largas para WhatsApp)
      if (
        (headerLower.includes("foto") || headerLower.includes("imagen")) &&
        typeof value === "string" &&
        value.startsWith("data:image/")
      ) {
        return null;
      }

      // Para ubicación, extraer solo la URL si es un objeto
      if (
        headerLower.includes("ubicacion") ||
        headerLower.includes("ubicación")
      ) {
        if (
          typeof value === "object" &&
          value !== null &&
          "hyperlink" in value
        ) {
          return `*${header}:* ${(value as any).hyperlink}`;
        } else if (
          typeof value === "object" &&
          value !== null &&
          "text" in value
        ) {
          return `*${header}:* ${(value as any).text}`;
        }
      }

      // Para otros valores
      if (value !== null && value !== undefined && value !== "") {
        return `*${header}:* ${value}`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");

  // Agregar nota sobre foto si existe
  const photoHeader = headers.find(
    (h) =>
      h.toLowerCase().includes("foto") || h.toLowerCase().includes("imagen")
  );
  if (photoHeader && row[photoHeader]) {
    return message + "\n\n📷 *Foto:* Ver en la aplicación";
  }

  return message;
};

/**
 * Genera el enlace de WhatsApp con el mensaje codificado
 * @param row - Fila de datos
 * @param headers - Encabezados de las columnas
 * @returns URL de WhatsApp
 */
export const generateWhatsAppLink = (
  row: ExcelRow,
  headers: string[]
): string => {
  const message = generateWhatsAppMessage(row, headers);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
};
