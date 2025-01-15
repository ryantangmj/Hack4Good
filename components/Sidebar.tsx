"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
	FaTasks,
	FaCalendarAlt,
	FaRobot,
	FaEnvelope,
	FaHome,
	FaSignOutAlt,
} from "react-icons/fa";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
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
	];

	const handleLogout = async () => {
		try {
			await signOut(auth);
			alert("Successfully logged out!");
			window.location.href = "/"; // Redirect to the login page
		} catch (error) {
			console.error("Error during logout: ", error);
		}
	};

	// Show nothing if the user is not logged in
	if (!user) {
		return null;
	}

	return (
		<aside className="w-72 bg-white h-screen shadow-md flex flex-col p-5">
			{/* Header Section */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Digital PA</h1>
				<p className="text-sm text-gray-600 mt-1">Productivity Score</p>
				<p className="text-2xl font-bold text-blue-600">92%</p>
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

			{/* Logout Button */}
			<div className="border-t pt-4">
				<button
					onClick={handleLogout}
					className="w-full flex items-center px-4 py-3 space-x-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
				>
					<FaSignOutAlt className="w-5 h-5" />
					<span>Log Out</span>
				</button>
			</div>
		</aside>
	);
};

export default Sidebar;