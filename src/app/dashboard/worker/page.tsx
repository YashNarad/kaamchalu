"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";

interface Booking {
  id: string;
  job_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
}

export default function WorkerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    let channel: any;

    const setupRealtimeDashboard = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch initial baseline bookings
        const { data, error } = await supabase
          .from("bookings")
          .select("id, job_id, status, created_at")
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setToast({ message: "Failed to load bookings: " + error.message, type: "error" });
        } else if (data) {
          setBookings(data as Booking[]);
        }

        // 2. Subscribe to realtime stream for this worker
        channel = supabase.channel('worker-bookings-channel')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'bookings',
              filter: `worker_id=eq.${user.id}` 
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setBookings(prev => [payload.new as Booking, ...prev]);
                setToast({ message: "New booking request received!", type: "success" });
              } else if (payload.eventType === 'UPDATE') {
                setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new as Booking : b));
              } else if (payload.eventType === 'DELETE') {
                setBookings(prev => prev.filter(b => b.id !== payload.old.id));
              }
            }
          )
          .subscribe();

      } catch (err: any) {
        setToast({ message: "Network error loading bookings.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    setupRealtimeDashboard();

    // 3. Prevent memory leaks
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const updateBookingStatus = async (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      
      if (!error) {
         setToast({ message: `Booking has been ${status}.`, type: "success" });
         // Realtime event covers the update; optimistic update removed to prevent duplicate render flash
      } else {
         setToast({ message: `Error updating booking: ${error.message}`, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "Unexpected error updating status.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Incoming Requests
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 Live
            </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-20 border border-gray-800 rounded-2xl bg-gray-900/50">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-b-2 border-white animate-spin"></div>
                  <p className="text-gray-400 animate-pulse text-lg">Syncing your requests...</p>
              </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-gray-900/40 border border-gray-800/60 p-16 rounded-3xl text-center shadow-2xl backdrop-blur-md">
               <div className="text-6xl mb-4">💤</div>
               <h3 className="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
               <p className="text-gray-400 text-lg">You have no new or upcoming booking requests.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-gray-900/80 p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col justify-between hover:border-blue-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Booking Request</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${booking.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                      : booking.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                      : booking.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                      : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]'}`}>
                       {booking.status}
                    </span>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl space-y-3 mb-2 border border-white/5">
                     <div>
                       <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wider">Reference Job ID</p>
                       <p className="font-mono text-blue-300/90 text-sm truncate">{booking.job_id}</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wider">Date Received</p>
                       <p className="text-white/90 text-sm font-medium">{new Date(booking.created_at).toLocaleString(undefined, {
                         dateStyle: 'medium',
                         timeStyle: 'short'
                       })}</p>
                     </div>
                  </div>
                </div>
                
                {booking.status === "pending" && (
                  <div className="mt-6 pt-5 border-t border-gray-800 flex gap-3">
                      <button 
                          onClick={() => updateBookingStatus(booking.id, "accepted")} 
                          disabled={actionLoading === booking.id}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-900/20 text-white transition-all transform active:scale-[0.98]"
                      >
                          {actionLoading === booking.id ? "Processing" : "Accept Job"}
                      </button>
                      <button 
                           onClick={() => updateBookingStatus(booking.id, "rejected")} 
                           disabled={actionLoading === booking.id}
                           className="flex-1 bg-transparent hover:bg-red-500/10 border-2 border-red-500/30 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-bold text-red-400 transition-all transform active:scale-[0.98]"
                      >
                          Decline
                      </button>
                  </div>
                )}

                {booking.status === "accepted" && (
                  <div className="mt-6 pt-5 border-t border-gray-800 flex gap-3">
                      <button 
                          onClick={() => updateBookingStatus(booking.id, "completed")} 
                          disabled={actionLoading === booking.id}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 text-white transition-all transform active:scale-[0.98]"
                      >
                          {actionLoading === booking.id ? "Processing" : "Mark as Completed"}
                      </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
}
