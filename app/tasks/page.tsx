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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

interface Task {
	id: string;
	title: string;
	priority: string;
	completed: boolean;
	dueDate: Timestamp; // Firestore Timestamp
	userId: string;
}

export default function TasksPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [newTask, setNewTask] = useState({
		title: "",
		priority: "Medium",
		dueDate: "",
	});
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState<any>(null);

	// Fetch tasks from Firestore
	const fetchTasks = async (uid: string) => {
		try {
			setLoading(true);
			const tasksRef = collection(db, "tasks");
			const q = query(tasksRef, where("userId", "==", uid));
			const snapshot = await getDocs(q);
			const tasksList = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
				dueDate: doc.data().dueDate.toDate(), // Convert Firestore Timestamp to JS Date
			})) as Task[];
			setTasks(tasksList);
		} catch (error) {
			console.error("Error fetching tasks:", error);
		} finally {
			setLoading(false);
		}
	};

	// Monitor authentication state
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUser(user);
				fetchTasks(user.uid);
			}
		});
		return () => unsubscribe();
	}, []);

	// Toggle task completion and update Firestore
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

	// Handle adding a new task
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
				dueDate: Timestamp.fromDate(new Date(newTask.dueDate)), // Save as Firestore Timestamp
				userId: user.uid,
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
			setNewTask({ title: "", priority: "Medium", dueDate: "" });
		} catch (error) {
			console.error("Error adding task:", error);
		}
	};

	// Delete a task
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

	return (
		<AuthGuard>
			<div className="p-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Tasks</h1>

				{/* Task Input */}
				<div className="mb-4 flex space-x-2">
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
						type="date"
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

				{/* Task List */}
				{loading ? (
					<p className="text-gray-600">Loading tasks...</p>
				) : (
					<div className="space-y-4">
						{tasks.length === 0 ? (
							<p className="text-gray-500">No tasks found.</p>
						) : (
							[...tasks]
								.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()) // Sort tasks chronologically
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
													Due: {task.dueDate.toLocaleDateString()}
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
				)}
			</div>
		</AuthGuard>
	);
}
