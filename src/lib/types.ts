export interface Profile {
  id: string;
  email: string;
  name?: string;
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
  preferred_date: string;
  preferred_time: string;
  budget: number;
  status: 'open' | 'accepted' | 'confirmed' | 'in_progress' | 'completed';
  created_at: string;
}

export interface Booking {
  id: string;
  job_id: string;
  customer_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed';
  created_at: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}
