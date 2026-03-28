"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Job, Booking, Profile } from "@/lib/types";
import Toast from "@/components/Toast";
import { getStatusBadgeClasses } from "@/lib/badge";
import { jobService } from "@/lib/services/jobService";
import { bookingService } from "@/lib/services/bookingService";
import { userService } from "@/lib/services/userService";

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
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Rating States
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isRated, setIsRated] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const { profile } = await userService.getCurrentUser();
      setUserProfile(profile);

      const jobData = await jobService.getJobById(id as string) as JobDetails;
      setJob(jobData);

      // Check rating status if job is completed
      if (jobData.status === "completed") {
         const activeBooking = jobData.bookings.find(b => b.status === "completed");
         if (activeBooking) {
            const existingRating = await bookingService.getRatingForBooking(activeBooking.id, profile.id);
            if (existingRating) setIsRated(true);
         }
      }
    } catch (error: any) {
      setToast({ message: "Failed to load job details. Make sure you are logged in.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWorker = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await bookingService.confirmBooking(bookingId, id as string);
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
      await jobService.updateJobStatus(id as string, "in_progress");
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

      await jobService.updateJobStatus(id as string, "completed");
      await bookingService.updateBookingStatus(confirmedBooking.id, "completed");

      setToast({ message: "Job completed successfully!", type: "success" });
      fetchJobDetails();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async () => {
    if (!job || !userProfile) return;
    setActionLoading(true);
    try {
      const confirmedBooking = job.bookings.find((b) => b.status === "completed");
      if (!confirmedBooking) throw new Error("Booking must be completed before rating.");

      const targetId = userProfile.role === "customer" ? confirmedBooking.worker_id : confirmedBooking.customer_id;
      
      await bookingService.rateBooking(
         confirmedBooking.id, 
         userProfile.id, 
         targetId, 
         ratingValue, 
         reviewText
      );
      
      setIsRated(true);
      setToast({ message: "Rating submitted successfully!", type: "success" });
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-b-2 border-t-2 border-blue-500 animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen text-white p-10 text-center flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
        <button onClick={() => router.push("/")} className="text-blue-500 underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 md:p-10 max-w-4xl mx-auto space-y-8">
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
              <p className="text-gray-400">This job is active. We'll notify you when someone accepts.</p>
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
                     </div>
                     
                     {userProfile?.role === "customer" && (
                       <button
                         onClick={() => handleConfirmWorker(booking.id)}
                         disabled={actionLoading}
                         className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2.5 rounded-lg font-bold transition active:scale-95 mt-4"
                       >
                         {actionLoading ? "Confirming..." : "Confirm Worker"}
                       </button>
                     )}
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
                  <p className="text-gray-400 mb-8">Ready to fulfill this request.</p>
                  
                  {userProfile?.role === "customer" && (
                     <button
                       onClick={handleStartJob}
                       disabled={actionLoading}
                       className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-10 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] transition active:scale-95"
                     >
                       {actionLoading ? "Starting..." : "Start Job Now"}
                     </button>
                  )}
               </div>
             );
         })()}

         {job.status === "in_progress" && (() => {
             const confirmedBooking = job.bookings.find(b => ["in_progress", "confirmed"].includes(b.status));
             return (
               <div className="text-center py-10">
                  <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">🛠️</div>
                  <h2 className="text-2xl font-bold mb-2">Job in progress</h2>
                  <p className="text-gray-400 mb-8">Worker Contact: {confirmedBooking?.worker?.name || "Worker"}</p>
                  
                  {userProfile?.role === "customer" && (
                     <button
                       onClick={handleCompleteJob}
                       disabled={actionLoading}
                       className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-10 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)] transition active:scale-95"
                     >
                       {actionLoading ? "Completing..." : "Complete Job"}
                     </button>
                  )}
               </div>
             );
         })()}

         {job.status === "completed" && (
           <div className="text-center py-10 bg-black/40 rounded-2xl border border-gray-800">
              <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🌟</div>
              <h2 className="text-2xl font-bold mb-2">Job Signed Off</h2>
              
              {!isRated ? (
                 <div className="mt-6 max-w-sm mx-auto bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
                    <p className="text-gray-400 mb-4 font-semibold">Rate your experience</p>
                    <div className="flex justify-center gap-3 text-4xl text-gray-600 cursor-pointer mb-6">
                       {[1,2,3,4,5].map(star => (
                         <span 
                           key={star} 
                           onClick={() => setRatingValue(star)}
                           className={`hover:text-yellow-500 transition-colors ${ratingValue >= star ? "text-yellow-500" : ""}`}
                         >
                           ★
                         </span>
                       ))}
                    </div>
                    <textarea 
                       className="w-full bg-black/50 border border-gray-700 focus:border-yellow-500 outline-none rounded-xl p-3 text-sm text-white mb-4 resize-none h-24 transition-colors" 
                       placeholder="Leave a quick review (optional)"
                       value={reviewText}
                       onChange={(e) => setReviewText(e.target.value)}
                     />
                    <button 
                       onClick={handleRate} 
                       disabled={ratingValue === 0 || actionLoading}
                       className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 py-3 rounded-xl font-bold text-white transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                       {actionLoading ? "Submitting..." : "Submit Rating"}
                    </button>
                 </div>
              ) : (
                 <div className="mt-8 max-w-sm mx-auto border border-green-500/30 bg-green-500/10 p-4 rounded-xl text-green-400 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">✓</span> Review Submitted Successfully
                 </div>
              )}
           </div>
         )}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
