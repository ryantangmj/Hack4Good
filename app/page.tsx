export default function Dashboard() {
	return (
		<div className="grid grid-cols-2 gap-6">
			{/* Upcoming Meetings */}
			<div className="bg-white p-6 rounded-xl shadow-md">
				<h2 className="text-xl font-semibold text-gray-900 flex items-center">
					📅 Upcoming Meetings
					<span className="ml-2 text-gray-500 cursor-pointer">+</span>
				</h2>

				<div className="mt-4 p-4 bg-gray-100 rounded-lg">
					<p className="font-bold text-gray-900">
						Strategic Planning{" "}
						<span className="text-gray-500 text-sm">10:00 AM</span>
					</p>
					<p className="text-gray-700 text-sm">
						Participants: Alice, Bob, Charlie
					</p>
					<p className="text-gray-700 text-sm mt-1">
						Agenda: Q1 Review • Goal Setting • Resource Planning
					</p>
				</div>
			</div>

			{/* Tasks */}
			<div className="bg-white p-6 rounded-xl shadow-md">
				<h2 className="text-xl font-semibold text-gray-900 flex items-center">
					✅ Tasks
					<span className="ml-2 text-gray-500 cursor-pointer">+</span>
				</h2>

				<div className="mt-4 p-4 bg-gray-100 rounded-lg">
					<p className="font-bold text-gray-900">
						Quarterly Report Review
						<span className="text-red-500 text-xs bg-red-100 px-2 py-1 rounded-md">
							High
						</span>
					</p>
					<p className="text-gray-700 text-sm">
						Due: 2025-01-15 |{" "}
						<span className="text-blue-500 font-medium">In Progress</span>
					</p>
					<p className="text-gray-700 text-sm mt-1">
						Dependencies: Data Analysis, Team Input
					</p>
				</div>
			</div>
		</div>
	);
}
