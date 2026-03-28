"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Job } from "@/lib/types";
import Toast from "@/components/Toast";

export default function WorkerAlertsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push("/login"); return;
      }
      
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setUserProfile(profile);

      // Fetch jobs where status is 'open' (and optionally relevant to category, but keeping it broad to fulfill requirement)
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
        
      if (profile?.category) {
         // Can optionally prioritize category using complex queries, but we'll show all open for discovery
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out jobs that this worker has already skipped or accepted if there were a history tracking table.
      setJobs(data as Job[]);
    } catch (error: any) {
      setToast({ message: "Network error loading alerts.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (job: Job) => {
    if (!userProfile) return;
    setActionLoading(job.id);
    try {
      // 1. Create a booking
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert([{
          job_id: job.id,
          customer_id: job.customer_id,
          worker_id: userProfile.id,
          status: "accepted"
        }]);
      if (bookingError) throw bookingError;

      // 2. Update job status to 'accepted'
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "accepted" })
        .eq("id", job.id);
      if (jobError) throw jobError;

      setToast({ message: "Job accepted! Waiting for customer confirmation.", type: "success" });
      setJobs((prev) => prev.filter(j => j.id !== job.id));
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = (jobId: string) => {
    // Simply remove from local view state
    setJobs((prev) => prev.filter(j => j.id !== jobId));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Worker Alerts</h1>
              <p className="text-gray-400">Real-time marketplace requests matching your area.</p>
            </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-32 border border-gray-800 rounded-2xl bg-gray-900/30">
              <div className="w-10 h-10 rounded-full border-b-2 border-t-2 border-blue-500 animate-spin mb-4"></div>
              <p className="text-gray-400 animate-pulse text-lg">Scanning for local jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-900/20 border border-gray-800/40 p-20 rounded-3xl text-center shadow-2xl backdrop-blur-md">
               <div className="text-7xl mb-6 opacity-80">📡</div>
               <h3 className="text-3xl font-bold text-white mb-3">No new alerts</h3>
               <p className="text-gray-400 text-lg max-w-md mx-auto">There are currently no open jobs in the marketplace. We'll alert you when customers post new requests!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl hover:border-gray-700 transition-colors">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                       <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-md">
                          {job.category}
                       </span>
                       <span className="text-gray-500 text-sm">{job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : "Flexible Start"}</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
                    <p className="text-gray-400 line-clamp-2 md:line-clamp-none max-w-2xl text-sm mb-4 leading-relaxed">
                       {job.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                       <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded border border-gray-800/50">
                          <span className="text-gray-400">📍</span>
                          <span className="text-gray-200">{job.city}</span>
                       </div>
                       <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded border border-gray-800/50">
                          <span className="text-gray-400">💰</span>
                          <span className="text-emerald-400 font-bold">₹{job.budget}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex w-full md:w-auto flex-col md:flex-row gap-3">
                    <button 
                       onClick={() => handleAccept(job)}
                       disabled={actionLoading === job.id}
                       className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3.5 rounded-xl font-bold text-white transition active:scale-95 flex-1 md:flex-none text-center shadow-lg shadow-blue-900/20"
                    >
                       {actionLoading === job.id ? "Accepting..." : "Accept Job"}
                    </button>
                    <button 
                       onClick={() => handleSkip(job.id)}
                       disabled={actionLoading === job.id}
                       className="bg-transparent border border-gray-700 hover:bg-gray-800 rounded-xl px-6 py-3.5 font-bold text-gray-300 transition active:scale-95 flex-1 md:flex-none text-center"
                    >
                       Skip
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
        
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
