import { FC, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  column: string;
  project?: string;
}

interface ColumnProps {
  id: string,
  title: string;
  tasksByProject: Record<string, Task[]>;
  isHovered: boolean;
  onDeleteTask: (taskId: string) => void;
}

const Column: FC<ColumnProps> = ({ id, title, tasksByProject, isHovered, onDeleteTask }) => {
  const { setNodeRef } = useDroppable({ id });
  // const [openProject, setOpenProject] = useState<string | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>([]);

  const toggleProject = (project: string) => {
    if (collapsedProjects.includes(project)) {
      setCollapsedProjects(collapsedProjects.filter(v => project !== v))
      return;
    }

    setCollapsedProjects([...collapsedProjects, project])
  };

  return (
    <div ref={setNodeRef} className={`${isHovered ? "bg-orange-200" : "bg-gray-200"} w-72 bg-gray-200 p-4 rounded-lg shadow-md`}>
      <h2 className="text-xl text-gray-700 font-bold mb-4">{title}</h2>
      <div className="space-y-2">
        {Object.entries(tasksByProject).map(([project, tasks]) => (
          <div key={project} className="bg-white rounded-lg shadow p-2">
            <button
              className="w-full text-left font-semibold px-2 py-1 bg-gray-300 rounded"
              onClick={() => toggleProject(project)}
            >
              {project} ({tasks.length})
            </button>
            {!collapsedProjects.includes(project) && (
              <div className="mt-2 space-y-2">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Column;
