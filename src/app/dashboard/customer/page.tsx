"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch jobs along with their corresponding bookings
    const { data, error } = await supabase
      .from("jobs")
      .select("*, bookings(status, worker_id, created_at)")
      .eq("customer_id", user.id)
      .order("id", { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
  };

  const matchWorker = async (jobId: string, category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
      
    // Simplified matching logic: find first worker with matching skills
    // Assuming workers exist and are public.
    const { data: workers } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "worker")
      // In a real app we'd match on skills/location here
      .limit(1);

    if (workers && workers.length > 0) {
      const bestWorker = workers[0];
      await supabase.from("bookings").insert({
        job_id: jobId,
        customer_id: user?.id,
        worker_id: bestWorker.id,
        status: "pending"
      });
      alert(`🎉 Requested worker ${bestWorker.id} for this job!`);
      fetchMyJobs();
    } else {
      alert("No workers found for this matching directly.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer Dashboard</h1>
        <button onClick={() => router.push("/jobs/new")} className="bg-blue-600 px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-700 transition">
          + Post New Job
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-md">
            <h2 className="text-xl font-semibold">{job.category}</h2>
            <p className="text-gray-400 text-sm mt-1">{job.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              <p>💰 ₹{job.budget} | 📍 {job.location}</p>
            </div>
            
            <div className="mt-5 border-t border-gray-800 pt-4">
               <h3 className="font-semibold text-gray-300 mb-2">Worker Bookings:</h3>
               {job.bookings && job.bookings.length > 0 ? (
                 job.bookings.map((b: any, i: number) => (
                   <div key={i} className="flex justify-between items-center text-sm p-3 bg-gray-800 rounded-lg mb-2">
                     <span className="text-gray-300 truncate">Worker: {b.worker_id?.slice(0, 8)}...</span>
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'accepted' ? 'bg-green-500/20 text-green-400' : b.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                       {b.status}
                     </span>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col gap-3">
                   <p className="text-sm text-gray-500">No requests sent yet.</p>
                   <button 
                     onClick={() => matchWorker(job.id, job.category)} 
                     className="bg-green-600 hover:bg-green-700 w-max px-4 py-2 rounded text-sm transition"
                   >
                     Find & Book Best Worker
                   </button>
                 </div>
               )}
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-gray-500">You have no posted jobs yet.</p>}
      </div>
    </div>
  );
}
