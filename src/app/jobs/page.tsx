"use client";
import LogoutButton from "@/components/LogoutButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Job } from "@/lib/types";
import Toast from "@/components/Toast";
import { workerService } from "@/lib/services/workerService";
import { getStatusBadgeClasses } from "@/lib/badge";

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [bookingLoading, setBookingLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
    };

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

    const fetchJobs = async () => {
        // Strict mapping against new table enforcement
        const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });

        if (error) {
            console.log("Fetch Error:", error.message);
        } else {
            setJobs(data as Job[]);
        }
    };

    const handleBookWorker = async (jobId: string, jobCategory: string, jobCity: string) => {
        setBookingLoading(jobId);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                showToast("Please log in to book a worker.", "error");
                return;
            }

            // Mapped dynamically out to the city matching matrix
            const { worker, matchType, error: matchError } = await workerService.getMatchingWorkers(jobCategory, jobCity);

            if (matchError || !worker) {
                showToast(matchError || "No available workers found at the moment.", "warning");
                return;
            }

            try {
                await workerService.createBooking(jobId, user.id, worker.id);
                
                if (matchType === 'exact') {
                    showToast(`🎉 Successfully matched and requested an exact local worker for this job!`, "success");
                } else if (matchType === 'category') {
                    showToast(`✅ Found a specialized worker for this job! (Local worker not available)`, "warning");
                } else {
                    showToast(`⚠️ No exact match found for "${jobCategory}". A general available worker has been assigned.`, "warning");
                }
            } catch (bookingError: any) {
                showToast("Failed to book worker: " + bookingError.message, "error");
            }
        } catch (error: any) {
            console.error("Booking error:", error);
            showToast("An unexpected network error occurred during booking.", "error");
        } finally {
            setBookingLoading(null);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">All Jobs</h1>

                <div className="flex gap-3">
                    <button onClick={() => router.push("/dashboard")} className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-lg">
                        Dashboard
                    </button>

                    <button onClick={() => router.push("/jobs/new")} className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg">
                        + Post Job
                    </button>

                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-lg">
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                               <h2 className="text-xl font-bold text-white line-clamp-1">{job.title || job.category}</h2>
                               <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${getStatusBadgeClasses(job.status)}`}>
                                  {job.status.replace("_", " ")}
                               </span>
                            </div>
                            
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">{job.category}</p>
                            <p className="text-gray-400 mt-2 line-clamp-2">{job.description}</p>

                            <div className="mt-4 text-sm text-gray-400 space-y-2">
                                <p>📍 <span className="text-gray-300">{job.city}</span></p>
                                <p>📅 <span className="text-gray-300">{job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : 'Flexible'}</span></p>
                                <p>⏰ <span className="text-gray-300">{job.preferred_time || 'Flexible'}</span></p>
                                <p className="text-green-400 font-semibold mt-1">💰 ₹{job.budget}</p>
                            </div>
                        </div>

                        {job.status === "open" && (
                            <button
                                onClick={() => handleBookWorker(job.id, job.category, job.city)}
                                disabled={bookingLoading === job.id}
                                className={`mt-5 w-full py-2.5 rounded-lg font-medium transition ${bookingLoading === job.id ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                            >
                                {bookingLoading === job.id ? "Booking Worker..." : "Match Worker Automatically"}
                            </button>
                        )}
                        {job.status !== "open" && (
                            <div className="mt-5 w-full py-2.5 rounded-lg font-medium text-center border border-gray-700 bg-black/40 text-gray-500">
                                Worker Assigned / Completed
                            </div>
                        )}
                    </div>
                ))}
                
                {jobs.length === 0 && <p className="text-gray-500">No jobs posted yet.</p>}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}