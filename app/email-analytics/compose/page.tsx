"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../../utils/firebase.mjs";
import { auth } from "../../../utils/firebase.mjs";
import { FaUserPlus } from "react-icons/fa";
import { useRouter } from "next/navigation"; // Import useRouter

interface User {
  id: string;
  email: string;
  name: string;
}

export default function ComposeEmailPage() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) setCurrentUserEmail(user.email || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm) {
        setFilteredUsers([]);
        return;
      }
      const q = query(
        collection(firestore, "users"),
        where("email", ">=", searchTerm),
        where("email", "<=", searchTerm + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setFilteredUsers(users);
    };
    fetchUsers();
  }, [searchTerm]);

  const addParticipant = (email: string) => {
    if (!participants.includes(email)) {
      setParticipants((prev) => [...prev, email]);
    }
    setSearchTerm("");
    setFilteredUsers([]);
  };

  const removeParticipant = (email: string) => {
    setParticipants((prev) => prev.filter((participant) => participant !== email));
  };

  const sendEmail = async () => {
    if (!subject || !message || participants.length === 0) {
      alert("Please fill all fields before sending.");
      return;
    }

    try {
      const threadRef = await addDoc(collection(firestore, "threads"), {
        subject,
        participants: [currentUserEmail, ...participants],
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(firestore, "threads", threadRef.id, "messages"), {
        sender: currentUserEmail,
        text: message,
        timestamp: serverTimestamp(),
      });

      alert("Email thread sent successfully!");
      setParticipants([]);
      setSubject("");
      setMessage("");

      router.push("/email-analytics"); // Navigate back to email analytics
    } catch (error) {
      console.error("Error sending email thread:", error);
      alert("Failed to send email thread.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📧 Compose Email</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">To:</label>
          <div className="border rounded-md p-2">
            <ul className="flex flex-wrap gap-2 mb-2">
              {participants.map((email) => (
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
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for participants by email..."
              className="w-full border-none focus:outline-none"
            />
            {filteredUsers.length > 0 && (
              <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => addParticipant(user.email)}
                  >
                    <span>{user.email}</span>
                    <FaUserPlus className="text-gray-500" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded-md px-4 py-2"
            placeholder="Enter the subject of the email..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-md px-4 py-2 h-32"
            placeholder="Type your message here..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={sendEmail}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}