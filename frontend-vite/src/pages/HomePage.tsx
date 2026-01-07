import { Link } from 'react-router-dom'
import { Film, Users, Clapperboard, Network, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Welcome to MovieXplorer</h1>
          <p className="text-xl text-gray-300">Discover amazing movies, actors, and directors</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link to="/movies" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-8 transition transform hover:scale-105">
            <Film size={48} className="mb-4 mx-auto text-blue-400" />
            <h2 className="text-2xl font-bold mb-2 text-center">Movies</h2>
            <p className="text-gray-300 text-center">Browse our collection of movies</p>
          </Link>

          <Link to="/actors" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-8 transition transform hover:scale-105">
            <Users size={48} className="mb-4 mx-auto text-green-400" />
            <h2 className="text-2xl font-bold mb-2 text-center">Actors</h2>
            <p className="text-gray-300 text-center">Explore talented actors</p>
          </Link>

          <Link to="/directors" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-8 transition transform hover:scale-105">
            <Clapperboard size={48} className="mb-4 mx-auto text-purple-400" />
            <h2 className="text-2xl font-bold mb-2 text-center">Directors</h2>
            <p className="text-gray-300 text-center">Discover acclaimed directors</p>
          </Link>

          <Link to="/favorites" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-8 transition transform hover:scale-105">
            <Heart size={48} className="mb-4 mx-auto text-pink-400" />
            <h2 className="text-2xl font-bold mb-2 text-center">Favorites</h2>
            <p className="text-gray-300 text-center">View your favorite items</p>
          </Link>

          <Link to="/relationships" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-8 transition transform hover:scale-105">
            <Network size={48} className="mb-4 mx-auto text-red-400" />
            <h2 className="text-2xl font-bold mb-2 text-center">Relationships</h2>
            <p className="text-gray-300 text-center">Visualize connections</p>
          </Link>
        </div>
      </div>
    </div>
  )
}