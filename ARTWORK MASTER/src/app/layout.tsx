import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beith Digital Preflight Portal",
  description: "Automated artwork validation platform for high-quality printing",
  keywords: ["print", "artwork", "preflight", "validation", "design", "CMYK", "bleed"],
  authors: [{ name: "Beith Digital" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white">
        <div className="flex flex-col min-h-screen">
          <header className="bg-beith-blue-600 text-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold">Beith Digital Preflight Portal</h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/" className="text-beith-blue-100 hover:text-white transition-colors">
                    Home
                  </a>
                  <a href="/admin" className="text-beith-blue-100 hover:text-white transition-colors">
                    Admin
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-beith-gray-50 border-t border-beith-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-beith-gray-600">
                <p>&copy; 2024 Beith Digital. All rights reserved.</p>
                <p className="mt-2 text-sm">
                  Professional print solutions with automated artwork validation
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
