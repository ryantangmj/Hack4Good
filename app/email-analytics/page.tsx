"use client";

import { useState } from "react";
import { FaEnvelopeOpenText } from "react-icons/fa";
import AuthGuard from "../../components/AuthGuard";

interface Email {
	id: number;
	subject: string;
	sender: string;
	date: string;
	summary: string;
	category: "Work" | "Client" | "Personal" | "Important";
}

export default function EmailAnalyticsPage() {
	const [emails, setEmails] = useState<Email[]>([
		{
			id: 1,
			subject: "Project Update",
			sender: "client@company.com",
			date: "2025-01-10",
			summary: "Client requested changes to the contract regarding deadlines.",
			category: "Client",
		},
		{
			id: 2,
			subject: "Team Standup",
			sender: "manager@work.com",
			date: "2025-01-11",
			summary: "Reminder: Team meeting at 3 PM to discuss upcoming tasks.",
			category: "Work",
		},
		{
			id: 3,
			subject: "Urgent: Payment Issue",
			sender: "finance@company.com",
			date: "2025-01-12",
			summary: "Payment delay detected. Please address this issue immediately.",
			category: "Important",
		},
	]);

	return (
        <AuthGuard>
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    📧 Email Analytics
                </h1>

                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="text-left p-3">Subject</th>
                                <th className="text-left p-3">Sender</th>
                                <th className="text-left p-3">Date</th>
                                <th className="text-left p-3">Category</th>
                                <th className="text-left p-3">Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map((email) => (
                                <tr key={email.id} className="border-b">
                                    <td className="p-3 font-semibold text-blue-600 flex items-center">
                                        <FaEnvelopeOpenText className="mr-2 text-gray-600" />
                                        {email.subject}
                                    </td>
                                    <td className="p-3 text-gray-700">{email.sender}</td>
                                    <td className="p-3 text-gray-500">{email.date}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 rounded-md text-sm ${
                                                email.category === "Work"
                                                    ? "bg-blue-100 text-blue-600"
                                                    : email.category === "Client"
                                                    ? "bg-green-100 text-green-600"
                                                    : email.category === "Important"
                                                    ? "bg-red-100 text-red-600"
                                                    : "bg-yellow-100 text-yellow-600"
                                            }`}
                                        >
                                            {email.category}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-700">{email.summary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthGuard>
	);
}
