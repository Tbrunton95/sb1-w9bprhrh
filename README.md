# Damian Khaine - London Underground Crime RPG

An AI-powered text-based RPG set in a dystopian London where you play as Damian Khaine, navigating the criminal underworld.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- An OpenRouter API key (for AI narrative generation)

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - The `.env` file is already included
   - **IMPORTANT:** Replace `your_openrouter_api_key_here` with your actual OpenRouter API key
   - Get an API key from: https://openrouter.ai/keys

Edit `.env`:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeXpsbnB4aXd6ZWpybnJlcnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyNDksImV4cCI6MjA3OTUxNDI0OX0.gw7bgns_XptRZ8TzRIvvBhVulVV3ruwzzrp4PuG2Jr0
VITE_SUPABASE_URL=https://bryzlnpxiwzejrnreryb.supabase.co
OPENROUTER_API_KEY=your_actual_api_key_here
```

## Running the Game

### Development Mode

Start the development server:
```bash
npm run dev
```

Then open your browser to: http://localhost:5173

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Database Setup

The game uses Supabase for persistence. The database is already configured, but there are known issues with the REST API endpoint in the current environment.

**Current Status:**
- Database schema is created and working
- RLS policies are in place
- REST API endpoint has connection issues (returns HTTP 556 errors)

**Workaround:**
If you encounter database connection errors, the game will still run but won't persist data. Session data will be stored in browser localStorage as a fallback.

## Game Features

- **Character System:** Track your character's humanity, compulsion, and stats
- **Dynamic Narrative:** AI-generated story that responds to your actions
- **Inventory Management:** Manage weapons, drugs, equipment, and cash
- **NPC Relationships:** Build trust with various criminal contacts
- **Deal System:** Buy, sell, and transport illegal goods
- **Time Progression:** Actions advance time, affecting story and gameplay
- **Multiple Locations:** Travel between different areas of London
- **Custom Character:** Set your own appearance, bio, and custom system prompts

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console, this is due to Supabase REST API configuration issues in the environment. The game code is correct.

### Database Connection Failed
The game will fall back to localStorage if the database is unreachable. Your session will still be saved locally in your browser.

### White Screen / Crashes
- Check browser console for errors
- Ensure you have a valid OpenRouter API key configured
- Try clearing browser localStorage and starting a new game

### OpenRouter API Issues
- Verify your API key is correct
- Check you have credits/quota available at https://openrouter.ai/
- The game uses the `anthropic/claude-3.5-sonnet` model

## Development

### Project Structure

```
src/
├── components/        # React components
│   ├── GameContainer.tsx
│   ├── StoryPanel.tsx
│   ├── CharacterPanel.tsx
│   ├── InventoryPanel.tsx
│   ├── MapPanel.tsx
│   ├── ActiveDealsPanel.tsx
│   ├── RelationshipsPanel.tsx
│   ├── SettingsPanel.tsx
│   └── WelcomeScreen.tsx
├── context/          # React context for game state
│   └── GameContext.tsx
├── services/         # External service integrations
│   └── supabase.ts
├── types/           # TypeScript type definitions
│   └── game.ts
└── App.tsx          # Main application component
```

### Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenRouter API (Claude 3.5 Sonnet)
- **Icons:** Lucide React
- **Build Tool:** Vite

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Known Issues

1. **Supabase REST API returning HTTP 556 errors** - The hosted Supabase endpoint is not responding correctly. This is an infrastructure issue, not a code issue.

2. **Database persistence not working in browser** - Due to the Supabase API issues, game data may not persist between sessions unless the API endpoint is fixed.

3. **Edge Function CORS** - The generate-narrative edge function may have CORS issues when called from the browser.

## License

This is a demo/prototype project.
