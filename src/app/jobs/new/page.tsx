"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function NewJob() {
    const router = useRouter()

    const [form, setForm] = useState({
        category: "",
        description: "",
        area: "",
        date: "",
        time: "",
        budget: "",
    })

    const handleSubmit = async (e: any) => {
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from("jobs").insert([
            {
                customer_id: user?.id,
                category: form.category,
                description: form.description,
                location: form.area, // FIX
                preferred_date: form.date, // FIX
                preferred_time: form.time, // FIX
                budget: Number(form.budget), // FIX
            },
        ])

        if (error) {
            console.log(error)
            alert(error.message)
        } else {
            alert("Job posted successfully ✅")
            router.push("/jobs")
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex justify-center items-center">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-900 p-8 rounded-xl w-full max-w-lg space-y-4"
            >
                <h2 className="text-2xl font-bold text-center">Post New Job</h2>

                <input
                    placeholder="Category"
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                />

                <input
                    placeholder="Description"
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <input
                    placeholder="Area"
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                />

                <input
                    type="date"
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <select
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                >
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                </select>

                <input
                    placeholder="Budget"
                    className="w-full p-3 bg-gray-800 rounded"
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />

                <button className="w-full bg-blue-600 py-3 rounded-lg">
                    Post Job
                </button>
            </form>
        </div>
    )
}