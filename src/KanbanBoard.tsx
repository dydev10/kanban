import { useCallback, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import LoginForm from "./LoginForm";
import { Board, LoginCredentials, Task, TaskColumns } from "./types";
import pb, { checkSession, loginUser } from "./api/pb";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAuthed, setIsAuthed] = useState<boolean>(checkSession());
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const columns: string[] = Object.values(TaskColumns);

  const fetchBoards = useCallback(async () => {
    const records = await pb.collection("boards").getFullList<Board>();
    setBoards(records);
    if (records.length > 0) {
      setSelectedBoard(records[0].id);
      fetchTasks(records[0].id);
    }
  }, []); 

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
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

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

  useEffect(() => {
    if (isAuthed) {
      fetchBoards();
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
    <div className="p-4">
      <div className="mb-4">
        <label className="mr-2">Select Board:</label>
        <select onChange={(e) => setSelectedBoard(e.target.value)} value={selectedBoard || ""}>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>{board.name}</option>
          ))}
        </select>
      </div>

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
    </div>
  );
}
