import { useState, useEffect, useRef, FormEvent } from "react";
import { Project, TaskColumns } from "./types";

type AddTaskPopupProps = {
  onAdd: (taskTitle: string, status: string, project?: string) => Promise<void>;
  projects: Project[],
};

export default function AddTaskPopup({ onAdd, projects }: AddTaskPopupProps) {
  const defaultStatus = Object.values(TaskColumns)[0];
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [status, setStatus] = useState<string>(defaultStatus);
  const [project, setProject] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const reset = () => {
    setLoading(false);
    setIsOpen(false);
    setTaskTitle("");
    setStatus(defaultStatus);
    setProject("");
  };

  const handleAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await onAdd(taskTitle, status, project || undefined);
    reset();
  };

  return (
    <div className="relative inline-block">
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        className="px-4 py-2 bg-green-600 text-white rounded-md"
      >
        Add Task
      </button>
      {isOpen && (
        <div 
          ref={popupRef} 
          className="absolute right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-64 p-4 border border-gray-300 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Add Task</h2>
          <form className="space-y-3" onSubmit={handleAddTask}>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Task Title</label>
              <input 
                type="text" 
                placeholder="Enter task title" 
                required 
                className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Status</label>
              <select 
                className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {
                  Object.values(TaskColumns).map((status) => {
                    return <option key={status} value={status}>{status}</option>
                  })
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Project (Optional)</label>
              <select 
                className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">None</option>
                {
                  projects.map((p) => {
                    return <option key={p.id} value={p.id}>{p.title}</option>
                  })
                }
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full text-sm py-2 bg-green-600 dark:bg-green-500 text-white rounded-md"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
