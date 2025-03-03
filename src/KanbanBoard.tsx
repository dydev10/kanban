import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import LoginForm from "./LoginForm";
import { Board, LoginCredentials, Project, Task, TaskColumns } from "./types";
import pb, { checkSession, getUserId, loginUser } from "./api/pb";
import AddTaskForm from "./AddTaskForm";
import HeaderBar from "./HeaderBar";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [isAuthed, setIsAuthed] = useState<boolean>(checkSession());
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const columns: string[] = Object.values(TaskColumns);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    const records = await pb.collection("boards").getFullList<Board>();
    setBoards(records);
    if (records.length > 0) {
      setSelectedBoard(records[0].id);
      fetchTasks(records[0].id);
    }
  }, []); 

  async function fetchProjects() {
    const records = await pb.collection("projects").getFullList<Project>();
    setProjects(records);
  };
  

  async function fetchTasks(boardId: string) {
    const records = await pb.collection("tasks").getFullList<Task>({
      filter: `board = "${boardId}"`
    });
    setTasks(records);
  }

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
    loginUser(creds).then((user) => {
      setIsAuthed(true);
      console.log('Logged In user:', user);
    });
  };

  async function switchBoard(e: ChangeEvent<HTMLSelectElement>) {
    const newBoard = e.target.value;
    setSelectedBoard(newBoard)
    fetchTasks(newBoard);
  }

  async function createRandomTask() {
    if (!selectedBoard) return;
    await pb.collection("tasks").create({
      title: "New Random Task #" + Math.floor(Math.random() * 1000),
      column: "todo",
      project: null,
      user: getUserId(),
      board: selectedBoard
    });
    fetchTasks(selectedBoard);
  }

  async function addTask(title: string, column: string, project?: string) {
    if (!selectedBoard) return;
    await pb.collection("tasks").create({
      title,
      column,
      project,
      user: getUserId(),
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
    if (isAuthed) {
      fetchBoards();
      fetchProjects();
    }
  }, [isAuthed, fetchBoards]);

  if (!isAuthed && !isGuest) {
    return (
      <LoginForm
        isOpen
        onClose={handleLoginCancel}
        onComplete={handleLoginRequest}
      />
    );
  }

  return (
    <div>
      <HeaderBar />
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label>Select Board:</label>
            <select onChange={switchBoard} value={selectedBoard || ""}>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          </div>
          <button onClick={createRandomTask} className="px-3 py-1 bg-blue-500 text-white rounded">+ Task Random</button>
          <AddTaskForm onAdd={addTask} projects={projects} />
        </div>

        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <div className="flex gap-4 p-4 overflow-x-auto min-h-screen bg-gray-100">
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
