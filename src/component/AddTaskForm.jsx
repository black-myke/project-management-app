"use client"

import { useState } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useToast } from "./ui/use-toast"

import { addTaskToFirestore } from "../lib/firebase"

function AddTaskForm({ columnId, setIsAddingTask, setColumns, tasksCount }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const newTask = {
      title,
      description: description || "",
      completed: false,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      columnId,
      order: tasksCount,
      assignee: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    }

    try {
      // Optimistic UI update
      const tempId = `temp-${Date.now()}`
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: [...(col.tasks || []), { ...newTask, id: tempId }],
            }
          }
          return col
        }),
      )

      // Add to Firestore
      const taskId = await addTaskToFirestore(newTask)

      // Update with real ID
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.map((t) => (t.id === tempId ? { ...t, id: taskId } : t)),
            }
          }
          return col
        }),
      )

      setIsAddingTask(false)
      toast({
        title: "Task added",
        description: "Your new task has been created",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      })

      // Remove temp task on error
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== `temp-${Date.now()}`),
            }
          }
          return col
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-3 border border-primary/20 shadow-sm backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">New Task</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setIsAddingTask(false)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>

            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm rounded-lg"
              autoFocus
            />

            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] text-sm rounded-lg resize-none"
            />

            <div className="flex space-x-2">
              <Select value={priority} onValueChange={(value) => setPriority(value)}>
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="low" className="rounded-md">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="rounded-md">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="rounded-md">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs justify-start rounded-lg">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dueDate ? format(dueDate, "PPP") : "Set due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="rounded-lg"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-lg">
                {isSubmitting ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddTaskForm
