"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Users, X } from "lucide-react";

interface SearchItem {
  id: number;
  name: string;
  type: "project" | "customer";
}

export function CommandPalette({ projects, customers }: { projects: SearchItem[]; customers: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const allItems = [
    ...projects.map(p => ({ ...p, type: "project" as const })),
    ...customers.map(c => ({ ...c, type: "customer" as const }))
  ];

  const filtered = query === "" 
    ? [] 
    : allItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(o => !o);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const selectItem = (item: SearchItem) => {
    router.push(item.type === "project" ? `/projects/${item.id}` : `/customers/${item.id}`);
    setOpen(false);
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={20} className="muted" />
          <input
            autoFocus
            placeholder="Search projects or customers... (Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        
        <div className="cmd-results">
          {query !== "" && filtered.length === 0 && (
            <div className="cmd-empty">No results found for "{query}"</div>
          )}
          {filtered.map(item => (
            <div key={`${item.type}-${item.id}`} className="cmd-item" onClick={() => selectItem(item)}>
              {item.type === "project" ? <Briefcase size={16} /> : <Users size={16} />}
              <span>{item.name}</span>
              <span className="cmd-type">{item.type}</span>
            </div>
          ))}
          {query === "" && (
            <div className="cmd-hint">Start typing to search projects and customers...</div>
          )}
        </div>
      </div>
    </div>
  );
}
