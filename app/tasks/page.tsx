"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  where,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Task {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: Date; // JavaScript Date object
  userId: string;
  participants: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Medium",
    dueDate: "",
    participants: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const fetchTasks = async (uid: string, email: string) => {
    try {
      setLoading(true);
      const tasksRef = collection(db, "tasks");

      // Query tasks where user is a participant or owner
      const [ownerSnapshot, participantSnapshot] = await Promise.all([
        getDocs(query(tasksRef, where("userId", "==", uid))),
        getDocs(query(tasksRef, where("participants", "array-contains", email))),
      ]);

      const ownerTasks = ownerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: new Date(doc.data().dueDate), // Convert Firestore string to JS Date
      }));

      const participantTasks = participantSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: new Date(doc.data().dueDate), // Convert Firestore string to JS Date
      }));

      // Combine tasks and remove duplicates
      const combinedTasks = [
        ...ownerTasks,
        ...participantTasks.filter(
          (task) => !ownerTasks.some((t) => t.id === task.id)
        ),
      ];

      setTasks(combinedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchTasks(user.uid, user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm) {
        setFilteredUsers([]);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", ">=", searchTerm),
        where("email", "<=", searchTerm + "\uf8ff")
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setFilteredUsers(users);
    };

    fetchUsers();
  }, [searchTerm]);

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { completed: !task.completed });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.dueDate.trim()) {
      alert("Task title and due date cannot be empty.");
      return;
    }
    if (!user) {
      alert("You must be logged in to add a task.");
      return;
    }

    try {
      const taskRef = collection(db, "tasks");
      const docRef = await addDoc(taskRef, {
        title: newTask.title,
        priority: newTask.priority,
        completed: false,
        dueDate: newTask.dueDate, // Store as Firestore string
        userId: user.uid,
        participants: newTask.participants,
        createdAt: serverTimestamp(),
      });

      setTasks((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newTask,
          completed: false,
          userId: user.uid,
          dueDate: new Date(newTask.dueDate),
        },
      ]);
      setNewTask({ title: "", priority: "Medium", dueDate: "", participants: [] });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const addParticipant = (email: string) => {
    if (!newTask.participants.includes(email)) {
      setNewTask((prev) => ({
        ...prev,
        participants: [...prev.participants, email],
      }));
    }
    setSearchTerm("");
    setFilteredUsers([]);
  };

  const removeParticipant = (email: string) => {
    setNewTask((prev) => ({
      ...prev,
      participants: prev.participants.filter((participant) => participant !== email),
    }));
  };

  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Tasks</h1>

        {/* Task Input */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {newTask.participants.map((email) => (
              <div
                key={email}
                className="px-3 py-1 bg-blue-500 text-white rounded-full flex items-center space-x-2"
              >
                <span>{email}</span>
                <button
                  onClick={() => removeParticipant(email)}
                  className="text-white hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search participants by email..."
            className="border px-3 py-2 rounded-md w-full mb-2"
          />
          {filteredUsers.length > 0 && (
            <ul className="border rounded-md max-h-40 overflow-y-auto mb-2">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => addParticipant(user.email)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="New Task"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="border px-3 py-2 rounded-md w-full"
            />
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="datetime-local"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <p className="text-gray-600">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found.</p>
        ) : (
          tasks
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg shadow-md ${
                  task.completed ? "bg-gray-200" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2
                      className={`text-lg font-semibold ${
                        task.completed
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-600"
                          : task.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {new Date(task.dueDate).toISOString().slice(0, 16)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Participants: {task.participants.join(", ")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded-md ${
                        task.completed
                          ? "bg-gray-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {task.completed ? "Undo" : "Complete"}
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </AuthGuard>
  );
}