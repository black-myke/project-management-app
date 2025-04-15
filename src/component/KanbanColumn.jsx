"use client"

import { useState } from "react"
import { Draggable, Droppable } from "react-beautiful-dnd"
import { MoreHorizontal, Plus } from "lucide-react"

import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useToast } from "./ui/use-toast"

import TaskCard from "./TaskCard"
import AddTaskForm from "./AddTaskForm"
import { deleteColumnFromFirestore } from "../lib/firebase"

function KanbanColumn({ column, tasks, setColumns }) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const { toast } = useToast()

  const handleDeleteColumn = async () => {
    try {
      // Optimistic UI update
      setColumns((prevColumns) => prevColumns.filter((col) => col.id !== column.id))

      // Delete from Firestore
      await deleteColumnFromFirestore(column.id)

      toast({
        title: "Column deleted",
        description: `"${column.title}" column has been removed`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete column. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      setColumns((prevColumns) => {
        if (!prevColumns.some((col) => col.id === column.id)) {
          return [...prevColumns, column]
        }
        return prevColumns
      })
    }
  }

  return (
    <Draggable draggableId={column.id} index={column.order || 0}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} className="flex-shrink-0 w-80 snap-start">
          <Card
            className={`h-full backdrop-blur-md bg-white/80 dark:bg-slate-800/70 border-t-2 border-t-white/50 shadow-lg hover:shadow-xl transition-all duration-300 ${
              snapshot.isDragging ? "rotate-1 scale-[1.02]" : ""
            }`}
          >
            <CardHeader
              className="p-4 flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-white/20 to-transparent dark:from-white/5 dark:to-transparent rounded-t-lg"
              {...provided.dragHandleProps}
            >
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
                    className="h-8 w-8 rounded-full hover:bg-white/20 dark:hover:bg-gray-700/50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Column menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive rounded-lg"
                    onClick={handleDeleteColumn}
                  >
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <Droppable droppableId={column.id} type="task">
              {(provided, snapshot) => (
                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-3 min-h-[300px] transition-colors duration-200 ${
                    snapshot.isDraggingOver ? "bg-white/20 dark:bg-gray-700/30" : ""
                  }`}
                >
                  {tasks
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} columnId={column.id} setColumns={setColumns} />
                    ))}
                  {provided.placeholder}

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
                        className="rounded-full"
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
              )}
            </Droppable>
          </Card>
        </div>
      )}
    </Draggable>
  )
}

export default KanbanColumn
