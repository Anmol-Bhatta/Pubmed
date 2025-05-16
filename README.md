# India-Affiliated PubMed Article Summarizer

A full-stack application that fetches India-affiliated PubMed articles, summarizes abstracts using AI, and displays results in a user-friendly interface.

## Tech Stack
- **Backend**: Python/Flask
- **Frontend**: React.js + Material-UI
- **Database**: SQLite
- **APIs**: NCBI PubMed E-Utilities
- **AI Model**: facebook/bart-large-cnn (HuggingFace Transformers)

## Prerequisites
- Python 3.9+
- Node.js 16+
- npm 8+
- Git

## Setup Instructions

### 1. Clone Repository
```bash
git clone git@github.com:mugglesharkbait/ResearchLens.git
cd ResearchLens
```
### 2. Backend Setup

```
cd backend
```

# Create and activate virtual environment
```
python -m venv venv
source venv/bin/activate  # Linux/MacOS
venv\Scripts\activate  # Windows
```

# Install dependencies
```
pip install -r requirements.txt
```

# Environment Variables
```
export FLASK_APP=app.py
export FLASK_DEBUG=1  # Development mode
```

# Initialize SQLite database
```
python -c "from cache_manager import init_db; init_db()"
```

# Run Flask server
```
flask run --port=5000
```

### 3. Frontend Setup
```
cd frontend
```

# Install dependencies
```
npm install
```

# Start React development server
```
npm run dev
```