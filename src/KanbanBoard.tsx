import { ChangeEvent, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import LoginForm from "./LoginForm";
import { Task } from "./types";
import AddTaskForm from "./AddTaskForm";
import HeaderBar from "./HeaderBar";
import usePocket from "./hooks/usePocket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useTasks, { TaskCreateParams, TaskUpdateParams } from "./hooks/useTasks";

export default function KanbanBoard() {
  const { pb, user } = usePocket();
  const TaskAPI = useTasks();
  const queryClient = useQueryClient();

  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  /**
   * Async Data Queries
   */
  const { data: boards  } = useQuery({
    queryKey: ['boards'],
    queryFn: () => TaskAPI.getBoards(),
    enabled: !!user || isGuest
  }); 
  const { data: projects  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => TaskAPI.getProjects(),
    enabled: !!user || isGuest,
  });
  const { data: columns  } = useQuery({
    queryKey: ['columns', selectedBoard],
    queryFn: () => TaskAPI.getColumns(selectedBoard),
    enabled: !!selectedBoard,
  });
  const { data: tasks, refetch: refetchTasks  } = useQuery({
    queryKey: ['tasks', selectedBoard],
    queryFn: () => TaskAPI.getTasks(selectedBoard),
    enabled: !!selectedBoard,
  });

  /**
   * Async Optimistic Mutations
   */
  const updateTaskMutation = useMutation({
    mutationFn: async (params: TaskUpdateParams) => TaskAPI.updateTask(params),
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedBoard] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (params :TaskCreateParams) => TaskAPI.createTasks(params),
    onMutate: async ({ title, column, project }: { title: string, column: string, project?: string }) => {
      const userId = pb.authStore.record?.id || TaskAPI.getGuestId();
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

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => TaskAPI.deleteTask(taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", selectedBoard] });
  
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", selectedBoard]) || [];
      queryClient.setQueryData(
        ["tasks", selectedBoard],
        previousTasks.filter((task) => task.id !== taskId)
      );
  
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
    console.log('Cancelled Login!');
    setIsGuest(true);
  };

  async function switchBoard(e: ChangeEvent<HTMLSelectElement>) {
    const newBoard = e.target.value;
    setSelectedBoard(newBoard)
  }

  async function addTask(title: string, column: string, project?: string) {
    createTaskMutation.mutate({ title, column, project, board: selectedBoard });
  }

  async function updateTask(payload: TaskUpdateParams) {
    updateTaskMutation.mutate(payload);
  }

  async function deleteTask(taskId: string) {
    deleteTaskMutation.mutate(taskId);
  }

  function handleDeleteTask(taskId: string) {
    deleteTask(taskId).then(() => {
      console.log('Deleted Task!');
      
      refetchTasks();
    });
  }

  if (!user && !isGuest) {
    return (
      <LoginForm
        isOpen
        onCancel={handleLoginCancel}
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
