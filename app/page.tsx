"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase.mjs";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebase.mjs";
import AuthPage from "./AuthPage";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // To handle initial authentication loading

  // Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once authentication state is resolved
    });

    return () => unsubscribe();
  }, []);

  // Fetch Firestore Data
  useEffect(() => {
    if (!user) return; // Only fetch data if the user is authenticated

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
  }, [user]); // Fetch data when the `user` changes

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

  // Render loading spinner while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div>
      {/* Show AuthPage if not authenticated */}
      {!user ? (
        <AuthPage />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              📅 Upcoming Meetings
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
        </div>
      )}
    </div>
  );
}