// Description: This component represents a Kanban column, displaying tasks and allowing for task management.

"use client";
import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { toast } from "sonner";

function AddTaskForm({ columnId, setIsAddingTask, setColumns, tasksCount }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setIsSubmitting(true);

    const newTask = {
      id: `task-${Date.now()}`, // Generate unique ID locally
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
    };

    try {
      // Update columns state and localStorage
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: [...(col.tasks || []), newTask],
            };
          }
          return col;
        });

        // Update localStorage
        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });

      setIsAddingTask(false);
      toast.success("Your new task has been created.");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task. Please try again.");

      // Remove task on error
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== newTask.id),
            };
          }
          return col;
        });

        // Update localStorage with reverted state
        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component remains the same (return statement with JSX)
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
                className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer"
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
                <SelectTrigger className="h-9 text-xs rounded-lg hover:cursor-pointer">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="low" className="rounded-md p-2 hover:cursor-pointer">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="rounded-md p-2 hover:cursor-pointer">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="rounded-md p-2 hover:cursor-pointer">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs justify-start rounded-lg hover:cursor-pointer">
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
                className="rounded-lg hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmitting} 
                className="rounded-lg hover:cursor-pointer"
              >
                {isSubmitting ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddTaskForm;