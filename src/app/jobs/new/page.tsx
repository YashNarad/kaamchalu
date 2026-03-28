"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function NewJob() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        city: "",
        preferred_date: "",
        preferred_time: "Morning",
        budget: "",
    });

    const categories = ["plumber", "electrician", "ac cleaner", "sweeper"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
       setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
               setToast({ message: "You must be logged in to post a job.", type: "error" });
               return;
            }

            if (!form.title || !form.category || !form.city || !form.preferred_date || !form.budget) {
               setToast({ message: "Please fill in all required fields.", type: "error" });
               return;
            }

            // True Marketplace Insert Execution
            const { error } = await supabase.from("jobs").insert([
                {
                    customer_id: user.id,
                    title: form.title,
                    category: form.category,
                    description: form.description,
                    city: form.city,
                    preferred_date: form.preferred_date,
                    preferred_time: form.preferred_time,
                    budget: Number(form.budget),
                    status: "open"
                },
            ]);

            if (error) {
               console.error("Supabase Insert Error: ", error);
               throw new Error(error.message);
            }

            setToast({ message: "Job posted to the marketplace successfully!", type: "success" });
            
            setTimeout(() => {
                router.push("/dashboard/customer");
            }, 1000);

        } catch (error: any) {
            setToast({ message: error.message || "Failed to post job.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex justify-center items-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-900/80 p-8 md:p-10 rounded-3xl w-full max-w-2xl border border-gray-800 shadow-2xl backdrop-blur-md space-y-6"
            >
                <div className="text-center mb-8">
                   <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">Post a New Job</h2>
                   <p className="text-gray-400 text-sm">Enter the details to list your request on the open marketplace.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Job Title</label>
                    <input
                        name="title"
                        placeholder="e.g. Need a quick pipe fix"
                        className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                        onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Category</label>
                        <select
                            name="category"
                            value={form.category}
                            className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-white cursor-pointer"
                            onChange={handleChange}
                        >
                            <option value="" disabled className="text-gray-500">Select a trade</option>
                            {categories.map(c => (
                              <option key={c} value={c} className="capitalize text-white bg-gray-900">{c}</option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">City</label>
                        <input
                            name="city"
                            placeholder="e.g. Mumbai"
                            className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            onChange={handleChange}
                        />
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Description</label>
                    <textarea
                        name="description"
                        rows={3}
                        placeholder="Provide some details about what precisely needs to be done..."
                        className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                        onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Date</label>
                        <input
                            type="date"
                            name="preferred_date"
                            className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-300"
                            onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Time Preference</label>
                        <select
                            name="preferred_time"
                            value={form.preferred_time}
                            className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white cursor-pointer"
                            onChange={handleChange}
                        >
                            <option>Morning</option>
                            <option>Afternoon</option>
                            <option>Evening</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Budget (₹)</label>
                        <input
                            type="number"
                            name="budget"
                            min="1"
                            placeholder="e.g. 1500"
                            className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            onChange={handleChange}
                        />
                      </div>
                  </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? "Listing Job..." : "Post to Marketplace"}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => router.push("/dashboard/customer")}
                        className="w-full mt-3 bg-transparent hover:bg-white/5 border border-gray-700 text-gray-300 py-3.5 text-sm font-bold rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}