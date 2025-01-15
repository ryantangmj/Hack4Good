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

interface Task {
  id: string; // Document ID
  Dependencies: string;
  Title: string;
  Due: string;
  Priority: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
  useEffect(() => {
    if (!user) return; // Only fetch data if the user is authenticated

    const fetchItems = async () => {
      try {
        // Fetch Events
        const eventSnapshot = await getDocs(collection(firestore, "Event"));
        const eventsArray = eventSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          Start: doc.data().Start.toDate().toLocaleString(), // Convert Firestore timestamp to string
        })) as Event[];

        // Fetch Tasks
        const taskSnapshot = await getDocs(collection(firestore, "Task"));
        const tasksArray = taskSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          Due: doc.data().Due.toDate().toLocaleString(), // Convert Firestore timestamp to string
        })) as Task[];

        // Update state
        setEvents(eventsArray);
        setTasks(tasksArray);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };

    fetchItems();
  }, [user]);

  // Render loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
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
                  <div
                    key={event.id}
                    className="bg-white p-4 rounded-xl shadow-md mb-4"
                  >
                    <p className="font-bold text-gray-900">
                      {event.Name}{" "}
                      <span className="text-gray-500 text-sm">
                        {event.Start}
                      </span>
                    </p>
                    <p className="text-gray-700 text-sm">
                      Participants:{" "}
                      {Array.isArray(event.Participants)
                        ? event.Participants.join(", ")
                        : "TBA"}
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
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-xl shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.Title}{" "}
                    <span className="text-gray-500 text-sm">{task.Due}</span>
                  </h3>
                  <p className="text-gray-700 text-sm mt-1">
                    Priority: {task.Priority}
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    Dependencies: {task.Dependencies || "None"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
