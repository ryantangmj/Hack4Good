import "./globals.css";
import Sidebar from "../components/Sidebar";
import { AuthProvider } from "@/utils/AuthContext";

export const metadata: Metadata = {
  title: "Digital PA",
  description: "A cost-effective digital PA system for administrators.",
};
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBell, FaUserCircle } from "react-icons/fa";
import AuthGuard from "../components/AuthGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "📅 New meeting scheduled for tomorrow at 10 AM" },
    { id: 2, message: "✅ Task 'Quarterly Report' is due soon" },
  ]);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth"); // Redirect to login page
  };

  // Close dropdowns when clicking outside
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
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold">Digital PA</h1>

            {/* Right-side Icons: Notifications & Auth */}
            <div className="flex items-center space-x-6">
              {/* 🔔 Notifications Bell */}
              <div className="relative dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false); // Close profile dropdown
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

                {/* Dropdown Notification List */}
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

              {/* 👤 User Profile */}
              <div className="relative dropdown">
                {user ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileOpen(!profileOpen);
                        setNotificationsOpen(false); // Close notifications dropdown
                      }}
                      className="flex items-center space-x-2"
                    >
                      <FaUserCircle className="text-2xl text-gray-700" />
                      <span className="text-gray-700">
                        {user.displayName || "User"}
                      </span>
                    </button>

                    {/* Dropdown User Menu */}
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
                  </>
                ) : (
                  <Link href="/auth">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                      Login
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
