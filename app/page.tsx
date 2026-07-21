import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically teleport anyone who visits the main website straight to the login screen
  redirect("/login");
}