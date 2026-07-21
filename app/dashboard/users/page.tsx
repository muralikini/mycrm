import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  // SECURITY BOUNCER: Kick out non-admins immediately
  const session = await getServerSession();
  const currentUser = await prisma.user.findUnique({
    where: { email: session?.user?.email as string }
  });
  if (currentUser?.role !== "ADMIN") redirect("/dashboard/tickets");
  // 1. Fetch both clients (for the dropdown) and existing users (for the list)
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' }
  });

  const users = await prisma.user.findMany({
    include: { clients: true }, // This pulls in the company name the user is attached to
    orderBy: { createdAt: 'desc' }
  });

  // 2. The Server Action to create a new user and link them to a client
  async function createUser(formData: FormData) {
    "use server";
    
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const clientId = formData.get("clientId") as string;
    
    if (email && password) {
      try {
        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Prepare the user data
        const userData: any = {
          email,
          password: hashedPassword,
          role: "USER",
        };

        // If you selected a client from the dropdown, link them together!
        if (clientId) {
          userData.clients = {
            connect: [{ id: clientId }]
          };
        }

        // Save to the database
        await prisma.user.create({ data: userData });
        revalidatePath("/dashboard/users"); 

      } catch (error) {
        console.error("Error creating user. The email might already exist.");
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Manage Users</h2>
      
      {/* The User Creation Form */}
      <form action={createUser} className="mb-8 grid gap-4 sm:grid-cols-4">
        <input 
          type="email" 
          name="email" 
          placeholder="User Email" 
          required 
          className="rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Temporary Password" 
          required 
          className="rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select 
          name="clientId"
          className="rounded border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Assign to Client (Optional)</option>
          {clients.map((client:any) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <button 
          type="submit" 
          className="rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Create User
        </button>
      </form>

      {/* The List of Users */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Active Users</h3>
        <ul className="space-y-2">
          {users.map((user : any) => (
            <li key={user.id} className="flex flex-col rounded border bg-gray-50 p-4 text-gray-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium">{user.email}</span>
                <span className="ml-3 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {user.role}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500 sm:mt-0">
                {user.clients.length > 0 
                  ? `Assigned to: ${user.clients.map((c :any) => c.name).join(', ')}` 
                  : "No Client Assigned"}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}