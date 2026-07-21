import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  // SECURITY BOUNCER: Kick out non-admins immediately
  const session = await getServerSession();
  const currentUser = await prisma.user.findUnique({
    where: { email: session?.user?.email as string }
  });
  if (currentUser?.role !== "ADMIN") redirect("/dashboard/tickets");

  // 2. The Server Action to create a new category
  async function createCategory(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    
    if (name) {
      // Save to database. We use a try/catch here in case we try to add a duplicate!
      try {
        await prisma.category.create({ data: { name } });
        revalidatePath("/dashboard/categories"); 
      } catch (error) {
        console.error("Category might already exist!");
      }
    }
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' } // Alphabetical order
    
  });

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Manage Ticket Categories</h2>
      
      <form action={createCategory} className="mb-8 flex gap-4">
        <input 
          type="text" 
          name="name" 
          placeholder="e.g., Task, Incident, Request..." 
          required 
          className="flex-1 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Add Category
        </button>
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Available Categories</h3>
        <ul className="space-y-2">
          {categories.length === 0 ? (
            <p className="italic text-gray-500">No categories added yet.</p>
          ) : (
            categories.map((category: any) => (
              <li key={category.id} className="flex items-center justify-between rounded border bg-gray-50 p-4 text-gray-700">
                <span className="font-medium">{category.name}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}