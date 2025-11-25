# Critical Bug Fix: State Change Deltas

## The Problem

Cash was resetting to £0 every time the AI responded because of a fundamental misunderstanding of how state changes work.

### Root Cause

The AI returns **delta values** (changes), not absolute values:
- `cash: 0` means "no change to cash"
- `reputation: 5` means "add 5 to reputation"
- `heat: -2` means "reduce heat by 2"

But the code was treating these as **absolute values** and calculating deltas from them:
```typescript
// WRONG - treating AI response as absolute value
const delta = changes.cash - (state.inventory?.cash || 0);
// If AI returns cash: 0 and player has £1000
// delta = 0 - 1000 = -1000 🔴 BUG!
```

This meant:
- AI returns `cash: 0` (meaning no change)
- Code calculates: `delta = 0 - 1000 = -1000`
- Player loses £1000 every turn!

## What Was Fixed

### 1. Cash Changes (GameContainer.tsx:320)
**Before:**
```typescript
if (changes.cash !== undefined && changes.cash !== state.inventory?.cash) {
  const delta = changes.cash - (state.inventory?.cash || 0);
  await updateCash(delta);
}
```

**After:**
```typescript
if (changes.cash !== undefined && changes.cash !== 0) {
  // changes.cash is a DELTA, not an absolute value
  await updateCash(changes.cash);
}
```

### 2. Heat Changes (GameContainer.tsx:219)
**Before:**
```typescript
if (changes.heatLevel !== undefined && changes.heatLevel !== state.session.heat_level) {
  const delta = changes.heatLevel - state.session.heat_level;
  await updateHeatLevel(changes.heatLevel); // Wrong: passing absolute as delta
}
```

**After:**
```typescript
if (changes.heat !== undefined && changes.heat !== 0) {
  // changes.heat is a DELTA, not an absolute value
  await updateHeatLevel(changes.heat);
}
```

### 3. Reputation Changes (GameContainer.tsx:229)
**Before:**
```typescript
if (changes.reputation !== undefined && changes.reputation !== state.session.reputation) {
  const delta = changes.reputation - state.session.reputation;
  await addReputation(delta);
}
```

**After:**
```typescript
if (changes.reputation !== undefined && changes.reputation !== 0) {
  // changes.reputation is a DELTA, not an absolute value
  await addReputation(changes.reputation);
}
```

### 4. JSONB Drug Inventory (supabase.ts:115)
**Additional fix:** Drugs object was being serialized as `'[object Object]'` instead of proper JSON.

**After:**
```typescript
export async function updateInventory(sessionId: string, updates: any) {
  const formattedUpdates = { ...updates };
  if (formattedUpdates.drugs !== undefined) {
    // Deep clone to ensure it's a plain object for JSONB
    formattedUpdates.drugs = JSON.parse(JSON.stringify(formattedUpdates.drugs));
  }
  // ... rest of function
}
```

## AI Response Format

From the edge function system prompt (line 428):

```
State change rules:
- cash: +/- amount (e.g., +50 for earning, -20 for spending)
- reputation: +/- amount (e.g., +5 for respect earned, -10 for getting violated)
- heat: +/- amount from 0-10 (e.g., +2 for risky action, -1 for laying low)
- timeAdvance: minutes to advance (e.g., 15 for quick action, 60 for longer activity)
```

All values are DELTAS (relative changes), not absolute values!

## Testing

After this fix:
- ✅ Starting a new game gives £1000 cash (default)
- ✅ Cash stays at £1000 when AI returns `cash: 0`
- ✅ Cash properly increases with `cash: +50`
- ✅ Cash properly decreases with `cash: -20`
- ✅ Heat and reputation work correctly
- ✅ Drug inventory updates work without JSONB errors

## Impact

This was affecting EVERY player action because:
- Most actions don't change cash → AI returns `cash: 0`
- Old code interpreted this as "set cash to £0"
- Players were constantly losing all their money

The bug made the game unplayable as players would lose £1000 every single turn unless the AI explicitly gave them money.
