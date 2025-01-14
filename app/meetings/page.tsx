"use client";

import { useState } from "react";

export default function MeetingsPage() {
	const [meetings, setMeetings] = useState([
		{
			id: 1,
			title: "Strategic Planning",
			time: "2025-01-15T10:00",
			participants: ["Alice", "Bob", "Charlie"],
			agenda: "Q1 Review • Goal Setting • Resource Planning",
		},
		{
			id: 2,
			title: "Project Kickoff",
			time: "2025-01-20T14:00",
			participants: ["David", "Emma", "Frank"],
			agenda: "Project timeline • Assigning roles",
		},
	]);

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editMeetingId, setEditMeetingId] = useState<number | null>(null);
	const [newMeeting, setNewMeeting] = useState({
		title: "",
		time: "",
		participants: "",
		agenda: "",
	});

	// Function to handle input change
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setNewMeeting({ ...newMeeting, [e.target.name]: e.target.value });
	};

	// Function to open the edit modal
	const openEditModal = (meetingId: number) => {
		const meetingToEdit = meetings.find((meeting) => meeting.id === meetingId);
		if (meetingToEdit) {
			setNewMeeting({
				title: meetingToEdit.title,
				time: meetingToEdit.time,
				participants: meetingToEdit.participants.join(", "),
				agenda: meetingToEdit.agenda,
			});
			setEditMeetingId(meetingId);
			setIsModalOpen(true);
		}
	};

	// Function to add or edit a meeting
	const saveMeeting = () => {
		if (!newMeeting.title || !newMeeting.time)
			return alert("Please fill all fields!");

		if (editMeetingId !== null) {
			// Editing an existing meeting
			setMeetings((prevMeetings) =>
				prevMeetings.map((meeting) =>
					meeting.id === editMeetingId
						? {
								...meeting,
								title: newMeeting.title,
								time: newMeeting.time,
								participants: newMeeting.participants
									.split(",")
									.map((p) => p.trim()),
								agenda: newMeeting.agenda,
						  }
						: meeting
				)
			);
		} else {
			// Adding a new meeting
			const meetingToAdd = {
				id: meetings.length + 1,
				title: newMeeting.title,
				time: newMeeting.time,
				participants: newMeeting.participants.split(",").map((p) => p.trim()),
				agenda: newMeeting.agenda,
			};
			setMeetings([...meetings, meetingToAdd]);
		}

		setIsModalOpen(false); // Close modal after saving
		setNewMeeting({ title: "", time: "", participants: "", agenda: "" }); // Reset form
		setEditMeetingId(null);
	};

	// Function to delete a meeting
	const deleteMeeting = (meetingId: number) => {
		const confirmDelete = confirm(
			"Are you sure you want to delete this meeting?"
		);
		if (confirmDelete) {
			setMeetings(meetings.filter((meeting) => meeting.id !== meetingId));
		}
	};

	// Function to format date-time for display
	const formatDateTime = (isoDateTime: string) => {
		const date = new Date(isoDateTime);
		return date.toLocaleString("en-US", {
			weekday: "short",
			month: "short",
			day: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold text-gray-900 mb-4">📅 Meetings</h1>

			{/* Add Meeting Button */}
			<button
				className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
				onClick={() => {
					setIsModalOpen(true);
					setEditMeetingId(null);
				}}
			>
				+ Add Meeting
			</button>

			{/* Meetings List */}
			<div className="grid grid-cols-2 gap-6">
				{meetings.map((meeting) => (
					<div key={meeting.id} className="bg-white p-6 rounded-xl shadow-md">
						<h2 className="text-lg font-semibold text-gray-900">
							{meeting.title}{" "}
							<span className="text-gray-500 text-sm">
								{formatDateTime(meeting.time)}
							</span>
						</h2>
						<p className="text-gray-700 text-sm mt-1">
							Participants: {meeting.participants.join(", ") || "TBA"}
						</p>
						<p className="text-gray-700 text-sm mt-1">
							Agenda: {meeting.agenda}
						</p>

						{/* Edit & Delete Buttons */}
						<div className="flex mt-4 space-x-2">
							<button
								className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
								onClick={() => openEditModal(meeting.id)}
							>
								Edit
							</button>
							<button
								className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
								onClick={() => deleteMeeting(meeting.id)}
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>

			{/* Meeting Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg shadow-lg w-96">
						<h2 className="text-xl font-semibold mb-4">
							{editMeetingId !== null ? "Edit Meeting" : "Add Meeting"}
						</h2>
						<input
							type="text"
							name="title"
							placeholder="Meeting Title"
							value={newMeeting.title}
							onChange={handleChange}
							className="w-full border px-3 py-2 mb-2 rounded-md"
						/>
						<input
							type="datetime-local"
							name="time"
							value={newMeeting.time}
							onChange={handleChange}
							className="w-full border px-3 py-2 mb-2 rounded-md"
						/>
						<input
							type="text"
							name="participants"
							placeholder="Participants (comma-separated)"
							value={newMeeting.participants}
							onChange={handleChange}
							className="w-full border px-3 py-2 mb-2 rounded-md"
						/>
						<textarea
							name="agenda"
							placeholder="Agenda"
							value={newMeeting.agenda}
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
								onClick={saveMeeting}
							>
								{editMeetingId !== null ? "Save Changes" : "Add Meeting"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
