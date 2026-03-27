"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer"); // Default to customer
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up the user in Supabase Auth
    // BEST PRACTICE: Pass custom data like 'role' into user_metadata.
    // Our Supabase SQL trigger will read this and auto-create the profile.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        },
      },
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    // 2. Fallback: Manual Profile Upsert
    // If the SQL trigger failed or was not setup, we can attempt an UPSERT here.
    // Note: If email confirmations are ON, the user is not authed immediately.
    // RLS might block this client-side insert. The SQL trigger handles it securely regardless.
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: authData.user.id, 
          email: email,
          role: role 
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn("Client profile upsert skipped or failed (Postgres trigger usually handles this):", profileError.message);
      }
      
      alert("Signup successful ✅ Now login");
      router.push("/login");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white px-4">
      <form
        onSubmit={handleSignup}
        className="bg-gray-900 p-8 rounded-2xl w-full max-w-md space-y-5 shadow-2xl"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-gray-400 text-sm mt-1">Join KaamChalu today 🚀</p>
        </div>

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

        <div>
          <label className="text-sm text-gray-400">Password</label>
          <input
            type="password"
            placeholder="Enter a secure password"
            className="w-full mt-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">I am a...</label>
          <select
            className="w-full mt-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="customer">Customer (Looking for services)</option>
            <option value="worker">Worker (Offering services)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-500 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}