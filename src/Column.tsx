import { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  column: string;
}

interface ColumnProps {
  title: string;
  tasks: Task[];
}

const Column: FC<ColumnProps> = ({ title, tasks }) => {
  const { setNodeRef } = useDroppable({ id: title });

  return (
    <div ref={setNodeRef} className="w-64 text-cyan-900 bg-gray-200 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default Column;
