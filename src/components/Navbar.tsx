"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { userService } from "@/lib/services/userService";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState<"customer" | "worker" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes globally
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkUser();
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
     setIsOpen(false);
  }, [pathname]);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { profile } = await userService.getCurrentUser();
      setUserRole(profile.role);
    } catch {
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    setUserRole(null);
    router.push("/login");
  };

  const navLinks = {
    customer: [
      { label: "Dashboard", href: "/dashboard/customer" },
      { label: "Post Job", href: "/jobs/new" },
      { label: "Find Workers", href: "/jobs" },
    ],
    worker: [
      { label: "Dashboard", href: "/dashboard/worker" },
      { label: "Alerts", href: "/worker/alerts" },
      { label: "Matches", href: "/jobs" },
    ],
  };

  if (loading) return <div className="h-16 bg-[#0a0a0a] border-b border-gray-800"></div>;

  const links = userRole === "customer" ? navLinks.customer : userRole === "worker" ? navLinks.worker : [];

  return (
    <nav className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-extrabold text-2xl tracking-tighter text-white">
              K<span className="text-blue-500">A</span>AM
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Auth/Profile */}
          <div className="hidden md:block">
            {userRole ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm font-semibold hover:border-gray-500 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">U</div>
                  <span className="text-gray-300 capitalize">{userRole}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5 border border-gray-800 focus:outline-none">
                     <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800"
                        >
                          Sign out
                        </button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 shadow-lg shadow-blue-500/20">Sign Up</Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w30Focus.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#0a0a0a]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {!userRole && (
               <div className="mt-4 border-t border-gray-800 pt-4 pb-2">
                  <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Login</Link>
                  <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-gray-800">Sign Up</Link>
               </div>
            )}
            
            {userRole && (
               <div className="mt-4 border-t border-gray-800 pt-4 pb-2">
                  <div className="flex items-center px-4 mb-3">
                     <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">U</div>
                     <span className="ml-3 text-gray-300 capitalize font-medium">{userRole}</span>
                  </div>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-gray-800">
                    Sign out
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
