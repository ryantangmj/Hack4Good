"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Upcoming Meetings */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📅 Upcoming Meetings
          <span className="ml-2 text-gray-500 cursor-pointer">+</span>
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
