"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase.mjs";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebase.mjs";
import AuthPage from "./AuthPage";
import { db } from "../firebaseConfig"; // Ensure correct Firebase import
import { FaCalendarAlt, FaTasks, FaInbox, FaRobot } from "react-icons/fa";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";

// Define types for the data coming from Firestore
interface Meeting {
  id: string;
  title: string;
  time: string;
  participants: string[];
  agenda: string;
}

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  status: string;
}

interface Email {
  id: string;
  subject: string;
  sender: string;
  summary: string;
}

interface Task {
  id: string; // Document ID
  Dependencies: string;
  Title: string;
  Due: string;
  Priority: string;
}

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);

  // Fetch meetings, tasks, and email summaries
  useEffect(() => {
    const fetchMeetings = async () => {
      const snapshot = await getDocs(collection(db, "meetings"));
      setMeetings(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Meeting[] // Type assertion here to ensure meetings are typed as Meeting[]
      );
    };

    const fetchTasks = async () => {
      const snapshot = await getDocs(collection(db, "tasks"));
      setTasks(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[] // Type assertion for Task[]
      );
    };

    const fetchEmails = async () => {
      const snapshot = await getDocs(collection(db, "emails"));
      setEmails(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Email[] // Type assertion for Email[]
      );
    };

    fetchMeetings();
    fetchTasks();
    fetchEmails();
  }, []);

  return (
    <AuthGuard>
      <div className="p-8 grid grid-cols-2 gap-6">
        {/* 🔹 Upcoming Meetings */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" /> Upcoming Meetings
            <Link href="/meetings">
              <span className="px-3 ml-auto text-blue-500 cursor-pointer">
                View All →
              </span>
            </Link>
          </h2>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            {meetings.length > 0 ? (
              meetings.slice(0, 2).map((meeting) => (
                <div key={meeting.id} className="mb-4">
                  <p className="font-bold text-gray-900">
                    {meeting.title}{" "}
                    <span className="text-gray-500 text-sm">
                      {new Date(meeting.time).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Participants:{" "}
                    {Array.isArray(meeting.participants)
                      ? meeting.participants.join(", ")
                      : "TBA"}
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    Agenda: {meeting.agenda}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-700 text-sm">No upcoming meetings.</p>
            )}
          </div>
        </div>

        {/* 🔹 Task Summary */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaTasks className="mr-2 text-green-500" /> Tasks
            <Link href="/tasks">
              <span className="px-3 ml-auto text-blue-500 cursor-pointer">
                View All →
              </span>
            </Link>
          </h2>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            {tasks.length > 0 ? (
              tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="mb-3">
                  <p className="font-bold text-gray-900 flex items-center">
                    {task.title}
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-md ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-500"
                          : task.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-500"
                          : "bg-green-100 text-green-500"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Due: {new Date(task.dueDate).toLocaleDateString()} |{" "}
                    {task.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-700 text-sm">No pending tasks.</p>
            )}
          </div>
        </div>

        {/* 🔹 Recent Emails */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaInbox className="mr-2 text-purple-500" /> Recent Emails
            <Link href="/email-analytics">
              <span className="px-3 ml-auto text-blue-500 cursor-pointer">
                View All →
              </span>
            </Link>
          </h2>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            {emails.length > 0 ? (
              emails.slice(0, 3).map((email) => (
                <div key={email.id} className="mb-3">
                  <p className="font-bold text-gray-900">{email.subject}</p>
                  <p className="text-gray-700 text-sm">From: {email.sender}</p>
                  <p className="text-gray-700 text-sm mt-1">{email.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-700 text-sm">No new emails.</p>
            )}
          </div>
        </div>

        {/* 🔹 AI Assistant Quick Tips */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaRobot className="mr-2 text-orange-500" /> AI Assistant
            <Link href="/chat">
              <span className="px-3 ml-auto text-blue-500 cursor-pointer">
                Chat →
              </span>
            </Link>
          </h2>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-700 text-sm">
              ✨ Tip: Your **Quarterly Report Review** task is still in
              progress. You may want to review it today!
            </p>
            <p className="text-gray-700 text-sm mt-2">
              📢 Reminder: You have a **meeting with Alice at 10 AM tomorrow**.
              Need a summary?
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
