"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import {
	collection,
	addDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	doc,
	query,
	where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

// Define types for the data coming from Firestore
interface Meeting {
	id: string;
	title: string;
	time: string;
	participants: string[];
	agenda: string;
	userId: string;
}

export default function MeetingsPage() {
	const router = useRouter();
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editMeetingId, setEditMeetingId] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null); // Type for user can be improved
	const [newMeeting, setNewMeeting] = useState({
		title: "",
		time: "",
		participants: "",
		agenda: "",
	});
	const [loading, setLoading] = useState(false);
	const [userName, setUserName] = useState<string>("");

	// 🔍 Function to fetch user-specific meetings
	const fetchMeetings = async (uid: string) => {
		try {
			setLoading(true);
			const meetingsRef = collection(db, "meetings");
			const q = query(meetingsRef, where("userId", "==", uid));
			const snapshot = await getDocs(q);
			const meetingsList = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Meeting[]; // Type assertion for Meeting[]
			setMeetings(meetingsList);
		} catch (error) {
			console.error("Error fetching meetings:", error);
			alert("Error loading meetings. Check Firestore setup.");
		} finally {
			setLoading(false);
		}
	};

	// 🔒 Check if user is authenticated & load their meetings
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				router.push("/auth"); // Redirect to login if not authenticated
			} else {
				setUser(user);
				setUserName(user.displayName || user.email || "Anonymous"); // Default to "Anonymous" if both are null/undefined
				fetchMeetings(user.uid);
			}
		});

		return () => unsubscribe();
	}, []);


	// Handle input changes
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setNewMeeting({ ...newMeeting, [e.target.name]: e.target.value });
	};

	// 📝 Save (Add or Edit) a Meeting
	const saveMeeting = async () => {
		if (!newMeeting.title || !newMeeting.time) {
			alert("Fill all fields!");
			return;
		}
		if (!user) {
			alert("You must be logged in to add a meeting.");
			return;
		}

		try {
			setLoading(true);
			const meetingsRef = collection(db, "meetings");

			if (editMeetingId) {
				// Edit existing meeting
				const meetingDoc = doc(db, "meetings", editMeetingId);
				await updateDoc(meetingDoc, {
					title: newMeeting.title,
					time: newMeeting.time,
					participants: newMeeting.participants.split(",").map((p) => p.trim()),
					agenda: newMeeting.agenda,
				});
			} else {
				// Add new meeting
				await addDoc(meetingsRef, {
					title: newMeeting.title,
					time: newMeeting.time,
					participants: newMeeting.participants.split(",").map((p) => p.trim()),
					agenda: newMeeting.agenda,
					userId: user.uid, // 🔒 Store meeting under logged-in user
				});
			}

			setIsModalOpen(false);
			setNewMeeting({ title: "", time: "", participants: "", agenda: "" });
			setEditMeetingId(null);
			fetchMeetings(user.uid);
		} catch (error) {
			console.error("Error saving meeting:", error);
			alert("Failed to save meeting. Check Firestore permissions.");
		} finally {
			setLoading(false);
		}
	};

	// ✏️ Open edit modal
	const openEditModal = (meeting: Meeting) => {
		setNewMeeting({
			title: meeting.title,
			time: meeting.time,
			participants: meeting.participants.join(", "),
			agenda: meeting.agenda,
		});
		setEditMeetingId(meeting.id);
		setIsModalOpen(true);
	};

	// 🗑️ Delete meeting from Firestore
	const deleteMeeting = async (meetingId: string) => {
		if (!confirm("Are you sure you want to delete this meeting?")) return;

		try {
			await deleteDoc(doc(db, "meetings", meetingId));
			fetchMeetings(user.uid);
		} catch (error) {
			console.error("Error deleting meeting:", error);
			alert("Error deleting meeting.");
		}
	};

	return (
		<div className="p-8">
			{/* Header */}
			<h1 className="text-2xl font-bold text-gray-900 mb-4">📅 My Meetings</h1>

        setEvents(
          events.map((event) =>
            event.id === editEventId
              ? {
                  ...event,
                  Name: newEvent.title,
                  Agenda: newEvent.agenda,
                  Participants: newEvent.participants
                    .split(",")
                    .map((p) => p.trim()),
                  Start: new Date(newEvent.time).toLocaleString(),
                }
              : event
          )
        );
      } else {
        // Add new meeting
        const docRef = await addDoc(collection(firestore, "Event"), {
          Name: newEvent.title,
          Agenda: newEvent.agenda,
          Participants: newEvent.participants.split(",").map((p) => p.trim()),
          Start: new Date(newEvent.time),
          OrganizerId: user?.uid,
        });

			{/* Meetings List */}
			{loading ? (
				<p className="text-gray-600">Loading meetings...</p>
			) : (
				<div className="grid grid-cols-2 gap-6">
					{meetings.length === 0 ? (
						<p className="text-gray-500">No meetings found.</p>
					) : (
						meetings.map((meeting) => (
							<div
								key={meeting.id}
								className="bg-white p-6 rounded-xl shadow-md transition hover:shadow-lg"
							>
								<h2 className="text-lg font-semibold text-gray-900 flex justify-between">
									{meeting.title}{" "}
									<span className="text-gray-500 text-sm">
										{new Date(meeting.time).toLocaleString()}
									</span>
								</h2>
								<p className="text-gray-700 text-sm mt-1">
									Participants:{" "}
									{Array.isArray(meeting.participants)
										? meeting.participants.join(", ")
										: "TBA"}
								</p>
								<p className="text-gray-700 text-sm mt-1">
									Agenda: {meeting.agenda}
								</p>

								{/* Edit & Delete Buttons */}
								<div className="flex mt-4 space-x-2">
									<button
										className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
										onClick={() => openEditModal(meeting)}
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
						))
					)}
				</div>
			)}

			{/* Meeting Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg shadow-lg w-96">
						<h2 className="text-xl font-semibold mb-4">
							{editMeetingId ? "Edit Meeting" : "Add Meeting"}
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
								{editMeetingId ? "Save Changes" : "Add Meeting"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
