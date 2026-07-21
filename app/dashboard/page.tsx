import { prisma } from "@/lib/prisma";
import StatusChart from "./StatusChart";

export default async function DashboardPage() {
  // 1. Fetch total counts
  const clientCount = await prisma.client.count();
  const categoryCount = await prisma.category.count();
  const userCount = await prisma.user.count();

  // 2. Fetch ticket counts grouped by their Status
  const statusGroups = await prisma.ticket.groupBy({
    by: ['status'],
    _count: { status: true }
  });

  // 3. Format the data so the Recharts library can read it
  const chartData = statusGroups.map((group:any) => ({
    name: group.status,
    count: group._count.status
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Overview</h1>
      
      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium uppercase text-gray-500">Total Clients</h2>
          <p className="mt-2 text-4xl font-bold text-blue-600">{clientCount}</p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium uppercase text-gray-500">Total Categories</h2>
          <p className="mt-2 text-4xl font-bold text-green-600">{categoryCount}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium uppercase text-gray-500">Total Users</h2>
          <p className="mt-2 text-4xl font-bold text-purple-600">{userCount}</p>
        </div>
      </div>

      {/* The Status Graph */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Tickets by Status</h2>
        <StatusChart data={chartData} />
      </div>
    </div>
  );
}