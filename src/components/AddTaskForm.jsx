"use client";
import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

function AddTaskForm({ columnId, setIsAddingTask, setColumns, tasksCount }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [timeframe, setTimeframe] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeframe = (value, unit) => {
    if (!value) return "";
    const formattedUnit = unit === "hours" ? "hr" : unit.slice(0, -1);
    return `${value} ${formattedUnit}${value === "1" ? "" : "s"}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    if (!timeframe) {
      toast.error("Please enter a timeframe.");
      return;
    }

    setIsSubmitting(true);

    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description: description || "",
      completed,
      priority,
      timeEstimate: {
        value: timeframe,
        unit: timeUnit,
        formatted: formatTimeframe(timeframe, timeUnit)
      },
      columnId,
      order: tasksCount,
      assignee: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    };

    try {
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

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });

      setIsAddingTask(false);
      toast.success("Your new task has been created.");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task. Please try again.");

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

        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-3 border border-primary/20 shadow-sm backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 rounded-xl overflow-hidden">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">New Task</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setIsAddingTask(false)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>

            {/* Title with Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="task-completed"
                checked={completed}
                onCheckedChange={setCompleted}
                className={`h-4 w-4 ${
                  completed ? "bg-primary border-primary" : ""
                } transition-colors duration-200`}
              />
              <Input
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`h-8 text-xs rounded-lg flex-1 ${
                  completed ? "line-through text-gray-400 dark:text-gray-500" : ""
                }`}
                autoFocus
              />
            </div>

            {/* Description */}
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`min-h-[60px] text-xs rounded-lg resize-none ${
                completed ? "text-gray-400 dark:text-gray-500" : ""
              }`}
            />

            {/* Priority and Time Estimate */}
            <div className="grid grid-cols-1 gap-2">
              {/* Priority */}
              <Select value={priority} onValueChange={(value) => setPriority(value)}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                </SelectContent>
              </Select>

              {/* Time Estimate */}
              <div className="flex space-x-2 items-center">
                <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <Input
                  type="number"
                  min="1"
                  placeholder="Time"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="h-8 text-xs rounded-lg w-16"
                />
                <Select value={timeUnit} onValueChange={setTimeUnit} className="flex-1">
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="minutes" className="text-xs">Minutes</SelectItem>
                    <SelectItem value="hours" className="text-xs">Hours</SelectItem>
                    <SelectItem value="days" className="text-xs">Days</SelectItem>
                    <SelectItem value="weeks" className="text-xs">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Estimate Preview */}
            {timeframe && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Estimated: {formatTimeframe(timeframe, timeUnit)}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(false)}
                className="h-7 text-xs rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isSubmitting}
                className="h-7 text-xs rounded-lg"
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