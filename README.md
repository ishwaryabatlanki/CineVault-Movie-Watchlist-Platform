# CineVault — Movie & Watchlist Platform

A polished vanilla HTML/CSS/JavaScript movie discovery and personal watchlist platform powered by the TMDB API.

## Features

- Cinematic featured-movie hero section
- Trending/popular movie recommendations
- Live movie search
- Genre filtering
- Minimum rating slider
- Sort by popularity, rating, or release date
- URL-driven filters using `URLSearchParams`
- Browser-persistent watchlist using `localStorage`
- Movie details modal
- YouTube trailer lookup
- Loading and error states
- Responsive desktop/tablet/mobile layout
- Vercel-ready deployment configuration

## Tech Stack

- Semantic HTML5
- Vanilla CSS3
- Vanilla JavaScript (ES modules)
- Fetch API + async/await
- TMDB REST API v3
- URLSearchParams
- localStorage
- Vite
- Vercel

## Run locally

1. Install Node.js.
2. Open this project folder in VS Code.
3. Run:

```bash
npm install
```

4. Create a `.env` file in the project root:

```env
VITE_TMDB_API_TOKEN=YOUR_REAL_TMDB_READ_ACCESS_TOKEN
```

5. Start the development server:

```bash
npm run dev
```

6. Open the local URL shown by Vite.

## TMDB setup

Create/get a TMDB API Read Access Token and put it in `.env` as:

`VITE_TMDB_API_TOKEN`

Never commit `.env` to GitHub.

## URL filter examples

The application updates the browser URL when filters are changed. For example:

`/discover?search=batman&genre=28&min_rating=7.5`

Refreshing/sharing that URL restores the selected filter state.

## GitHub

```bash
git init
git add .
git commit -m "Build CineVault movie watchlist platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Vercel

Import the GitHub repository into Vercel.

Add the environment variable:

- Key: `VITE_TMDB_API_TOKEN`
- Value: your TMDB Read Access Token

Then deploy.

## Assignment mapping

This project covers the requested concepts:

- Semantic HTML structure
- Vanilla CSS with Grid/Flexbox
- DOM manipulation
- Event listeners
- Async JavaScript and REST API calls
- URL search parameters
- Browser storage
- Environment-variable setup
- Git/GitHub workflow
- Vercel deployment

## Important security note

A Vite `VITE_*` variable is available to client-side code after build. It is useful for following the assignment's environment-variable workflow, but it is **not a server-side secret**. Do not put passwords, private credentials, or other truly secret values in client-side environment variables.

## Credits

Movie data and images are provided by TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.
