# Sahayata – Student mental health lifeline

A simple, trustworthy multi‑page site with a minimal Node backend (no packages) that talks to MongoDB Atlas via the Data API.

## Structure

- `index.html` – Landing page
- `pages/section-*.html` – Content pages mapped from content.txt sections
- `assets/css/style.css` – Minimal UI theme
- `assets/js/main.js` – Small interactions
- `backend/server.js` – No‑deps Node server using MongoDB Atlas Data API

## Run the static site
Open `index.html` directly, or serve the folder with any static server.

## Backend (no packages)
Uses only Node's built‑ins. Configure MongoDB Atlas Data API env vars (create a `backend/.env` from `backend/.env.example`):

- `DATA_API_ENDPOINT` – Use your region domain, e.g. `https://ap-south-1.aws.data.mongodb-api.com/app/<app-id>/endpoint/data/v1/`
- `DATA_API_KEY` – Your Data API key
- `DATA_API_DATABASE` – Your database name
- `DATA_API_COLLECTION` – Collection name (default `notes`)
- `DATA_API_DATASOURCE` – Data source/cluster name (default `mongodb-atlas`)

### Start
In a terminal from `backend/`:

```bash
# copy example env and edit values
cp backend/.env.example backend/.env
# edit backend/.env and set DATA_API_ENDPOINT, DATA_API_KEY, etc.

# start the server
node backend/server.js
```

## Deploy to Vercel (serverless API)
This repo includes a Vercel serverless function at `api/notes.js` that proxies to the Atlas Data API.

1) Push this project to a Git repo (GitHub/GitLab/Bitbucket).
2) In Vercel, import the repo.
3) Add Environment Variables in Vercel Project Settings (Production/Preview/Development):
		- `DATA_API_ENDPOINT` – Region-specific, e.g. https://ap-south-1.aws.data.mongodb-api.com/app/<AppID>/endpoint/data/v1/
	- `DATA_API_KEY` – your Data API key
	- `DATA_API_DATABASE` – sahayata (or your DB)
	- `DATA_API_COLLECTION` – notes (or your collection)
	- `DATA_API_DATASOURCE` – mongodb-atlas
4) Deploy. Frontend will call the relative path `/api/notes`.

Local vs Vercel
- Local backend: `node backend/server.js` and the homepage form points to localhost only if you change the URL back; by default it uses `/api/notes` which works on Vercel.
- Vercel: No extra setup beyond env vars; Data API key stays in Vercel’s env.

### Test endpoints
- `GET http://localhost:3000/api/notes` – list last 10 notes
- `POST http://localhost:3000/api/notes` – body: `{ "mood":"stressed", "note":"first check-in" }`

## Why Data API?
You asked for no packages. The official MongoDB driver requires installing a package. The Atlas Data API lets us talk to MongoDB over HTTPS with built‑in `https` module, so no installs.
