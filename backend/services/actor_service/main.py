from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from shared.models import Actor, Movie, Genre, Director
from shared.database import get_db, init_db
from shared.utils import paginate, timing_decorator, cache_manager

init_db()

app = FastAPI(title="Actor Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "actor_service"}


@app.get("/actors")
@timing_decorator
async def get_actors(
    movie: Optional[str] = Query(None),
    movie_id: Optional[int] = Query(None),
    genre: Optional[str] = Query(None),
    director_id: Optional[int] = Query(None),
    nationality: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cache_key = f"actors:{movie}:{movie_id}:{genre}:{director_id}:{nationality}:{search}:{page}:{page_size}"
    cached = cache_manager.get(cache_key)
    if cached:
        return cached

    query = db.query(Actor).options(joinedload(Actor.movies))

    if movie:
        query = query.join(Actor.movies).filter(Movie.title.ilike(f"%{movie}%"))
    if movie_id:
        query = query.join(Actor.movies).filter(Movie.id == movie_id)
    if genre:
        query = query.join(Actor.movies).join(Movie.genres).filter(Genre.name.ilike(f"%{genre}%"))
    if director_id:
        query = query.join(Actor.movies).filter(Movie.director_id == director_id)
    if nationality:
        query = query.filter(Actor.nationality.ilike(f"%{nationality}%"))
    if search:
        query = query.filter(Actor.name.ilike(f"%{search}%"))

    query = query.distinct()
    result = paginate(query, page, page_size)

    result["items"] = [
        {
            "id": actor.id,
            "name": actor.name,
            "biography": actor.biography,
            "birth_date": actor.birth_date.isoformat() if actor.birth_date else None,
            "nationality": actor.nationality,
            "photo_url": actor.photo_url,
        }
        for actor in result["items"]
    ]

    cache_manager.set(cache_key, result, ttl=300)
    return result


@app.get("/actors/{actor_id}")
@timing_decorator
async def get_actor(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).options(joinedload(Actor.movies)).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    return {
        "id": actor.id,
        "name": actor.name,
        "biography": actor.biography,
        "birth_date": actor.birth_date.isoformat() if actor.birth_date else None,
        "nationality": actor.nationality,
        "photo_url": actor.photo_url,
        "movies": [
            {
                "id": m.id,
                "title": m.title,
                "release_year": m.release_year,
                "poster_url": m.poster_url,
            }
            for m in actor.movies
        ],
    }


@app.get("/actors/{actor_id}/movies")
@timing_decorator
async def get_actor_movies(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).options(joinedload(Actor.movies)).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")

    return {
        "actor_id": actor_id,
        "actor_name": actor.name,
        "movies": [
            {
                "id": movie.id,
                "title": movie.title,
                "release_year": movie.release_year,
                "rating": float(movie.rating) if movie.rating else 0.0,
                "poster_url": movie.poster_url,
                "director_id": movie.director_id,
            }
            for movie in actor.movies
        ]
    }


@app.get("/actors/{actor_id}/directors")
@timing_decorator
async def get_actor_directors(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).options(
        joinedload(Actor.movies).joinedload(Movie.director)
    ).filter(Actor.id == actor_id).first()
    
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")

    directors_map = {}
    for movie in actor.movies:
        if movie.director and movie.director.id not in directors_map:
            directors_map[movie.director.id] = {
                "id": movie.director.id,
                "name": movie.director.name,
                "photo_url": movie.director.photo_url,
                "nationality": movie.director.nationality,
                "birth_date": movie.director.birth_date.isoformat() if movie.director.birth_date else None,
                "movie_count": 0,
            }
        if movie.director:
            directors_map[movie.director.id]["movie_count"] += 1

    return {
        "actor_id": actor_id,
        "actor_name": actor.name,
        "directors": list(directors_map.values())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
