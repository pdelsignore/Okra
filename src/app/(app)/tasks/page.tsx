import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TaskTableClient from "./TaskTableClient";

export default async function TasksPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const tasks = await prisma.task.findMany({
    where: { userId },
    include: {
      alignments: {
        include: { kpi: true, keyResult: { include: { objective: true } } },
        orderBy: { contribution: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>All your tasks and their OKR alignment</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">+ New task</Link>
      </div>
      <TaskTableClient tasks={tasks} />
    </div>
  );
}
