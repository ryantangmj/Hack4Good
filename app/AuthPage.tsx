"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebase.mjs"; // Ensure your Firebase configuration is imported here

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activePath, setActivePath] = useState("signin"); // Tracks which form is active
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    setError(""); // Clear previous errors

    // Validate inputs
    if (isSignUp && password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    try {
      if (isSignUp) {
        // Sign up user
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
      } else {
        // Sign in user
        await signInWithEmailAndPassword(auth, email, password);
        alert("Signed in successfully!");
      }
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || "Authentication failed! Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {"Digital PA"}
        </h2>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 mb-4 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 mb-4 rounded-md"
            required
          />
          <button
            type="submit" // Use form submission
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          {isSignUp
            ? "Already have an account? "
            : "Don't have an account yet? "}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setActivePath(isSignUp ? "signin" : "signup");
              setError("");
            }}
            className="text-blue-500 cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;