"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "../../utils/firebase.mjs";

interface Task {
  id: string; // Document ID
  Dependencies: string;
  Title: string;
  Due: string; // Converted Firestore timestamp to string
  Priority: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    due: "",
    dependencies: "",
    priority: "",
  });

  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "Task"));
        const tasksArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          Due: doc.data().Due.toDate().toLocaleString(), // Convert Firestore timestamp to ISO string
        })) as Task[];
        setTasks(tasksArray);
      } catch (error) {
        console.error("Error fetching tasks: ", error);
      }
    };

    fetchTasks();
  }, []);

  // Function to handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  // Function to open the edit modal
  const openEditModal = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setNewTask({
        title: taskToEdit.Title,
        due: taskToEdit.Due,
        dependencies: taskToEdit.Dependencies,
        priority: taskToEdit.Priority,
      });
      setEditTaskId(taskId);
      setIsModalOpen(true);
    }
  };

  // Save the new or edited task to Firestore
  const saveTask = async () => {
    if (!newTask.title || !newTask.due) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      if (editTaskId !== null) {
        // Update existing task
        const docRef = doc(firestore, "Task", editTaskId);
        await updateDoc(docRef, {
          Title: newTask.title,
          Due: new Date(newTask.due),
          Dependencies: newTask.dependencies,
          Priority: newTask.priority,
        });

        setTasks(
          tasks.map((task) =>
            task.id === editTaskId
              ? {
                  ...task,
                  Title: newTask.title,
                  Due: newTask.due,
                  Dependencies: newTask.dependencies,
                  Priority: newTask.priority,
                }
              : task
          )
        );
      } else {
        // Add new task
        const docRef = await addDoc(collection(firestore, "Task"), {
          Title: newTask.title,
          Due: new Date(newTask.due),
          Dependencies: newTask.dependencies,
          Priority: newTask.priority,
        });

        setTasks([
          ...tasks,
          {
            id: docRef.id,
            Title: newTask.title,
            Due: newTask.due,
            Dependencies: newTask.dependencies,
            Priority: newTask.priority,
          },
        ]);
      }

      alert("Task saved successfully!");
      setIsModalOpen(false);
      setNewTask({ title: "", due: "", dependencies: "", priority: "" });
    } catch (error) {
      console.error("Error saving task: ", error);
      alert("Failed to save task!");
    }
  };

  // Function to delete a task
  const deleteTask = async (taskId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(firestore, "Task", taskId));
        setTasks(tasks.filter((task) => task.id !== taskId));
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task: ", error);
        alert("Failed to delete task!");
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Tasks</h1>

      {/* Add Task Button */}
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        onClick={() => {
          setIsModalOpen(true);
          setEditTaskId(null);
        }}
      >
        + Add Task
      </button>

      {/* Tasks List */}
      <div className="grid grid-cols-2 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-900">
              {task.Title}{" "}
              <span className="text-gray-500 text-sm">{task.Due}</span>
            </h2>
            <p className="text-gray-700 text-sm mt-1">
              Dependencies: {task.Dependencies || "None"}
            </p>
            <p className="text-gray-700 text-sm mt-1">
              Priority: {task.Priority || "Normal"}
            </p>

            {/* Edit & Delete Buttons */}
            <div className="flex mt-4 space-x-2">
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                onClick={() => openEditModal(task.id)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              {editTaskId !== null ? "Edit Task" : "Add Task"}
            </h2>
            <input
              type="text"
              name="title"
              placeholder="Task Title"
              value={newTask.title}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="datetime-local"
              name="due"
              value={newTask.due}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="text"
              name="dependencies"
              placeholder="Dependencies"
              value={newTask.dependencies}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="text"
              name="priority"
              placeholder="Priority"
              value={newTask.priority}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={saveTask}
              >
                {editTaskId !== null ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
