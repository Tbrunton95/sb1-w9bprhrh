# Damian Khaine: The London Underground - Project Summary

## Overview
A gritty text-based RPG set in London's criminal underworld. Players navigate the dangerous world of drug dealing, managing relationships with NPCs, avoiding police, and making morally complex choices that affect their reputation, safety, and humanity.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase** (PostgreSQL database + Edge Functions)
- **OpenRouter API** (Claude 3.5 Sonnet for narrative generation)

### Architecture
- Client-side React SPA
- Serverless edge functions for AI narrative
- Real-time database with Row Level Security

## Core Game Systems

### 1. Character System
**Stats:**
- **Compulsion** (0-10): Urge to kill, increases over time, decreases with kills
- **Humanity** (0-100): Moral compass, affected by player choices
- **Heat Level** (0-10): Police attention/danger level
- **Reputation** (0-100): Street credibility and influence
- **Cash**: Money for deals and bribes

**Player Character Fields:**
- Name
- Appearance (editable)
- Bio/Backstory (editable)
- Current location, day, time
- Game status (active/paused/ended/won)

### 2. Inventory System
**Database: `player_inventory` + `item_states`**
- Cash tracking
- Weapons, drugs, equipment
- Item states (equipped/unequipped, quantity)
- Item descriptions for narrative context
- Metadata for item-specific properties

### 3. NPC Relationship System
**Database: `npcs` + `relationships`**

**NPC Data:**
- Name, role, location
- Personality, appearance, bio
- Base trust threshold
- Description, primary business

**Relationship Tracking:**
- Trust score (dynamic, affects interactions)
- Status (ally, neutral, enemy, rival, contact)
- Interaction count
- Last interaction timestamp

### 4. NPC Conversation Memory
**Database: `npc_conversations`**

Tracks every conversation between player and NPCs:
- Player message
- NPC response
- Conversation day
- Context summary
- Timestamp

This gives the AI full memory of past interactions.

### 5. Events System
**Database: `game_events`**

Tracks story events with categories:
- **Major events**: Story-defining moments
- **Recent events**: Short-term developments
- **Minor events**: Background happenings

Each event has:
- Description
- Day occurred
- Importance (1-10)
- Consequences (JSON metadata)

### 6. Location System
**Database: `locations`**

London areas with:
- Name, region
- Description
- Danger level
- Primary NPCs
- Available activities

## Database Schema

### Core Tables

**game_sessions**
- Player character data
- Current game state (day, time, location)
- Stats (compulsion, humanity, heat, reputation)
- Custom system prompt (optional)
- Appearance and bio

**player_inventory**
- Cash
- Weapons array
- Drugs object
- Equipment array

**item_states**
- Detailed item tracking
- Equipped status
- Quantity
- Description for narrative
- Metadata (JSON)

**npcs**
- NPC profile data
- Personality, appearance, bio
- Location and role
- Trust threshold

**relationships**
- Links sessions to NPCs
- Trust scores
- Relationship status
- Interaction tracking

**npc_conversations**
- Full conversation history
- Player messages
- NPC responses
- Context summaries

**game_events**
- Event log
- Categories (major/recent/minor)
- Importance scores
- Consequences

**locations**
- London area data
- Descriptions
- Danger ratings

**active_deals**
- Ongoing transactions
- Deal types, amounts, NPCs
- Status, deadlines
- Risk assessment

**conversation_history**
- General narrative log
- Speaker, message, type
- Turn numbers

### Security (Row Level Security)
All tables have RLS policies ensuring:
- Users can only access their own game data
- Authentication required for all operations
- No public access to sensitive data

## AI Narrative System

### Edge Function: `generate-narrative`

**Input:**
```typescript
{
  action: string,              // Player's action
  customSystemPrompt?: string, // Optional custom GM instructions
  playerCharacter: {
    name: string,
    appearance: string,
    bio: string
  },
  gameState: {
    location: string,
    locationDetails: object,
    cash: number,
    reputation: number,
    heatLevel: number,
    day: number,
    inventory: object,
    equippedItems: array,
    recentConversation: array,
    npcConversations: array,
    majorEvents: array,
    recentEvents: array,
    relationships: array
  }
}
```

**Output:**
```typescript
{
  narrative: string  // AI-generated story response
}
```

### Context Building
The edge function builds a comprehensive prompt including:
- Player character description
- Current game state
- Equipped items with descriptions
- NPC relationships with personalities
- Past NPC conversations
- Major story events
- Recent events
- Recent conversation history

This gives the AI complete context for consistent, memory-aware storytelling.

### AI Model
- **Claude 3.5 Sonnet** via OpenRouter
- Temperature: 0.8 (creative but consistent)
- Max tokens: 1000 (2-4 paragraphs)

## Frontend Architecture

### Context: `GameContext`
Global state management for:
- Session data
- Inventory
- Relationships
- Active deals
- Location
- Conversation history
- NPC conversations
- Game events
- Item states
- Loading/error states

**Key Functions:**
- `initializeGame()` - Creates new game session
- `addConversationMessage()` - Saves narrative
- `updateHeatLevel()` - Adjusts police attention
- `addReputation()` - Changes street cred
- `updateNPCRelationship()` - Modifies trust
- `updatePlayerLocation()` - Moves player
- `updateItemState()` - Manages inventory
- `updateCharacterInfo()` - Edits appearance/bio
- `addGameEvent()` - Records story events

