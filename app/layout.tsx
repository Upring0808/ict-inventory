import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "ICT Asset & PMS Inventory | Accomplishment Report Management",
  description: "Modern digital asset management and preventive maintenance schedule (PMS) tracking for desktop computers, laptops, printers, and scanners.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
