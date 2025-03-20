"use client";

import { Pacifico, Poppins } from "next/font/google";
import React, { useRef, useState, useEffect} from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "../utils/firebase";  // Firestore instance
import { collection, getDocs, query, where } from "firebase/firestore";


const poppins = Poppins({ subsets: ["latin"], weight: ["400"], display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], display: "swap" });

const Login = () => {
    const router = useRouter();
    useEffect(() => {
        if (localStorage.getItem("user")) {
            router.replace("/");
        }
    }, []);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    let user = null;
    
    
    
    // ✅ Function to check if email exists in "coaches" or "players"
    const checkUserCollection = async (email, password) => {
        try {
            // Query Firestore to check for the email in both collections
            const coachesQuery = query(collection(db, "coaches"), where("email", "==", email));
            const playersQuery = query(collection(db, "players"), where("email", "==", email));
    
            // Fetch data from Firestore
            const [coachesSnapshot, playersSnapshot] = await Promise.all([
                getDocs(coachesQuery),
                getDocs(playersQuery),
            ]);
    
            let userDoc = null;
            let role = null;
    
            if (!coachesSnapshot.empty) {
                userDoc = coachesSnapshot.docs[0].data();
                role = "coach";
            } else if (!playersSnapshot.empty) {
                userDoc = playersSnapshot.docs[0].data();
                role = "player";
            } else {
                return { success: false, message: "User not found" };
            }
    
            if (password !== userDoc.password) {
                return { success: false, message: "Invalid password" };
            }

            localStorage.setItem("user",JSON.stringify(userDoc));


            return { success: true, role };
        } catch (error) {
            console.error("Error checking user collection:", error);
            return { success: false, message: "Error checking user collection" };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = emailRef.current?.value.trim();
        const password = passwordRef.current?.value.trim();

        if (!email) {
            toast.error("Email is required");
            setLoading(false);
            return;
        }
        if (!password) {
            toast.error("Password is required");
            setLoading(false);
            return;
        }

        // ✅ Check if email exists in "coaches" or "players"
        const result = await checkUserCollection(email, password);
        if (!result.success) {
            toast.error(result.message);
            setLoading(false);
            return;
        }

        // ✅ Redirect based on role
        router.push(result.role === "coach" ? "/coach_dashboard" : "/player_dashboard");
        window.location.href = result.role === "coach" ? "/coach_dashboard" : "/player_dashboard";
        toast.success(`Logged in as ${result.role}`);

        setLoading(false);
        }
  

    return (
        <div className={`${poppins.className} flex items-center justify-center min-h-screen bg-gray-100`}> 
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className={`text-2xl font-bold text-center ${pacifico.className}`}>Login</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            ref={emailRef}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            ref={passwordRef}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200 pr-10"
                        />
                        {/* <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button> */}
                    </div>
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 font-medium text-white rounded-md"
                    >
                        {loading ? "Processing..." : "Login"}
                    </Button>
                </form>
                <div className="flex items-center justify-center mt-4">
                    <span className="text-sm text-gray-500">Do you have an account? Register Now!</span>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 mt-2">
                    <Link href="/coach_signup" className="w-full">
                    <Button variant="outline" disabled={loading} className="w-full px-4 py-2 font-medium rounded-md">
                        Coach
                    </Button>
                </Link>
                <Link href="/player_signup" className="w-full">
                    <Button disabled={loading} className="w-full px-4 py-2 font-medium text-white rounded-md">
                        Player
                </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
