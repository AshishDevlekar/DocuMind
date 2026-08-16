import { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { listDocuments } from "./api";

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [backendError, setBackendError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents);
      setBackendError(false);
    } catch (err) {
      setBackendError(true);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  if (backendError) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-semibold text-text mb-2">Can't reach the backend</h1>
          <p className="text-sm text-text-soft">
            Make sure your FastAPI server is running at{" "}
            <code className="bg-surface border border-border px-1.5 py-0.5 rounded text-xs">
              127.0.0.1:8000
            </code>{" "}
            (run <code className="bg-surface border border-border px-1.5 py-0.5 rounded text-xs">uvicorn main:app --reload</code> in the backend folder).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-bg overflow-hidden relative">
      {/* Mobile backdrop — click to close sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
        />
      )}

      <Sidebar
        documents={documents}
        onDocumentsChange={refreshDocuments}
        selectedDocId={selectedDocId}
        onSelectDoc={(id) => {
          setSelectedDocId(id);
          setSidebarOpen(false); // auto-close on mobile after picking a doc
        }}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />
      <ChatWindow
        hasDocuments={documents.length > 0}
        selectedDocId={selectedDocId}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  );
}

export default App;
