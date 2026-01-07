import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Calendar, Clock, ArrowLeft } from 'lucide-react'
import { movieAPI } from '../services/api'
import Loading from '../components/Loading'

export default function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<any>(null)
  const [actors, setActors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadMovieDetails(parseInt(id))
    }
  }, [id])

  const loadMovieDetails = async (movieId: number) => {
    setLoading(true)
    try {
      const [movieRes, actorsRes] = await Promise.all([
        movieAPI.getMovie(movieId),
        movieAPI.getMovieActors(movieId)
      ])
      setMovie(movieRes.data)
      setActors(actorsRes.data.actors || [])
    } catch (error) {
      console.error('Error loading movie details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loading /></div>
  if (!movie) return <div className="h-full flex items-center justify-center">Movie not found</div>

  return (
    <div className="h-full overflow-y-auto scrollable-content">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/movies')}
          className="flex items-center gap-2 mb-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Back to Movies
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <img
                src={movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Image'}
                alt={movie.title}
                className="w-full rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ENo Image%3C/text%3E%3C/svg%3E'
                }}
                className="h-[20rem]"
              />
            </div>
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-semibold">{movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar size={18} />
                  <span>{movie.release_year}</span>
                </div>
                {movie.duration_minutes && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={18} />
                    <span>{movie.duration_minutes} min</span>
                  </div>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre: any) => (
                      <span key={genre.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.director && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Director:</h3>
                  <button
                    onClick={() => navigate(`/directors/${movie.director.id}`)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {movie.director.name}
                  </button>
                </div>
              )}

              {movie.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Description:</h3>
                  <p className="text-gray-700">{movie.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {actors.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {actors.map((actor: any) => (
                <div
                  key={actor.id}
                  onClick={() => navigate(`/actors/${actor.id}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <img
                    src={actor.photo_url || 'https://via.placeholder.com/150x200?text=No+Photo'}
                    alt={actor.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Photo%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <p className="text-sm font-semibold text-center">{actor.name}</p>
                  {actor.nationality && (
                    <p className="text-xs text-gray-500 text-center">{actor.nationality}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}