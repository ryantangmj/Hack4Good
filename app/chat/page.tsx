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
    dueDate: string;  // ISO string format
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [pendingTask, setPendingTask] = useState<TaskData | null>(null);

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

      // Show success message with formatted date/time
      setMessages(prev => [...prev, {
        role: "ai",
        text: `✅ Task created successfully for ${format(dueDate, "MMM d, yyyy 'at' h:mm a")}! You can view it in the Tasks page.`
      }]);

      setPendingTask(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "I couldn't create the task in the system. Please try again."
      }]);
    }
  };

  const handleConfirmTask = async () => {
    if (pendingTask) {
      await createTask(pendingTask);
    }
  };

  const handleRejectTask = () => {
    setMessages(prev => [...prev, {
      role: "ai",
      text: "Task creation cancelled. How else can I help you?"
    }]);
    setPendingTask(null);
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

      if (data.taskData?.action === 'create_task') {
        setPendingTask(data.taskData);
        // Format the date nicely in the confirmation message
        const dueDate = new Date(data.taskData.task.dueDate);
        setMessages(prev => [...prev, {
          role: "ai",
          text: `Would you like me to create this task for ${format(dueDate, "MMM d, yyyy 'at' h:mm a")}? (Click Confirm or Cancel below)`
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
              🤖 AI Task Assistant
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Try saying: "Create a high priority task to review project docs tomorrow at 3pm"
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
            
            {pendingTask && (
              <div className="flex justify-center gap-3 my-4">
                <button
                  onClick={handleConfirmTask}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Confirm Task
                </button>
                <button
                  onClick={handleRejectTask}
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
              placeholder="Type your message..."
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