### Component Structure

**WelcomeScreen**
- Initial game setup
- Character creation
- Start game button

**GameContainer** (Main game view)
- Story panel (left)
- Character/Info panel (right)
- Action input
- Tab navigation

**StoryPanel**
- Displays conversation history
- Narrative scroll
- Turn-by-turn story

**CharacterPanel**
- Character stats display
- Appearance/bio editor
- Stat bars (compulsion, humanity, heat)
- Cash, reputation, time, location

**InventoryPanel**
- Equipment management
- Item equip/unequip
- Quantity tracking
- Item descriptions

**RelationshipsPanel**
- NPC list
- Trust scores
- Relationship status
- Last interaction info

**ActiveDealsPanel**
- Current deals
- Deal status tracking
- Deadlines

**MapPanel**
- Location navigation
- Area descriptions
- Danger levels

**SettingsPanel**
- Custom system prompt editor
- Game configuration

**StateChangeNotification**
- Animated stat change alerts
- Visual feedback system

## Game Flow

1. **Initialization**
   - User starts game
   - Creates session in database
   - Loads default location (East End)
   - Initializes inventory (£500 starting cash)

2. **Turn Loop**
   - Player types action
   - Action sent to edge function with full context
   - AI generates narrative response
   - Response saved to database
   - UI updates with new narrative
   - Stats/state updated as needed

3. **State Updates**
   - Heat level affects police encounters
   - Reputation affects NPC interactions
   - Compulsion increases over time
   - Time progresses (hours/days)
   - Events accumulate
   - Relationships evolve

4. **Persistence**
   - All game state in Supabase
   - Session tokens for continuity
   - Full conversation history
   - Event log for story consistency

## Key Features

### Memory System
- NPCs remember past conversations
- Events create lasting consequences
- Relationships evolve over time
- Context builds naturally

### Dynamic Storytelling
- AI-driven narrative responds to actions
- NPCs have personalities and agendas
- World reacts to player reputation and heat
- Consequences of choices persist

### Character Development
- Editable appearance and backstory
- Stats reflect moral choices
- Compulsion mechanic creates tension
- Humanity system for moral weight

### Immersive UI
- Dark, atmospheric design
- Animated stat changes
- Real-time updates
- Intuitive navigation

## Environment Variables

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Edge function environment (auto-configured):
- OPENROUTER_API_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy Edge Functions
Edge functions are deployed via Supabase MCP tools automatically.

## Game Design Philosophy

### Core Pillars
1. **Consequence**: Every action matters
2. **Memory**: The world remembers
3. **Agency**: Player always chooses
4. **Tension**: Stakes escalate naturally
5. **Atmosphere**: Gritty, immersive London

### Mechanics Support Story
- Stats create narrative pressure
- Heat forces strategic choices
- Reputation opens/closes doors
- Compulsion adds psychological horror
- Humanity creates moral weight

### AI as Game Master
- AI controls world and NPCs
- Never plays the player character
- Responds to player actions
- Creates consistent narrative
- Remembers and references history

## Future Enhancement Ideas

### Potential Features
- Multiple character archetypes
- Drug manufacturing system
- Territory control mechanics
- Gang warfare
- More complex police system
- Character permadeath
- Multiple endings
- Save/load system
- Character portraits
- Sound effects/music
- Mobile responsive design

### Technical Improvements
- TypeScript strict mode
- Unit tests
- E2E tests
- Performance optimization
- Error boundary components
- Offline support
- Progressive Web App
- Analytics tracking

## File Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── ActiveDealsPanel.tsx
│   │   ├── CharacterPanel.tsx
│   │   ├── GameContainer.tsx
│   │   ├── InventoryPanel.tsx
│   │   ├── MapPanel.tsx
│   │   ├── RelationshipsPanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── StateChangeNotification.tsx
│   │   ├── StoryPanel.tsx
│   │   └── WelcomeScreen.tsx
│   ├── context/             # State management
│   │   └── GameContext.tsx
│   ├── services/            # API/Database
│   │   └── supabase.ts
│   ├── types/               # TypeScript types
│   │   └── game.ts
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── supabase/
│   ├── migrations/          # Database migrations
│   │   ├── 20251124003629_add_character_stats.sql
│   │   ├── 20251124073444_add_item_states_table.sql
│   │   ├── 20251124082552_add_custom_system_prompt.sql
│   │   └── 20251124083625_add_character_context_fields.sql
│   └── functions/           # Edge functions
│       └── generate-narrative/
│           └── index.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── SYSTEM_PROMPT.md         # GM instructions
└── PROJECT_SUMMARY.md       # This file
```

## Summary for LLMs

This is a narrative-driven RPG where an AI acts as Game Master, controlling the world and NPCs while the player makes decisions as a drug dealer in London. The system tracks comprehensive context (character details, NPC relationships, conversation history, events) and passes it all to the AI for consistent, memory-aware storytelling. The database stores everything for persistence, and the frontend provides an immersive interface for the text-based experience. The core mechanic is: player inputs action → AI receives full context → AI generates narrative → state updates → player responds.
