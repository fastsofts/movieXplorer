# MovieXplorer - Full-Stack Movie Explorer Platform

A complete microservices-based movie exploration platform with dual frontend implementations (Vite and Next.js).

##  Features

### Frontend Features (Both Vite & Next.js)
- **Fixed Header & Footer** - Page content scrolls only in the middle section
- **Movies Page** with pagination toggle (OFF/ON)
  - Scroll mode (default) and pagination mode
  - Page size selector: 5, 10, 20, 25
  - Previous/Next navigation
  - Filters: Search, Genre, Year, Rating, Director, Actor
  - Compact movie cards with: Poster, Title, Rating, Year, Genre
- **Actors Page** with similar pagination and filtering
- **Directors Page** with pagination and filtering
- **Favourites Page**
   - Setting Movie, Director, Actor as favorite
   - Has separate page for each
- **Relationship Navigation**
  - Click movie → View actors
  - Click actor → View directors
  - Click director → View actors
  - Filtered cross-navigation
- **Force Diagram Visualization**
  - Canvas-based D3.js visualization
  - Movie → Actors → Directors relationships
  - Interactive: Click, Drag, Zoom, Collapse/Expand
  - Shows relationship network

### Backend Features
- **Microservices Architecture**
  - API Gateway for routing
  - Movie Service
  - Actor Service
  - Director Service
  - Favorite Service
  - Genre Service
  - Review Service
- **PostgreSQL Database** with seed data
- **RESTful APIs** with pagination
- **Relationship Endpoints** for navigation
- **Docker Compose** for orchestration

##  Quick Start

### Prerequisites
- Docker & Docker Compose
- Ports available: 3000, 5173, 8000-8005, 5432

### Start the Application

```bash
docker-compose up --build
```

### Access the Applications

- **Vite Frontend**: http://localhost:5173
- **Next.js Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **PostgreSQL**: localhost:5432

## Project Structure

```
moviexplorer/
├── backend/
│   ├── services/
│   │   ├── api_gateway/     # Central routing
│   │   ├── movie_service/   # Movie operations
│   │   ├── actor_service/   # Actor operations
│   │   ├── director_service/# Director operations
│   │   ├── favorite_service/# Favorite operations
│   │   ├── genre_service/   # Genre operations
│   │   └── review_service/  # Review operations
│   ├── shared/
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database config
│   │   └── utils.py         # Utilities
│   ├── database/
│   │   ├── init.sql         # Database schema
│   │   └── seed.sql         # Sample data
│   └── requirements.txt     # Python dependencies
├── frontend-vite/           # Complete Vite implementation
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # All pages
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
├── frontend-nextjs/         # Next.js implementation
│   ├── app/                 # App router pages
│   ├── components/          # Components
│   ├── lib/                 # API services
│   ├── types/               # TypeScript types
│   └── package.json
├── docker/                  # Dockerfiles
│   ├── Dockerfile.service   # Backend services
│   ├── Dockerfile.vite      # Vite frontend
│   └── Dockerfile.nextjs    # Next.js frontend
└── docker-compose.yml       # Orchestration

```

##  Development

### Backend Development

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run individual service
cd backend/services/movie_service
uvicorn main:app --reload --port 8001
```

### Frontend Development (Vite)

```bash
cd frontend-vite
npm install
npm run dev
```

### Frontend Development (Next.js)

```bash
cd frontend-nextjs
npm install
npm run dev
```

## API Endpoints

### Movies
- `GET /movies` - List movies (paginated, filterable)
- `GET /movies/{id}` - Get movie details
- `GET /movies/{id}/actors` - Get movie actors
- `GET /movies/{id}/director` - Get movie director

### Actors
- `GET /actors` - List actors (paginated, filterable)
- `GET /actors/{id}` - Get actor details
- `GET /actors/{id}/movies` - Get actor movies
- `GET /actors/{id}/directors` - Get directors actor worked with

### Directors
- `GET /directors` - List directors (paginated, filterable)
- `GET /directors/{id}` - Get director details
- `GET /directors/{id}/movies` - Get director movies
- `GET /directors/{id}/actors` - Get actors director worked with

### Favoites
- `GET /favorites` - List favorites (paginated, filterable) and as well as add favorite
- `GET /favorites/{entity_type}/{entity_id}` - Get favorite details based on entity - movie/director/actor
- `GET /favorites/check/{entity_type}/{entity_id}"` - Check whether it is in favorite

### Relationships
- `GET /api/relationships` - Get full relationship graph for force diagram

### Genres
- `GET /genres` - List all genres

## Features Breakdown

### Pagination System
- **Default OFF**: Scroll through all results using lazy load loads further results.
- **When ON**: 
  - Select page size (5, 10, 20, 25)
  - Navigate with Previous/Next buttons
  - Current page indicator
  - Total count display

### Relationship Navigation
1. **Movies Page** → Click movie → View actors
2. **Actors Page** → Click actor → View directors worked with
3. **Directors Page** → Click director → View actors
4. **Cross-filtering**: Director page with actor filter, etc.

### Force Diagram
- D3.js canvas-based visualization
- Node types: Root, Movies, Actors, Directors
- Interactions:
  - Click: View node details
  - Double-click: Collapse/Expand children
  - Drag: Move nodes
  - Scroll: Zoom in/out
- Color-coded by type

##  Technologies

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Pydantic (Data validation)
- Uvicorn (ASGI server)

### Frontend (Vite)
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS
- Axios (HTTP client)
- D3.js (Visualizations)
- Lucide React (Icons)
- React Router (Routing)

### Frontend (Next.js)
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios
- D3.js
- Lucide React

### DevOps
- Docker & Docker Compose
- Multi-container orchestration
- Health checks
- Volume persistence

##  Environment Variables

### Backend Services
```env
DATABASE_URL=postgresql://movieuser:moviepass@postgres:5432/moviedb
MOVIE_SERVICE_URL=http://movie_service:8001
ACTOR_SERVICE_URL=http://actor_service:8002
DIRECTOR_SERVICE_URL=http://director_service:8003
GENRE_SERVICE_URL=http://genre_service:8004
REVIEW_SERVICE_URL=http://review_service:8005
```

### Frontend
```env
# Vite
VITE_API_URL=http://localhost:8000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
```

##  Testing

The application includes:
- 10000 sample movies
- 5000 sample actors
- 5000 sample directors
- 15+ genres
- Complete relationships

##  Production Considerations

For production deployment:

1. **Security**
   - Use environment variables for sensitive data
   - Implement authentication/authorization
   - Enable CORS properly
   - Use HTTPS

2. **Performance**
   - Enable caching
   - Optimize database queries
   - Use CDN for static assets
   - Implement rate limiting

3. **Monitoring**
   - Add logging
   - Implement health checks
   - Monitor service health
   - Track errors

##  License

This project is provided as-is for assessment purposes.

## 👥 Support

For issues or questions, please refer to the documentation in each service directory.

---

Built with  using modern web technologies
