import React, { useState, useMemo } from "react";
import {
  ExcelData,
  ExcelRow,
  SortConfig,
  FilterConfig,
  SPECIAL_COLUMNS,
} from "../types";
import { generateWhatsAppLink } from "../utils/excelUtils";
import { Checkbox, Select } from "./ui/FormControls";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface ExcelTableProps {
  data: ExcelData;
  onDataChange: (newRows: ExcelRow[]) => void;
}

/**
 * Componente de tabla interactiva mejorado con UI moderna
 */
const ExcelTable: React.FC<ExcelTableProps> = ({ data, onDataChange }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    column: string;
  } | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  /**
   * Obtiene opciones únicas para una columna (para selects dinámicos)
   */
  const getUniqueOptions = (columnName: string) => {
    const values = data.rows
      .map((row) => row[columnName])
      .filter((val) => val !== null && val !== undefined && val !== "")
      .map((val) => String(val));

    const uniqueValues = Array.from(new Set(values)).sort();
    return uniqueValues.map((val) => ({ value: val, label: val }));
  };

  /**
   * Detecta si una columna es tipo ciudad/pueblo
   */
  const isCityColumn = (columnName: string): boolean => {
    const lower = columnName.toLowerCase();
    return (
      lower === SPECIAL_COLUMNS.CITY ||
      lower === SPECIAL_COLUMNS.PUEBLO ||
      lower.includes("ciudad") ||
      lower.includes("pueblo") ||
      lower.includes("localidad")
    );
  };

  /**
   * Detecta si una columna es tipo ubicación (link)
   */
  const isLocationColumn = (columnName: string): boolean => {
    const lower = columnName.toLowerCase();
    return (
      lower === SPECIAL_COLUMNS.LOCATION ||
      lower.includes("ubicacion") ||
      lower.includes("ubicación") ||
      lower.includes("mapa") ||
      lower.includes("maps")
    );
  };

  /**
   * Detecta si un valor es un link
   */
  const isLink = (value: unknown): boolean => {
    if (typeof value !== "string") return false;
    return value.startsWith("http://") || value.startsWith("https://");
  };

  /**
   * Maneja el ordenamiento
   */
  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === column && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: column, direction });
  };

  /**
   * Maneja los filtros
   */
  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
  };

  /**
   * Maneja la edición de celdas
   */
  const handleCellEdit = (
    rowIndex: number,
    column: string,
    value: string | boolean
  ) => {
    const newRows = [...data.rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [column]: value,
    };
    onDataChange(newRows);
  };

  /**
   * Toggle del estado
   */
  const handleStatusToggle = (rowIndex: number) => {
    const statusColumn = data.headers.find(
      (h) => h.toLowerCase() === SPECIAL_COLUMNS.STATUS
    );
    if (!statusColumn) return;

    const currentStatus = data.rows[rowIndex][statusColumn];
    handleCellEdit(rowIndex, statusColumn, !currentStatus);
  };

  /**
   * Datos procesados (filtrados y ordenados)
   */
  const processedData = useMemo(() => {
    let filtered = [...data.rows];

    // Aplicar filtros
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((row) => {
          const cellValue = row[column];
          return (
            cellValue !== null &&
            cellValue !== undefined &&
            String(cellValue).toLowerCase().includes(filterValue.toLowerCase())
          );
        });
      }
    });

    // Aplicar ordenamiento
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data.rows, filters, sortConfig]);

  /**
   * Renderiza el contenido de una celda según su tipo
   */
  const renderCellContent = (
    row: ExcelRow,
    header: string,
    rowIndex: number
  ) => {
    const value = row[header];
    const isStatus = header.toLowerCase() === SPECIAL_COLUMNS.STATUS;
    const isCityCol = isCityColumn(header);
    const isLocationCol = isLocationColumn(header);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.column === header;

    // Detectar columnas de fotos por nombre
    const isPhotoColumn =
      header.toLowerCase().includes("foto") ||
      header.toLowerCase().includes("imagen") ||
      header.toLowerCase().includes("picture") ||
      header.toLowerCase().includes("image");

    // Debug: mostrar tipo de valor en columnas de foto
    if (isPhotoColumn) {
      console.log("🔍 Columna foto - Fila", rowIndex, ":", {
        tipo: typeof value,
        esNull: value === null,
        esString: typeof value === "string",
        preview:
          typeof value === "string" ? value.substring(0, 50) + "..." : value,
      });
    }

    // ===== IMPORTANTE: Columna de ubicación PRIMERO (antes de check de imágenes) =====
    if (isLocationCol) {
      // Extraer URL si viene en formato {text, hyperlink}
      let url = "";
      if (typeof value === "string") {
        url = value;
      } else if (value && typeof value === "object" && "hyperlink" in value) {
        url = (value as any).hyperlink;
      } else if (value && typeof value === "object" && "text" in value) {
        url = (value as any).text;
      }

      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl hover:scale-110 transition-transform inline-block cursor-pointer"
            title="Ver ubicación en el mapa"
            onClick={(e) => e.stopPropagation()}
          >
            📍
          </a>
        );
      }
      return <span className="text-gray-400">—</span>;
    }

    // Columna de estado (checkbox)
    if (isStatus) {
      return (
        <div className="flex justify-center">
          <Checkbox
            checked={Boolean(value)}
            onChange={() => handleStatusToggle(rowIndex)}
          />
        </div>
      );
    }

    // Si es columna de foto pero no hay valor o es null
    if (
      isPhotoColumn &&
      (value === null || value === undefined || value === "")
    ) {
      return (
        <div className="flex items-center justify-center w-[120px] h-[80px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-xs text-gray-400">Sin foto</span>
        </div>
      );
    }

    // Debug: si el valor es un objeto en columna de foto
    if (
      isPhotoColumn &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      console.error("❌ ERROR: Objeto en columna foto:", {
        header,
        rowIndex,
        value,
      });
      return (
        <div className="flex items-center justify-center w-[120px] h-[80px] bg-red-50 rounded-lg border-2 border-dashed border-red-200">
          <span className="text-xs text-red-400">Error: Objeto</span>
        </div>
      );
    }

    // Detectar si es una imagen (data URL base64 o URL externa) - SOLO para columnas de foto
    if (
      isPhotoColumn &&
      typeof value === "string" &&
      (value.startsWith("data:image/") ||
        value.startsWith("http://") ||
        value.startsWith("https://"))
    ) {
      console.log("✅ Renderizando imagen en fila", rowIndex);
      return (
        <img
          src={value}
          alt="Foto"
          className="max-w-[120px] max-h-[120px] object-cover rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform hover:shadow-xl"
          onClick={() => setModalImage(value)}
          onError={(e) => {
            console.error("Error al cargar imagen en fila", rowIndex);
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML =
              '<div class="flex items-center justify-center w-[120px] h-[80px] bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300"><span class="text-xs text-yellow-600">Error al cargar</span></div>';
          }}
        />
      );
    }

    // Columna de ciudad con select
    if (isCityCol && !isEditing) {
      const options = getUniqueOptions(header);
      return (
        <Select
          value={String(value || "")}
          onChange={(newValue) => handleCellEdit(rowIndex, header, newValue)}
          options={options}
          placeholder="Seleccionar..."
          className="min-w-[150px]"
        />
      );
    }

    // Edición normal
    if (isEditing) {
      return (
        <input
          type="text"
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => handleCellEdit(rowIndex, header, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              setEditingCell(null);
            }
          }}
          autoFocus
          className="w-full px-2 py-1 bg-white border border-navy-500 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
        />
      );
    }

    // Vista normal
    return (
      <span className="block px-2 py-1">
        {value !== null && value !== undefined ? String(value) : "—"}
      </span>
    );
  };

  if (data.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <FunnelIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Contador de registros */}
      <div className="mb-3 px-1 flex items-center justify-between flex-shrink-0">
        <div className="text-sm text-navy-700 font-medium">
          Mostrando{" "}
          <span className="font-bold text-navy-900">
            {processedData.length}
          </span>{" "}
          de <span className="font-bold text-navy-900">{data.rows.length}</span>{" "}
          registros
        </div>
      </div>

      {/* Tabla con scroll */}
      <div className="flex-1 border border-navy-200 rounded-xl shadow-lg bg-white overflow-auto min-h-0">
        <table className="w-full divide-y divide-navy-200">
          <thead className="bg-navy-700 text-white sticky top-0 z-10">
            <tr>
              {/* Columna WhatsApp */}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                WhatsApp
              </th>

              {/* Columna Estado - fija después de WhatsApp */}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                Estado
              </th>

              {/* Columnas dinámicas (sin estado) */}
              {data.headers
                .filter((h) => h.toLowerCase() !== SPECIAL_COLUMNS.STATUS)
                .map((header) => {
                  return (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    >
                      {/* Botón de ordenamiento */}
                      <button
                        onClick={() => handleSort(header)}
                        className="flex items-center gap-2 w-full transition-colors hover:text-navy-200"
                      >
                        <span className="truncate">{header}</span>
                        <span className="flex-shrink-0">
                          {sortConfig?.key === header ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4" />
                            )
                          ) : (
                            <div className="w-4 h-4 opacity-30">
                              <ChevronUpIcon className="w-4 h-4" />
                            </div>
                          )}
                        </span>
                      </button>

                      {/* Input de filtro */}
                      {!isCityColumn(header) && (
                        <input
                          type="text"
                          placeholder={`Filtrar...`}
                          value={filters[header] || ""}
                          onChange={(e) =>
                            handleFilterChange(header, e.target.value)
                          }
                          className="mt-2 w-full px-2 py-1.5 text-xs bg-white text-navy-900 border border-navy-300 rounded-md focus:ring-2 focus:ring-navy-400 focus:border-navy-400 placeholder-navy-400"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </th>
                  );
                })}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-navy-100">
            {processedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-navy-50 transition-colors">
                {/* Botón WhatsApp */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <a
                    href={generateWhatsAppLink(row, data.headers)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-2xl hover:scale-110 transition-transform"
                    title="Compartir por WhatsApp"
                  >
                    🟢
                  </a>
                </td>

                {/* Estado - columna fija */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <Checkbox
                    checked={row[SPECIAL_COLUMNS.STATUS] === true}
                    onChange={(checked) =>
                      handleCellEdit(rowIndex, SPECIAL_COLUMNS.STATUS, checked)
                    }
                    label=""
                  />
                </td>

                {/* Celdas dinámicas (sin estado) */}
                {data.headers
                  .filter((h) => h.toLowerCase() !== SPECIAL_COLUMNS.STATUS)
                  .map((header) => {
                    const isCityCol = isCityColumn(header);

                    return (
                      <td
                        key={`${rowIndex}-${header}`}
                        className={clsx(
                          "px-4 py-3 text-sm text-navy-900",
                          !isCityCol && "editable-cell whitespace-nowrap"
                        )}
                        onClick={() => {
                          if (!isCityCol) {
                            setEditingCell({ rowIndex, column: header });
                          }
                        }}
                      >
                        {renderCellContent(row, header, rowIndex)}
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de imagen */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] p-4">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-2 -right-2 z-10 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-colors"
              title="Cerrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={modalImage}
              alt="Foto ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelTable;
