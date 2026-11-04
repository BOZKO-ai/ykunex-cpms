"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn-primary"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
    >
      <Printer size={16} /> Print / Save as PDF
    </button>
  );
}

