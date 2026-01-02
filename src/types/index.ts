/**
 * Representa una fila de datos del Excel
 * Las claves son dinámicas según las columnas del archivo
 */
export type ExcelRow = Record<string, string | number | boolean | null>;

/**
 * Datos completos del Excel
 */
export interface ExcelData {
  headers: string[]; // Nombres de las columnas
  rows: ExcelRow[]; // Filas de datos
  originalFileName?: string; // Nombre del archivo original
}

/**
 * Configuración de ordenamiento
 */
export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Configuración de filtros por columna
 */
export type FilterConfig = Record<string, string>;

/**
 * Tipos de columnas especiales
 */
export const SPECIAL_COLUMNS = {
  STATUS: "estado",
  LOCATION: "ubicacion",
  CITY: "ciudad",
  PUEBLO: "pueblo",
} as const;
