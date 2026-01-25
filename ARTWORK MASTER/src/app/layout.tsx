import "./globals.css"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white">
        {/* Clean Professional Header */}
        <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center header-glow">
            {/* vAIb Logo */}
            <div className="flex-shrink-0 flex items-center space-x-2 group cursor-pointer">
              <div className="flex items-center group-hover:drop-shadow-[0_0_20px_rgba(124,58,237,0.8)] transition-all duration-300">
                <span className="text-purple-500 font-bold text-5xl tracking-widest group-hover:text-purple-300 transition-colors duration-300" style={{ fontFamily: 'Futura, sans-serif' }}>v</span>
                <span className="text-purple-500 font-bold text-5xl tracking-widest group-hover:text-purple-300 transition-colors duration-300" style={{ fontFamily: 'Futura, sans-serif' }}>A</span>
                <span className="text-red-500 font-bold text-5xl tracking-widest group-hover:text-purple-400 transition-colors duration-300 transform rotate-12 inline-block" style={{ fontFamily: 'Futura, sans-serif' }}>I</span>
                <span className="text-purple-500 font-bold text-5xl tracking-widest group-hover:text-purple-300 transition-colors duration-300" style={{ fontFamily: 'Futura, sans-serif' }}>b</span>
              </div>
              <div className="ml-3 border-l-2 border-purple-300/40 pl-3">
                <div className="text-purple-300/80 text-[10px] font-semibold leading-tight tracking-[0.25em] uppercase">
                  <div>Creating</div>
                  <div>Visual</div>
                  <div>Impact</div>
                </div>
              </div>
            </div>

            {/* Centered Title */}
            <div className="flex-1 flex flex-col items-center relative z-10">
              <div className="text-center mt-2">
                <h1 className="text-3xl sm:text-4xl font-bold tech-title mb-2">
                  <span className="font-ethno tracking-widest text-purple-500">AI</span> Powered Preflight Portal
                </h1>
                <p className="tech-tagline text-[9px] sm:text-xs font-semibold">
                  Professional print solutions with automated artwork validation
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
