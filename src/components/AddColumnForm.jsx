// Description: This component represents a Kanban column, displaying tasks and allowing for task management.
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { toast } from "sonner";

function AddColumnForm({ setColumns, columnsCount }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a column title.");
      return;
    }

    setIsSubmitting(true);

    const newColumn = {
      id: `column-${Date.now()}`, // Generate unique ID
      title,
      order: columnsCount,
      tasks: [],
    };

    try {
      // Update columns state and localStorage
      setColumns((prev) => {
        const updatedColumns = [...prev, newColumn];
        localStorage.setItem("kanbanColumns", JSON.stringify(updatedColumns));
        return updatedColumns;
      });

      setTitle("");
      setIsAdding(false);
      toast.success("Your new column has been created.");
    } catch (error) {
      console.error("Error adding column:", error);
      toast.error("Failed to add column. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="flex-shrink-0 h-16 border-dashed border-2 w-80 mt-10 rounded-xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 hover:border-white/50 hover:text-white snap-start shadow-lg hover:shadow-xl"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Column
      </Button>
    );
  }

  return (
    <Card className="flex-shrink-0 w-80 border-dashed border-2 shadow-lg bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl snap-start">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <h3 className="font-medium mb-3 text-slate-800 dark:text-slate-200">
            Add new column
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Column title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setIsSubmitting(false);
                  setTitle("");
                }}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-lg"
              >
                {isSubmitting ? "Adding..." : "Add Column"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddColumnForm;