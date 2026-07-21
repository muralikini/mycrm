import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* We are forcing the background to be light gray and text to be dark gray here */}
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}