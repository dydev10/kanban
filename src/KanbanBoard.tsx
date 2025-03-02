import { useEffect, useState } from "react";
import PocketBase from "pocketbase";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";

interface Task {
  id: string;
  title: string;
  column: string;
}

const pb = new PocketBase("https://pb.dydev.art");

console.log(pb);

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const columns: string[] = ["todo", "in-progress", "done"];

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const records = await pb.collection("tasks").getFullList<Task>();
    setTasks(records);
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    await pb.collection("tasks").update(id, updates);
    fetchTasks();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newColumn = over.id as string;
    updateTask(taskId, { column: newColumn });
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto min-h-screen bg-gray-100">
        {columns.map((column) => (
          <SortableContext key={column} items={tasks.filter((t) => t.column === column)} strategy={verticalListSortingStrategy}>
            <Column title={column} tasks={tasks.filter((t) => t.column === column)} />
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
