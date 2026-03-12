"use client";
import { useState } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Objective {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  keyResults: { id: string; kpis: unknown[] }[];
}

function SortableObjective({ obj }: { obj: Objective }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: obj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "stretch", gap: 8 }}>
      <button
        {...attributes}
        {...listeners}
        style={{ display: "flex", alignItems: "center", padding: "0 4px", color: "#C8D0DC", cursor: "grab", flexShrink: 0, touchAction: "none", background: "none", border: "none" }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      <Link
        href={`/objectives/${obj.id}`}
        className="okra-card"
        style={{ flex: 1, display: "block", padding: 20, textDecoration: "none", transition: "box-shadow 0.15s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0px 8px 30px rgba(0,0,0,0.10)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0px 4px 20px rgba(0,0,0,0.05)"; }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1B3D" }}>{obj.title}</span>
              <span
                className="status-badge"
                style={{
                  background: obj.status === "ACTIVE" ? "rgba(8,146,165,0.10)" : "rgba(130,130,130,0.10)",
                  color: obj.status === "ACTIVE" ? "#0892A5" : "#828282",
                  fontSize: 11,
                }}
              >
                {obj.status}
              </span>
            </div>
            {obj.description && (
              <p style={{ fontSize: 12, color: "#828282", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                {obj.description}
              </p>
            )}
            <p style={{ fontSize: 11, color: "#B0BAC9", marginTop: 4 }}>
              {obj.keyResults.length} key results · {obj.keyResults.reduce((n, kr) => n + (kr.kpis as unknown[]).length, 0)} KPIs
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#EB5757", letterSpacing: "-0.02em" }}>
              {obj.progress}%
            </span>
          </div>
        </div>
        <Progress value={obj.progress} className="h-1.5" />
      </Link>
    </div>
  );
}

export default function ObjectivesSortable({ objectives: initial }: { objectives: Objective[] }) {
  const [objectives, setObjectives] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = objectives.findIndex((o) => o.id === active.id);
    const newIndex = objectives.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(objectives, oldIndex, newIndex);
    setObjectives(reordered);
    await fetch("/api/objectives/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((o) => o.id) }),
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={objectives.map((o) => o.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {objectives.map((obj) => <SortableObjective key={obj.id} obj={obj} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
