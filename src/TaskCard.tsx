import { FC, PointerEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { FaTrashAlt } from "react-icons/fa";

interface Task {
  id: string;
  title: string;
  column: string;
}

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
}

const TaskCard: FC<TaskCardProps> = ({ task, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const handleDeleteTask = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <div
      key={task.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
      className="bg-blue-50 hover:bg-blue-100 active:bg-blue-300 font-medium text-gray-700 flex justify-between items-center p-4 rounded-md shadow-md cursor-pointer"
    >
      <span>{task.title}</span>
      <button
        onPointerDown={handleDeleteTask}
        className="px-1 rounded-md text-gray-500 hover:text-red-500 cursor-pointer"
      >
        <FaTrashAlt />
      </button>
    </div>
  );
};

export default TaskCard;
