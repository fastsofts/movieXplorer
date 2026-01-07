'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Users, Clapperboard, Network, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-gray-900 text-white shadow-lg flex-shrink-0">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <Film size={32} />
            MovieXplorer
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            <Link
              href="/movies"
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/movies') ? 'text-blue-400' : ''
              }`}
            >
              <Film size={20} />
              Movies
            </Link>

            <Link
              href="/actors"
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/actors') ? 'text-blue-400' : ''
              }`}
            >
              <Users size={20} />
              Actors
            </Link>

            <Link
              href="/directors"
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/directors') ? 'text-blue-400' : ''
              }`}
            >
              <Clapperboard size={20} />
              Directors
            </Link>

            <Link
              href="/favorites"
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/favorites') ? 'text-blue-400' : ''
              }`}
            >
             <Clapperboard size={20} />
               Favorites
            </Link>             

            <Link
              href="/relationships"
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/relationships') ? 'text-blue-400' : ''
              }`}
            >
              <Network size={20} />
              Relationships
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <nav className="flex flex-col gap-4 px-6 py-4">
            <Link
              href="/movies"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/movies') ? 'text-blue-400' : ''
              }`}
            >
              <Film size={20} />
              Movies
            </Link>

            <Link
              href="/actors"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/actors') ? 'text-blue-400' : ''
              }`}
            >
              <Users size={20} />
              Actors
            </Link>

            <Link
              href="/directors"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/directors') ? 'text-blue-400' : ''
              }`}
            >
              <Clapperboard size={20} />
              Directors
            </Link>

            <Link
              href="/relationships"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 hover:text-blue-400 transition ${
                isActive('/relationships') ? 'text-blue-400' : ''
              }`}
            >
              <Network size={20} />
              Relationships
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}