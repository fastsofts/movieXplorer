from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from shared.models import Director, Movie, Actor
from shared.database import get_db, init_db
from shared.utils import paginate, timing_decorator, cache_manager

init_db()

app = FastAPI(title="Director Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "director_service"}


@app.get("/directors")
@app.get("/directors/")
@timing_decorator
async def get_directors(
    actor_id: Optional[int] = Query(None),
    nationality: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cache_key = f"directors:{actor_id}:{nationality}:{search}:{page}:{page_size}"
    cached = cache_manager.get(cache_key)
    if cached:
        return cached

    query = db.query(Director).options(joinedload(Director.movies))

    if actor_id:
        query = query.join(Director.movies).join(Movie.actors).filter(Actor.id == actor_id)
    if nationality:
        query = query.filter(Director.nationality.ilike(f"%{nationality}%"))
    if search:
        query = query.filter(Director.name.ilike(f"%{search}%"))

    query = query.distinct()
    result = paginate(query, page, page_size)
    
    result["items"] = [
        {
            "id": director.id,
            "name": director.name,
            "biography": director.biography,
            "birth_date": director.birth_date.isoformat() if director.birth_date else None,
            "nationality": director.nationality,
            "photo_url": director.photo_url,
        }
        for director in result["items"]
    ]
    
    cache_manager.set(cache_key, result, ttl=300)
    return result


@app.get("/directors/{director_id}")
@timing_decorator
async def get_director(director_id: int, db: Session = Depends(get_db)):
    director = db.query(Director).options(joinedload(Director.movies)).filter(Director.id == director_id).first()
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")
    
    return {
        "id": director.id,
        "name": director.name,
        "biography": director.biography,
        "birth_date": director.birth_date.isoformat() if director.birth_date else None,
        "nationality": director.nationality,
        "photo_url": director.photo_url,
        "movies": [
            {
                "id": m.id,
                "title": m.title,
                "release_year": m.release_year,
                "poster_url": m.poster_url,
            }
            for m in director.movies
        ],
    }


@app.get("/directors/{director_id}/movies")
@timing_decorator
async def get_director_movies(
    director_id: int,
    actor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    director = db.query(Director).filter(Director.id == director_id).first()
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")

    query = db.query(Movie).filter(Movie.director_id == director_id)
    
    if actor_id:
        query = query.join(Movie.actors).filter(Actor.id == actor_id)

    movies = query.options(joinedload(Movie.genres)).distinct().all()

    return {
        "director_id": director_id,
        "director_name": director.name,
        "movies": [
            {
                "id": movie.id,
                "title": movie.title,
                "release_year": movie.release_year,
                "rating": float(movie.rating) if movie.rating else 0.0,
                "poster_url": movie.poster_url,
                "genres": [{"id": g.id, "name": g.name} for g in movie.genres],
            }
            for movie in movies
        ]
    }


@app.get("/directors/{director_id}/actors")
@timing_decorator
async def get_director_actors(director_id: int, db: Session = Depends(get_db)):
    director = db.query(Director).options(
        joinedload(Director.movies).joinedload(Movie.actors)
    ).filter(Director.id == director_id).first()
    
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")

    actors_map = {}
    for movie in director.movies:
        for actor in movie.actors:
            if actor.id not in actors_map:
                actors_map[actor.id] = {
                    "id": actor.id,
                    "name": actor.name,
                    "photo_url": actor.photo_url,
                    "nationality": actor.nationality,
                    "birth_date": actor.birth_date.isoformat() if actor.birth_date else None,
                    "movie_count": 0,
                }
            actors_map[actor.id]["movie_count"] += 1

    return {
        "director_id": director_id,
        "director_name": director.name,
        "actors": list(actors_map.values())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
