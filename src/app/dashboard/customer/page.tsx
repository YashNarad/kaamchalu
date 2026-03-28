"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import Link from "next/link";
import { Job, Booking } from "@/lib/types";
import { getStatusBadgeClasses } from "@/lib/badge";

interface DashboardJob extends Job {
  bookings: (Booking & {
    worker: { name: string } | null;
  })[];
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [activeJobs, setActiveJobs] = useState<DashboardJob[]>([]);
  const [pastJobs, setPastJobs] = useState<DashboardJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push("/login"); return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          bookings (
            *,
            worker:profiles!bookings_worker_id_fkey(name)
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
         console.error("Fetch Jobs Error:", error);
         throw error;
      }
      
      if (data) {
          const jobs = data as any as DashboardJob[];
          setActiveJobs(jobs.filter(j => j.status !== 'completed'));
          setPastJobs(jobs.filter(j => j.status === 'completed'));
      }

    } finally {
      setIsLoading(false);
    }
  };

  const getWorkerInfo = (job: DashboardJob) => {
    if (job.status === 'open') return "Finding workers...";
    if (job.status === 'accepted') {
       const acceptedCount = job.bookings?.filter(b => b.status === "accepted").length || 0;
       return `${acceptedCount} worker(s) applied`;
    }
    // For confirmed, in_progress, completed
    const activeBooking = job.bookings?.find(b => ['confirmed', 'completed'].includes(b.status));
    return activeBooking?.worker?.name || "Assigned Worker";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">My Dashboard</h1>
              <p className="text-gray-400">Manage your active marketplace listings and past jobs.</p>
            </div>
            
            <button onClick={() => router.push("/jobs/new")} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 rounded-full text-white font-bold transition-transform active:scale-95 shadow-lg shadow-blue-900/20 w-fit">
              + Post New Job
            </button>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-32 border border-gray-800 rounded-2xl bg-gray-900/30">
              <div className="w-10 h-10 rounded-full border-b-2 border-t-2 border-blue-500 animate-spin mb-4"></div>
              <p className="text-gray-400 animate-pulse text-lg">Loading your listings...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Bookings Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                 <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                 Active Jobs
              </h2>
              
              {activeJobs.length === 0 ? (
                <div className="bg-gray-900/20 border border-gray-800/40 p-12 rounded-3xl text-center shadow-2xl backdrop-blur-md">
                     <p className="text-gray-400 text-lg">No active jobs right now.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeJobs.map(job => (
                    <Link href={`/jobs/${job.id}`} key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-gray-600 transition-colors group block cursor-pointer">
                      <div>
                        <div className="flex justify-between items-start mb-5">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${getStatusBadgeClasses(job.status)}`}>
                               {job.status.replace("_", " ")}
                          </span>
                          <p className="text-xs font-semibold text-gray-500 uppercase">{job.category}</p>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{job.title || "Untitled Job"}</h3>
                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                           <span className="text-lg">👷</span>
                           <span className="font-medium text-gray-300">{getWorkerInfo(job)}</span>
                        </div>
                        
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800/50 space-y-3">
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Date</span>
                              <span className="text-gray-200">{job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : "Flexible"}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Time</span>
                              <span className="text-gray-200">{job.preferred_time || "Flexible"}</span>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Past Jobs Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-400">Past Jobs</h2>
              
              {pastJobs.length === 0 ? (
                <div className="bg-gray-900/10 border border-gray-800/20 p-8 rounded-2xl text-center">
                     <p className="text-gray-500">No completed jobs yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {pastJobs.map(job => (
                    <Link href={`/jobs/${job.id}`} key={job.id} className="bg-black border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors block">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-gray-800 text-gray-400">
                          {job.status}
                        </span>
                        <p className="text-xs font-semibold text-gray-600 uppercase">{job.category}</p>
                      </div>
                      <h3 className="text-lg font-bold text-gray-300 mb-2">{job.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                         <span>Worker: {getWorkerInfo(job)}</span>
                         <span className="text-yellow-500">★★★★★</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
