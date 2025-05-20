

---

# ResearchLens

A full-stack web application for searching, summarizing, and interacting with scientific papers from PubMed.

---

## Features

- Search PubMed for scientific papers by topic, country, and year
- Summarize abstracts using BART (or other transformer models)
- Progressive loading and real-time UI updates
- Modern React frontend with advanced filters and dark mode

---

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- (Optional) CUDA-enabled GPU for faster summarization

---

## 1. Clone the Repository

```bash
git clone https://github.com/Anmol-Bhatta/researchlens.git
cd researchlens
```

---

## 2. Backend Setup

```bash
cd backend
python -m venv venv
# Activate the virtual environment:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### (Optional) Download Model Weights in Advance

The first run will download the BART model weights (~1.5GB). You can pre-download them if you want.

---

## 3. Start the Backend Server

```bash
python app.py
```
- The backend will run on `http://localhost:5000` by default.

---

## 4. Frontend Setup

Open a new terminal window/tab:

```bash
cd frontend
npm install
```

---

## 5. Start the Frontend

```bash
npm run dev
```
- The frontend will run on `http://localhost:5173` by default.

---

## 6. Using the App

- Open your browser and go to [http://localhost:5173](http://localhost:5173)
- Search for papers, adjust filters, and view summaries in real time.

---

## 7. Configuration

- If you deploy the backend/frontend separately, update the API URL in `frontend/src/App.tsx` to point to your backend server.

---

## 8. Deployment

- **Frontend:** Deploy to Vercel, Netlify, or GitHub Pages.
- **Backend:** Deploy to Railway, Render, Heroku, or a cloud VM.

---

## 9. Troubleshooting

- If you get errors about missing packages, re-run `pip install -r requirements.txt` or `npm install`.
- For large model errors, ensure you have enough RAM/VRAM or use a smaller summarization model.

---

## 10. License

This project is licensed under the Apache 2.0 License.

---

**Enjoy using ResearchLens!**  
For questions or contributions, open an issue or pull request on GitHub.

