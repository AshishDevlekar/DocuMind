import { useEffect, useRef, useState } from "react";
import { Send, Brain, User, Menu } from "lucide-react";
import { askQuestion } from "../api";
import SourceCitations from "./SourceCitations";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-text-soft typing-dot" style={{ animationDelay: "0s" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-text-soft typing-dot" style={{ animationDelay: "0.2s" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-text-soft typing-dot" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

export default function ChatWindow({ hasDocuments, selectedDocId, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const result = await askQuestion(question, selectedDocId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong: ${err.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 border-b border-border bg-surface px-4 py-3 shrink-0">
        <button
          onClick={onOpenSidebar}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text hover:bg-bg shrink-0"
        >
          <Menu size={20} />
        </button>
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Brain size={14} className="text-white" />
        </div>
        <span className="font-semibold text-text text-sm">DocuMind</span>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <Brain size={26} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">
              {hasDocuments ? "Ask something about your documents" : "Upload a document to get started"}
            </h2>
            <p className="text-sm text-text-soft max-w-sm">
              {hasDocuments
                ? "Ask a question in plain English — answers are grounded in your uploaded PDFs, with page citations."
                : "Use the Upload button to add a PDF, then ask questions about it here."}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                    <Brain size={16} className="text-accent" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : msg.error
                      ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-sm"
                      : "bg-surface border border-border text-text rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && <SourceCitations sources={msg.sources} />}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-text flex items-center justify-center shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                  <Brain size={16} className="text-accent" />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface px-4 sm:px-6 py-3 sm:py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2 sm:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!hasDocuments}
            placeholder={hasDocuments ? "Ask a question…" : "Upload a document first"}
            rows={1}
            className="flex-1 resize-none bg-bg border border-border rounded-xl px-3.5 sm:px-4 py-2.5 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !hasDocuments}
            className="shrink-0 w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent flex items-center justify-center transition-colors"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
