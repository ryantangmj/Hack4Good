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
					{/* Page Content */}
					<main className="p-8">{children}</main>
				</div>
			</body>
		</html>
	);
}
