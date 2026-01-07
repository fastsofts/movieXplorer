import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { actorAPI } from '../services/api'
import Loading from '../components/Loading'

export default function ActorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [actor, setActor] = useState<any>(null)
  const [directors, setDirectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadActorDetails(parseInt(id))
    }
  }, [id])

  const loadActorDetails = async (actorId: number) => {
    setLoading(true)
    try {
      const [actorRes, directorsRes] = await Promise.all([
        actorAPI.getActor(actorId),
        actorAPI.getActorDirectors(actorId)
      ])
      setActor(actorRes.data)
      setDirectors(directorsRes.data.directors || [])
    } catch (error) {
      console.error('Error loading actor details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loading /></div>
  if (!actor) return <div className="h-full flex items-center justify-center">Actor not found</div>

  return (
    <div className="h-full overflow-y-auto scrollable-content">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/actors')}
          className="flex items-center gap-2 mb-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Back to Actors
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <img
                src={actor.photo_url || 'https://via.placeholder.com/300x400?text=No+Photo'}
                alt={actor.name}
                className="w-full rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ENo Photo%3C/text%3E%3C/svg%3E'
                }}
                className="h-[20rem]"
              />
            </div>
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{actor.name}</h1>
              
              {actor.nationality && (
                <p className="mb-2"><span className="font-semibold">Nationality:</span> {actor.nationality}</p>
              )}
              {actor.birth_date && (
                <p className="mb-2"><span className="font-semibold">Born:</span> {new Date(actor.birth_date).toLocaleDateString()}</p>
              )}
              {actor.biography && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Biography:</h3>
                  <p className="text-gray-700">{actor.biography}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {directors.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Directors Worked With</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {directors.map((director: any) => (
                <div
                  key={director.id}
                  onClick={() => navigate(`/directors/${director.id}?actor_id=${id}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <img
                    src={director.photo_url || 'https://via.placeholder.com/150x200?text=No+Photo'}
                    alt={director.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Photo%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <p className="text-sm font-semibold text-center">{director.name}</p>
                  <p className="text-xs text-gray-500 text-center">{director.movie_count} movies</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {actor.movies && actor.movies.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {actor.movies.map((movie: any) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movies/${movie.id}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg overflow-hidden"
                >
                  <img
                    src={movie.poster_url || 'https://via.placeholder.com/150x225?text=No+Poster'}
                    alt={movie.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="225"%3E%3Crect width="150" height="225" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Poster%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <div className="p-2">
                    <p className="text-sm font-semibold line-clamp-2">{movie.title}</p>
                    <p className="text-xs text-gray-500">{movie.release_year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}