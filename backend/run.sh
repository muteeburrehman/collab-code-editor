#!/bin/bash

# 1️⃣ Create and activate virtual environment
echo "🔧 Setting up virtual environment..."
python -m venv venv

# Activate based on OS
if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
    source venv/bin/activate
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    echo "❌ Unsupported OS for automatic virtualenv activation"
    exit 1
fi

# 2️⃣ Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 3️⃣ Database setup
echo "💾 Initializing database..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head
else
    echo "⚠️ No alembic.ini found - skipping database setup"
fi

# 4️⃣ Start services
echo "🚀 Starting services..."

# Start FastAPI in background
uvicorn app.main:app --reload &
FASTAPI_PID=$!

# Start WAMP server in background
if [ -f "app/wamp_server.py" ]; then
    crossbar start --config app/wamp_server.py &
    WAMP_PID=$!
else
    echo "⚠️ No WAMP server config found - skipping"
fi

# Trap CTRL+C to clean up
trap "echo '🛑 Shutting down...'; kill $FASTAPI_PID $WAMP_PID; deactivate" SIGINT

echo "✅ Services running! Press CTRL+C to stop"
wait