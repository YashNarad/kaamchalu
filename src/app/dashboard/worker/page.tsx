"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";
import { getStatusBadgeClasses } from "@/lib/badge";
import { bookingService } from "@/lib/services/bookingService";
import { userService } from "@/lib/services/userService";

interface Booking {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  jobs: {
    title?: string;
    description?: string;
    category: string;
    location?: string;
    city?: string;
    budget?: number;
    price?: number;
  };
}

export default function WorkerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    let channel: any;

    const setupDashboard = async () => {
      setIsLoading(true);
      try {
        const { user } = await userService.getCurrentUser();

        // Fetch bookings AND join the corresponding Jobs table
        const data = await bookingService.getBookingsByWorker(user.id);
        
        // Explicit casting for the joined data
        setBookings(data as any as Booking[]);

        // Realtime Subscription
        channel = supabase.channel('worker-bookings-dashboard')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings', filter: `worker_id=eq.${user.id}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                 // Needs to fetch the joined job manually on pure insert hook
                 const { data: newBooking } = await supabase
                     .from('bookings')
                     .select('id, status, created_at, jobs(*)')
                     .eq('id', payload.new.id)
                     .single();
                 
                 if (newBooking) {
                     setBookings(prev => [newBooking as any as Booking, ...prev]);
                     setToast({ message: "New booking request received!", type: "success" });
                 }
              } else if (payload.eventType === 'UPDATE') {
                setBookings(prev => prev.map(b => b.id === payload.new.id ? { ...b, status: payload.new.status } : b));
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

    setupDashboard();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const updateBookingStatus = async (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    setActionLoading(id);
    try {
      if (status === 'completed') {
         // Also update job to completed if completing booking. For simplicity in worker dashboard, logic handles it.
         // Actually in worker dashboard, we just need to update the booking.
      }
      await bookingService.updateBookingStatus(id, status);
      setToast({ message: `Booking has been ${status}.`, type: "success" });
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                Incoming Requests
              </h1>
              <p className="text-gray-400">Manage your active jobs and client requests.</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] w-fit">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                 Live Dashboard
            </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-32 border border-gray-800 rounded-2xl bg-gray-900/30">
              <div className="w-10 h-10 rounded-full border-b-2 border-t-2 border-blue-500 animate-spin mb-4"></div>
              <p className="text-gray-400 animate-pulse text-lg">Fetching active requests...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-gray-900/20 border border-gray-800/40 p-20 rounded-3xl text-center shadow-2xl backdrop-blur-md">
               <div className="text-7xl mb-6 opacity-80">🛋️</div>
               <h3 className="text-3xl font-bold text-white mb-3">All Caught Up!</h3>
               <p className="text-gray-400 text-lg max-w-md mx-auto">You have no active booking requests right now. As soon as a customer links a job, it will instantly appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => {
              const jobTitle = booking.jobs?.title || booking.jobs?.description?.slice(0, 30) || "Job Request";
              const jobCity = booking.jobs?.city || booking.jobs?.location || "Remote / Unspecified";
              const jobPrice = booking.jobs?.price || booking.jobs?.budget || 0;
              
              return (
                <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-gray-600 transition-colors group">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${getStatusBadgeClasses(booking.status)}`}>
                         {booking.status.replace("_", " ")}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Job Details */}
                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{jobTitle}</h2>
                    <p className="text-sm font-medium text-blue-400/80 mb-5 capitalize">{booking.jobs?.category || "Unknown Category"}</p>
                    
                    <div className="bg-black/50 p-4 rounded-xl border border-gray-800/50 space-y-4 mb-3">
                       <div className="flex items-center gap-3">
                         <span className="text-gray-500 text-lg">📍</span>
                         <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">City</p>
                            <p className="text-sm text-gray-200">{jobCity}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                         <span className="text-gray-500 text-lg">💰</span>
                         <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Offered Price</p>
                            <p className="text-sm text-white font-semibold">₹{jobPrice}</p>
                         </div>
                       </div>
                    </div>
                  </div>
                  
                  {/* Action Handlers strictly mapped to status phase */}
                  <div className="mt-6 pt-5 border-t border-gray-800/50">
                    {booking.status === "pending" && (
                      <div className="flex gap-3">
                          <button 
                              onClick={() => updateBookingStatus(booking.id, "accepted")} 
                              disabled={actionLoading === booking.id}
                              className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50 py-3 rounded-xl text-sm font-bold transition-transform active:scale-95"
                          >
                              {actionLoading === booking.id ? "..." : "Accept"}
                          </button>
                          <button 
                               onClick={() => updateBookingStatus(booking.id, "rejected")} 
                               disabled={actionLoading === booking.id}
                               className="flex-1 bg-transparent border border-gray-700 hover:border-red-500 hover:bg-red-500/10 text-red-500 disabled:opacity-50 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                          >
                              Reject
                          </button>
                      </div>
                    )}

                    {booking.status === "accepted" && (
                      <button 
                          onClick={() => updateBookingStatus(booking.id, "completed")} 
                          disabled={actionLoading === booking.id}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-xl text-sm font-bold text-white transition-transform active:scale-95 shadow-lg shadow-blue-900/20"
                      >
                          {actionLoading === booking.id ? "Saving..." : "Mark as Completed"}
                      </button>
                    )}

                    {/* Static verification tags for finished flows */}
                    {(booking.status === "completed" || booking.status === "rejected") && (
                       <div className={`w-full py-3 rounded-xl text-sm font-bold text-center border bg-black/40
                          ${booking.status === 'completed' ? 'border-blue-500/20 text-blue-500/50' : 'border-red-500/10 text-red-500/50'}`}>
                          {booking.status === 'completed' ? "✓ Job Finished" : "✕ Job Declined"}
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
