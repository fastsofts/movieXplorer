from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime


class GenreBase(BaseModel):
    name: str
    description: Optional[str] = None


class GenreCreate(GenreBase):
    pass


class GenreResponse(GenreBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActorBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    biography: Optional[str] = None
    photo_url: Optional[str] = None
    nationality: Optional[str] = None


class ActorCreate(ActorBase):
    pass


class ActorListItem(BaseModel):
    id: int
    name: str
    birth_date: Optional[date] = None
    nationality: Optional[str] = None
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ActorDetailResponse(ActorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActorListResponse(BaseModel):
    items: List[ActorListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class DirectorBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    biography: Optional[str] = None
    photo_url: Optional[str] = None
    nationality: Optional[str] = None


class DirectorCreate(DirectorBase):
    pass


class DirectorListItem(BaseModel):
    id: int
    name: str
    birth_date: Optional[date] = None
    nationality: Optional[str] = None
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DirectorDetailResponse(DirectorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DirectorListResponse(BaseModel):
    items: List[DirectorListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class MovieBase(BaseModel):
    title: str
    release_year: int
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    rating: Optional[float] = None
    poster_url: Optional[str] = None
    director_id: Optional[int] = None


class MovieCreate(MovieBase):
    genre_ids: Optional[List[int]] = None
    actor_ids: Optional[List[int]] = None


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    rating: Optional[float] = None
    poster_url: Optional[str] = None
    director_id: Optional[int] = None
    genre_ids: Optional[List[int]] = None
    actor_ids: Optional[List[int]] = None


class MovieListItem(BaseModel):
    id: int
    title: str
    release_year: int
    rating: Optional[float] = None
    poster_url: Optional[str] = None
    duration_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class MovieDetailResponse(MovieBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MovieListResponse(BaseModel):
    items: List[MovieListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReviewBase(BaseModel):
    movie_id: int
    reviewer_name: str
    rating: float
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
