# ClimateAI — Global Climate Action Coordinator

AI-powered platform for coordinated global climate action, real-time monitoring, and evidence-based decision making.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Recharts + Three.js (3D Globe)
- Google Gemini 2.0/2.5 Flash (AI features)

## Getting Started

```sh
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:8080`.

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For AI features, set `GEMINI_API_KEY` in Supabase Edge Function secrets.

## Deployment

Build for production:

```sh
npm run build
```

Output is in the `dist/` directory. Deploy to any static hosting (Vercel, Netlify, Cloudflare Pages, etc.).
