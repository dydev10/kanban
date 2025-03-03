import { useState, useEffect, useRef, FormEvent } from "react";
import { TaskColumns } from "./types";

export default function AddTaskPopup() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [status, setStatus] = useState<string>("To Do");
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

  const handleAddTask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Task Title:", taskTitle);
    console.log("Status:", status);
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
                    return <option value={status}>{status}</option>
                  })
                }
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full text-sm py-2 bg-green-600 dark:bg-green-500 text-white rounded-md"
            >
              Add Task
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
