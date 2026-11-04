"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Progress } from "@/components/ui";
import { updateProjectStatus } from "../actions";
import { Calendar, User, Building2 } from "lucide-react";
import { fmtDate } from "@/lib/dates";

interface Project {
  id: number;
  name: string;
  customerId: number;
  statusId: number;
  deadline: Date;
  progress: number;
  customer: { name: string };
  assignedTo: { name: string } | null;
  status: { label: string; color: string };
}

interface Status {
  id: number;
  label: string;
  color: string;
}

export function KanbanBoard({ statuses, projects }: { statuses: Status[]; projects: any[] }) {
  const [items, setItems] = useState<Project[]>(projects);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.setData("projectId", id.toString());
  };

  const onDrop = async (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    const projectId = parseInt(e.dataTransfer.getData("projectId"));
    setDraggingId(null);
    setDragOverStatusId(null);

    const project = items.find((p) => p.id === projectId);
    if (!project || project.statusId === statusId) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, statusId } : p
      )
    );

    // DB update
    await updateProjectStatus(projectId, statusId);
  };

  const onDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    setDragOverStatusId(statusId);
  };

  return (
    <div className="kanban-container">
      {statuses.map((status) => (
        <div
          key={status.id}
          className={`kanban-column${dragOverStatusId === status.id ? " drag-over" : ""}`}
          onDragOver={(e) => onDragOver(e, status.id)}
          onDragLeave={() => setDragOverStatusId(null)}
          onDrop={(e) => onDrop(e, status.id)}
        >
          <div className="kanban-column-header">
            <div className="status-indicator" style={{ backgroundColor: status.color }} />
            <h3>{status.label}</h3>
            <span className="count">{items.filter((p) => p.statusId === status.id).length}</span>
          </div>

          <div className="kanban-cards">
            {items
              .filter((p) => p.statusId === status.id)
              .map((p) => (
                <div
                  key={p.id}
                  className={`kanban-card ${draggingId === p.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, p.id)}
                >
                  <Link href={`/projects/${p.id}`} className="card-title">
                    {p.name}
                  </Link>
                  
                  <div className="card-info">
                    <div className="info-row">
                      <Building2 size={14} className="muted" />
                      <span>{p.customer.name}</span>
                    </div>
                    <div className="info-row">
                      <Calendar size={14} className="muted" />
                      <span>{fmtDate(p.deadline)}</span>
                    </div>
                    {p.assignedTo && (
                      <div className="info-row">
                        <User size={14} className="muted" />
                        <span>{p.assignedTo.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <Progress value={p.progress} color={status.color} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
