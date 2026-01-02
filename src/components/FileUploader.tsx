import React, { useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)");
        return;
      }

      onFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)");
        return;
      }

      onFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={clsx(
          "border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300",
          isLoading
            ? "opacity-50 cursor-wait border-navy-300 bg-navy-50"
            : "border-navy-300 bg-white hover:border-navy-500 hover:bg-navy-50 hover:shadow-xl"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-6">
          <div
            className={clsx(
              "p-6 rounded-full transition-all duration-300",
              isLoading ? "bg-navy-200" : "bg-navy-100"
            )}
          >
            <ArrowUpTrayIcon className="w-16 h-16 text-navy-600" />
          </div>

          <div>
            <p className="text-2xl font-bold text-navy-900 mb-2">
              {isLoading ? "Cargando archivo..." : "Sube tu archivo Excel"}
            </p>
            <p className="text-sm text-navy-600">
              Haz clic o arrastra un archivo .xlsx o .xls
            </p>
          </div>

          {!isLoading && (
            <div className="mt-4 px-6 py-3 bg-navy-600 text-white rounded-lg font-medium hover:bg-navy-700 transition-colors">
              Seleccionar Archivo
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
