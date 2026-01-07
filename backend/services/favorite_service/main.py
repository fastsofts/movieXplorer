from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from shared.models import Favorite, Movie, Actor, Director
from shared.database import get_db, init_db
from shared.utils import timing_decorator

init_db()

app = FastAPI(title="Favorite Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FavoriteCreate(BaseModel):
    entity_type: str
    entity_id: int
    user_id: str = "default_user"


class FavoriteResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    user_id: str
    created_at: str


def get_poster_fallback(movie):
    """Get poster URL with fallback"""
    if movie.poster_url:
        return movie.poster_url
    title_short = movie.title[:25] if movie.title else "Movie"
    return f"https://placehold.co/300x450/1A202C/FFFFFF?text={title_short.replace(' ', '+')}"


def get_photo_fallback(person):
    """Get photo with fallback"""
    if not person:
        return None
    if person.photo_url:
        return person.photo_url
    name = person.name.replace(' ', '+')
    return f"https://ui-avatars.com/api/?name={name}&size=200&background=4A5568&color=fff"


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "favorite_service"}

@app.post("/favorites/")
@app.post("/favorites")
@timing_decorator
async def add_favorite(favorite: FavoriteCreate, db: Session = Depends(get_db)):
    """Add an item to favorites"""
    if favorite.entity_type not in ['movie', 'actor', 'director']:
        raise HTTPException(status_code=400, detail="Invalid entity_type")
    
    # Check if entity exists
    if favorite.entity_type == 'movie':
        entity = db.query(Movie).filter(Movie.id == favorite.entity_id).first()
    elif favorite.entity_type == 'actor':
        entity = db.query(Actor).filter(Actor.id == favorite.entity_id).first()
    else:
        entity = db.query(Director).filter(Director.id == favorite.entity_id).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"{favorite.entity_type.capitalize()} not found")
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.entity_type == favorite.entity_type,
        Favorite.entity_id == favorite.entity_id,
        Favorite.user_id == favorite.user_id
    ).first()
    
    if existing:
        return {
            "id": existing.id,
            "entity_type": existing.entity_type,
            "entity_id": existing.entity_id,
            "user_id": existing.user_id,
            "created_at": existing.created_at.isoformat(),
            "message": "Already in favorites"
        }
    
    # Create favorite
    new_favorite = Favorite(
        entity_type=favorite.entity_type,
        entity_id=favorite.entity_id,
        user_id=favorite.user_id
    )
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return {
        "id": new_favorite.id,
        "entity_type": new_favorite.entity_type,
        "entity_id": new_favorite.entity_id,
        "user_id": new_favorite.user_id,
        "created_at": new_favorite.created_at.isoformat()
    }


@app.delete("/favorites/{entity_type}/{entity_id}")
@timing_decorator
async def remove_favorite(
    entity_type: str,
    entity_id: int,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    """Remove an item from favorites"""
    if entity_type not in ['movie', 'actor', 'director']:
        raise HTTPException(status_code=400, detail="Invalid entity_type")
    
    favorite = db.query(Favorite).filter(
        Favorite.entity_type == entity_type,
        Favorite.entity_id == entity_id,
        Favorite.user_id == user_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Removed from favorites"}


@app.get("/favorites")
@timing_decorator
async def get_favorites(
    user_id: str = "default_user",
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all favorites for a user, optionally filtered by entity_type"""
    query = db.query(Favorite).filter(Favorite.user_id == user_id)
    
    if entity_type:
        if entity_type not in ['movie', 'actor', 'director']:
            raise HTTPException(status_code=400, detail="Invalid entity_type")
        query = query.filter(Favorite.entity_type == entity_type)
    
    favorites = query.all()
    
    result = {
        "movies": [],
        "actors": [],
        "directors": []
    }
    
    for fav in favorites:
        if fav.entity_type == 'movie':
            movie = db.query(Movie).filter(Movie.id == fav.entity_id).first()
            if movie:
                result["movies"].append({
                    "id": movie.id,
                    "title": movie.title,
                    "release_year": movie.release_year,
                    "rating": float(movie.rating) if movie.rating else 0.0,
                    "poster_url": get_poster_fallback(movie),
                    "favorite_id": fav.id
                })
        elif fav.entity_type == 'actor':
            actor = db.query(Actor).filter(Actor.id == fav.entity_id).first()
            if actor:
                result["actors"].append({
                    "id": actor.id,
                    "name": actor.name,
                    "nationality": actor.nationality,
                    "photo_url": get_photo_fallback(actor),
                    "favorite_id": fav.id
                })
        else:
            director = db.query(Director).filter(Director.id == fav.entity_id).first()
            if director:
                result["directors"].append({
                    "id": director.id,
                    "name": director.name,
                    "nationality": director.nationality,
                    "photo_url": get_photo_fallback(director),
                    "favorite_id": fav.id
                })
    
    return result


@app.get("/favorites/check/{entity_type}/{entity_id}")
@timing_decorator
async def check_favorite(
    entity_type: str,
    entity_id: int,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    """Check if an item is favorited"""
    if entity_type not in ['movie', 'actor', 'director']:
        raise HTTPException(status_code=400, detail="Invalid entity_type")
    
    favorite = db.query(Favorite).filter(
        Favorite.entity_type == entity_type,
        Favorite.entity_id == entity_id,
        Favorite.user_id == user_id
    ).first()
    
    return {
        "is_favorite": favorite is not None,
        "favorite_id": favorite.id if favorite else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
