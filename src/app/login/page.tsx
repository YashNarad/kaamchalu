"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            alert("Login successful ✅");
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
            <form
                onSubmit={handleLogin}
                className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-2xl space-y-5"
            >
                {/* Title */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold">KaamChalu</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Login to continue 🚀
                    </p>
                </div>

                {/* Email */}
                <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full mt-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="text-sm text-gray-400">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full mt-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/* Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-semibold transition ${loading
                            ? "bg-gray-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                {/* Divider */}
                <div className="border-t border-gray-700"></div>

                {/* Signup */}
                <p className="text-center text-sm text-gray-400">
                    New user?{" "}
                    <span
                        onClick={() => router.push("/signup")}
                        className="text-blue-500 cursor-pointer hover:underline"
                    >
                        Create account
                    </span>
                </p>
            </form>
        </div>
    );
}