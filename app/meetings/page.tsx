"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { firestore } from "../../utils/firebase.mjs";
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
import { useAuth } from "@/utils/AuthContext";

interface Meeting {
  id: string;
  title: string;
  time: string;
  participants: string[];
  agenda: string;
  userId: string;
  isOrganizer?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function MeetingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    time: "",
    participants: [] as string[],
    agenda: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchMeetings = async () => {
    try {
      if (!user?.uid || !user?.email) return;

      const meetingsRef = collection(db, "meetings");

      // Get meetings where user is organizer or participant
      const [organizerSnapshot, participantSnapshot] = await Promise.all([
        getDocs(query(meetingsRef, where("userId", "==", user.uid))),
        getDocs(
          query(
            meetingsRef,
            where("participants", "array-contains", user.email)
          )
        ),
      ]);

      const organizerMeetings = organizerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOrganizer: true,
      }));

      const participantMeetings = participantSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOrganizer: false,
      }));

      // Combine and sort meetings by date
      const allMeetings = [...organizerMeetings, ...participantMeetings]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        // Filter out past meetings
        .filter((meeting) => new Date(meeting.time) >= new Date());

      setMeetings(allMeetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const addParticipant = (user: User) => {
    if (!newMeeting.participants.includes(user.email)) {
      setNewMeeting((prev) => ({
        ...prev,
        participants: [...prev.participants, user.email],
      }));
    }
    setSearchEmail("");
    setFilteredUsers([]);
  };

  const removeParticipant = (email: string) => {
    setNewMeeting((prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (participant) => participant !== email
      ),
    }));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (user) {
      fetchMeetings(user.uid);
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"));
        const usersArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersArray);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchEmail) {
      setFilteredUsers(
        users.filter((user) =>
          user.email.toLowerCase().includes(searchEmail.toLowerCase())
        )
      );
    } else {
      setFilteredUsers([]);
    }
  }, [searchEmail, users]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isModalOpen]);

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
          participants: newMeeting.participants,
          agenda: newMeeting.agenda,
        });
      } else {
        // Add new meeting
        await addDoc(meetingsRef, {
          title: newMeeting.title,
          time: newMeeting.time,
          participants: newMeeting.participants,
          agenda: newMeeting.agenda,
          userId: user.uid, // 🔒 Store meeting under logged-in user
        });
      }

      setIsModalOpen(false);
      setNewMeeting({
        title: "",
        time: "",
        participants: [] as string[],
        agenda: "",
      });
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
      participants: meeting.participants,
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

      {/* Add Meeting & Arrange Meeting Buttons */}
      <div className="mb-4 flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          onClick={() => {
            setIsModalOpen(true);
            setEditMeetingId(null);
          }}
        >
          + Add Meeting
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          onClick={() => router.push("meetings/ArrangeMeeting")}
        >
          Arrange Meeting
        </button>
      </div>

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
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
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
              className="w-full border px-3 py-2 rounded-md"
            />
            <ul className="flex flex-wrap">
              {newMeeting.participants.map((email) => (
                <li
                  key={email}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full flex items-center space-x-2"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeParticipant(email)}
                    className="text-white hover:text-gray-300"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div>
              <input
                type="text"
                placeholder="Type participant's email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full border px-3 py-2 rounded-md mt-2"
              />
              <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => addParticipant(user)}
                  >
                    {user.email} - {user.name}
                  </li>
                ))}
              </ul>
            </div>
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
