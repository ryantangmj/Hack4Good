"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
	FaTasks,
	FaCalendarAlt,
	FaRobot,
	FaEnvelope,
	FaHome,
} from "react-icons/fa";

const Sidebar = () => {
	const [active, setActive] = useState("Dashboard");

	const menuItems = [
		{ name: "Dashboard", icon: FaHome, path: "/" },
		{ name: "Meetings", icon: FaCalendarAlt, path: "/meetings" },
		{ name: "Tasks", icon: FaTasks, path: "/tasks" },
		{ name: "Email Analytics", icon: FaEnvelope, path: "/email-analytics" },
		{ name: "AI Assistant", icon: FaRobot, path: "/chat" },
	];

	return (
		<aside className="w-72 bg-white h-screen shadow-md p-5">
			<h1 className="text-2xl font-bold text-gray-900">Digital PA</h1>{" "}
			{/* Stronger Text Color */}
			<p className="text-sm text-gray-600 mt-1">Productivity Score</p>{" "}
			{/* Darker Text */}
			<p className="text-2xl font-bold text-blue-600">92%</p>
			<ul className="mt-6 space-y-2">
				{menuItems.map((item) => (
					<li key={item.name}>
						<Link href={item.path} passHref>
							<div
								className={`flex items-center px-4 py-3 space-x-3 rounded-lg transition-colors ${
									active === item.name
										? "bg-blue-500 text-white"
										: "text-gray-700 hover:bg-gray-200"
								}`}
								onClick={() => setActive(item.name)}
							>
								<item.icon className="w-5 h-5" />
								<span>{item.name}</span>
							</div>
						</Link>
					</li>
				))}
			</ul>
		</aside>
	);
};

export default Sidebar;
