from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
import httpx
import os
import logging
import asyncio

from shared.database import get_db
from shared.models import Movie, Actor, Director

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# APP
# =========================================================
app = FastAPI(
    title="Movie Explorer API Gateway",
    description="Central API Gateway for all microservices",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# =========================================================
# CORS
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# SERVICE REGISTRY
# =========================================================
SERVICES = {
    "movies": os.getenv("MOVIE_SERVICE_URL", "http://movie_service:8001"),
    "actors": os.getenv("ACTOR_SERVICE_URL", "http://actor_service:8002"),
    "directors": os.getenv("DIRECTOR_SERVICE_URL", "http://director_service:8003"),
    "genres": os.getenv("GENRE_SERVICE_URL", "http://genre_service:8004"),
    "reviews": os.getenv("REVIEW_SERVICE_URL", "http://review_service:8005"),
    "favorites": os.getenv("FAVORITE_SERVICE_URL", "http://favorite_service:8006"),
}

# =========================================================
# HTTP CLIENT
# =========================================================
http_client = httpx.AsyncClient(
    timeout=30.0,
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
)

# =========================================================
# GRAPH HELPERS (CRITICAL)
# =========================================================
def node_id(entity: str, entity_id: int) -> str:
    return f"{entity}-{entity_id}"


def dedupe_nodes(nodes):
    seen = {}
    for n in nodes:
        seen[n["id"]] = n
    return list(seen.values())


def dedupe_links(links):
    seen = set()
    unique = []
    for l in links:
        key = (l["source"], l["target"], l["type"])
        if key not in seen:
            seen.add(key)
            unique.append(l)
    return unique


def validate_links(nodes, links):
    node_ids = {n["id"] for n in nodes}
    valid = []
    for l in links:
        if l["source"] in node_ids and l["target"] in node_ids:
            valid.append(l)
        else:
            logger.warning(
                "Dropping invalid link: %s -> %s", l["source"], l["target"]
            )
    return valid


# =========================================================
# HEALTH
# =========================================================
@app.get("/health")
async def health_check():
    async def check(name, url):
        try:
            r = await http_client.get(f"{url}/health", timeout=5)
            return name, {"status": "healthy"}
        except Exception as e:
            return name, {"status": "unreachable", "error": str(e)}

    results = await asyncio.gather(
        *(check(name, url) for name, url in SERVICES.items())
    )

    return {"services": dict(results)}

# =========================================================
# RELATIONSHIP GRAPH (FULLY FIXED)
# =========================================================
@app.get("/api/relationships")
async def get_relationships(
    level: int = 2,
    expand: str | None = None,
    db: Session = Depends(get_db),
):
    """
    level=1  -> root → movies
    level=2  -> movies → actors + directors
    expand   -> expand only one movie node (progressive)
    """

    nodes = []
    links = []

    # ---------------- ROOT ----------------
    nodes.append({
        "id": "root",
        "name": "Movie Database",
        "type": "root",
        "size": 50,
    })

    # ---------------- MOVIES ----------------
    movies = db.query(Movie).limit(100).all()

    for movie in movies:
        mid = node_id("movie", movie.id)

        nodes.append({
            "id": mid,
            "name": movie.title,
            "type": "movie",
            "size": 22,
            "parent": "root",
            "details": {
                "year": movie.release_year,
                "rating": float(movie.rating or 0),
            },
        })

        links.append({
            "source": "root",
            "target": mid,
            "type": "contains",
        })

        # Progressive expansion
        if level < 2 and expand != mid:
            continue

        # ---------------- DIRECTOR ----------------
        if movie.director:
            did = node_id("director", movie.director.id)

            nodes.append({
                "id": did,
                "name": movie.director.name,
                "type": "director",
                "size": 18,
                "parent": mid,
                "details": {
                    "nationality": movie.director.nationality,
                },
            })

            links.append({
                "source": mid,
                "target": did,
                "type": "directed_by",
            })

        # ---------------- ACTORS ----------------
        for actor in movie.actors:
            aid = node_id("actor", actor.id)

            nodes.append({
                "id": aid,
                "name": actor.name,
                "type": "actor",
                "size": 15,
                "parent": mid,
                "details": {
                    "nationality": actor.nationality,
                },
            })

            links.append({
                "source": mid,
                "target": aid,
                "type": "features",
            })

    # ---------------- FINAL SANITIZATION ----------------
    nodes = dedupe_nodes(nodes)
    links = dedupe_links(links)
    links = validate_links(nodes, links)

    return {
        "nodes": nodes,
        "links": links,
    }

# =========================================================
# REQUEST FORWARDER
# =========================================================
async def forward_request(service_url: str, path: str, request: Request) -> Response:
    url = f"{service_url}{path}"
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    resp = await http_client.request(
        method=request.method,
        url=url,
        params=request.query_params,
        content=body,
        headers=headers,
    )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
        media_type=resp.headers.get("content-type"),
    )

# =========================================================
# PROXY ROUTES
# =========================================================
@app.api_route("/movies/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def movies_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["movies"], f"/movies/{path}" if path else "/movies", request
    )

@app.api_route("/actors/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def actors_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["actors"], f"/actors/{path}" if path else "/actors", request
    )

@app.api_route("/directors/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def directors_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["directors"], f"/directors/{path}" if path else "/directors", request
    )

@app.api_route("/genres/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def genres_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["genres"], f"/genres/{path}" if path else "/genres", request
    )

@app.api_route("/reviews/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def reviews_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["reviews"], f"/reviews/{path}" if path else "/reviews", request
    )

@app.api_route("/favorites/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def favorites_proxy(request: Request, path: str = ""):
    return await forward_request(
        SERVICES["favorites"], f"/favorites/{path}" if path else "/favorites", request
    )

# =========================================================
# SHUTDOWN
# =========================================================
@app.on_event("shutdown")
async def shutdown():
    await http_client.aclose()

# =========================================================
# ENTRYPOINT
# =========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
