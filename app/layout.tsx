"use client";

import "./globals.css";
import Sidebar from "../components/Sidebar";
import { AuthProvider } from "@/utils/AuthContext";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../utils/firebase.mjs";
import { FaBell, FaUserCircle } from "react-icons/fa";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>(""); // State for user name
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "📅 New meeting scheduled for tomorrow at 10 AM" },
    { id: 2, message: "✅ Task 'Quarterly Report' is due soon" },
  ]);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // If the user is logged in, fetch the user's name from Firestore
      if (currentUser?.email) {
        try {
          const userQuery = query(
            collection(firestore, "users"),
            where("email", "==", currentUser.email)
          );
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setUserName(userData.name || "User");
          } else {
            setUserName("User");
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      } else {
        setUserName(""); // Clear name if user is logged out
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth"); // Redirect to login page
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown")) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        <AuthProvider>
          {user && <Sidebar />}

          <div className="flex-1 flex flex-col">
            {user && (
              <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
                <h1 className="text-lg font-semibold">Digital PA</h1>

                <div className="flex items-center space-x-6">
                  <div className="relative dropdown">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationsOpen(!notificationsOpen);
                        setProfileOpen(false);
                      }}
                      className="relative text-gray-700"
                    >
                      <FaBell className="text-2xl" />
                      {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-white shadow-lg rounded-lg p-4">
                        <h3 className="text-gray-800 font-semibold mb-2">
                          🔔 Notifications
                        </h3>
                        {notifications.length > 0 ? (
                          <ul>
                            {notifications.map((notif) => (
                              <li
                                key={notif.id}
                                className="text-gray-700 text-sm py-2 border-b"
                              >
                                {notif.message}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600 text-sm">
                            No new notifications
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative dropdown">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileOpen(!profileOpen);
                        setNotificationsOpen(false);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <FaUserCircle className="text-2xl text-gray-700" />
                      <span className="text-gray-700">{userName || "User"}</span>
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-3 bg-white shadow-lg rounded-lg w-40">
                        <button
                          onClick={handleLogout}
                          className="block px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>
            )}

            <main className="p-8">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}