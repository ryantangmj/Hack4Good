"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "../../utils/firebase.mjs";
import { useAuth } from "@/utils/AuthContext";
import { query, where } from "firebase/firestore";

interface Event {
  id: string; // Document ID
  Agenda: string;
  Name: string;
  Participants: string[];
  Start: string;
  OrganizerId: string;
}

export default function MeetingsPage() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    participants: "",
    agenda: "",
  });

  // Fetch meetings from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      if (!user) return; // Ensure the user is logged in

      try {
        const eventsQuery = query(
          collection(firestore, "Event"),
          where("OrganizerId", "==", user.uid) // Filter by OrganizerId
        );

        const querySnapshot = await getDocs(eventsQuery);
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
  }, [user]);

  // Function to handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  // Function to open the edit modal
  const openEditModal = (eventId: string) => {
    const eventToEdit = events.find((event) => event.id === eventId);
    if (eventToEdit) {
      setNewEvent({
        title: eventToEdit.Name,
        time: eventToEdit.Start,
        participants: eventToEdit.Participants.join(", "),
        agenda: eventToEdit.Agenda,
      });
      setEditEventId(eventId);
      setIsModalOpen(true);
    }
  };

  // Save the new or edited meeting to Firestore
  const saveEvent = async () => {
    if (!newEvent.title || !newEvent.time) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      if (editEventId !== null) {
        // Update existing meeting
        const docRef = doc(firestore, "Event", editEventId);
        await updateDoc(docRef, {
          Name: newEvent.title,
          Agenda: newEvent.agenda,
          Participants: newEvent.participants.split(",").map((p) => p.trim()),
          Start: new Date(newEvent.time),
        });

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

        setEvents([
          ...events,
          {
            id: docRef.id,
            Name: newEvent.title,
            Agenda: newEvent.agenda,
            Participants: newEvent.participants.split(",").map((p) => p.trim()),
            Start: new Date(newEvent.time).toLocaleString(),
            OrganizerId: user?.uid,
          },
        ]);
      }

      alert("Meeting saved successfully!");
      setIsModalOpen(false);
      setNewEvent({ title: "", agenda: "", participants: "", time: "" });
    } catch (error) {
      console.error("Error saving meeting: ", error);
      alert("Failed to save meeting!");
    }
  };

  // Function to delete a meeting
  const deleteMeeting = async (meetingId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this meeting?"
    );
    if (confirmDelete) {
      try {
        await deleteDoc(doc(firestore, "Event", meetingId));
        setEvents(events.filter((event) => event.id !== meetingId));
        alert("Meeting deleted successfully!");
      } catch (error) {
        console.error("Error deleting meeting: ", error);
        alert("Failed to delete meeting!");
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📅 Meetings</h1>

      {/* Add and Arrange Meeting Buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          onClick={() => {
            setIsModalOpen(true);
            setEditEventId(null);
          }}
        >
          + Add Meeting
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          onClick={() => (window.location.href = "/meetings/ArrangeMeeting")}
        >
          Arrange Meeting
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-900">
              {event.Name}{" "}
              <span className="text-gray-500 text-sm">{event.Start}</span>
            </h2>
            <p className="text-gray-700 text-sm mt-1">
              Participants:{" "}
              {Array.isArray(event.Participants)
                ? event.Participants.join(", ")
                : "TBA"}
            </p>
            <p className="text-gray-700 text-sm mt-1">Agenda: {event.Agenda}</p>

            {/* Edit & Delete Buttons */}
            <div className="flex mt-4 space-x-2">
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                onClick={() => openEditModal(event.id)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                onClick={() => deleteMeeting(event.id)}
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
              {editEventId !== null ? "Edit Meeting" : "Add Meeting"}
            </h2>
            <input
              type="text"
              name="title"
              placeholder="Meeting Title"
              value={newEvent.title}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="datetime-local"
              name="time"
              value={newEvent.time}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <input
              type="text"
              name="participants"
              placeholder="Participants (comma-separated)"
              value={newEvent.participants}
              onChange={handleChange}
              className="w-full border px-3 py-2 mb-2 rounded-md"
            />
            <textarea
              name="agenda"
              placeholder="Agenda"
              value={newEvent.agenda}
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
                onClick={saveEvent}
              >
                {editEventId !== null ? "Save Changes" : "Add Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}