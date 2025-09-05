# Sahayata – Student mental health lifeline

A simple, trustworthy multi‑page site with a tiny backend. It now connects directly to MongoDB Atlas using the official driver (via `MONGODB_URI`).

## Structure

- `index.html` – Landing page
- `pages/section-*.html` – Content pages mapped from content.txt sections
- `assets/css/style.css` – Minimal UI theme
- `assets/js/main.js` – Small interactions
- `backend/server.js` – Minimal Node server (prefers MongoDB driver; falls back to Data API if URI not set)

## Run the static site
Open `index.html` directly, or serve the folder with any static server.

## Backend (direct MongoDB)
We use the MongoDB driver in both local and serverless environments.

Required env vars:
- `MONGODB_URI` – SRV connection string (with password URL‑encoded)
- `MONGODB_DB` – Database name (e.g., `sahayata`)

Optional:
- `MONGODB_COLLECTION` – Collection name (default `notes`)
- Legacy fallback (only if using Data API): `DATA_API_*`

### Start
In a terminal from `backend/`:

```bash
# create backend/.env and set MONGODB_URI and MONGODB_DB
# example (don’t check in real secrets):
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp
# MONGODB_DB=sahayata

# start the server (serves API on http://localhost:3000)
node backend/server.js
```

## Deploy to Vercel (serverless API)
This repo includes a Vercel serverless function at `api/notes.js` that connects directly to MongoDB.

1) Push this project to a Git repo (GitHub/GitLab/Bitbucket).
2) In Vercel, import the repo.
3) Add Environment Variables in Vercel Project Settings (Production/Preview/Development):
	- `MONGODB_URI` – your full SRV URI
	- `MONGODB_DB` – sahayata
	- (optional) `MONGODB_COLLECTION` – notes
4) Deploy. Frontend will call the relative path `/api/notes`.

Local vs Vercel
- Local static site (127.0.0.1:5500 etc.) automatically posts to `http://localhost:3000/api/notes`.
- Vercel uses the serverless function at `/api/notes`.

### Test endpoints
**Local**
- `GET http://localhost:3000/api/notes` – list last 10 notes
- `POST http://localhost:3000/api/notes` – body: `{ "mood":"stressed", "note":"first check-in" }`

**Vercel**
- `GET https://<your-domain>/api/notes`
- `POST https://<your-domain>/api/notes`

## Troubleshooting
- 401/403 on Vercel: verify `MONGODB_URI` credentials and that your Atlas user has readWrite on the DB.
- Timeouts on Vercel: ensure Atlas Network Access allows your deployment IPs (for testing, allow 0.0.0.0/0 temporarily).
- Special characters in password: URL‑encode them in `MONGODB_URI`.
- Local works but prod fails: check `/api/health` on your deployed site; it reports whether the driver can connect and counts documents.
