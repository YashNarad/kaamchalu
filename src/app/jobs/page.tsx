"use client";
import LogoutButton from "@/components/LogoutButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);

    // ✅ Protect route
    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();

            if (!data.user) {
                router.push("/login");
            } else {
                fetchJobs();
            }
        };

        checkUser();
    }, []);

    // ✅ Fetch jobs
    const fetchJobs = async () => {
        const { data, error } = await supabase.from("jobs").select("*");

        if (error) {
            console.log(error);
        } else {
            setJobs(data);
        }
    };

    // ✅ Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">All Jobs</h1>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-lg"
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() => router.push("/jobs/new")}
                        className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg"
                    >
                        + Post Job
                    </button>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-lg"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Jobs Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <div
                        key={job.id}
                        className="bg-gray-900 p-5 rounded-xl border border-gray-800"
                    >
                        <h2 className="text-xl font-semibold">{job.category}</h2>
                        <p className="text-gray-400">{job.description}</p>

                        <div className="mt-3 text-sm text-gray-400 space-y-1">
                            <p>📍 {job.location}</p>
                            <p>📅 {job.preferred_date}</p>
                            <p>⏰ {job.preferred_time}</p>
                            <p>💰 ₹{job.budget}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}