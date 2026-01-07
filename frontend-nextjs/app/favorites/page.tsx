'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Calendar, Heart, Film, Users, Clapperboard } from 'lucide-react'
import { favoriteAPI } from '@/lib/api'
import Loading from '@/components/Loading'

interface FavoriteMovie {
  id: number
  title: string
  release_year: number
  rating: number
  poster_url: string
  favorite_id: number
}

interface FavoriteActor {
  id: number
  name: string
  nationality: string
  photo_url: string
  favorite_id: number
}

interface FavoriteDirector {
  id: number
  name: string
  nationality: string
  photo_url: string
  favorite_id: number
}

interface FavoritesData {
  movies: FavoriteMovie[]
  actors: FavoriteActor[]
  directors: FavoriteDirector[]
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoritesData>({
    movies: [],
    actors: [],
    directors: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'movies' | 'actors' | 'directors'>('movies')

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const response = await favoriteAPI.getFavorites()
      setFavorites(response.data)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (entityType: string, entityId: number) => {
    try {
      await favoriteAPI.removeFavorite(entityType, entityId)
      loadFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const getTotalCount = () => {
    return favorites.movies.length + favorites.actors.length + favorites.directors.length
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 scrollable-content">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
          <p className="text-gray-600">You have {getTotalCount()} favorite items</p>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'movies'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Film size={20} />
              Movies ({favorites.movies.length})
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'actors'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              Actors ({favorites.actors.length})
            </button>
            <button
              onClick={() => setActiveTab('directors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'directors'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clapperboard size={20} />
              Directors ({favorites.directors.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'movies' && (
            <div>
              {favorites.movies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Film size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite movies yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favorites.movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onRemove={() => removeFavorite('movie', movie.id)}
                      onClick={() => router.push(`/movies/${movie.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actors' && (
            <div>
              {favorites.actors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite actors yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favorites.actors.map((actor) => (
                    <PersonCard
                      key={actor.id}
                      person={actor}
                      onRemove={() => removeFavorite('actor', actor.id)}
                      onClick={() => router.push(`/actors/${actor.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'directors' && (
            <div>
              {favorites.directors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clapperboard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite directors yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favorites.directors.map((director) => (
                    <PersonCard
                      key={director.id}
                      person={director}
                      onRemove={() => removeFavorite('director', director.id)}
                      onClick={() => router.push(`/directors/${director.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MovieCard = ({ 
  movie, 
  onRemove, 
  onClick 
}: { 
  movie: FavoriteMovie
  onRemove: () => void
  onClick: () => void
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden relative"
      style={{ height: '320px' }}
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="h-48 overflow-hidden bg-gray-200 flex items-center justify-center">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">No Image</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
          <div className="flex items-center gap-1 mb-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{movie.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 text-xs">
            <Calendar size={12} />
            <span>{movie.release_year}</span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition z-10"
      >
        <Heart size={20} className="text-green-500 fill-green-500" />
      </button>
    </div>
  )
}

const PersonCard = ({ 
  person, 
  onRemove, 
  onClick 
}: { 
  person: FavoriteActor | FavoriteDirector
  onRemove: () => void
  onClick: () => void
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden relative"
      style={{ height: '280px' }}
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="h-48 overflow-hidden bg-gray-200 flex items-center justify-center">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">No Image</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{person.name}</h3>
          {person.nationality && (
            <p className="text-xs text-gray-600">{person.nationality}</p>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition z-10"
      >
        <Heart size={20} className="text-green-500 fill-green-500" />
      </button>
    </div>
  )
}
