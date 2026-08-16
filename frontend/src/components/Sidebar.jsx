import { useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2, Brain } from "lucide-react";
import { uploadDocument, deleteDocument } from "../api";

export default function Sidebar({ documents, onDocumentsChange, selectedDocId, onSelectDoc }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      await onDocumentsChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  }

  async function handleDelete(docId, e) {
    e.stopPropagation();
    try {
      await deleteDocument(docId);
      if (selectedDocId === docId) onSelectDoc(null);
      await onDocumentsChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-surface flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-text leading-tight">DocuMind</h1>
          <p className="text-xs text-text-soft">Ask your documents anything</p>
        </div>
      </div>

      <div className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Upload size={16} /> Upload PDF
            </>
          )}
        </button>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-3 pb-4">
        <p className="px-2 text-xs font-medium text-text-soft uppercase tracking-wide mb-2">
          Documents {documents.length > 0 && `(${documents.length})`}
        </p>

        {documents.length === 0 && (
          <p className="px-2 text-sm text-text-soft">
            No documents yet — upload a PDF to get started.
          </p>
        )}

        <ul className="space-y-1">
          {documents.map((doc) => (
            <li key={doc.doc_id}>
              <button
                onClick={() => onSelectDoc(selectedDocId === doc.doc_id ? null : doc.doc_id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors group ${
                  selectedDocId === doc.doc_id
                    ? "bg-accent-soft text-accent-hover"
                    : "hover:bg-bg text-text"
                }`}
              >
                <FileText size={15} className="shrink-0" />
                <span className="flex-1 truncate">{doc.filename}</span>
                <span
                  onClick={(e) => handleDelete(doc.doc_id, e)}
                  className="opacity-0 group-hover:opacity-100 text-text-soft hover:text-red-600 transition-opacity"
                >
                  <Trash2 size={14} />
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selectedDocId && (
          <p className="px-2 mt-3 text-xs text-text-soft">
            Filtering to selected document. Click it again to search all documents.
          </p>
        )}
      </div>
    </aside>
  );
}
