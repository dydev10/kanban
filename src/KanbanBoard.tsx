import { useEffect, useState } from "react";
import PocketBase from "pocketbase";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";

interface Task {
  id: string;
  title: string;
  column: string;
  project?: string;
}

enum TaskColumns {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
};

const pb = new PocketBase("https://pb.dydev.art");

const { PB_USER, PB_PASS } = process.env;

const loginUser = async () => {
  await pb.collection('users').authWithPassword(
    PB_USER ?? "",
    PB_PASS ?? "",
  );
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const columns: string[] = Object.values(TaskColumns);

  useEffect(() => {
    const init = async () => {
      await loginUser();
      setIsAuthed(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchTasks();
    }
  }, [isAuthed]);

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
        {columns.map((column) => {
          const tasksByProject = tasks
            .filter((task) => task.column === column)
            .reduce((acc, task) => {
              const project = task.project || "No Project";
              if (!acc[project]) acc[project] = [];
              acc[project].push(task);
              return acc;
            }, {} as Record<string, Task[]>);

          return (
            <SortableContext key={column} items={Object.values(tasksByProject).flat()} strategy={verticalListSortingStrategy}>
              <Column title={column} tasksByProject={tasksByProject} />
            </SortableContext>
          );
        })}
      </div>
    </DndContext>
  );
}
