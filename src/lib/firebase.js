import { initializeApp, getApps, getApp } from "firebase/app";
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
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaPMwU_5GphfPHDi_zFgx0inLFE8feYkA",
  authDomain: "kanban-app-project.firebaseapp.com",
  projectId: "kanban-app-project",
  storageBucket: "kanban-app-project.appspot.com",
  messagingSenderId: "895396614709",
  appId: "1:895396614709:web:e838329a67e2bbc095d77c",
  measurementId: "G-MLPDFGML6Z",
};

// Declare app and db variables
let app;
let db;

// ✅ Initialize Firebase lazily
export const initializeFirebase = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  return app;
};

// ✅ Fetch board data
export const fetchBoardData = (callback) => {
  const columnsQuery = query(collection(db, "columns"), orderBy("order"));

  return onSnapshot(columnsQuery, async (columnsSnapshot) => {
    const columnsData = columnsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      tasks: [],
    }));

    const tasksSnapshot = await getDocs(collection(db, "tasks"));
    const tasksData = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    columnsData.forEach((column) => {
      column.tasks = tasksData
        .filter((task) => task.columnId === column.id)
        .sort((a, b) => a.order - b.order);
    });

    callback(columnsData);
  });
};

// ✅ Column functions
export const addColumnToFirestore = async (columnData) => {
  const docRef = await addDoc(collection(db, "columns"), columnData);
  return docRef.id;
};

export const updateColumnInFirestore = async (columnId, data) => {
  await updateDoc(doc(db, "columns", columnId), data);
};

export const deleteColumnFromFirestore = async (columnId) => {
  await deleteDoc(doc(db, "columns", columnId));

  const tasksQuery = query(collection(db, "tasks"), where("columnId", "==", columnId));
  const tasksSnapshot = await getDocs(tasksQuery);

  const deletePromises = tasksSnapshot.docs.map((taskDoc) =>
    deleteDoc(doc(db, "tasks", taskDoc.id))
  );

  await Promise.all(deletePromises);
};

// ✅ Task functions
export const addTaskToFirestore = async (taskData) => {
  const docRef = await addDoc(collection(db, "tasks"), taskData);
  return docRef.id;
};

export const updateTaskInFirestore = async (taskId, data) => {
  await updateDoc(doc(db, "tasks", taskId), data);
};

export const deleteTaskFromFirestore = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// ✅ Export all together
export default {
  initializeFirebase,
  fetchBoardData,
  addColumnToFirestore,
  updateColumnInFirestore,
  deleteColumnFromFirestore,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
};
