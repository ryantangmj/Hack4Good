"use client";

import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Explicitly typing user

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth"); // Redirect to login page if not logged in
      } else {
        setUser(currentUser); // Set user when authenticated
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center text-lg">
        Loading...
      </div>
    );
  }

  return <>{user ? children : null}</>; // Render children only if user is authenticated
}
