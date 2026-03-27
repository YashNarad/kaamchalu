import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";

export type MatchType = 'exact' | 'category' | 'general' | 'none';

export interface MatchingResult {
  worker: Profile | null;
  matchType: MatchType;
  error?: string;
}

export const workerService = {
  /**
   * Finds the best matching worker based on category and optional location.
   */
  async getMatchingWorkers(category: string, location: string): Promise<MatchingResult> {
    try {
      // 1. Try exact match
      const { data: exactWorkers, error: exactError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .ilike('category', `%${category}%`)
        .ilike('location', `%${location}%`)
        .returns<Profile[]>();

      if (!exactError && exactWorkers && exactWorkers.length > 0) {
        return { worker: exactWorkers[0], matchType: 'exact' };
      }

      // 2. Try category match (fallback location)
      const { data: categoryWorkers, error: categoryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .ilike('category', `%${category}%`)
        .returns<Profile[]>();

      if (!categoryError && categoryWorkers && categoryWorkers.length > 0) {
        return { worker: categoryWorkers[0], matchType: 'category' };
      }

      // 3. Fallback to any worker
      const { data: allWorkers, error: allWorkersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .returns<Profile[]>();

      if (allWorkersError || !allWorkers || allWorkers.length === 0) {
        return { worker: null, matchType: 'none', error: 'No available workers found at the moment.' };
      }

      return { worker: allWorkers[0], matchType: 'general' };
    } catch (error: any) {
      console.error("Worker matching error:", error);
      return { worker: null, matchType: 'none', error: error.message || 'An unexpected error occurred while matching workers.' };
    }
  },

  /**
   * Creates a booking request for a worker
   */
  async createBooking(jobId: string, customerId: string, workerId: string) {
    const { error } = await supabase.from("bookings").insert({
      job_id: jobId,
      customer_id: customerId,
      worker_id: workerId,
      status: "pending"
    });

    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  }
};
