import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import LoginForm from "./LoginForm";
import { Board, BoardColumn, LoginCredentials, PayloadTaskUpdate, Project, Task } from "./types";
import AddTaskForm from "./AddTaskForm";
import HeaderBar from "./HeaderBar";
import usePocket from "./hooks/usePocket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function KanbanBoard() {
  const { pb, login, token } = usePocket();
  const queryClient = useQueryClient();

  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    return await pb.collection("boards").getFullList<Board>();
  }, [pb]); 

  const fetchProjects = useCallback(async () => {
    return await pb.collection("projects").getFullList<Project>();
  }, [pb]);

  const fetchColumns = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];    
    return await pb.collection("columns").getFullList<BoardColumn>({
      filter: `board = "${boardId}" || board = ""`,
    });;
  }, [pb]);
 
  const fetchTasks = useCallback(async (boardId: string | null) => {
    if (!boardId) return [];
    return await pb.collection("tasks").getFullList<Task>({
      filter: `board = "${boardId}"`,
    });
  }, [pb]);

  /**
   * Async Data Queries
   */
  const { data: boards  } = useQuery({
    queryKey: ['boards'],
    queryFn: () => fetchBoards(),
    enabled: !!token
  }); 
  const { data: projects  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
    enabled: !!token,
  });
  const { data: columns  } = useQuery({
    queryKey: ['columns', selectedBoard],
    queryFn: () => fetchColumns(selectedBoard),
    enabled: !!selectedBoard,
  });
  const { data: tasks, refetch: refetchTasks  } = useQuery({
    queryKey: ['tasks', selectedBoard],
    queryFn: () => fetchTasks(selectedBoard),
    enabled: !!selectedBoard,
  });

  /**
   * Async Optimistic Mutations
   */
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      return pb.collection("tasks").update(id, updates, { requestKey: null }); // requestKey null to disable auto cancellation
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", selectedBoard] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", selectedBoard]) || [];
      const updatedTasks = previousTasks.map((task) => (task.id === id ? { ...task, ...updates } : task));

      queryClient.setQueryData(["tasks", selectedBoard], updatedTasks);

      return { previousTasks };
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", selectedBoard], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedBoard] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ title, column, project }: { title: string, column: string, project?: string }) => {
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error("User not authenticated");
      if (!selectedBoard) throw new Error(" No board selected");

      const tempTask: Partial<Task> = {
        title,
        project,
        column,
        board: selectedBoard,
        user: userId,
      }
      return pb.collection("tasks").create(tempTask);
    },
    onMutate: async ({ title, column, project }: { title: string, column: string, project?: string }) => {
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error("User not authenticated");
      if (!selectedBoard) throw new Error(" No board selected");

      await queryClient.cancelQueries({ queryKey: ["tasks", selectedBoard] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", selectedBoard]) || [];
      const newTask: Task = {
        id: Math.random().toString(), // Temporary ID
        title,
        column,
        project,
        board: selectedBoard,
        user: userId,
      };
      queryClient.setQueryData(["tasks", selectedBoard], [...previousTasks, newTask]);

      return { previousTasks };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["tasks", selectedBoard], context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedBoard] });
    }
  });

  // set default selection
  useEffect(() => {
    if(boards?.length) {
      setSelectedBoard(boards[0].id);
    }
  }, [boards]);

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
    updateTask({ id: taskId, updates: { column: newColumn } });
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
  }

  async function addTask(title: string, column: string, project?: string) {
    createTaskMutation.mutate({ title, column, project });
  }

  async function updateTask(payload: PayloadTaskUpdate) {
    updateTaskMutation.mutate(payload);
  }

  async function deleteTask(taskId: string) {
    return pb.collection("tasks").delete(taskId);
  }

  function handleDeleteTask(taskId: string) {
    deleteTask(taskId).then(() => {
      console.log('Deleted Task!');
      
      refetchTasks();
    });
  }

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
              {boards?.map((board) => (
                <option className="text-gray-500" key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          </div>
          <AddTaskForm onAdd={addTask} projects={projects ?? []} columns={columns} />
        </div>

        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <div className="flex grow gap-4 p-4 overflow-x-auto bg-gray-100">
            {columns?.map(({id, title}) => {
              const tasksByProject = tasks
                ?.filter((task) => task.column === id)
                .reduce((acc, task) => {                
                  const project = projects?.find(p => p.id === task.project)?.title || "No Project";
                  if (!acc[project]) acc[project] = [];
                  acc[project].push(task);
                  return acc;
                }, {} as Record<string, Task[]>) ?? {};

              return (
                <SortableContext id={id} key={id} items={Object.values(tasksByProject).flat()} strategy={verticalListSortingStrategy}>
                  <Column
                    id={id}
                    title={title}
                    tasksByProject={tasksByProject}
                    isHovered={hoveredColumn === id}
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
