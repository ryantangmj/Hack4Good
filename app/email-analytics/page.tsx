"use client";

import { useState, useEffect } from "react";
import { FaEnvelopeOpenText } from "react-icons/fa";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { auth, firestore } from "../../utils/firebase.mjs";
import AuthGuard from "../../components/AuthGuard";
import { useRouter } from "next/navigation";

interface Thread {
  id: string;
  subject: string;
  participants: string[];
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: any;
}

export default function EmailSystemPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user.email || null);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const threadsQuery = query(
      collection(firestore, "threads"),
      where("participants", "array-contains", currentUser)
    );

    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      const fetchedThreads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Thread[];
      setThreads(fetchedThreads);
    });

    return () => unsubscribeThreads();
  }, [currentUser]);

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);

    const messagesQuery = query(
      collection(firestore, "threads", thread.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(fetchedMessages);
    });

    return () => unsubscribeMessages();
  };

  const sendMessage = async () => {
    if (!newMessage || !selectedThread) return;

    try {
      await addDoc(
        collection(firestore, "threads", selectedThread.id, "messages"),
        {
          sender: auth.currentUser?.email,
          text: newMessage,
          timestamp: Timestamp.now(),
        }
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSummarise = (thread: Thread) => {
    alert(`Summarising thread: ${thread.subject}`);
  };

  const handleCompose = () => {
    router.push("/email-analytics/compose"); // Navigate to the Compose page
  };

  return (
    <AuthGuard>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            📧 Email System
          </h1>
          <button
            onClick={handleCompose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Compose
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {!selectedThread ? (
            threads.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="text-left p-3">Subject</th>
                    <th className="text-left p-3">Participants</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((thread) => (
                    <tr key={thread.id} className="border-b">
                      <td
                        className="p-3 font-semibold text-blue-600 flex items-center cursor-pointer"
                        onClick={() => handleThreadSelect(thread)}
                      >
                        <FaEnvelopeOpenText className="mr-2 text-gray-600" />
                        {thread.subject}
                      </td>
                      <td className="p-3 text-gray-700">
                        {thread.participants.join(", ")}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleSummarise(thread)}
                          className="px-3 py-1 bg-green-500 text-white rounded-md"
                        >
                          Summarise
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8">No threads to display.</p>
            )
          ) : (
            <div>
              <header className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{selectedThread.subject}</h2>
                <button
                  onClick={() => setSelectedThread(null)}
                  className="px-3 py-1 bg-gray-300 rounded-md"
                >
                  Back
                </button>
              </header>

              <div className="overflow-y-auto h-64 border-b mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="mb-4">
                    <p className="font-semibold">{message.sender}</p>
                    <p>{message.text}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(
                        message.timestamp.seconds * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 border rounded-l-md px-4 py-2"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}