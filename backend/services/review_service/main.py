from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from shared.models import Review
from shared.database import get_db, init_db
from shared.utils import paginate, timing_decorator

init_db()

app = FastAPI(title="Review Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "review_service"}


@app.get("/reviews")
@timing_decorator
async def get_reviews(
    movie_id: int = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Review)
    
    if movie_id:
        query = query.filter(Review.movie_id == movie_id)
    
    result = paginate(query, page, page_size)
    
    result["items"] = [
        {
            "id": review.id,
            "movie_id": review.movie_id,
            "reviewer_name": review.reviewer_name,
            "rating": float(review.rating),
            "comment": review.comment,
            "created_at": review.created_at.isoformat(),
        }
        for review in result["items"]
    ]
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
