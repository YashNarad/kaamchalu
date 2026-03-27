# KaamChalu 🚀

KaamChalu is a professional service marketplace application connecting customers with skilled workers. Built with a modern, high-performance tech stack, it provides a seamless experience for posting jobs, finding workers, and managing service bookings.

## 🌟 Features

- **Role-based Dashboards:** Dedicated experiences for Customers (to post jobs and manage requests) and Workers (to view and accept/reject bookings).
- **Secure Authentication:** Password-based authentication integrated directly with Supabase Auth.
- **Job Matchmaking:** Smart logic matching customer job requests with appropriate workers.
- **Real-Time Booking Status:** Track bookings through pending, accepted, and rejected stages.
- **Responsive UI:** A modern, dark-themed responsive interface built entirely with Tailwind CSS.

## 💻 Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** TypeScript

## 📂 Folder Structure

```text
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── dashboard/      # Protected role-based dashboards (Customer/Worker)
│   │   ├── jobs/           # Job listing and creation
│   │   ├── login/          # User login
│   │   └── signup/         # User registration with role selection
│   ├── components/         # Reusable React components
│   └── lib/                # Config files (e.g., Supabase client initialized)
├── .env.local              # Environment variables (Ignored in Git)
├── supabase_schema.sql     # Database setup instructions
└── tailwind.config.ts      # Tailwind CSS configuration
```

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup:**
   Run the `supabase_schema.sql` script inside your Supabase SQL Editor to configure the necessary `profiles`, `jobs`, and `bookings` tables with Row Level Security (RLS) triggers.

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running live.
