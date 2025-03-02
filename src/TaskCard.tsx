import { FC } from "react";
import { useDraggable } from "@dnd-kit/core";

interface Task {
  id: string;
  title: string;
  column: string;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard: FC<TaskCardProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
      className="bg-white text-emerald-900 p-3 rounded-md shadow-md cursor-pointer"
    >
      {task.title}
    </div>
  );
};

export default TaskCard;
