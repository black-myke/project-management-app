import { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreHorizontal, Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";

function KanbanColumn({ column, tasks, setColumns, isDragging }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const dropdownRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeleteColumn = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If dropdownRef supports close, call it
    if (dropdownRef.current?.close) {
      dropdownRef.current.close();
    }

    // Delete column synchronously
    setColumns((prevColumns) => {
      try {
        const updatedColumns = prevColumns
          .filter((col) => col.id !== column.id)
          .map((col, index) => ({ ...col, order: index }));

        window.localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        
        toast.success(`Column "${column.title}" deleted`);
        return updatedColumns;
      } catch (error) {
        console.error("Error deleting column:", error);
        toast.error("Failed to delete column");
        return prevColumns;
      }
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex-shrink-0 w-80 ${isDragging ? "opacity-50" : ""}`}
    >
      <Card
        className={`h-full backdrop-blur-md bg-white/80 dark:bg-slate-800/70 border-t-2 border-t-white/50 shadow-lg hover:shadow-xl transition-all duration-300 ${
          isDragging ? "rotate-1 scale-[1.02]" : ""
        }`}
      >
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-white/20 to-transparent dark:from-white/5 dark:to-transparent rounded-t-lg">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-lg text-gray-800 dark:text-gray-100">{column.title}</h3>
            <span className="bg-white/30 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              {tasks.length}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-white/20 dark:hover:bg-gray-700/50 hover:cursor-pointer focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Column menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent ref={dropdownRef} align="end" className="w-48 rounded-xl">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteColumn(e);
                }}
                className="text-destructive focus:text-destructive rounded-lg hover:cursor-pointer hover:bg-destructive/10"
              >
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-3 min-h-[300px] transition-colors duration-200">
          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {tasks
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} columnId={column.id} setColumns={setColumns} />
              ))}
          </SortableContext>

          {isAddingTask ? (
            <AddTaskForm
              columnId={column.id}
              setIsAddingTask={setIsAddingTask}
              setColumns={setColumns}
              tasksCount={tasks.length}
            />
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4 rounded-xl border border-dashed border-white/30 dark:border-gray-700 mt-2">
              <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-gray-800 flex items-center justify-center mb-3 backdrop-blur-sm">
                <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No tasks in this column</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="rounded-full hover:cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add a task
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-xl border border-dashed border-white/30 dark:border-gray-700 hover:border-white/50 dark:hover:border-gray-600 transition-colors backdrop-blur-sm"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add a task
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KanbanColumn;