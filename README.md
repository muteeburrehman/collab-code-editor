# 👨‍💻 Collaborative Code Editor

## Overview
**Collaborative Code Editor** is a real-time code-sharing platform that allows multiple users to collaboratively write and edit code in their favorite programming languages. The project is designed to explore and demonstrate the power of **WAMP (Web Application Messaging Protocol)** with **Crossbar** and **Autobahn**, while combining **FastAPI** for backend APIs and **Next.js** for a responsive frontend interface.

> ✨ This project is built as a learning tool to understand how real-time collaborative systems can be architected using WAMP and modern full-stack technologies.

---

## 🛠️ Technologies Used

- **Frontend:** Next.js (React)
- **Backend:** FastAPI
- **Real-Time Communication:** Autobahn + Crossbar (WAMP Protocol)
- **WebSocket Transport:** Crossbar Router
- **Editor:** Monaco / CodeMirror
- **Database:** SQLite (`code_editor.db`)

---

## ⚙️ Prerequisites

- Python 3.10+
- Node.js 20+
- pip
- npm
- [Crossbar](https://crossbar.io/) (Install via `pip install crossbar`)

---

## 📁 Project Structure

```bash
collaborative-code-editor/
│
├── backend/                        # FastAPI backend and WAMP server
│   ├── app/                        # Core backend logic
│   │   ├── models/                 # SQLAlchemy models
│   │   ├── routers/                # API routes
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── services/               # Business logic
│   │   ├── config.py               # App settings and environment
│   │   ├── db.py                   # DB connection setup
│   │   └── wamp_server.py          # Autobahn WAMP server integration
│   │
│   ├── code_editor.db              # SQLite database file
│   ├── config.json                 # Crossbar WAMP router config
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                        # Backend environment variables
│   └── venv/                       # Python virtual environment
│
└── frontend/                       # Next.js frontend
    ├── components/                 # UI components
    ├── pages/                      # App pages
    ├── services/                   # API and socket clients
    ├── styles/                     # CSS modules and styles
    ├── .env.local                  # Frontend environment variables
    ├── package.json
    └── next.config.js
```
## 🚀 Getting Started
### 🔧 Backend Setup (FastAPI + Crossbar)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
## 🔐 Environment Variables
### Create a .env file in backend/:

```DATABASE_URL=sqlite:///./code_editor.db
# Database Configuration (Choose one)
DATABASE_URL=postgresql://user:password@localhost/dbname
DATABASE_URL=mysql+pymysql://user:password@localhost/dbname

# WAMP (Crossbar) Server Configuration
WAMP_URL=ws://localhost:8080/ws
WAMP_REALM=realm1

# JWT Authentication Settings
SECRET_KEY='your secret kay'
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Debug Mode
DEBUG=True
```
# 🖥️ Frontend Setup (Next.js)
```bash
cd frontend
npm install
```
## 🔐 Environment Variables
### Create .env.local in frontend/:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WAMP_URL=ws://localhost:8080/ws
NEXT_PUBLIC_WAMP_REALM=realm1
```
### Start the frontend dev server:
```bash
npm run dev
```
# 🌐 Crossbar Configuration (backend/config.json)
```
{
  "$schema": "https://raw.githubusercontent.com/crossbario/crossbar/master/crossbar.json",
  "version": 2,
  "controller": {},
  "workers": [
    {
      "type": "router",
      "realms": [
        {
          "name": "realm1",
          "roles": [
            {
              "name": "anonymous",
              "permissions": [
                {
                  "uri": "code.",
                  "match": "prefix",
                  "allow": {
                    "publish": true,
                    "subscribe": true,
                    "call": true,
                    "register": true
                  }
                },
                {
                  "uri": "",
                  "allow": {
                    "publish": true,
                    "subscribe": true,
                    "call": true,
                    "register": true
                  }
                }
              ]
            }
          ]
        }
      ],
      "transports": [
        {
          "type": "web",
          "endpoint": {
            "type": "tcp",
            "port": 8080
          },
          "paths": {
            "ws": {
              "type": "websocket"
            }
          }
        }
      ]
    }
  ]
}
```
### 🔑 Key Features
- 🧑‍🤝‍🧑 Collaborate in real-time with other users
- 🧠 Live syncing via WAMP pub/sub
- ⌨️ Syntax-highlighted code editor
- 🌐 Backend APIs for session and user logic
- 💾 Local SQLite DB setup
- 🧪 Modular and testable codebase

### 💡 Future Enhancements
- Chat system between collaborators
- Docker support for unified deployment
- UI/UX Enhancements

### 🤝 Contributing
- Fork the repository
- Create a new feature branch
- Commit your changes
- Push and create a pull request

## 📦 Clone the Repository
```bash
git clone git@github.com:muteeburrehman/collab-code-editor.git
cd collab-code-editor
```