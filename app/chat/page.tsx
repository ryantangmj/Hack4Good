"use client";

import { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import AuthGuard from "../../components/AuthGuard";
import { onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { format } from 'date-fns';

interface Message {
  role: string;
  text: string;
}

interface TaskData {
  action: string;
  task: {
    title: string;
    priority: string;
    dueDate: string;
  };
}

interface MeetingData {
  action: string;
  meeting: {
    title: string;
    time: string;
    participants: string[];
    agenda: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [pendingData, setPendingData] = useState<TaskData | MeetingData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const createTask = async (taskData: TaskData) => {
    try {
      const taskRef = collection(db, "tasks");
      const dueDate = new Date(taskData.task.dueDate);
      
      await addDoc(taskRef, {
        title: taskData.task.title,
        priority: taskData.task.priority,
        completed: false,
        dueDate: Timestamp.fromDate(dueDate),
        userId: user.uid,
      });

      setMessages(prev => [...prev, {
        role: "ai",
        text: `✅ Task created successfully for ${format(dueDate, "MMM d, yyyy 'at' h:mm a")}!`
      }]);
    } catch (error) {
      console.error("Error creating task:", error);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "I couldn't create the task. Please try again."
      }]);
    }
  };

  const createMeeting = async (meetingData: MeetingData) => {
    try {
      const meetingRef = collection(db, "meetings");
      const meetingTime = new Date(meetingData.meeting.time);
      
      await addDoc(meetingRef, {
        title: meetingData.meeting.title,
        time: meetingData.meeting.time,
        // participants: meetingData.meeting.participants,
        participants: [],
        agenda: meetingData.meeting.agenda,
        userId: user.uid,
      });

      setMessages(prev => [...prev, {
        role: "ai",
        text: `✅ Meeting "${meetingData.meeting.title}" scheduled for ${format(meetingTime, "MMM d, yyyy 'at' h:mm a")}!`
      }]);
    } catch (error) {
      console.error("Error creating meeting:", error);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "I couldn't schedule the meeting. Please try again."
      }]);
    }
  };

  const handleConfirm = async () => {
    if (!pendingData) return;

    if (pendingData.action === 'create_task') {
      await createTask(pendingData as TaskData);
    } else if (pendingData.action === 'create_meeting') {
      await createMeeting(pendingData as MeetingData);
    }

    setPendingData(null);
  };

  const handleReject = () => {
    setMessages(prev => [...prev, {
      role: "ai",
      text: "Action cancelled. How else can I help you?"
    }]);
    setPendingData(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const newMessage = { role: "user", text: input };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input,
          userId: user.uid 
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);

      if (data.data?.action) {
        setPendingData(data.data);
        let confirmationMessage = "";
        
        if (data.data.action === 'create_task') {
          const dueDate = new Date(data.data.task.dueDate);
          confirmationMessage = `Would you like me to create this ${data.data.task.priority.toLowerCase()} priority task for ${format(dueDate, "MMM d, yyyy 'at' h:mm a")}?`;
        } else if (data.data.action === 'create_meeting') {
          const meetingTime = new Date(data.data.meeting.time);
          confirmationMessage = `Would you like me to schedule this meeting for ${format(meetingTime, "MMM d, yyyy 'at' h:mm a")}?`;
        }

        setMessages(prev => [...prev, {
          role: "ai",
          text: confirmationMessage + " (Click Confirm or Cancel below)"
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Sorry, I encountered an error. Please try again."
      }]);
    }

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              🤖 AI Assistant
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Try saying: "Schedule a team meeting tomorrow at 2pm" or "Create a high priority task due next Friday"
            </p>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white shadow-sm border border-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {pendingData && (
              <div className="flex justify-center gap-3 my-4">
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Schedule a meeting or create a task..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !user}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}