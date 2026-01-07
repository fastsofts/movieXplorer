'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { directorAPI } from '@/lib/api';
import Loading from '@/components/Loading';

export default function DirectorDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [director, setDirector] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadDirectorDetails(parseInt(params.id as string));
    }
  }, [params.id]);

  const loadDirectorDetails = async (directorId: number) => {
    setLoading(true);
    try {
      const actorId = searchParams.get('actor_id');
      const [directorRes, moviesRes, actorsRes] = await Promise.all([
        directorAPI.getDirector(directorId),
        directorAPI.getDirectorMovies(directorId, actorId ? parseInt(actorId) : undefined),
        directorAPI.getDirectorActors(directorId)
      ]);
      setDirector(directorRes.data);
      setMovies(moviesRes.data.movies || []);
      setActors(actorsRes.data.actors || []);
    } catch (error) {
      console.error('Error loading director details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!director) {
    return (
      <div className="h-full flex items-center justify-center">
        Director not found
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollable-content">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.push('/directors')}
          className="flex items-center gap-2 mb-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Back to Directors
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <img
                src={director.photo_url || 'https://via.placeholder.com/300x400?text=No+Photo'}
                alt={director.name}
                className="w-full rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ENo Photo%3C/text%3E%3C/svg%3E';
                }}
                className="h-[20rem]"                
              />
            </div>
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{director.name}</h1>
              
              {director.nationality && (
                <p className="mb-2"><span className="font-semibold">Nationality:</span> {director.nationality}</p>
              )}
              {director.birth_date && (
                <p className="mb-2"><span className="font-semibold">Born:</span> {new Date(director.birth_date).toLocaleDateString()}</p>
              )}
              {director.biography && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Biography:</h3>
                  <p className="text-gray-700">{director.biography}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {movies.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((movie: any) => (
                <div
                  key={movie.id}
                  onClick={() => router.push(`/movies/${movie.id}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg overflow-hidden"
                >
                  <img
                    src={movie.poster_url || 'https://via.placeholder.com/150x225?text=No+Poster'}
                    alt={movie.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="225"%3E%3Crect width="150" height="225" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Poster%3C/text%3E%3C/svg%3E';
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

        {actors.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Actors Worked With</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {actors.map((actor: any) => (
                <div
                  key={actor.id}
                  onClick={() => router.push(`/actors/${actor.id}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <img
                    src={actor.photo_url || 'https://via.placeholder.com/150x200?text=No+Photo'}
                    alt={actor.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Photo%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <p className="text-sm font-semibold text-center">{actor.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
