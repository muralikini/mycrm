import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Check if they are logged in at all
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    redirect("/login");
  }

  // 2. Fetch the user's role securely from the database
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between bg-blue-900 p-4 text-white shadow-md">
        <div className="text-xl font-bold tracking-wide">CRM Admin</div>
        <div className="space-x-6 text-sm font-medium">
          <Link href="/dashboard" className="transition-colors hover:text-blue-300">Home</Link>
          <Link href="/dashboard/tickets" className="transition-colors hover:text-blue-300">Tickets</Link>
          
          {/* SECURITY: Only render these links if the user is an Admin */}
          {isAdmin && (
            <>
              <Link href="/dashboard/clients" className="transition-colors hover:text-blue-300">Clients</Link>
              <Link href="/dashboard/categories" className="transition-colors hover:text-blue-300">Categories</Link>
              <Link href="/dashboard/users" className="transition-colors hover:text-blue-300">Users</Link>
            </>
          )}

          <Link 
            href="/api/auth/signout" 
            className="rounded border border-white px-3 py-1 transition-colors hover:bg-white hover:text-blue-900"
          >
            Logout
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}