import uvicorn
from fastapi import FastAPI
from app.db import Base, engine
from app.routers import user, document, login
from fastapi.middleware.cors import CORSMiddleware

# Creating all database tables
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Code Sharing API")


# Configure CORS
origins = ["http://localhost:3000"]

# In your main.py file
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to the browser
    max_age=600,  # Cache preflight requests for 10 minutes
)
app.include_router(user.router)
app.include_router(document.router)
app.include_router(login.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI + WAMP Backend!"}

def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()