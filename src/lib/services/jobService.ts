import { supabase } from "../supabase";

export const jobService = {
  async getJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getOpenJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getUserJobs(userId: string) {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        bookings(
          *,
          worker:profiles!bookings_worker_id_fkey(name)
        )
      `)
      .eq("customer_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async getJobById(jobId: string) {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        bookings(
          *,
          worker:profiles!bookings_worker_id_fkey(*)
        )
      `)
      .eq("id", jobId)
      .single();
      
    if (error) throw error;
    return data;
  },

  async createJob(jobData: any) {
    const { data, error } = await supabase
      .from("jobs")
      .insert([jobData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateJobStatus(jobId: string, status: string) {
    const { data, error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", jobId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
