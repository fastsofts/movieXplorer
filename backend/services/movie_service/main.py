from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from shared.models import Movie, Director, Actor, Genre
from shared.database import get_db, init_db
from shared.utils import paginate, timing_decorator, cache_manager

init_db()

app = FastAPI(title="Movie Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_director_photo_fallback(director):
    """Get director photo with fallback"""
    if not director:
        return None
    if director.photo_url:
        return director.photo_url
    # Generate fallback avatar
    name = director.name.replace(' ', '+')
    return f"https://ui-avatars.com/api/?name={name}&size=200&background=4A5568&color=fff"

def get_poster_fallback(movie):
    """Get poster URL with fallback"""
    if movie.poster_url:
        return movie.poster_url
    # Generate fallback poster
    title_short = movie.title[:25] if movie.title else "Movie"
    return f"https://placehold.co/300x450/1A202C/FFFFFF?text={title_short.replace(' ', '+')}"




@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "movie_service"}


@app.get("/movies")
@app.get("/movies/")
@timing_decorator
async def get_movies(
    genre: Optional[str] = Query(None),
    director: Optional[str] = Query(None),
    director_id: Optional[int] = Query(None),
    actor: Optional[str] = Query(None),
    actor_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0.0, le=10.0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cache_key = f"movies:{genre}:{director}:{director_id}:{actor}:{actor_id}:{year}:{search}:{min_rating}:{page}:{page_size}"
    cached = cache_manager.get(cache_key)
    if cached:
        return cached

    query = db.query(Movie).options(
        joinedload(Movie.genres),
        joinedload(Movie.director),
        joinedload(Movie.actors)
    )

    if genre:
        query = query.join(Movie.genres).filter(Genre.name.ilike(f"%{genre}%"))
    if director:
        query = query.join(Movie.director).filter(Director.name.ilike(f"%{director}%"))
    if director_id:
        query = query.filter(Movie.director_id == director_id)
    if actor:
        query = query.join(Movie.actors).filter(Actor.name.ilike(f"%{actor}%"))
    if actor_id:
        query = query.join(Movie.actors).filter(Actor.id == actor_id)
    if year:
        query = query.filter(Movie.release_year == year)
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    if min_rating is not None:
        query = query.filter(Movie.rating >= min_rating)

    result = paginate(query.distinct(), page, page_size)
    
    result["items"] = [
        {
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_year": movie.release_year,
            "duration_minutes": movie.duration_minutes,
            "rating": float(movie.rating) if movie.rating else 0.0,
            "poster_url":  get_poster_fallback(movie),
            "director_id": movie.director_id,
            "director": {
                "id": movie.director.id,
                "name": movie.director.name,
                "photo_url": get_director_photo_fallback(movie.director)                
            } if movie.director else None,
            "genres": [{"id": g.id, "name": g.name} for g in movie.genres],
            "actors": [{"id": a.id, "name": a.name} for a in movie.actors],
        }
        for movie in result["items"]
    ]
    
    cache_manager.set(cache_key, result, ttl=300)
    return result


@app.get("/movies/{movie_id}")
@timing_decorator
async def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).options(
        joinedload(Movie.genres),
        joinedload(Movie.director),
        joinedload(Movie.actors)
    ).filter(Movie.id == movie_id).first()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    return {
        "id": movie.id,
        "title": movie.title,
        "description": movie.description,
        "release_year": movie.release_year,
        "duration_minutes": movie.duration_minutes,
        "rating": float(movie.rating) if movie.rating else 0.0,
        "poster_url": get_poster_fallback(movie),
        "director_id": movie.director_id,
        "director": {
            "id": movie.director.id,
            "name": movie.director.name,
            "photo_url": movie.director.photo_url,
            "nationality": movie.director.nationality,
        } if movie.director else None,
        "genres": [{"id": g.id, "name": g.name} for g in movie.genres],
        "actors": [
            {
                "id": a.id,
                "name": a.name,
                "photo_url": get_director_photo_fallback(a),
                "nationality": a.nationality,
            }
            for a in movie.actors
        ],
    }


@app.get("/movies/{movie_id}/actors")
@timing_decorator
async def get_movie_actors(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).options(joinedload(Movie.actors)).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    return {
        "movie_id": movie_id,
        "movie_title": movie.title,
        "actors": [
            {
                "id": actor.id,
                "name": actor.name,
                "photo_url": get_director_photo_fallback(actor),
                "nationality": actor.nationality,
                "birth_date": actor.birth_date.isoformat() if actor.birth_date else None,
            }
            for actor in movie.actors
        ]
    }


@app.get("/movies/{movie_id}/director")
@timing_decorator
async def get_movie_director(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).options(joinedload(Movie.director)).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if not movie.director:
        return {"movie_id": movie_id, "movie_title": movie.title, "director": None}

    return {
        "movie_id": movie_id,
        "movie_title": movie.title,
        "director": {
            "id": movie.director.id,
            "name": movie.director.name,
            "photo_url": get_director_photo_fallback(movie.director),
            "nationality": movie.director.nationality,
            "birth_date": movie.director.birth_date.isoformat() if movie.director.birth_date else None,
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
