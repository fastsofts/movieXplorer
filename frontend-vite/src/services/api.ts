import axios from 'axios';
import type { Movie, Actor, Director, Genre, PaginatedResponse, GraphData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const movieAPI = {
  getMovies: (params?: any) => api.get<PaginatedResponse<Movie>>('/movies', { params }),
  getMovie: (id: number) => api.get<Movie>(`/movies/${id}`),
  getMovieActors: (id: number) => api.get(`/movies/${id}/actors`),
  getMovieDirector: (id: number) => api.get(`/movies/${id}/director`),
};

export const actorAPI = {
  getActors: (params?: any) => api.get<PaginatedResponse<Actor>>('/actors', { params }),
  getActor: (id: number) => api.get<Actor>(`/actors/${id}`),
  getActorMovies: (id: number) => api.get(`/actors/${id}/movies`),
  getActorDirectors: (id: number) => api.get(`/actors/${id}/directors`),
};

export const directorAPI = {
  getDirectors: (params?: any) => api.get<PaginatedResponse<Director>>('/directors', { params }),
  getDirector: (id: number) => api.get<Director>(`/directors/${id}`),
  getDirectorMovies: (id: number, actorId?: number) => 
    api.get(`/directors/${id}/movies`, { params: actorId ? { actor_id: actorId } : {} }),
  getDirectorActors: (id: number) => api.get(`/directors/${id}/actors`),
};

export const genreAPI = {
  getGenres: (params?: any) => api.get<PaginatedResponse<Genre>>('/genres', { params }),
  getGenre: (id: number) => api.get<Genre>(`/genres/${id}`),
};

export const relationshipAPI = {
  getRelationships: () => api.get<GraphData>('/api/relationships'),
};

export const favoriteAPI = {
  getFavorites: (userId?: string) => 
    api.get('/favorites', { params: userId ? { user_id: userId } : {} }),
  addFavorite: (entityType: string, entityId: number, userId: string = 'default_user') =>
    api.post('/favorites', { entity_type: entityType, entity_id: entityId, user_id: userId }),
  removeFavorite: (entityType: string, entityId: number, userId: string = 'default_user') =>
    api.delete(`/favorites/${entityType}/${entityId}`, { params: { user_id: userId } }),
  checkFavorite: (entityType: string, entityId: number, userId: string = 'default_user') =>
    api.get(`/favorites/check/${entityType}/${entityId}`, { params: { user_id: userId } }),
};