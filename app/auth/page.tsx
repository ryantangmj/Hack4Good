"use client";

import { useState } from "react";
import { db, auth, googleProvider } from "../../firebaseConfig";
import {
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc } from "firebase/firestore";
import {
	FaGoogle,
	FaSignInAlt,
	FaUserPlus,
	FaSignOutAlt,
} from "react-icons/fa";

export default function AuthPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign-In & Sign-Up
	const router = useRouter();

	// Google Sign-In / Sign-Up
	const handleGoogleAuth = async () => {
		try {
			const userCredential = await signInWithPopup(auth, googleProvider);
			const user = userCredential.user;

			// ✅ Save user role in Firestore (Only if it's new)
			const userRef = doc(collection(db, "users"), user.uid);
			await setDoc(
				userRef,
				{ email: user.email, role: "user" },
				{ merge: true }
			);

			router.push("/meetings"); // Redirect after login
		} catch (error) {
			console.error("Google Authentication Error:", error);
			alert("Google Authentication Failed");
		}
	};

	// Email/Password Authentication
	const handleEmailAuth = async () => {
		try {
			if (isSignUp) {
				// Sign Up
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
				const user = userCredential.user;

				// ✅ Save user role in Firestore
				const userRef = doc(collection(db, "users"), user.uid);
				await setDoc(userRef, { email: user.email, role: "user" });

				alert("Sign-Up Successful!");
			} else {
				// Sign In
				await signInWithEmailAndPassword(auth, email, password);
			}
			router.push("/"); // Redirect after authentication
		} catch (error) {
			console.error("Authentication Error:", error);
			alert("Authentication Failed. Check your credentials.");
		}
	};

	// Forgot Password
	const handleForgotPassword = async () => {
		if (!email) {
			alert("Please enter your email first.");
			return;
		}
		try {
			await sendPasswordResetEmail(auth, email);
			alert("Password reset link sent to your email.");
		} catch (error) {
			console.error("Reset Password Error:", error);
			alert("Failed to send reset email.");
		}
	};

	// Sign-Out Function
	const handleSignOut = async () => {
		try {
			await signOut(auth);
			router.push("/auth"); // Redirect to login
		} catch (error) {
			console.error("Sign-Out Error:", error);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
			{/* Authentication Container */}
			<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
				{/* Branding */}
				<h1 className="text-2xl font-bold text-gray-800 mb-4">
					{isSignUp ? "Create an Account" : "Welcome Back"}
				</h1>
				<p className="text-gray-600 mb-6">
					{isSignUp ? "Join Digital PA today!" : "Sign in to continue"}
				</p>

				{/* Email Input */}
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full border px-3 py-2 mb-3 rounded-md focus:ring focus:ring-blue-300"
				/>

				{/* Password Input */}
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full border px-3 py-2 mb-3 rounded-md focus:ring focus:ring-blue-300"
				/>

				{/* Forgot Password */}
				{!isSignUp && (
					<button
						onClick={handleForgotPassword}
						className="text-sm text-blue-500 hover:underline mb-4"
					>
						Forgot Password?
					</button>
				)}

				{/* Submit Button */}
				<button
					onClick={handleEmailAuth}
					className="w-full px-4 py-2 mt-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center justify-center"
				>
					{isSignUp ? (
						<FaUserPlus className="mr-2" />
					) : (
						<FaSignInAlt className="mr-2" />
					)}
					{isSignUp ? "Sign Up" : "Sign In"}
				</button>

				{/* Google Sign-In */}
				<button
					onClick={handleGoogleAuth}
					className="w-full px-4 py-2 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition flex items-center justify-center"
				>
					<FaGoogle className="mr-2" />
					Sign in with Google
				</button>

				{/* Toggle Between Sign-In & Sign-Up */}
				<p className="text-gray-700 mt-4">
					{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
					<button
						onClick={() => setIsSignUp(!isSignUp)}
						className="text-blue-500 hover:underline"
					>
						{isSignUp ? "Sign In" : "Sign Up"}
					</button>
				</p>

				{/* Sign Out (Optional, for testing) */}
				<button
					onClick={handleSignOut}
					className="w-full px-4 py-2 mt-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition flex items-center justify-center"
				>
					<FaSignOutAlt className="mr-2" />
					Sign Out
				</button>
			</div>
		</div>
	);
}
