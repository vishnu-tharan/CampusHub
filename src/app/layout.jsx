import Link from "next/link";
import { Compass } from "lucide-react";
import { getUser } from "@/lib/session";
import { SignOut } from "@/components/sign-out";
import "./globals.css";

export const metadata = {
  title: {
    default: "CampusHub · Where Campus Connects",
    template: "%s · CampusHub",
  },
  description:
    "Discover campus clubs, join exciting student events, and make the most of your university life.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/events">
              <span className="brand-icon">
                <Compass size={22} />
              </span>
              Campus<span>Hub</span>
            </Link>
            <nav aria-label="Main navigation" className="main-nav">
              <Link href="/events" className="nav-link">
                Explore events
              </Link>
              <Link href="/clubs" className="nav-link">
                Clubs
              </Link>
              {user?.role === "STUDENT" && (
                <Link href="/dashboard" className="nav-link">
                  My campus
                </Link>
              )}
              {user?.role === "ORGANIZER" && (
                <Link href="/organizer" className="nav-link">
                  Organizer workspace
                </Link>
              )}
            </nav>
            <div className="account-nav">
              {user ? (
                <>
                  <span className="user-chip">{user.name.split(" ")[0]}</span>
                  <SignOut />
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-link">
                    Sign in
                  </Link>
                  <Link href="/signup" className="button small">
                    Join the hub ↗
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="site-footer">
          <div className="shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">CampusHub</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                Official Campus Community & Events Platform
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link href="/events" className="hover:text-indigo-600 transition-colors">
                Events
              </Link>
              <Link href="/clubs" className="hover:text-indigo-600 transition-colors">
                Clubs
              </Link>
              <span>© {new Date().getFullYear()} CampusHub</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
