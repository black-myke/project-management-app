// Description: This component represents a Kanban board, managing columns and tasks with drag-and-drop functionality.

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import BackgroundParticles from "./components/BackgroundParticles";
import KanbanColumn from "./components/KanbanColumn";
import AddColumnForm from "./components/AddColumnForm";
import TaskCard from "./components/TaskCard"; 
import { Toaster, toast } from "sonner";

function App() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const savedColumns = localStorage.getItem("kanbanColumns");
        if (savedColumns) {
          setColumns(JSON.parse(savedColumns));
        } else {
          setColumns([]); // Set empty array if no data
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data. Please refresh the page.");
        setColumns([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadFromLocalStorage();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("kanbanColumns", JSON.stringify(columns));
    }
  }, [columns, loading]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    if (active.data.current?.type === "column") {
      setActiveType("column");
    } else {
      setActiveType("task");
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    try {
      if (activeType === "column") {
        if (active.id !== over.id) {
          setColumns((columns) => {
            const oldIndex = columns.findIndex((col) => col.id === active.id);
            const newIndex = columns.findIndex((col) => col.id === over.id);
            
            const newColumns = arrayMove(columns, oldIndex, newIndex).map(
              (col, index) => ({ ...col, order: index })
            );
            
            return newColumns;
          });
        }
      } else if (activeType === "task") {
        const activeContainer = active.data.current.sortable.containerId;
        const overContainer = over.data.current?.sortable.containerId || over.id;

        const sourceColumn = columns.find((col) => col.id === activeContainer);
        const destColumn = columns.find((col) => col.id === overContainer);

        if (!sourceColumn || !destColumn) return;

        if (activeContainer === overContainer) {
          // Same column task reordering
          setColumns((columns) => {
            return columns.map((col) => {
              if (col.id === activeContainer) {
                const activeIndex = active.data.current.sortable.index;
                const overIndex = over.data.current?.sortable.index ?? col.tasks.length;
                
                const newTasks = arrayMove(col.tasks, activeIndex, overIndex)
                  .map((task, index) => ({ ...task, order: index }));
                return { ...col, tasks: newTasks };
              }
              return col;
            });
          });
        } else {
          // Moving task between columns
          setColumns((columns) => {
            return columns.map((col) => {
              if (col.id === activeContainer) {
                // Remove from source column
                const filteredTasks = col.tasks
                  .filter(task => task.id !== active.id)
                  .map((task, index) => ({ ...task, order: index }));
                return { ...col, tasks: filteredTasks };
              }
              if (col.id === overContainer) {
                // Add to destination column
                const activeTask = columns
                  .flatMap(col => col.tasks)
                  .find(task => task.id === active.id);
                
                const overIndex = over.data.current?.sortable.index ?? col.tasks.length;
                const newTasks = [...col.tasks];
                newTasks.splice(overIndex, 0, {
                  ...activeTask,
                  columnId: overContainer,
                  order: overIndex,
                });
                
                return {
                  ...col,
                  tasks: newTasks.map((task, index) => ({ ...task, order: index })),
                };
              }
              return col;
            });
          });
        }
      }
    } catch (error) {
      console.error("Error during drag operation:", error);
      toast.error("Failed to move item. Please try again.");
    }

    setActiveId(null);
    setActiveType(null);
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading your board...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 bg-pattern animate-gradient relative overflow-hidden">
      <BackgroundParticles />
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF00FF]/30 via-[#FFFF00]/30 to-[#00FFFF]/30 dark:from-[#FF00DD]/30 dark:via-[#DDFF00]/30 dark:to-[#00DDFF]/30 animate-color-pulse"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF3300]/50 dark:bg-[#FF5500]/30 rounded-full mix-blend-overlay dark:mix-blend-soft-light blur-3xl opacity-70 animate-float"></div>
        <div
          className="absolute top-1/4 -right-24 w-96 h-96 bg-[#33FF00]/50 dark:bg-[#55FF00]/30 rounded-full mix-blend-overlay dark:mix-blend-soft-light blur-3xl opacity-70 animate-wave"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#0033FF]/50 dark:bg-[#0055FF]/30 rounded-full mix-blend-overlay dark:mix-blend-soft-light blur-3xl opacity-70 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>
      
      {/* Main content */}
      <div 
        className="relative z-10 mx-auto max-w-7xl px-4 py-8 pointer-events-auto"
        onClick={handleContentClick}
      >
        <header className="mb-8 mt-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl bg-clip-text bg-gradient-to-r from-white to-white/80 drop-shadow-md">
            Kanban Board
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto drop-shadow-sm">
            Organize your tasks with drag and drop simplicity
          </p>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex space-x-6 overflow-x-auto pb-8 px-2 py-4 snap-x">
              {columns
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={column.tasks || []}
                    setColumns={setColumns}
                  />
                ))}
              <AddColumnForm setColumns={setColumns} columnsCount={columns.length} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeType === "column" ? (
              <KanbanColumn
                column={columns.find((col) => col.id === activeId)}
                tasks={[]}
                setColumns={setColumns}
                isDragging
              />
            ) : activeId && activeType === "task" ? (
              <TaskCard
                task={columns
                  .flatMap((col) => col.tasks)
                  .find((task) => task.id === activeId)}
                isDragging
                index={-1}
                columnId=""
                setColumns={setColumns}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;