import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore"

let firebaseApp

export const initializeFirebase = async () => {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
  }

  firebaseApp = initializeApp(firebaseConfig)
  return firebaseApp
}

export const fetchBoardData = (callback) => {
  const db = getFirestore()

  // Get columns
  const columnsQuery = query(collection(db, "columns"), orderBy("order"))

  return onSnapshot(columnsQuery, async (columnsSnapshot) => {
    const columnsData = columnsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      tasks: [],
    }))

    // Get tasks for each column
    const tasksQuery = query(collection(db, "tasks"))

    const tasksSnapshot = await getDocs(tasksQuery)
    const tasksData = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Assign tasks to their columns
    columnsData.forEach((column) => {
      column.tasks = tasksData.filter((task) => task.columnId === column.id).sort((a, b) => a.order - b.order)
    })

    callback(columnsData)
  })
}

export const addColumnToFirestore = async (columnData) => {
  const db = getFirestore()
  const docRef = await addDoc(collection(db, "columns"), columnData)
  return docRef.id
}

export const updateColumnInFirestore = async (columnId, data) => {
  const db = getFirestore()
  await updateDoc(doc(db, "columns", columnId), data)
}

export const deleteColumnFromFirestore = async (columnId) => {
  const db = getFirestore()

  // Delete the column
  await deleteDoc(doc(db, "columns", columnId))

  // Delete all tasks in the column
  const tasksQuery = query(collection(db, "tasks"), where("columnId", "==", columnId))

  const tasksSnapshot = await getDocs(tasksQuery)

  const deletePromises = tasksSnapshot.docs.map((taskDoc) => deleteDoc(doc(db, "tasks", taskDoc.id)))

  await Promise.all(deletePromises)
}

export const addTaskToFirestore = async (taskData) => {
  const db = getFirestore()
  const docRef = await addDoc(collection(db, "tasks"), taskData)
  return docRef.id
}

export const updateTaskInFirestore = async (taskId, data) => {
  const db = getFirestore()
  await updateDoc(doc(db, "tasks", taskId), data)
}

export const deleteTaskFromFirestore = async (taskId) => {
  const db = getFirestore()
  await deleteDoc(doc(db, "tasks", taskId))
}
