"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
	FaTasks,
	FaCalendarAlt,
	FaRobot,
	FaEnvelope,
	FaHome,
	FaBell,
} from "react-icons/fa";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebase.mjs";

const Sidebar = () => {
	const [active, setActive] = useState("Dashboard");
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		// Listen to authentication state changes
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
		});

		return () => unsubscribe(); // Cleanup the listener on unmount
	}, []);

	const menuItems = [
		{ name: "Dashboard", icon: FaHome, path: "/" },
		{ name: "Meetings", icon: FaCalendarAlt, path: "/meetings" },
		{ name: "Tasks", icon: FaTasks, path: "/tasks" },
		{ name: "Email Analytics", icon: FaEnvelope, path: "/email-analytics" },
		{ name: "AI Assistant", icon: FaRobot, path: "/chat" },
		{ name: "Invites", icon: FaBell, path: "/invites" },
	];

	// Show nothing if the user is not logged in
	if (!user) {
		return null;
	}

	return (
		<aside className="w-72 bg-white h-screen shadow-md flex flex-col p-5">
			{/* Header Section */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Digital PA</h1>
			</div>

			{/* Menu Items */}
			<ul className="mt-6 space-y-2 flex-1">
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