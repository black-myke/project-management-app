"use client"

import { useState } from "react"
import { Draggable } from "react-beautiful-dnd"
import { Calendar, MoreHorizontal, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent } from "./ui/card"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useToast } from "./ui/use-toast"

import { deleteTaskFromFirestore, updateTaskInFirestore } from "../lib/firebase"

function TaskCard({ task, index, columnId, setColumns }) {
  const [isHovered, setIsHovered] = useState(false)
  const { toast } = useToast()

  const handleDeleteTask = async (e) => {
    e.stopPropagation()

    try {
      // Optimistic UI update
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            }
          }
          return col
        }),
      )

      // Delete from Firestore
      await deleteTaskFromFirestore(task.id)

      toast({
        title: "Task deleted",
        description: "The task has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      setColumns((prevColumns) => {
        return prevColumns.map((col) => {
          if (col.id === columnId) {
            // Check if task is already in the column
            if (!col.tasks.some((t) => t.id === task.id)) {
              return {
                ...col,
                tasks: [...col.tasks, task].sort((a, b) => (a.order || 0) - (b.order || 0)),
              }
            }
          }
          return col
        })
      })
    }
  }

  const toggleTaskCompletion = async () => {
    try {
      // Optimistic UI update
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
            }
          }
          return col
        }),
      )

      // Update in Firestore
      await updateTaskInFirestore(task.id, { completed: !task.completed })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
            }
          }
          return col
        }),
      )
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
      case "medium":
        return "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
      case "low":
        return "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300"
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPriorityBorderColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-400"
      case "medium":
        return "border-l-amber-400"
      case "low":
        return "border-l-green-400"
      default:
        return "border-l-gray-300"
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="mb-3 group"
        >
          <Card
            className={`
            border-l-2 
            ${getPriorityBorderColor(task.priority)}
            shadow-sm 
            ${snapshot.isDragging ? "shadow-md" : "hover:shadow-sm"} 
            transition-all duration-300 
            ${task.completed ? "bg-gray-50/80 dark:bg-gray-800/50" : "bg-white/95 dark:bg-gray-800/90"}
            ${snapshot.isDragging ? "scale-[1.02] rotate-1" : ""}
            backdrop-blur-sm rounded-lg
          `}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={toggleTaskCompletion}
                    className={`mt-1 ${task.completed ? "bg-primary border-primary" : ""} transition-colors duration-200`}
                  />
                  <div>
                    <div
                      className={`font-medium ${task.completed ? "line-through text-gray-400 dark:text-gray-500" : ""} transition-all duration-200`}
                    >
                      {task.title}
                    </div>
                    {task.description && (
                      <p
                        className={`text-sm mt-1.5 ${task.completed ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${isHovered ? "opacity-100" : "opacity-0"} group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200`}
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">Task menu</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg"
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
                  className={`${getPriorityColor(task.priority)} rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>

                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
                  </div>
                )}

                {task.assignee && (
                  <div className="ml-auto">
                    <Avatar className="h-6 w-6 ring-1 ring-white dark:ring-gray-800 transition-all duration-200 hover:scale-105">
                      {task.assignee.avatar && (
                        <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} alt={task.assignee.name} />
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
      )}
    </Draggable>
  )
}

export default TaskCard
