"use client";

import { useState } from "react";
import { FaBell } from "react-icons/fa";

export default function Notifications() {
	const [isOpen, setIsOpen] = useState(false);
	const notifications = [
		{ id: 1, text: "Meeting with Alice at 10 AM", type: "meeting" },
		{ id: 2, text: "Task 'Quarterly Report' is due today", type: "task" },
	];

	return (
		<div className="relative">
			<button onClick={() => setIsOpen(!isOpen)} className="relative">
				<FaBell className="text-gray-700 text-xl" />
				{notifications.length > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 rounded-full">
						{notifications.length}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-4">
					<h3 className="text-lg font-semibold mb-2">Notifications</h3>
					<ul>
						{notifications.map((notification) => (
							<li key={notification.id} className="p-2 border-b">
								{notification.text}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
