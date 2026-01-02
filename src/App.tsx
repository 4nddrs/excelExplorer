import { useState } from "react";
import FileUploader from "./components/FileUploader";
import ExcelTable from "./components/ExcelTable";
import { ExcelData, ExcelRow } from "./types";
import { readExcelFile, exportToExcel } from "./utils/excelUtils";
import { Button } from "./components/ui/Button";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

function App() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja la subida de un archivo Excel
   */
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await readExcelFile(file);
      setExcelData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al leer el archivo";
      setError(errorMessage);
      console.error("Error al cargar el archivo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja los cambios en los datos de la tabla
   */
  const handleDataChange = (newRows: ExcelRow[]) => {
    if (excelData) {
      setExcelData({
        ...excelData,
        rows: newRows,
      });
    }
  };

  /**
   * Exporta los datos actuales a Excel
   */
  const handleExport = () => {
    if (!excelData) return;

    try {
      const fileName = excelData.originalFileName
        ? excelData.originalFileName.replace(".xlsx", "").replace(".xls", "") +
          "_editado"
        : "datos_editados";

      exportToExcel(excelData, fileName);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al exportar el archivo";
      setError(errorMessage);
      console.error("Error al exportar:", err);
    }
  };

  /**
   * Resetea la aplicación para cargar un nuevo archivo
   */
  const handleReset = () => {
    setExcelData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-slate-50 to-navy-100">
      {/* Header fijo */}
      <header className="bg-navy-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-navy-600 p-2 rounded-lg">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Excel Explorer
                </h1>
                <p className="text-navy-300 text-sm hidden sm:block">
                  Gestiona tus datos de forma inteligente
                </p>
              </div>
            </div>

            {/* Botones de acción - solo si hay datos */}
            {excelData && (
              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  variant="success"
                  size="md"
                  icon={<ArrowDownTrayIcon className="w-5 h-5" />}
                  className="hidden sm:inline-flex"
                >
                  Exportar
                </Button>
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  size="md"
                  icon={<ArrowUpTrayIcon className="w-5 h-5" />}
                >
                  <span className="hidden sm:inline">Nuevo</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-80px)]">
        {/* Mensajes de error */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-fade-in">
            <div className="flex items-start">
              <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido dinámico */}
        {!excelData ? (
          <div className="flex items-center justify-center h-full">
            <FileUploader
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <div className="h-full">
            <ExcelTable data={excelData} onDataChange={handleDataChange} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-navy-300 py-4 text-center text-sm">
        <p>Desarrollado con ❤️ usando React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
}

export default App;
