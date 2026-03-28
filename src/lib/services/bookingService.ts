import { supabase } from "../supabase";

export const bookingService = {
  async getBookingsByWorker(workerId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
         id, 
         status, 
         created_at, 
         jobs (*)
      `)
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async createBooking(jobId: string, customerId: string, workerId: string, status: string = "pending") {
    // Check if duplicate exists for this worker/job? Usually unique constraint does this if configured.
    const { data, error } = await supabase
      .from("bookings")
      .insert([{
        job_id: jobId,
        customer_id: customerId,
        worker_id: workerId,
        status: status
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateBookingStatus(bookingId: string, status: string) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async confirmBooking(bookingId: string, jobId: string) {
    // 1. Update target booking to confirmed
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    if (bookingError) throw bookingError;

    // 2. Reject others
    await supabase
      .from("bookings")
      .update({ status: "rejected" })
      .eq("job_id", jobId)
      .neq("id", bookingId)
      .eq("status", "accepted");

    // 3. Update job to confirmed
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "confirmed" })
      .eq("id", jobId);
    if (jobError) throw jobError;
    
    return true;
  },

  async rateBooking(bookingId: string, reviewerId: string, revieweeId: string, rating: number, reviewText: string) {
    const { data, error } = await supabase
      .from("ratings")
      .insert([{
        booking_id: bookingId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: rating,
        review_text: reviewText
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getRatingForBooking(bookingId: string, reviewerId: string) {
    const { data, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle(); // maybeSingle allows 0 rows without throwing error
      
    if (error) throw error;
    return data;
  }
};
