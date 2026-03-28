"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function WorkerSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    city: "",
    experience: "",
    price: ""
  });

  useEffect(() => {
    // Optional: Pre-fill if they already started
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("name, category, location, experience, price")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setFormData({
          name: data.name || "",
          category: data.category || "",
          city: data.location || "", // Map to location
          experience: data.experience?.toString() || "",
          price: data.price?.toString() || ""
        });
      }
    };
    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.category || !formData.city || !formData.experience || !formData.price) {
      setToast({ message: "Please fill in all required fields.", type: "error" });
      setLoading(false);
      return;
    }

    if (Number(formData.price) <= 0) {
      setToast({ message: "Price must be greater than 0.", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Authentication error. Please sign in again.");

      // Supabase update logic
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          category: formData.category,
          location: formData.city, // Storing 'city' as 'location' in the DB
          experience: Number(formData.experience),
          price: Number(formData.price)
        })
        .eq("id", user.id); // Match using auth.uid() equivalents

      if (error) throw error;

      setToast({ message: "Profile completely set up!", type: "success" });
      
      // Redirect after slight delay for visual confirmation
      setTimeout(() => {
        router.push("/dashboard/worker");
      }, 1000);

    } catch (error: any) {
      setToast({ message: error.message || "Failed to update profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const categories = ["plumber", "electrician", "ac cleaner", "sweeper"];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
      <div className="w-full max-w-xl bg-gray-900/60 p-8 sm:p-12 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-md">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
            Worker Profile Setup
          </h1>
          <p className="text-gray-400">Complete your profile to start accepting job requests in your area.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Category Dropdown & City Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-gray-600">Select a trade</option>
                {categories.map(c => (
                  <option key={c} value={c} className="capitalize text-white bg-gray-900">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
              <input 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Experience & Price Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Experience (Years)</label>
              <input 
                type="number" 
                name="experience"
                min="0"
                value={formData.experience}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Hourly Price (₹)</label>
              <input 
                type="number" 
                name="price"
                min="1"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 500"
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Profile...
              </>
            ) : "Complete Setup"}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
