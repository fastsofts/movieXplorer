import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, User, Heart } from 'lucide-react'
import { directorAPI, favoriteAPI } from '../services/api'
import type { Director } from '../types'
import Loading from '../components/Loading'

// Move FilterInputs OUTSIDE the component
const FilterInputs = ({ 
  filters, 
  onFilterChange 
}: { 
  filters: any; 
  onFilterChange: (key: string, value: string) => void 
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
    <input
      type="text"
      placeholder="Search directors..."
      value={filters.search}
      onChange={(e) => onFilterChange('search', e.target.value)}
      className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />
    
    <input
      type="text"
      placeholder="Nationality"
      value={filters.nationality}
      onChange={(e) => onFilterChange('nationality', e.target.value)}
      className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />
  </div>
)

export default function DirectorsPage() {
  const navigate = useNavigate()
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [paginationEnabled, setPaginationEnabled] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const hasMore = useRef(true)
  
  const [filters, setFilters] = useState({
    search: '',
    nationality: '',
  })

  useEffect(() => {
    if (paginationEnabled) {
      loadDirectors(true)
    } else {
      loadDirectors(true)
    }
  }, [filters, paginationEnabled])

  useEffect(() => {
    // Only load when page changes and pagination is enabled
    if (paginationEnabled && page > 1) {
      loadCurrentPage()
    }
  }, [page])

  useEffect(() => {
    if (!paginationEnabled && observerTarget.current && !loading) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore.current && !loadingMore) {
            loadDirectors(false)
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(observerTarget.current)
      return () => observer.disconnect()
    }
  }, [paginationEnabled, loadingMore, loading, directors.length])

  const loadCurrentPage = async () => {
    setLoading(true)
    
    try {
      const params: any = {
        page: page,
        page_size: pageSize,
      }

      if (filters.search) params.search = filters.search
      if (filters.nationality) params.nationality = filters.nationality

      const response = await directorAPI.getDirectors(params)
      
      setDirectors(response.data.items)
      setTotal(response.data.total)
      setTotalPages(response.data.total_pages)
      
    } catch (error) {
      console.error('Error loading directors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDirectors = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setDirectors([])
      setPage(1)
      hasMore.current = true
    } else {
      setLoadingMore(true)
    }

    try {
      const currentPage = reset ? 1 : page + 1
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      }

      if (filters.search) params.search = filters.search
      if (filters.nationality) params.nationality = filters.nationality

      const response = await directorAPI.getDirectors(params)
      
      if (reset) {
        setDirectors(response.data.items)
      } else {
        setDirectors(prev => [...prev, ...response.data.items])
        setPage(currentPage)
      }
      
      setTotal(response.data.total)
      setTotalPages(response.data.total_pages)
      
      if (response.data.items.length < pageSize || currentPage >= response.data.total_pages) {
        hasMore.current = false
      }
    } catch (error) {
      console.error('Error loading directors:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleDirectorClick = (directorId: number) => {
    navigate(`/directors/${directorId}`)
  }

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Directors</h1>
            <div className="text-sm text-gray-600">Total: {total}</div>
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
          </div>

          {/* Filters */}
          <FilterInputs 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading />
            </div>
          ) : directors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No directors found</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {directors.map((director) => (
                  <DirectorCard key={director.id} director={director} onClick={() => handleDirectorClick(director.id)} />
                ))}
              </div>
              
              {!paginationEnabled && (
                <div ref={observerTarget} className="py-4 text-center">
                  {loadingMore && <Loading />}
                  {!hasMore.current && <div className="text-gray-500 text-sm">No more directors</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const DirectorCard = ({ director, onClick }: { director: Director; onClick: () => void }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [director.id])

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteAPI.checkFavorite('director', director.id)
      setIsFavorite(response.data.is_favorite)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      if (isFavorite) {
        await favoriteAPI.removeFavorite('director', director.id)
        setIsFavorite(false)
      } else {
        await favoriteAPI.addFavorite('director', director.id)
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
    >
      {/* Photo - Fixed aspect ratio */}
      <div className="relative h-[8rem] bg-gray-200 overflow-hidden">
        {director.photo_url ? (
          <img
            src={director.photo_url}
            alt={director.name}
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
        
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={loading}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Heart 
            size={16} 
            className={isFavorite ? 'text-green-500 fill-green-500' : 'text-gray-600'}
          />
        </button>
      </div>

      {/* Info Section */}
      <div className="p-2.5">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1.5">{director.name}</h3>
        
        <div className="flex items-center justify-between text-xs">
          {director.nationality && (
            <span className="text-gray-600 truncate">{director.nationality}</span>
          )}
          {director.birth_date && (
            <span className="text-gray-500 flex-shrink-0">
              {new Date(director.birth_date).getFullYear()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}