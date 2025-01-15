"use client";

import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AuthGuard from "../../components/AuthGuard";

export default function ChatPage() {
	const [messages, setMessages] = useState<{ role: string; text: string }[]>(
		[]
	);
	const [input, setInput] = useState("");

	const sendMessage = async () => {
		if (!input.trim()) return;

		// Add user message to chat
		const newMessage = { role: "user", text: input };
		setMessages([...messages, newMessage]);

		// Send request to AI backend
		const response = await fetch("/api/chat", {
			method: "POST",
			body: JSON.stringify({ message: input }),
		});

		const data = await response.json();
		setMessages([...messages, newMessage, { role: "ai", text: data.reply }]);

		setInput(""); // Clear input after sending
	};

	return (
        <AuthGuard>
            <div className="flex flex-col h-screen bg-gray-100">
                <div className="p-4 bg-white shadow-md text-lg font-semibold">
                    🤖 AI Assistant
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 my-2 rounded-lg w-fit ${
                                msg.role === "user"
                                    ? "bg-blue-500 text-white self-end"
                                    : "bg-gray-300 text-black self-start"
                            }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-white flex items-center sticky bottom-0 left-0 w-full border-t">
                    <input
                        type="text"
                        className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        onClick={sendMessage}
                        className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </AuthGuard>
	);
}
