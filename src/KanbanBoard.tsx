import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import LoginForm from "./LoginForm";
import { Board, LoginCredentials, Project, Task, TaskColumns } from "./types";
import AddTaskForm from "./AddTaskForm";
import HeaderBar from "./HeaderBar";
import usePocket from "./hooks/usePocket";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const { pb, login, token, user } = usePocket();

  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const columns: string[] = Object.values(TaskColumns);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const fetchTasks = useCallback(async (boardId: string) => {
    const records = await pb.collection("tasks").getFullList<Task>({
      filter: `board = "${boardId}"`
    });
    setTasks(records);
  }, [pb]);

  const fetchBoards = useCallback(async () => {
    const records = await pb.collection("boards").getFullList<Board>();
    setBoards(records);
    if (records.length > 0) {
      setSelectedBoard(records[0].id);
      fetchTasks(records[0].id);
    }
  }, [pb, fetchTasks]); 

  const fetchProjects = useCallback(async () => {
    const records = await pb.collection("projects").getFullList<Project>();
    setProjects(records);
  }, [pb]);


  async function updateTask(id: string, updates: Partial<Task>) {
    await pb.collection("tasks").update(id, updates);
    if (selectedBoard) fetchTasks(selectedBoard);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (over) {
      setHoveredColumn(over.id as string);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    setHoveredColumn(null);

    const taskId = active.id as string;
    const newColumn = over.id as string;
    updateTask(taskId, { column: newColumn });
  }

  function handleLoginCancel() {
    console.log('Closed Cancelled!');
    setIsGuest(true);
  };

  function handleLoginRequest(creds: LoginCredentials) {
    console.log('Trying to login...');
    login(creds.email, creds.password).then((user) => {
      console.log('Logged In user:', user);
    });
  };

  async function switchBoard(e: ChangeEvent<HTMLSelectElement>) {
    const newBoard = e.target.value;
    setSelectedBoard(newBoard)
    fetchTasks(newBoard);
  }

  async function addTask(title: string, column: string, project?: string) {
    if (!selectedBoard || !user) return;
    await pb.collection("tasks").create({
      title,
      column,
      project,
      user: user.id,
      board: selectedBoard
    });
    fetchTasks(selectedBoard);
  }

  async function deleteTask(taskId: string) {
    return pb.collection("tasks").delete(taskId);
  }

  function handleDeleteTask(taskId: string) {
    deleteTask(taskId).then(() => {
      console.log('Deleted Task!');
      
      if (!selectedBoard) return;
      fetchTasks(selectedBoard);
    });
  }

  useEffect(() => {
    if (token) {
      fetchBoards();
      fetchProjects();
    }
  }, [token, fetchBoards, fetchProjects]);

  if (!token && !isGuest) {
    return (
      <LoginForm
        isOpen
        onClose={handleLoginCancel}
        onComplete={handleLoginRequest}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <HeaderBar />
      <div className="p-4 grow flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="font-light">Select Board:</label>
            <select onChange={switchBoard} value={selectedBoard || ""} className="font-bold font-mono text-lg">
              {boards.map((board) => (
                <option className="text-gray-500" key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          </div>
          <AddTaskForm onAdd={addTask} projects={projects} />
        </div>

        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <div className="flex grow gap-4 p-4 overflow-x-auto bg-gray-100">
            {columns.map((column) => {
              const tasksByProject = tasks
                .filter((task) => task.column === column)
                .reduce((acc, task) => {                
                  const project = projects.find(p => p.id === task.project)?.title || "No Project";
                  if (!acc[project]) acc[project] = [];
                  acc[project].push(task);
                  return acc;
                }, {} as Record<string, Task[]>);

              return (
                <SortableContext id={column} key={column} items={Object.values(tasksByProject).flat()} strategy={verticalListSortingStrategy}>
                  <Column
                    title={column}
                    tasksByProject={tasksByProject}
                    isHovered={hoveredColumn === column}
                    onDeleteTask={handleDeleteTask}  
                  />
                </SortableContext>
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
