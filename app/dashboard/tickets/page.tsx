import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export default async function TicketsPage() {
  const session = await getServerSession();
  const userEmail = session?.user?.email;

  // 1. Identify who is looking at the page
  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail as string },
    include: { clients: true }
  });

  if (!currentUser) return <div>Please log in.</div>;

  const isAdmin = currentUser.role === "ADMIN";

  // 2. Fetch data based on their role
  // Admins see all tickets. Users only see tickets tied to their assigned clients.
  const tickets = await prisma.ticket.findMany({
    where: isAdmin ? {} : { clientId: { in: currentUser.clients.map(c => c.id) } },
    include: { client: true, category: true, author: true },
    orderBy: { createdAt: 'desc' }
  });

  const categories = await prisma.category.findMany();
  
  // Users can only create tickets for their assigned company
  const availableClients = isAdmin 
    ? await prisma.client.findMany() 
    : currentUser.clients;

  // 3. Server Action: Create a Ticket
  async function createTicket(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const clientId = formData.get("clientId") as string;
    const deadline = formData.get("deadline") as string;

    if (title && description && categoryId && clientId) {
      await prisma.ticket.create({
        data: {
          title,
          description,
          categoryId,
          clientId,
          authorId: currentUser!.id,
          deadline: deadline ? new Date(deadline) : null,
        }
      });
      revalidatePath("/dashboard/tickets");
    }
  }

  // 4. Server Action: Update Status (Admin Only)
  async function updateStatus(formData: FormData) {
    "use server";
    const ticketId = formData.get("ticketId") as string;
    const status = formData.get("status") as any;
    
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });
    revalidatePath("/dashboard/tickets");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* --- TICKET CREATION FORM --- */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Raise New Ticket</h2>
        <form action={createTicket} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input 
            type="text" name="title" placeholder="Short Title" required 
            className="rounded border border-gray-300 p-2 lg:col-span-2"
          />
          <select name="clientId" required className="rounded border border-gray-300 bg-white p-2">
            <option value="">Select Client...</option>
            {availableClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="categoryId" required className="rounded border border-gray-300 bg-white p-2">
            <option value="">Select Category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea 
            name="description" placeholder="Describe the issue, task, or request in detail..." required 
            className="rounded border border-gray-300 p-2 lg:col-span-3" rows={2}
          ></textarea>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500">Deadline (Optional)</label>
            <input type="date" name="deadline" className="rounded border border-gray-300 p-2" />
          </div>
          <div className="lg:col-span-4">
            <button type="submit" className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
              Submit Ticket
            </button>
          </div>
        </form>
      </div>

      {/* --- TICKET BOARD / LIST --- */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Issue Tracker</h2>
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <p className="text-gray-500 italic">No tickets found.</p>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="flex flex-col rounded border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-blue-900">{ticket.title}</h3>
                    <span className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                      {ticket.category.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{ticket.description}</p>
                  <div className="flex gap-4 text-xs font-medium text-gray-500">
                    <span>🏢 {ticket.client.name}</span>
                    <span>👤 {ticket.author.email}</span>
                    {ticket.deadline && (
                      <span className="text-red-500">⏰ Due: {ticket.deadline.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Status Updater */}
                {/* Status Updater */}
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <form action={updateStatus} className="flex flex-col gap-2 sm:items-end">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <div className="flex items-center gap-2">
                      <select 
                        name="status" 
                        defaultValue={ticket.status}
                        disabled={!isAdmin} // Only Admins can change status
                        className={`rounded border p-1 text-sm font-bold shadow-sm ${
                          ticket.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'DELAYED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DELAYED">DELAYED</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="POSTPONED">POSTPONED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                      
                      {/* We added a Save button instead of the onChange auto-submit */}
                      {isAdmin && (
                        <button 
                          type="submit" 
                          className="rounded bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-300"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}