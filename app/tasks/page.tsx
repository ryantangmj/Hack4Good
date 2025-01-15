"use client";

import { useState } from "react";
import AuthGuard from "../../components/AuthGuard";


export default function TasksPage() {
	const [tasks, setTasks] = useState([
		{
			id: 1,
			title: "Prepare Quarterly Report",
			priority: "High",
			completed: false,
		},
		{
			id: 2,
			title: "Email Client Updates",
			priority: "Medium",
			completed: false,
		},
		{ id: 3, title: "Schedule Team Meeting", priority: "Low", completed: true },
	]);

	// Toggle task completion
	const toggleTaskCompletion = (taskId: number) => {
		setTasks(
			tasks.map((task) =>
				task.id === taskId ? { ...task, completed: !task.completed } : task
			)
		);
	};

	return (
        <AuthGuard>
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Tasks</h1>

                <div className="space-y-4">
                    {tasks.map((task) => (
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
                                </div>

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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthGuard>
	);
}
