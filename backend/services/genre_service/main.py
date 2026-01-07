from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from shared.models import Genre
from shared.database import get_db, init_db
from shared.utils import paginate, timing_decorator

init_db()

app = FastAPI(title="Genre Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "genre_service"}


@app.get("/genres")
@app.get("/genres/")
@timing_decorator
async def get_genres(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Genre)
    
    if search:
        query = query.filter(Genre.name.ilike(f"%{search}%"))
    
    result = paginate(query, page, page_size)
    
    result["items"] = [
        {
            "id": genre.id,
            "name": genre.name,
            "description": genre.description,
        }
        for genre in result["items"]
    ]
    
    return result


@app.get("/genres/{genre_id}")
@timing_decorator
async def get_genre(genre_id: int, db: Session = Depends(get_db)):
    genre = db.query(Genre).filter(Genre.id == genre_id).first()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")
    
    return {
        "id": genre.id,
        "name": genre.name,
        "description": genre.description,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
