export interface Profile {
  id: string;
  email: string;
  role: 'customer' | 'worker';
  category?: string;
  city?: string;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  date: string;
  time: string;
  budget: number;
  status: 'open' | 'accepted' | 'completed';
  created_at: string;
}

export interface Booking {
  id: string;
  job_id: string;
  customer_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
}
