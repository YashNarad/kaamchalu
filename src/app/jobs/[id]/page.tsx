"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Job, Booking, Profile } from "@/lib/types";
import Toast from "@/components/Toast";
import { getStatusBadgeClasses } from "@/lib/badge";

interface BookingWithWorker extends Booking {
  worker: Profile | null;
}

interface JobDetails extends Job {
  bookings: BookingWithWorker[];
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          bookings (
            *,
            worker:profiles!bookings_worker_id_fkey(*)
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setJob(data as JobDetails);
    } catch (error: any) {
      setToast({ message: "Failed to load job details.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWorker = async (bookingId: string) => {
    setActionLoading(true);
    try {
      // 1. Update Booking to 'confirmed'
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (bookingError) throw bookingError;

      // 2. Reject other 'accepted' bookings
      await supabase
        .from("bookings")
        .update({ status: "rejected" })
        .eq("job_id", id)
        .neq("id", bookingId)
        .eq("status", "accepted");

      // 3. Update Job to 'confirmed'
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "confirmed" })
        .eq("id", id);
      if (jobError) throw jobError;

      setToast({ message: "Worker confirmed successfully!", type: "success" });
      fetchJobDetails();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartJob = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", id);
      if (error) throw error;

      setToast({ message: "Job is now in progress!", type: "success" });
      fetchJobDetails();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    setActionLoading(true);
    try {
      const confirmedBooking = job?.bookings.find((b) => ["confirmed", "in_progress"].includes(b.status));
      if (!confirmedBooking) throw new Error("No active booking found.");

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", id);
      if (jobError) throw jobError;

      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", confirmedBooking.id);
      if (bookingError) throw bookingError;

      setToast({ message: "Job completed successfully!", type: "success" });
      fetchJobDetails();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-b-2 border-t-2 border-blue-500 animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
        <button onClick={() => router.push("/dashboard/customer")} className="text-blue-500 underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Job Details Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
           <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-md mb-4 inline-block ${getStatusBadgeClasses(job.status)}`}>
                  {job.status.replace("_", " ")}
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                <p className="text-gray-400 max-w-2xl">{job.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-400">₹{job.budget}</span>
              </div>
           </div>

           <div className="flex flex-wrap gap-4 text-sm">
             <div className="bg-black/50 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <span>📍</span> <span className="text-gray-300">{job.city}</span>
             </div>
             <div className="bg-black/50 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <span>📅</span> <span className="text-gray-300">{job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : "Flexible"}</span>
             </div>
             <div className="bg-black/50 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <span>⏰</span> <span className="text-gray-300">{job.preferred_time || "Flexible"}</span>
             </div>
           </div>
        </div>

        {/* Dynamic UI based on Job Status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
           {job.status === "open" && (
             <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">📡</div>
                <h2 className="text-2xl font-bold mb-2">Finding workers...</h2>
                <p className="text-gray-400">Your job is visible to workers in {job.city}. We'll notify you when someone accepts.</p>
             </div>
           )}

           {job.status === "accepted" && (
             <div>
                <h2 className="text-2xl font-bold mb-6">Workers who accepted</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {job.bookings.filter(b => b.status === "accepted").map(booking => (
                    <div key={booking.id} className="bg-black border border-gray-700 rounded-xl p-5 flex flex-col justify-between">
                       <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{booking.worker?.name || "Anonymous Worker"}</h3>
                            <p className="text-sm text-gray-500 mt-1">{booking.worker?.category || "General Worker"}</p>
                          </div>
                          <div className="bg-gray-800 px-2 py-1 rounded text-yellow-500 text-xs font-bold">
                             ★★★★☆ 4.8
                          </div>
                       </div>
                       <button
                         onClick={() => handleConfirmWorker(booking.id)}
                         disabled={actionLoading}
                         className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2.5 rounded-lg font-bold transition active:scale-95"
                       >
                         {actionLoading ? "Confirming..." : "Confirm Worker"}
                       </button>
                    </div>
                  ))}
                  {job.bookings.filter(b => b.status === "accepted").length === 0 && (
                     <p className="text-gray-500 col-span-2">No active workers found at the moment.</p>
                  )}
                </div>
             </div>
           )}

           {job.status === "confirmed" && (() => {
               const confirmedBooking = job.bookings.find(b => b.status === "confirmed");
               return (
                 <div className="text-center py-10">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🤝</div>
                    <h2 className="text-2xl font-bold mb-2">{confirmedBooking?.worker?.name || "Worker"} is confirmed!</h2>
                    <p className="text-gray-400 mb-8">They are preparing to fulfill your request.</p>
                    <button
                      onClick={handleStartJob}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-10 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] transition active:scale-95"
                    >
                      {actionLoading ? "Starting..." : "Start Job Now"}
                    </button>
                 </div>
               );
           })()}

           {job.status === "in_progress" && (() => {
               const confirmedBooking = job.bookings.find(b => ["in_progress", "confirmed"].includes(b.status));
               return (
                 <div className="text-center py-10">
                    <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">🛠️</div>
                    <h2 className="text-2xl font-bold mb-2">Job in progress</h2>
                    <p className="text-gray-400 mb-8">Worker Contact: {confirmedBooking?.worker?.name || "Worker"} — Please allow them time to complete the task.</p>
                    <button
                      onClick={handleCompleteJob}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-10 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)] transition active:scale-95"
                    >
                      {actionLoading ? "Completing..." : "Complete Job"}
                    </button>
                 </div>
               );
           })()}

           {job.status === "completed" && (
             <div className="text-center py-10">
                <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🌟</div>
                <h2 className="text-2xl font-bold mb-2">Job completed</h2>
                <p className="text-gray-400 mb-6">How was your experience?</p>
                <div className="flex justify-center gap-3 text-4xl text-gray-700 cursor-pointer">
                   <span className="hover:text-yellow-500 transition-colors">★</span>
                   <span className="hover:text-yellow-500 transition-colors">★</span>
                   <span className="hover:text-yellow-500 transition-colors">★</span>
                   <span className="hover:text-yellow-500 transition-colors">★</span>
                   <span className="hover:text-yellow-500 transition-colors">★</span>
                </div>
             </div>
           )}

        </div>
        
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
