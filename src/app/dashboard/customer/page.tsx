"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

interface Job {
  id: string;
  title: string;
  category: string;
  city: string;
  preferred_date: string;
  preferred_time: string;
  budget: number;
  status: 'open' | 'accepted' | 'completed';
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
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
        .select("id, title, category, city, preferred_date, preferred_time, budget, status")
        .eq("customer_id", user.id)
        .order("id", { ascending: false });

      if (error) {
         console.error("Fetch Jobs Error:", error);
         throw error;
      }
      
      if (data) setJobs(data as Job[]);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">My Posted Jobs</h1>
              <p className="text-gray-400">Track the status of your open marketplace listings.</p>
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
        ) : jobs.length === 0 ? (
          <div className="bg-gray-900/20 border border-gray-800/40 p-20 rounded-3xl text-center shadow-2xl backdrop-blur-md">
               <div className="text-7xl mb-6 opacity-80">📭</div>
               <h3 className="text-3xl font-bold text-white mb-3">You have no posted jobs yet</h3>
               <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">List your first job request to start receiving matches from workers in your area.</p>
               <button onClick={() => router.push("/jobs/new")} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl text-white font-bold transition-transform active:scale-95">
                 Post a Job Now
               </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-gray-600 transition-colors group">
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md
                        ${job.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : job.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                         {job.status}
                    </span>
                    <p className="text-xs font-semibold text-gray-500 uppercase">{job.category}</p>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-4 line-clamp-1">{job.title || "Untitled Job"}</h2>
                  
                  <div className="bg-black/50 p-4 rounded-xl border border-gray-800/50 space-y-4 mb-3">
                     <div className="flex items-center gap-3">
                       <span className="text-gray-500 text-lg">📍</span>
                       <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">City</p>
                          <p className="text-sm text-gray-200">{job.city || "Unspecified"}</p>
                       </div>
                     </div>

                     <div className="flex items-center gap-3">
                       <span className="text-gray-500 text-lg">📅</span>
                       <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Scheduled Date</p>
                          <p className="text-sm text-gray-200">{job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : "Flexible"}</p>
                       </div>
                     </div>

                     <div className="flex items-center gap-3">
                       <span className="text-gray-500 text-lg">⏰</span>
                       <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Time Preference</p>
                          <p className="text-sm text-gray-200">{job.preferred_time || "Flexible"}</p>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-3">
                       <span className="text-gray-500 text-lg">💰</span>
                       <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Budget</p>
                          <p className="text-sm text-white font-semibold">₹{job.budget || 0}</p>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Alert Frame */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
