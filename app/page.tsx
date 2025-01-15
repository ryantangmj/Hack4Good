"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase.mjs";

interface Event {
  id: string; // Document ID
  Agenda: string;
  Name: string;
  Participants: string;
  Start: string; // Converted Firestore timestamp to string
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    Name: "",
    Agenda: "",
    Participants: "",
    Start: "",
  });

  // Fetch meetings from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "Event"));
        const itemsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          Start: doc.data().Start.toDate().toLocaleString(),
        })) as Event[];
        setEvents(itemsArray);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };

    fetchItems();
  }, []);

  // Handle input changes for the form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewMeeting({ ...newMeeting, [e.target.name]: e.target.value });
  };

  // Save the new meeting to Firestore
  const saveMeeting = async () => {
    if (!newMeeting.Name || !newMeeting.Start) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "Event"), {
        Name: newMeeting.Name,
        Agenda: newMeeting.Agenda,
        Participants: newMeeting.Participants.split(",").map((p) => p.trim()),
        Start: new Date(newMeeting.Start),
      });

      // Update the UI with the new meeting
      setEvents([
        ...events,
        {
          id: docRef.id,
          ...newMeeting,
          Participants: newMeeting.Participants,
          Start: new Date(newMeeting.Start).toLocaleString(),
        },
      ]);

      alert("Meeting added successfully!");
      setIsModalOpen(false);
      setNewMeeting({ Name: "", Agenda: "", Participants: "", Start: "" });
    } catch (error) {
      console.error("Error adding meeting: ", error);
      alert("Failed to add meeting!");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Upcoming Meetings */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📅 Upcoming Meetings
          <span
          className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700 text-2xl" 
          onClick={() => {
            console.log("Button clicked");
            setIsModalOpen(true);
          }}
        >
          +
        </span>
        </h2>

        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="mb-4">
                <p className="font-bold text-gray-900">
                  {event.Name}{" "}
                  <span className="text-gray-500 text-sm">{event.Start}</span>
                </p>
                <p className="text-gray-700 text-sm">
                  Participants: {event.Participants}
                </p>
                <p className="text-gray-700 text-sm mt-1">
                  Agenda: {event.Agenda}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-700 text-sm">No upcoming meetings.</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          ✅ Tasks
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

      {/* Modal for Adding Meetings */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Add Meeting</h2>
            <input
              type="text"
              name="Name"
              placeholder="Meeting Name"
              value={newMeeting.Name}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="datetime-local"
              name="Start"
              value={newMeeting.Start}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="text"
              name="Participants"
              placeholder="Participants (comma-separated)"
              value={newMeeting.Participants}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <textarea
              name="Agenda"
              placeholder="Agenda"
              value={newMeeting.Agenda}
              onChange={handleInputChange}
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
                Save Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}