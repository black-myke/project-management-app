// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
      
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App



"use client"

import { useEffect, useState } from "react"
import { DragDropContext } from "react-beautiful-dnd"
import { Loader2 } from "lucide-react"

import { initializeFirebase, fetchBoardData, updateColumnInFirestore, updateTaskInFirestore } from "./lib/firebase"
import BackgroundParticles from "./components/BackgroundParticles"
import KanbanColumn from "./components/KanbanColumn"
import AddColumnForm from "./components/AddColumnForm"
import { Toaster } from "./components/ui/toaster"
import { useToast } from "./components/ui/use-toast"

function App() {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const setupFirebase = async () => {
      try {
        const firebaseApp = await initializeFirebase()

        // Set up real-time listener for board data
        const unsubscribe = fetchBoardData((data) => {
          setColumns(data)
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error setting up Firebase:", error)
        toast({
          title: "Connection Error",
          description: "Failed to connect to the database. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    setupFirebase()
  }, [toast])

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result

    // If there's no destination or the item was dropped back in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Handle column reordering
    if (type === "column") {
      const newColumns = Array.from(columns)
      const [removed] = newColumns.splice(source.index, 1)
      newColumns.splice(destination.index, 0, removed)

      // Update state optimistically
      setColumns(newColumns)

      // Update in Firestore
      try {
        for (let i = 0; i < newColumns.length; i++) {
          await updateColumnInFirestore(newColumns[i].id, { order: i })
        }
      } catch (error) {
        toast({
          title: "Sync Error",
          description: "Failed to update column order. Please try again.",
          variant: "destructive",
        })
      }
      return
    }

    // Handle task reordering
    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const destColumn = columns.find((col) => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceColumn.tasks || [])
      const [movedTask] = newTasks.splice(source.index, 1)
      newTasks.splice(destination.index, 0, movedTask)

      const newColumns = columns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: newTasks }
        }
        return col
      })

      // Update state optimistically
      setColumns(newColumns)

      // Update in Firestore
      try {
        for (let i = 0; i < newTasks.length; i++) {
          await updateTaskInFirestore(newTasks[i].id, {
            columnId: sourceColumn.id,
            order: i,
          })
        }
      } catch (error) {
        toast({
          title: "Sync Error",
          description: "Failed to update task order. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Moving from one column to another
      const sourceTasks = Array.from(sourceColumn.tasks || [])
      const destTasks = Array.from(destColumn.tasks || [])
      const [movedTask] = sourceTasks.splice(source.index, 1)

      // Update the task with new column ID
      const updatedTask = { ...movedTask, columnId: destColumn.id }
      destTasks.splice(destination.index, 0, updatedTask)

      const newColumns = columns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: sourceTasks }
        }
        if (col.id === destColumn.id) {
          return { ...col, tasks: destTasks }
        }
        return col
      })

      // Update state optimistically
      setColumns(newColumns)

      // Update in Firestore
      try {
        await updateTaskInFirestore(movedTask.id, {
          columnId: destColumn.id,
          order: destination.index,
        })

        // Update order of other tasks in destination column
        for (let i = 0; i < destTasks.length; i++) {
          if (i !== destination.index) {
            await updateTaskInFirestore(destTasks[i].id, { order: i })
          }
        }
      } catch (error) {
        toast({
          title: "Sync Error",
          description: "Failed to move task between columns. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading your board...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] dark:from-[#00DDFF] dark:via-[#FF00DD] dark:to-[#DDFF00] bg-pattern animate-gradient relative overflow-hidden">
      <BackgroundParticles />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 mt-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl bg-clip-text  bg-gradient-to-r from-white to-white/80 drop-shadow-md">
            Kanban Board
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto drop-shadow-sm">
            Organize your tasks with drag and drop simplicity
          </p>
        </header>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 overflow-x-auto pb-8 px-2 py-4 snap-x">
            {columns
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={column.tasks || []} setColumns={setColumns} />
              ))}
            <AddColumnForm setColumns={setColumns} columnsCount={columns.length} />
          </div>
        </DragDropContext>
      </div>
      <Toaster />
    </div>
  )
}

export default App
