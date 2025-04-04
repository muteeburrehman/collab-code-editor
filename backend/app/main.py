from fastapi import FastAPI
from .db import Base, engine
from .routers import user, document, login
from fastapi.middleware.cors import CORSMiddleware

# Creating all database tables
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Code Sharing API")


# Configure CORS
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Don't use "*" here with credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(user.router)
app.include_router(document.router)
app.include_router(login.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI + WAMP Backend!"}