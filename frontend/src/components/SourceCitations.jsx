import { FileText } from "lucide-react";

export default function SourceCitations({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-medium text-text-soft uppercase tracking-wide mb-2">
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <span
            key={s.index}
            className="inline-flex items-center gap-1.5 bg-bg border border-border rounded-full px-3 py-1 text-xs text-text-soft"
          >
            <FileText size={12} />
            [{s.index}] {s.filename} · p.{s.page}
          </span>
        ))}
      </div>
    </div>
  );
}
