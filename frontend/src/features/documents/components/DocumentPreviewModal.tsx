/**
 * DocumentPreviewModal
 * ---------------------
 * Full-screen modal that previews a single vault document. PDFs render inline
 * in an <iframe>, images render in an <img>, and any other content type falls
 * back to a download prompt. Also exposes "open in tab" and "download" actions.
 */
import React from "react";
import { X, ExternalLink, Download, FileText, FileImage, File } from "lucide-react";
import type { VaultDocument } from "@hrms/middleware";

interface DocumentPreviewModalProps {
  document: VaultDocument;
  onClose: () => void;
}

/**
 * Renders the preview modal for a vault document.
 * @param document - The vault document to preview (provides content type, name, download URL, etc.).
 * @param onClose - Callback invoked when the modal should be dismissed.
 */
export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const isPdf = document.contentType.includes("pdf");
  const isImage = document.contentType.startsWith("image/");

  // Convert a raw byte count into a human-readable size (e.g. "1.5 MB").
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    // Pick the unit index from the magnitude of the value (log base 1024).
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Choose an icon that matches the document's content type.
  const getFileIcon = () => {
    if (isPdf) return <FileText className="h-10 w-10 text-rose-500" />;
    if (isImage) return <FileImage className="h-10 w-10 text-blue-500" />;
    return <File className="h-10 w-10 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon()}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate" title={document.name}>
                {document.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {formatSize(document.sizeBytes)} · {document.category.toUpperCase()} · {document.contentType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={document.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <ExternalLink size={15} />
              Open in Tab
            </a>
            <a
              href={document.downloadUrl}
              download={document.name}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Download size={15} />
              Download
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content/Viewer Area */}
        <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
          {isPdf ? (
            <iframe
              src={`${document.downloadUrl}#view=FitH`}
              className="w-full h-full rounded-lg border border-slate-200 bg-white"
              title={document.name}
            />
          ) : isImage ? (
            <div className="max-w-full max-h-full flex items-center justify-center p-4">
              <img
                src={document.downloadUrl}
                alt={document.name}
                className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain bg-white p-2 border border-slate-200"
              />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm">
              <File className="h-16 w-16 text-slate-300 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-800">Preview not available</h3>
              <p className="text-sm text-slate-500 mt-2">
                This file type ({document.contentType}) cannot be previewed directly in the browser.
              </p>
              <a
                href={document.downloadUrl}
                download={document.name}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download File to View
              </a>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default DocumentPreviewModal;
