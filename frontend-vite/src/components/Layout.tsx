import { Outlet, Link, useLocation } from 'react-router-dom'
import { Film, Users, Clapperboard, Network, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (path: string) => location.pathname.startsWith(path)

  const NavLinks = () => (
    <>
      <Link
        to="/movies"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 hover:text-blue-400 transition ${
          isActive('/movies') ? 'text-blue-400' : ''
        }`}
      >
        <Film size={20} />
        Movies
      </Link>

      <Link
        to="/actors"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 hover:text-blue-400 transition ${
          isActive('/actors') ? 'text-blue-400' : ''
        }`}
      >
        <Users size={20} />
        Actors
      </Link>

      <Link
        to="/directors"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 hover:text-blue-400 transition ${
          isActive('/directors') ? 'text-blue-400' : ''
        }`}
      >
        <Clapperboard size={20} />
        Directors
      </Link>

      <Link
        to="/favorites"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 hover:text-blue-400 transition ${
          isActive('/favorites') ? 'text-blue-400' : ''
        }`}
      >
        <Clapperboard size={20} />
        Favorites
      </Link>      

      <Link
        to="/relationships"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 hover:text-blue-400 transition ${
          isActive('/relationships') ? 'text-blue-400' : ''
        }`}
      >
        <Network size={20} />
        Relationships
      </Link>
    </>
  )

  return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <header className="bg-gray-900 text-white shadow-lg flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2">
              <Film size={32} />
              MovieXplorer
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-6">
              <NavLinks />
            </nav>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden"
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
              <NavLinks />
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT (SCROLLABLE) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-4 flex-shrink-0">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 MovieXplorer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
