from sqlalchemy import (
    Column, Integer, String, Text, Float, ForeignKey,
    Table, DateTime, Date, CheckConstraint, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


movie_genre = Table(
    "movie_genre",
    Base.metadata,
    Column("movie_id", Integer, ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", Integer, ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, server_default=func.now()),
)


movie_actor = Table(
    "movie_actor",
    Base.metadata,
    Column("movie_id", Integer, ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("actor_id", Integer, ForeignKey("actors.id", ondelete="CASCADE"), primary_key=True),
    Column("role", String(200)),
    Column("created_at", DateTime, server_default=func.now()),
)


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    release_year = Column(Integer, nullable=False, index=True)
    description = Column(Text)
    duration_minutes = Column(Integer)
    rating = Column(Float, default=0.0)
    poster_url = Column(String(500))
    director_id = Column(Integer, ForeignKey("directors.id", ondelete="SET NULL"), index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    director = relationship("Director", back_populates="movies", passive_deletes=True)
    actors = relationship("Actor", secondary=movie_actor, back_populates="movies", passive_deletes=True)
    genres = relationship("Genre", secondary=movie_genre, back_populates="movies", passive_deletes=True)
    reviews = relationship(
        "Review",
        back_populates="movie",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    birth_date = Column(Date)
    biography = Column(Text)
    photo_url = Column(String(500))
    nationality = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    movies = relationship("Movie", secondary=movie_actor, back_populates="actors", passive_deletes=True)


class Director(Base):
    __tablename__ = "directors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    birth_date = Column(Date)
    biography = Column(Text)
    photo_url = Column(String(500))
    nationality = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    movies = relationship("Movie", back_populates="director", passive_deletes=True)


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    movies = relationship("Movie", secondary=movie_genre, back_populates="genres", passive_deletes=True)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_name = Column(String(255), nullable=False)
    rating = Column(Float, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 10", name="rating_range"),
    )

    movie = relationship("Movie", back_populates="reviews", passive_deletes=True)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    user_id = Column(String(255), default="default_user")
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("entity_type IN ('movie', 'actor', 'director')", name="entity_type_check"),
    )
