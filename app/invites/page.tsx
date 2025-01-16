"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../../utils/firebase.mjs";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../utils/firebase.mjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface PendingMeeting {
  id: string;
  title: string;
  agenda: string;
  organiser: string; // Store only the organiser's email
  participants: string[]; // Array of participant emails
  availabilities: Record<string, Record<string, string[]>>; // Email → Date → Time Blocks
  pendingResponse: number;
}

export default function InvitesPage() {
  const [pendingMeetings, setPendingMeetings] = useState<PendingMeeting[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<string[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, string[]>>({});
  const [currentMeeting, setCurrentMeeting] = useState<PendingMeeting | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserEmail(currentUser.email || "");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const fetchPendingMeetings = async () => {
      try {
        const meetingsQuery = query(
          collection(firestore, "pendingmeetings"),
          where("participants", "array-contains", userEmail)
        );
        const querySnapshot = await getDocs(meetingsQuery);
        const meetingsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PendingMeeting[];
        setPendingMeetings(meetingsArray);
      } catch (error) {
        console.error("Error fetching pending meetings:", error);
      }
    };

    fetchPendingMeetings();
  }, [userEmail]);

  const handleAcceptMeeting = (meeting: PendingMeeting) => {
    setCurrentMeeting(meeting);
    setIsCalendarModalOpen(true);
  };

  const handleResponse = async (meeting: PendingMeeting, status: "accepted" | "rejected") => {
    try {
      const updatedPendingResponse = meeting.pendingResponse - 1;

      if (status === "rejected") {
        if (updatedPendingResponse === 0) {
          await deleteDoc(doc(firestore, "pendingmeetings", meeting.id));
        } else {
          await updateDoc(doc(firestore, "pendingmeetings", meeting.id), {
            pendingResponse: updatedPendingResponse,
          });
        }
        setPendingMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
        alert("You have declined the meeting.");
      }
    } catch (error) {
      console.error("Error handling response:", error);
      alert("Failed to process response.");
    }
  };

  const handleDateClick = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setSelectedDate(date);
    setTimeBlocks(availabilities[formattedDate] || []);
    setIsCalendarModalOpen(false);
    setIsTimeModalOpen(true);
  };

  const saveTimeBlocks = () => {
    if (!selectedDate) return;

    const formattedDate = selectedDate.toISOString().split("T")[0];
    setAvailabilities((prev) => ({
      ...prev,
      [formattedDate]: timeBlocks,
    }));

    setSelectedDate(null);
    setTimeBlocks([]);
    setIsTimeModalOpen(false);
    setIsCalendarModalOpen(true); // Allow selecting another date
  };

  const finalizeAvailability = async () => {
    if (!currentMeeting || !userEmail) return;

    try {
      const updatedAvailabilities = {
        ...currentMeeting.availabilities,
        [userEmail]: availabilities,
      };
      const updatedPendingResponse = currentMeeting.pendingResponse - 1;

      if (updatedPendingResponse === 0) {
        const matchingTimeBlock = findMatchingTimeBlock(updatedAvailabilities);
        if (matchingTimeBlock) {
          await createMeeting(currentMeeting, matchingTimeBlock);
        }
        await deleteDoc(doc(firestore, "pendingmeetings", currentMeeting.id));
      } else {
        await updateDoc(doc(firestore, "pendingmeetings", currentMeeting.id), {
          availabilities: updatedAvailabilities,
          pendingResponse: updatedPendingResponse,
        });
      }

      setPendingMeetings((prev) => prev.filter((m) => m.id !== currentMeeting.id));
      alert("Availability saved successfully!");
    } catch (error) {
      console.error("Error finalizing availability:", error);
      alert("Failed to finalize availability.");
    } finally {
      setAvailabilities({});
      setCurrentMeeting(null);
      setIsCalendarModalOpen(false);
    }
  };

  const toggleTimeBlock = (block: string) => {
    setTimeBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );
  };

  const findMatchingTimeBlock = (
    availabilities: Record<string, Record<string, string[]>>
  ): { date: string; time: string } | null => {
    const availabilityMap: Record<string, Set<string>> = {};

    Object.values(availabilities).forEach((participantAvailability) => {
      Object.entries(participantAvailability).forEach(([date, times]) => {
        if (!availabilityMap[date]) {
          availabilityMap[date] = new Set(times);
        } else {
          availabilityMap[date] = new Set(
            [...availabilityMap[date]].filter((time) => times.includes(time))
          );
        }
      });
    });

    for (const [date, times] of Object.entries(availabilityMap)) {
      if (times.size > 0) {
        return { date, time: Array.from(times)[0] };
      }
    }

    return null;
  };

  const createMeeting = async (
    pendingMeeting: PendingMeeting,
    matchingTimeBlock: { date: string; time: string }
  ) => {
    try {
      const meetingData = {
        title: pendingMeeting.title,
        agenda: pendingMeeting.agenda,
        organiser: pendingMeeting.organiser,
        participants: [...pendingMeeting.participants, pendingMeeting.organiser],
        date: matchingTimeBlock.date,
        time: matchingTimeBlock.time,
      };

      await addDoc(collection(firestore, "meetings"), meetingData);
      alert("Meeting scheduled successfully!");
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to schedule meeting.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📩 Meeting Invitations</h1>
      {pendingMeetings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {pendingMeetings.map((meeting) => (
            <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold text-gray-900">{meeting.title}</h2>
              <p className="text-gray-700 text-sm mt-1">Agenda: {meeting.agenda}</p>
              <p className="text-gray-700 text-sm mt-1">
                Organiser: {meeting.organiser}
              </p>
              <div className="flex mt-4 space-x-2">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                  onClick={() => handleAcceptMeeting(meeting)}
                >
                  Accept
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  onClick={() => handleResponse(meeting, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-700 text-sm">No pending meetings available.</p>
      )}

      {isCalendarModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Select Your Availability Dates</h2>
            <DatePicker inline selected={selectedDate} onChange={handleDateClick} />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={finalizeAvailability}
              >
                Save All Selections
              </button>
            </div>
          </div>
        </div>
      )}

      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Select Time Blocks</h2>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }, (_, i) => `${9 + i}:00 - ${10 + i}:00`).map(
                (block) => (
                  <button
                    key={block}
                    className={`px-2 py-1 rounded-md ${
                      timeBlocks.includes(block)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => toggleTimeBlock(block)}
                  >
                    {block}
                  </button>
                )
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => setIsTimeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={saveTimeBlocks}
              >
                Save Time Blocks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}