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

interface Task {
  title: string;
  priority: string;
  dueDate: string | null;
  extracted_from: string;
}

interface Meeting {
  title: string;
  time: string | null;
  participants: string[];
  agenda: string;
  extracted_from: string;
}

interface SummaryResult {
  summary: string;
  tasks?: Task[];
  meetings?: Meeting[];
}

interface NotificationType {
  message: string;
  type: 'success' | 'error';
}

export default function EmailSystemPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [createdItems, setCreatedItems] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<NotificationType | null>(null);

  const router = useRouter();

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
    setSummaryResult(null);

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

  const createTaskFromEmail = async (task: Task) => {
    try {
      await addDoc(collection(firestore, "tasks"), {
        title: task.title,
        priority: task.priority,
        completed: false,
        dueDate: task.dueDate ? Timestamp.fromDate(new Date(task.dueDate)) : null,
        userId: auth.currentUser?.uid,
      });
      
      setCreatedItems(prev => new Set(prev).add(`task-${task.title}`));
      showNotification('Task added successfully!', 'success');
    } catch (error) {
      console.error("Error creating task:", error);
      showNotification('Failed to create task', 'error');
    }
  };

  const createMeetingFromEmail = async (meeting: Meeting) => {
    try {
      await addDoc(collection(firestore, "meetings"), {
        title: meeting.title,
        time: meeting.time ? meeting.time : null,
        participants: meeting.participants,
        agenda: meeting.agenda,
        userId: auth.currentUser?.uid,
      });
      
      setCreatedItems(prev => new Set(prev).add(`meeting-${meeting.title}`));
      showNotification('Meeting scheduled successfully!', 'success');
    } catch (error) {
      console.error("Error creating meeting:", error);
      showNotification('Failed to schedule meeting', 'error');
    }
  };

  const handleSummarise = async (thread: Thread) => {
    // Select the thread first
    setSelectedThread(thread);
    setIsSummarizing(true);
    setSummaryResult(null);
  
    try {
      // Fetch messages for the selected thread
      const messagesQuery = query(
        collection(firestore, "threads", thread.id, "messages"),
        orderBy("timestamp", "asc")
      );
  
      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
  
        // Proceed with summarizing only after fetching messages
        setMessages(fetchedMessages);
  
        // Perform the summary operation
        fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: fetchedMessages,
            subject: thread.subject,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            setSummaryResult(data);
          })
          .catch((error) => {
            console.error("Error summarizing thread:", error);
            showNotification('Failed to analyze email', 'error');
          })
          .finally(() => {
            setIsSummarizing(false);
            unsubscribeMessages(); // Clean up the message snapshot
          });
      });
    } catch (error) {
      console.error("Error handling summarize:", error);
      showNotification('Failed to analyze email', 'error');
      setIsSummarizing(false);
    }
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
      showNotification('Message sent successfully!', 'success');
    } catch (error) {
      console.error("Error sending message:", error);
      showNotification('Failed to send message', 'error');
    }
  };

  const handleCompose = () => {
    router.push("/email-analytics/compose");
  };

  return (
    <AuthGuard>
      <div className="p-8">
        {notification && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-opacity duration-500 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        )}

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
                      {summaryResult && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary:</h3>
                  <p className="text-gray-700 mb-4">{summaryResult.summary}</p>

                  {summaryResult.tasks && summaryResult.tasks.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-blue-600 mb-2">
                        Identified Tasks:
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.tasks.map((task, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded border"
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-500">
                                Priority: {task.priority}
                                {task.dueDate && ` | Due: ${new Date(task.dueDate).toLocaleString()}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                From: "{task.extracted_from}"
                              </p>
                            </div>
                            {createdItems.has(`task-${task.title}`) ? (
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-md">
                                ✓ Added
                              </span>
                            ) : (
                              <button
                                onClick={() => createTaskFromEmail(task)}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                              >
                                Create Task
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryResult.meetings && summaryResult.meetings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-600 mb-2">
                        Suggested Meetings:
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.meetings.map((meeting, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded border"
                          >
                            <div>
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-sm text-gray-500">
                                {meeting.time && `Time: ${new Date(meeting.time).toLocaleString()}`}
                                {meeting.participants.length > 0 && 
                                  ` | With: ${meeting.participants.join(", ")}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Agenda: {meeting.agenda}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                From: "{meeting.extracted_from}"
                              </p>
                            </div>
                            {createdItems.has(`meeting-${meeting.title}`) ? (
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-md">
                                ✓ Scheduled
                              </span>
                            ) : (
                              <button
                                onClick={() => createMeetingFromEmail(meeting)}
                                className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600"
                              >
                                Schedule
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            
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
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                        disabled={isSummarizing}
                      >
                        {isSummarizing ? "Analyzing..." : "Summarize"}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => selectedThread && handleSummarise(selectedThread)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md"
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? "Analyzing..." : "Summarize"}
                  </button>
                  <button
                    onClick={() => setSelectedThread(null)}
                    className="px-3 py-1 bg-gray-300 rounded-md"
                  >
                    Back
                  </button>
                </div>
              </header>

              {summaryResult && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary:</h3>
                  <p className="text-gray-700 mb-4">{summaryResult.summary}</p>

                  {summaryResult.tasks && summaryResult.tasks.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-blue-600 mb-2">
                        Identified Tasks:
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.tasks.map((task, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded border"
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-500">
                                Priority: {task.priority}
                                {task.dueDate && ` | Due: ${new Date(task.dueDate).toLocaleString()}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                From: "{task.extracted_from}"
                              </p>
                            </div>
                            {createdItems.has(`task-${task.title}`) ? (
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-md">
                                ✓ Added
                              </span>
                            ) : (
                              <button
                                onClick={() => createTaskFromEmail(task)}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                              >
                                Create Task
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryResult.meetings && summaryResult.meetings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-600 mb-2">
                        Suggested Meetings:
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.meetings.map((meeting, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded border"
                          >
                            <div>
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-sm text-gray-500">
                                {meeting.time && `Time: ${new Date(meeting.time).toLocaleString()}`}
                                {meeting.participants.length > 0 && 
                                  ` | With: ${meeting.participants.join(", ")}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Agenda: {meeting.agenda}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                From: "{meeting.extracted_from}"
                              </p>
                            </div>
                            {createdItems.has(`meeting-${meeting.title}`) ? (
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-md">
                                ✓ Scheduled
                              </span>
                            ) : (
                              <button
                                onClick={() => createMeetingFromEmail(meeting)}
                                className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600"
                              >
                                Schedule
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-y-auto h-64 border-b mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="mb-4">
                    <p className="font-semibold">{message.sender}</p>
                    <p>{message.text}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(message.timestamp.seconds * 1000).toLocaleString()}
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