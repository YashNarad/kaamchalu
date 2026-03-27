"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enforceAuthAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Automatically route to correct dashboard if at base /dashboard
        if (pathname === "/dashboard") {
          router.push(`/dashboard/${profile.role}`);
        } else if (pathname.startsWith("/dashboard/customer") && profile.role !== "customer") {
          router.push(`/dashboard/${profile.role}`);
        } else if (pathname.startsWith("/dashboard/worker") && profile.role !== "worker") {
          router.push(`/dashboard/${profile.role}`);
        }
      }
      setLoading(false);
    };

    enforceAuthAndRole();
  }, [pathname, router]);

  if (loading) return <div className="min-h-screen bg-black text-white flex justify-center items-center">Loading Dashboard...</div>;

  return <>{children}</>;
}
