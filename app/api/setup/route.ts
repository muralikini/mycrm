import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Check if the admin already exists so we don't create duplicates
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@additlabs.com" }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists!" });
    }

    // 2. Encrypt the default password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 3. Create the user in the database
    const admin = await prisma.user.create({
      data: {
        email: "admin@additlabs.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ 
      message: "Success! First admin created.", 
      email: admin.email 
    });

  } catch (error) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}