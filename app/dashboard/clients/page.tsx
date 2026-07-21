import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  // 1. SECURITY BOUNCER: Kick out non-admins immediately
  const session = await getServerSession();
  const currentUser = await prisma.user.findUnique({
    where: { email: session?.user?.email as string }
  });
  if (currentUser?.role !== "ADMIN") redirect("/dashboard/tickets");

  // 2. THIS IS THE LINE THAT WENT MISSING! Fetch existing clients
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' } 
  });

  // 3. The Server Action: Create a Client
  async function createClient(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    
    if (name) {
      await prisma.client.create({ data: { name } });
      revalidatePath("/dashboard/clients"); 
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm border border-gray-200">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Manage Clients</h2>
      
      {/* The Input Form */}
      <form action={createClient} className="mb-8 flex gap-4">
        <input 
          type="text" 
          name="name" 
          placeholder="Enter new client name..." 
          required 
          className="flex-1 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Add Client
        </button>
      </form>

      {/* The List of Clients */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Active Clients</h3>
        <ul className="space-y-2">
          {clients.length === 0 ? (
            <p className="text-gray-500 italic">No clients added yet.</p>
          ) : (
            clients.map((client) => (
              <li key={client.id} className="flex items-center justify-between rounded border bg-gray-50 p-4 text-gray-700">
                <span className="font-medium">{client.name}</span>
                <span className="text-xs text-gray-400">ID: {client.id.slice(0, 8)}...</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}