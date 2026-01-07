import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Calendar, Heart, Film, Users, Clapperboard, ChevronLeft, ChevronRight, User, Filter, X } from 'lucide-react'
import { favoriteAPI } from '../services/api'
import Loading from '../components/Loading'

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

// Move FilterInputs OUTSIDE the component
const FilterInputs = ({ 
  filters, 
  onFilterChange,
  activeTab
}: { 
  filters: any; 
  onFilterChange: (key: string, value: string) => void;
  activeTab: string;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
    <input
      type="text"
      placeholder={`Search ${activeTab}...`}
      value={filters.search}
      onChange={(e) => onFilterChange('search', e.target.value)}
      className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />
    
    {activeTab !== 'movies' && (
      <input
        type="text"
        placeholder="Nationality"
        value={filters.nationality}
        onChange={(e) => onFilterChange('nationality', e.target.value)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    )}

    {activeTab === 'movies' && (
      <input
        type="number"
        placeholder="Year"
        value={filters.year}
        onChange={(e) => onFilterChange('year', e.target.value)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    )}
  </div>
)

export default function FavoritesPage() {
  const navigate = useNavigate()
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const [favorites, setFavorites] = useState<FavoritesData>({
    movies: [],
    actors: [],
    directors: []
  })
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'movies' | 'actors' | 'directors'>('movies')
  const [showFilters, setShowFilters] = useState(false)
  
  const [paginationEnabled, setPaginationEnabled] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  
  const [filters, setFilters] = useState({
    search: '',
    nationality: '',
    year: '',
  })

  useEffect(() => {
    loadFavorites()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [favorites, activeTab, filters, page, paginationEnabled])

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

  const applyFilters = () => {
    let data: any[] = []
    
    switch (activeTab) {
      case 'movies':
        data = favorites.movies
        break
      case 'actors':
        data = favorites.actors
        break
      case 'directors':
        data = favorites.directors
        break
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      data = data.filter(item => {
        if ('title' in item) {
          return item.title.toLowerCase().includes(searchLower)
        }
        return item.name.toLowerCase().includes(searchLower)
      })
    }

    // Apply nationality filter
    if (filters.nationality && activeTab !== 'movies') {
      data = data.filter(item => 
        item.nationality?.toLowerCase().includes(filters.nationality.toLowerCase())
      )
    }

    // Apply year filter
    if (filters.year && activeTab === 'movies') {
      data = data.filter(item => 
        item.release_year === parseInt(filters.year)
      )
    }

    // Calculate total pages
    setTotalPages(Math.ceil(data.length / pageSize))

    // Apply pagination
    if (paginationEnabled) {
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      data = data.slice(startIndex, endIndex)
    }

    setFilteredData(data)
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

  const getCurrentTabCount = () => {
    switch (activeTab) {
      case 'movies': return favorites.movies.length
      case 'actors': return favorites.actors.length
      case 'directors': return favorites.directors.length
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filtering
  }

  const handleTabChange = (tab: 'movies' | 'actors' | 'directors') => {
    setActiveTab(tab)
    setPage(1)
    setFilters({ search: '', nationality: '', year: '' })
  }

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Favorites</h1>
              <p className="text-sm text-gray-600">You have {getTotalCount()} favorite items</p>
            </div>
            <div className="text-sm text-gray-600">Total: {getCurrentTabCount()}</div>
          </div>

          {/* Tab Buttons - Responsive */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handleTabChange('movies')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition text-sm ${
                activeTab === 'movies'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Film size={16} />
              <span className="hidden sm:inline">Movies</span> ({favorites.movies.length})
            </button>
            <button
              onClick={() => handleTabChange('actors')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition text-sm ${
                activeTab === 'actors'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={16} />
              <span className="hidden sm:inline">Actors</span> ({favorites.actors.length})
            </button>
            <button
              onClick={() => handleTabChange('directors')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition text-sm ${
                activeTab === 'directors'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clapperboard size={16} />
              <span className="hidden sm:inline">Directors</span> ({favorites.directors.length})
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paginationEnabled}
                onChange={(e) => setPaginationEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable Pagination</span>
            </label>

            {paginationEnabled && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="text-sm text-gray-600 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:block">
            <FilterInputs 
              filters={filters} 
              onFilterChange={handleFilterChange}
              activeTab={activeTab}
            />
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <FilterInputs 
                filters={filters} 
                onFilterChange={handleFilterChange}
                activeTab={activeTab}
              />
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          {activeTab === 'movies' && (
            <div>
              {filteredData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Film size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite movies {filters.search || filters.year ? 'found' : 'yet'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  {filteredData.map((movie: FavoriteMovie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onRemove={() => removeFavorite('movie', movie.id)}
                      onClick={() => navigate(`/movies/${movie.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actors' && (
            <div>
              {filteredData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite actors {filters.search || filters.nationality ? 'found' : 'yet'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  {filteredData.map((actor: FavoriteActor) => (
                    <PersonCard
                      key={actor.id}
                      person={actor}
                      onRemove={() => removeFavorite('actor', actor.id)}
                      onClick={() => navigate(`/actors/${actor.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'directors' && (
            <div>
              {filteredData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clapperboard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No favorite directors {filters.search || filters.nationality ? 'found' : 'yet'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  {filteredData.map((director: FavoriteDirector) => (
                    <PersonCard
                      key={director.id}
                      person={director}
                      onRemove={() => removeFavorite('director', director.id)}
                      onClick={() => navigate(`/directors/${director.id}`)}
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
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
    >
      <div className="relative h-[8rem] bg-gray-200 overflow-hidden">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3ENo Poster%3C/text%3E%3C/svg%3E'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Poster</div>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Heart size={16} className="text-red-500 fill-red-500" />
        </button>
      </div>

      <div className="p-2.5">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1.5">{movie.title}</h3>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{movie.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <span className="text-gray-500">{movie.release_year}</span>
        </div>
      </div>
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
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
    >
      <div className="relative aspect-[2/3] bg-gray-200 overflow-hidden">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3ENo Photo%3C/text%3E%3C/svg%3E'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User size={48} />
          </div>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Heart size={16} className="text-green-500 fill-green-500" />
        </button>
      </div>

      <div className="p-2.5">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1.5">{person.name}</h3>
        
        <div className="flex items-center justify-between text-xs">
          {person.nationality && (
            <span className="text-gray-600 truncate">{person.nationality}</span>
          )}
        </div>
      </div>
    </div>
  )
}