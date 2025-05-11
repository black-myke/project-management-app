import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MoreHorizontal, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";

function TaskCard({ task, index, columnId, setColumns, isDragging = false }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      index,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeleteTask = (e) => {
    e.preventDefault(); // Add this line
    e.stopPropagation();

    try {
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks
                .filter((t) => t.id !== task.id)
                .map((t, idx) => ({ ...t, order: idx })), // Add order update
            };
          }
          return col;
        });

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });

      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task. Please try again.");

      // Revert changes on error
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId && !col.tasks.some((t) => t.id === task.id)) {
            return {
              ...col,
              tasks: [...col.tasks, task].sort((a, b) => (a.order || 0) - (b.order || 0)),
            };
          }
          return col;
        });

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });
    }
  };

  const toggleTaskCompletion = () => {
    try {
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === task.id ? { ...t, completed: !t.completed } : t
              ),
            };
          }
          return col;
        });

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });

      toast.success("Task status updated!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status. Please try again.");

      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === task.id ? { ...t, completed: task.completed } : t
              ),
            };
          }
          return col;
        });

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300";
      case "medium":
        return "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300";
      case "low":
        return "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityBorderColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-400";
      case "medium":
        return "border-l-amber-400";
      case "low":
        return "border-l-green-400";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`mb-3 group ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card
        className={`border-l-2 ${getPriorityBorderColor(task.priority)} shadow-sm ${
          isDragging ? "shadow-md" : "hover:shadow-sm"
        } transition-all duration-300 ${
          task.completed
            ? "bg-gray-50/80 dark:bg-gray-800/50"
            : "bg-white/95 dark:bg-gray-800/90"
        } ${isDragging ? "scale-[1.02] rotate-1" : ""} backdrop-blur-sm rounded-lg`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={toggleTaskCompletion}
                className={`mt-1 ${
                  task.completed ? "bg-primary border-primary" : ""
                } transition-colors duration-200`}
              />
              <div>
                <div
                  className={`font-medium ${
                    task.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
                  } transition-all duration-200`}
                >
                  {task.title}
                </div>
                {task.description && (
                  <p
                    className={`text-sm mt-1.5 ${
                      task.completed
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isHovered ? "opacity-100" : "opacity-0"
                  } group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200`}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Task menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive rounded-lg hover:cursor-pointer"
                  onClick={handleDeleteTask}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center mt-4 gap-2">
            <Badge
              variant="secondary"
              className={`${getPriorityColor(
                task.priority
              )} rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors`}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {task.timeEstimate && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3 mr-1" />
                <span>{task.timeEstimate.formatted}</span>
              </div>
            )}

            {task.assignee && (
              <div className="ml-auto">
                <Avatar className="h-6 w-6 ring-1 ring-white dark:ring-gray-800 transition-all duration-200 hover:scale-105">
                  {task.assignee.avatar && (
                    <AvatarImage
                      src={task.assignee.avatar || "/placeholder.svg"}
                      alt={task.assignee.name}
                    />
                  )}
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {task.assignee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskCard;