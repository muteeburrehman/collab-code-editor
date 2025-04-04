from fastapi import FastAPI
from .db import Base, engine
from .routers import user, document

# Creating all database tables
Base.metadata.create_all(bind=engine)
app = FastAPI()

app.include_router(user.router)
app.include_router(document.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI + WAMP Backend!"}