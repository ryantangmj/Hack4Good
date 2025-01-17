"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaCalendarAlt, FaTasks, FaInbox, FaRobot } from "react-icons/fa";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";
import { useAuth } from "@/utils/AuthContext";

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
  participants: string[];
}

interface Thread {
  id: string;
  subject: string;
  participants: string[];
}

interface Message {
  sender: string;
  text: string;
  timestamp: any;
}

interface EmailPreview extends Thread {
  latestMessage?: Message;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<EmailPreview[]>([]);

  useEffect(() => {
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

        const participantMeetings = participantSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isOrganizer: false,
          }))
          // Filter out meetings where user is already the organizer
          .filter(meeting => !organizerMeetings.some(orgMeeting => orgMeeting.id === meeting.id));

        // Combine and sort meetings by date, filter future meetings, and take top 3
        const allMeetings = [...organizerMeetings, ...participantMeetings]
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .filter((meeting) => new Date(meeting.time) >= new Date())
          .slice(0, 3);

        setMeetings(allMeetings);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    const fetchTasks = async () => {
      try {
        if (!user?.email) return;

        const tasksRef = collection(db, "tasks");
        const snapshot = await getDocs(
          query(tasksRef, where("participants", "array-contains", user.email))
        );

        const fetchedTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];

        const sortedTasks = fetchedTasks.sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

        setTasks(sortedTasks.slice(0, 3));
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    const fetchEmails = () => {
      if (!user?.email) return;

      const threadsQuery = query(
        collection(db, "threads"),
        where("participants", "array-contains", user.email)
      );

      const unsubscribe = onSnapshot(threadsQuery, async (snapshot) => {
        const threads = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Thread[];

        const threadPreviews = await Promise.all(
          threads.map(async (thread) => {
            const messagesQuery = query(
              collection(db, "threads", thread.id, "messages"),
              orderBy("timestamp", "desc")
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            const latestMessage = messagesSnapshot.docs[0]?.data() as Message | undefined;

            return {
              ...thread,
              latestMessage,
            };
          })
        );

        const sortedThreads = threadPreviews
          .filter(thread => thread.latestMessage) // Only include threads with messages
          .sort((a, b) => 
            b.latestMessage!.timestamp.seconds - a.latestMessage!.timestamp.seconds
          )
          .slice(0, 2); // Get only the latest 3 threads

        setEmails(sortedThreads);
      });

      return () => unsubscribe();
    };

    fetchMeetings();
    fetchTasks();
    fetchEmails();
  }, [user?.uid, user?.email]);

  return (
    <AuthGuard>
<div className="pt-0 pb-8 px-8 grid grid-cols-2 gap-6">       
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
              meetings.map((meeting) => (
                <div key={meeting.id} className="mb-4">
                  <p className="font-bold text-gray-900">
                    {meeting.title}{" "}
                    <span className="text-gray-500 text-sm">
                      {new Date(meeting.time).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Participants:{" "}
                    {meeting.participants?.join(", ") || "TBA"}
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
              tasks.map((task) => (
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
                    Due: {new Date(task.dueDate).toLocaleString()}
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
              emails.map((thread) => (
                <div key={thread.id} className="mb-3">
                  <p className="font-bold text-gray-900">{thread.subject}</p>
                  <p className="text-gray-700 text-sm">
                    From: {thread.latestMessage?.sender}
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    {thread.latestMessage?.text}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(thread.latestMessage?.timestamp.seconds * 1000).toLocaleString()}
                  </p>
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