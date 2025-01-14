import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
	title: "Digital PA",
	description: "A cost-effective digital PA system for administrators.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="flex h-screen bg-gray-100">
				{/* Sidebar */}
				<Sidebar />

				{/* Main Content */}
				<div className="flex-1 flex flex-col">
					{/* Top Navbar */}
					<header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
						<h1 className="text-lg font-semibold">Digital PA</h1>
						<input
							type="text"
							placeholder="Search..."
							className="border rounded-lg px-4 py-2 w-64"
						/>
					</header>

					{/* Page Content */}
					<main className="p-8">{children}</main>
				</div>
			</body>
		</html>
	);
}
