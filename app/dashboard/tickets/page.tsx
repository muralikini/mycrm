import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

export default async function TicketsPage() {
  const session = await getServerSession();
  const currentUser = await prisma.user.findUnique({
    where: { email: session?.user?.email as string }
  });
  const isAdmin = currentUser?.role === "ADMIN";

  // Fetch data
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true, category: true }
  });
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  // Create Ticket Action
  async function createTicket(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const clientId = formData.get("clientId") as string;
    const categoryId = formData.get("categoryId") as string;
    const deadlineStr = formData.get("deadline") as string;
    const reportedDateStr = formData.get("reportedDate") as string; // Capture new field

    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    const reportedDate = reportedDateStr ? new Date(reportedDateStr) : new Date();

    if (title && clientId && categoryId) {
      await prisma.ticket.create({
        data: {
          title,
          description,
          clientId,
          categoryId,
          deadline,
          reportedDate, // Save it to database
          status: "ACTIVE",
        }
      });
      revalidatePath("/dashboard/tickets");
    }
  }

  // Update Status Action
  async function updateStatus(formData: FormData) {
    "use server";
    const ticketId = formData.get("ticketId") as string;
    const status = formData.get("status") as string;
    
    if (ticketId && status) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status }
      });
      revalidatePath("/dashboard/tickets");
    }
  }

  // Get today's date formatted for the HTML input default
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* CREATION FORM */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Raise New Ticket</h2>
        
        <form action={createTicket} className="space-y-4">
          <div className="flex gap-4">
            <input type="text" name="title" placeholder="Short Title" required className="flex-2 rounded border border-gray-300 p-2 w-full" />
            <select name="clientId" required className="flex-1 rounded border border-gray-300 p-2">
              <option value="">Select Client...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="categoryId" required className="flex-1 rounded border border-gray-300 p-2">
              <option value="">Select Category...</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex gap-4">
            <textarea name="description" placeholder="Describe the issue, task, or request in detail..." rows={2} className="flex-[3] rounded border border-gray-300 p-2"></textarea>
            
            <div className="flex flex-[2] gap-4">
              {/* NEW REPORTED DATE FIELD */}
              <div className="flex-1 flex flex-col">
                <label className="mb-1 text-xs font-bold text-gray-500">Reported Date</label>
                <input type="date" name="reportedDate" defaultValue={todayDate} required className="rounded border border-gray-300 p-2" />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="mb-1 text-xs font-bold text-gray-500">Deadline (Optional)</label>
                <input type="date" name="deadline" className="rounded border border-gray-300 p-2" />
              </div>
            </div>
          </div>

          <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700">
            Submit Ticket
          </button>
        </form>
      </div>

      {/* TICKET LIST */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800">Issue Tracker</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {tickets.length === 0 ? (
            <p className="p-6 text-gray-500 italic">No tickets raised yet.</p>
          ) : (
            tickets.map((ticket :any) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{ticket.title}</h3>
                    <span className="text-xs font-medium text-gray-500">{ticket.category.name}</span>
                  </div>
                </div>
                
                {ticket.description && (
                  <p className="mb-4 text-sm text-gray-700">{ticket.description}</p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1 font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
                      🏢 {ticket.client.name}
                    </span>
                    {/* NEW DISPLAY FOR REPORTED DATE */}
                    <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded">
                      📥 Reported: {ticket.reportedDate.toLocaleDateString()}
                    </span>
                    {ticket.deadline && (
                      <span className="flex items-center gap-1 font-medium text-red-800 bg-red-100 px-2 py-1 rounded">
                        ⏰ Due: {ticket.deadline.toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  
                  {/* Status Updater */}
                  <div className="mt-4 sm:mt-0 sm:text-right">
                    <form action={updateStatus} className="flex flex-col gap-2 sm:items-end">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <div className="flex items-center gap-2">
                        <select 
                          name="status" 
                          defaultValue={ticket.status}
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
                        
                        <button type="submit" className="rounded bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-300">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}