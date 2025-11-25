# AI Reasoning Display Feature

## Overview
The game now captures and displays Claude's internal reasoning/thinking process for debugging and understanding how the AI generates responses.

## What Was Changed

### 1. Edge Function (`supabase/functions/generate-narrative/index.ts`)
- **Extracts thinking content** from AI response before stripping it
- **Adds `reasoning` field** to the response JSON if thinking content exists
- **Removed `reasoning_effort` parameter** - it doesn't work with Chat Completions API (only works with Responses API Beta)
- Claude Sonnet 4.5 already does extended thinking automatically via `<thinking>` tags

### 2. Database (`conversation_history` table)
- **Added `reasoning` column** (TEXT, nullable) to store AI thinking
- Migration: `add_reasoning_to_conversation_history.sql`
- Old messages without reasoning will show no debug panel

### 3. Frontend Types (`src/types/game.ts`)
- **Added optional `reasoning?` field** to `ConversationMessage` interface

### 4. Game Context (`src/context/GameContext.tsx`)
- **Updated `addConversationMessage`** to accept optional `reasoning` parameter
- Passes reasoning through to database when available

### 5. Game Container (`src/components/GameContainer.tsx`)
- **Passes `data.reasoning`** from AI response to `addConversationMessage`
- Reasoning is now saved with each narrative message

### 6. Story Panel UI (`src/components/StoryPanel.tsx`)
- **Added collapsible reasoning display** above narrative messages
- Purple-themed debug panel with Brain icon
- Click to expand/collapse reasoning content
- Shows raw thinking text in monospace font
- Only appears when message has reasoning data

## How It Works

1. **AI Generates Response**: Claude includes `<thinking>` tags with internal reasoning
2. **Edge Function Extracts**: Thinking content is captured before being stripped
3. **Response Includes Reasoning**: JSON response has both `narrative` and `reasoning` fields
4. **Saved to Database**: Reasoning is stored alongside the message
5. **UI Displays**: Collapsible panel shows reasoning when message is displayed

## UI Design

```
┌─────────────────────────────────────────────────┐
│ 🧠 AI REASONING (Debug Info)              ▼    │  ← Clickable header
├─────────────────────────────────────────────────┤
│ The player is asking about...                  │  ← Thinking content
│ I need to consider the location...             │    (when expanded)
│ Based on their reputation of 45...             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 👤 NARRATOR                        11:14 AM     │
├─────────────────────────────────────────────────┤
│ The bouncer eyes you suspiciously...           │  ← Actual narrative
│                                                  │
└─────────────────────────────────────────────────┘
```

## Deploying the Updates

### Frontend (Already Done)
The project has been built with `npm run build`. UI changes are live.

### Edge Function (Needs Manual Deployment)
Run the deployment script:
```bash
./deploy-function.sh
```

Or manually:
```bash
supabase functions deploy generate-narrative --no-verify-jwt
```

## Benefits

1. **Debugging**: See exactly what the AI was thinking when it generated a response
2. **Understanding**: Learn how the AI interprets your actions and game state
3. **Quality Control**: Verify the AI is following your custom system prompt correctly
4. **Development**: Iterate on prompts by seeing internal reasoning

## Notes

- Reasoning content is **only visible** when present (Claude doesn't always use thinking tags)
- The display is **optional** - users can choose to expand or ignore it
- Reasoning is **stored permanently** - you can review past AI thinking later
- The feature has **minimal UI impact** - collapses neatly when not needed

## Technical Details

### Thinking Tag Format
Claude returns thinking in this format:
```
<thinking>
Player wants to go to the club. They have:
- Cash: £1000
- Reputation: 45
- Heat: 3

I should describe the club entrance and introduce a bouncer NPC...
</thinking>

{
  "narrative": "The club's neon lights pulse...",
  "stateChanges": {...}
}
```

The edge function extracts everything between `<thinking>` and `</thinking>` tags, then removes the tags from the final response before parsing JSON.

### Why No `reasoning_effort`?
The `reasoning_effort` parameter is only available in OpenRouter's **Responses API Beta** (`/api/v1/responses`), not the Chat Completions API (`/api/v1/chat/completions`) that we're using. Claude Sonnet 4.5 already includes extended thinking by default - we just needed to capture it instead of discarding it.
