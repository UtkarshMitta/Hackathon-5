import Link from 'next/link';
import { ArrowRight, Home, Wrench, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex h-screen bg-black">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-black p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">MarginGuard</h1>
            <button className="text-zinc-500 hover:text-zinc-400 text-xs mt-0.5">
              ‹
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-3">Navigation</p>
          
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
          
          <Link 
            href="/agent"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Wrench className="h-4 w-4" />
            <span className="text-sm">Agent Tools</span>
          </Link>
          
          <Link 
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Reports</span>
          </Link>
          
          <Link 
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm">Our Vision</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-20">
        <div className="max-w-7xl w-full flex items-center justify-between gap-20">
          {/* Left Content */}
          <div className="flex-1 space-y-6">
            <h1 className="text-6xl font-medium text-gray-400 leading-tight">
              Type a sentence.{' '}
              <br />
              <span className="text-white">Get protection.</span>
            </h1>
            
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              AI analyzes your HVAC portfolio and identifies margin risks in minutes.
            </p>
            
            <Button 
              asChild
              className="bg-white text-black hover:bg-zinc-200 rounded-full h-12 px-8 text-base font-medium"
            >
              <Link href="/agent" className="flex items-center gap-2">
                Get the agent — free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative">
            {/* iPhone Frame */}
            <div className="relative w-[320px] h-[640px] bg-zinc-900 rounded-[3rem] border-[14px] border-zinc-800 shadow-2xl overflow-hidden">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-zinc-900 flex items-center justify-between px-8 text-white text-xs z-10">
                <span>11:43</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-3 border border-white rounded-sm"></div>
                  <div className="w-1 h-3 bg-white"></div>
                </div>
              </div>

              {/* App Header */}
              <div className="absolute top-10 left-0 right-0 h-14 bg-zinc-900 flex items-center justify-between px-4 border-b border-zinc-800 z-10">
                <button className="text-blue-400">‹ Studio</button>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Mechanics</span>
                  <div className="w-6 h-6 rounded-full bg-zinc-700"></div>
                </div>
                <button className="text-white">⋯</button>
              </div>

              {/* 3D Isometric View */}
              <div className="absolute top-24 left-0 right-0 bottom-16 bg-gradient-to-b from-sky-200 to-sky-100 overflow-hidden">
                {/* Isometric Building */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                  <div className="relative w-full h-full">
                    {/* Building blocks (simplified isometric view) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Base platform */}
                        <div className="w-48 h-32 bg-blue-300 transform skew-y-12 shadow-xl"></div>
                        {/* Building structure */}
                        <div className="absolute top-0 left-12 w-24 h-40 bg-red-400 transform skew-y-12 shadow-lg"></div>
                        <div className="absolute top-8 left-20 w-24 h-32 bg-zinc-400 transform skew-y-12 shadow-lg"></div>
                        {/* Roof accent */}
                        <div className="absolute -top-4 left-16 w-16 h-8 bg-gray-600 transform skew-y-12"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Building label */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-zinc-800 text-xs font-medium">GRAND CENTRAL</p>
                  <p className="text-zinc-500 text-[10px]">Last edited now</p>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-8">
                <button className="text-blue-400 text-xs font-medium">← Plan</button>
                <button className="text-white text-xs font-medium">Build →</button>
                <button className="text-zinc-500 text-xs">Test (0/$)</button>
              </div>

              {/* Pause button */}
              <button className="absolute bottom-20 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-zinc-700">
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-white"></div>
                  <div className="w-1 h-3 bg-white"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Download Button */}
      <div className="fixed bottom-8 left-8">
        <Button 
          variant="outline"
          className="bg-white text-black hover:bg-zinc-200 rounded-full h-12 px-8 text-sm font-medium border-0"
        >
          Download App
        </Button>
      </div>
    </div>
  );
}
