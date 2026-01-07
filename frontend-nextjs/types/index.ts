export interface Movie {
  id: number;
  title: string;
  description?: string;
  release_year: number;
  duration_minutes?: number;
  rating?: number;
  poster_url?: string;
  director_id?: number;
  director?: Director;
  genres?: Genre[];
  actors?: Actor[];
}

export interface Actor {
  id: number;
  name: string;
  biography?: string;
  birth_date?: string;
  nationality?: string;
  photo_url?: string;
  movie_count?: number;
}

export interface Director {
  id: number;
  name: string;
  biography?: string;
  birth_date?: string;
  nationality?: string;
  photo_url?: string;
  movie_count?: number;
}

export interface Genre {
  id: number;
  name: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'root' | 'movie' | 'actor' | 'director';
  size: number;
  details?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
