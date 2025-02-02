"use client";

import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { auth, firestore } from "../../../utils/firebase.mjs";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { onAuthStateChanged } from "firebase/auth";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function ArrangeMeetingPage() {
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    agenda: "",
    participants: [] as string[], // Store participant emails only
    availabilities: {} as Record<string, Record<string, string[]>>, // Email to {date -> time blocks}
  });

  const [users, setUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<string[]>([]);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(
    null
  );

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        setLoggedInUserEmail(currentUser.email);
      }
    });
    return () => unsubscribe();
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

  const addParticipant = (user: User) => {
    if (!meetingDetails.participants.includes(user.email)) {
      setMeetingDetails((prev) => ({
        ...prev,
        participants: [...prev.participants, user.email],
      }));
    }
    setSearchEmail("");
    setFilteredUsers([]);
  };

  const removeParticipant = (email: string) => {
    setMeetingDetails((prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (participant) => participant !== email
      ),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMeetingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = format(date, "yyyy-MM-dd");
    setTimeBlocks(
      meetingDetails.availabilities[loggedInUserEmail || ""]?.[formattedDate] ||
        []
    );
    setIsTimeModalOpen(true);
  };

  const saveTimeBlocks = () => {
    if (!selectedDate || !loggedInUserEmail) return;

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    setMeetingDetails((prev) => ({
      ...prev,
      availabilities: {
        ...prev.availabilities,
        [loggedInUserEmail]: {
          ...(prev.availabilities[loggedInUserEmail] || {}),
          [formattedDate]: timeBlocks,
        },
      },
    }));

    setIsTimeModalOpen(false);
  };

  const toggleTimeBlock = (block: string) => {
    setTimeBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );
  };

  const savePendingMeeting = async () => {
    if (
      !meetingDetails.title ||
      Object.keys(meetingDetails.availabilities).length === 0
    ) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      await addDoc(collection(firestore, "pendingmeetings"), {
        title: meetingDetails.title,
        agenda: meetingDetails.agenda,
        organiser: loggedInUserEmail,
        participants: meetingDetails.participants,
        availabilities: meetingDetails.availabilities, // Save availabilities separately
        pendingResponse: meetingDetails.participants.length, // Number of participants who need to respond
      });

      alert("Pending meeting arranged successfully!");
      setMeetingDetails({
        title: "",
        agenda: "",
        participants: [],
        availabilities: {},
      });
      setSearchEmail("");
    } catch (error) {
      console.error("Error saving pending meeting: ", error);
      alert("Failed to arrange meeting!");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        🗓️ Arrange Meeting
      </h1>
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          name="title"
          placeholder="Meeting Title"
          value={meetingDetails.title}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
        />
        <textarea
          name="agenda"
          placeholder="Meeting Agenda"
          value={meetingDetails.agenda}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
        />
      </div>
      <div className="mt-2">
        <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
        <ul className="flex flex-wrap gap-2 mt-1">
          {meetingDetails.participants.map((email) => (
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
      </div>
      <div className="mt-2">
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
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Select Available Dates
        </h2>
        <DatePicker
          inline
          selected={null}
          onChange={handleDateClick}
          highlightDates={Object.keys(
            meetingDetails.availabilities[loggedInUserEmail || ""] || {}
          ).map((date) => new Date(date))}
        />
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          onClick={savePendingMeeting}
        >
          Save Meeting
        </button>
      </div>
      {isTimeModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              Select Time Blocks for {format(selectedDate, "yyyy-MM-dd")}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {Array.from(
                { length: 9 },
                (_, i) => `${9 + i}:00 - ${10 + i}:00`
              ).map((block) => (
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
              ))}
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
                Save Blocks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
