import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "Role-based team and task management for product teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full scroll-smooth antialiased">
      <body className="min-h-full bg-[rgb(var(--background-rgb))] text-[rgb(var(--foreground-rgb))]">
        {children}
      </body>
    </html>
  );
}
