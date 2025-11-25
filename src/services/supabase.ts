import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateSessionToken(): Promise<string> {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function createNewGame(playerName: string = 'Damian Khaine') {
  const sessionToken = await generateSessionToken();

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert([
      {
        player_name: playerName,
        session_token: sessionToken,
        current_location: 'Kensington',
        current_day: 1,
        current_hour: 9,
        current_minute: 0,
        day_of_week: 'Monday',
        month: 11,
        year: 2024,
        season: 'Autumn',
        weather: 'Overcast',
        temperature: 12,
        reputation: 0,
        heat_level: 0,
        game_status: 'active',
      },
    ])
    .select()
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) throw new Error('Failed to create session');

  const { data: inventory, error: inventoryError } = await supabase
    .from('player_inventory')
    .insert([
      {
        session_id: session.id,
        cash: 500,
        bank_balance: 12500,
        weapons: [],
        drugs: {
          'Cocaine': 100,
          'MDMA': 50,
          'Cannabis': 7
        },
        equipment: [],
      },
    ])
    .select()
    .maybeSingle();

  if (inventoryError) throw inventoryError;

  return { session, inventory };
}

export async function loadExistingSession(sessionToken: string) {
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) return null;

  const { data: inventory, error: inventoryError } = await supabase
    .from('player_inventory')
    .select('*')
    .eq('session_id', session.id)
    .maybeSingle();

  if (inventoryError) throw inventoryError;
  if (!inventory) throw new Error('Inventory not found for session');

  return { session, inventory };
}

export async function getPlayerInventory(sessionId: string) {
  const { data, error } = await supabase
    .from('player_inventory')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRelationships(sessionId: string) {
  const { data, error } = await supabase
    .from('relationships')
    .select(`
      *,
      npc:npcs!npc_id (
        id,
        name,
        role,
        location,
        personality,
        appearance,
        bio,
        is_significant
      )
    `)
    .eq('session_id', sessionId);

  if (error) throw error;

  // Filter to only show significant NPCs in the relationships panel
  const relationships = (data || []).filter((rel: any) =>
    rel.npc && rel.npc.is_significant === true
  );

  return relationships;
}

export async function updateInventory(sessionId: string, updates: any) {
  // Ensure drugs field is properly formatted for JSONB column
  const formattedUpdates = { ...updates };
  if (formattedUpdates.drugs !== undefined) {
    // Deep clone to ensure it's a plain object, not a Proxy or other wrapper
    formattedUpdates.drugs = JSON.parse(JSON.stringify(formattedUpdates.drugs));
  }

  const { data, error } = await supabase
    .from('player_inventory')
    .update(formattedUpdates)
    .eq('session_id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSession(sessionId: string, updates: any) {
  const { data, error } = await supabase
    .from('game_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveConversationMessage(messageData: any) {
  const { data, error } = await supabase
    .from('conversation_history')
    .insert([messageData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getConversationHistory(sessionId: string) {
  const { data, error } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLocation(locationName: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('name', locationName)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getItemStates(sessionId: string) {
  const { data, error} = await supabase
    .from('item_states')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return data || [];
}

export async function getAllLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLocationByName(name: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function changeLocation(sessionId: string, locationName: string) {
  const { error } = await supabase
    .from('game_sessions')
    .update({
      current_location: locationName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function upsertItemState(sessionId: string, itemData: {
  item_type: string;
  item_id: string;
  item_name: string;
  equipped?: boolean;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('item_states')
    .upsert(
      {
        session_id: sessionId,
        ...itemData,
      },
      {
        onConflict: 'session_id,item_id',
      }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateItemState(sessionId: string, itemId: string, updates: {
  equipped?: boolean;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('item_states')
    .update(updates)
    .eq('session_id', sessionId)
    .eq('item_id', itemId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteItemState(sessionId: string, itemId: string) {
  const { error } = await supabase
    .from('item_states')
    .delete()
    .eq('session_id', sessionId)
    .eq('item_id', itemId);

  if (error) throw error;
}

export async function getNPCConversations(sessionId: string, npcId?: string) {
  let query = supabase
    .from('npc_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (npcId) {
    query = query.eq('npc_id', npcId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function saveNPCConversation(conversationData: {
  session_id: string;
  npc_id: string;
  player_message: string;
  npc_response: string;
  conversation_day?: number;
  context_summary?: string;
}) {
  const { data, error } = await supabase
    .from('npc_conversations')
    .insert([conversationData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteNPCConversations(sessionId: string, npcId: string) {
  const { error } = await supabase
    .from('npc_conversations')
    .delete()
    .eq('session_id', sessionId)
    .eq('npc_id', npcId);

  if (error) throw error;
}

export async function getGameEvents(sessionId: string, category?: string) {
  let query = supabase
    .from('game_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('day_occurred', { ascending: false });

  if (category) {
    query = query.eq('event_category', category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function saveGameEvent(eventData: {
  session_id: string;
  event_type: string;
  event_category: 'major' | 'recent' | 'minor';
  importance: number;
  description: string;
  day_occurred: number;
  consequences?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('game_events')
    .insert([eventData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getNPCs() {
  const { data, error} = await supabase
    .from('npcs')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getActiveDeals(sessionId: string) {
  const { data, error } = await supabase
    .from('active_deals')
    .select(`
      *,
      npc:npcs(*)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDeal(dealData: {
  session_id: string;
  npc_id?: string;
  deal_type: 'buy' | 'sell' | 'transport' | 'protect';
  item: string;
  quantity: number;
  price_per_unit: number;
  total_value: number;
  risk_level: number;
  start_day: number;
  due_day: number;
  location: string;
  status?: 'pending' | 'active' | 'completed' | 'failed';
}) {
  const { data, error } = await supabase
    .from('active_deals')
    .insert([dealData])
    .select(`
      *,
      npc:npcs(*)
    `)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateDeal(dealId: string, updates: {
  status?: 'pending' | 'active' | 'completed' | 'failed';
  completion_details?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('active_deals')
    .update(updates)
    .eq('id', dealId)
    .select(`
      *,
      npc:npcs(*)
    `)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteDeal(dealId: string) {
  const { error } = await supabase
    .from('active_deals')
    .delete()
    .eq('id', dealId);

  if (error) throw error;
}

export async function getVehicles(sessionId: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle: any) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicle])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateVehicle(vehicleId: string, updates: any) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({...updates, updated_at: new Date().toISOString()})
    .eq('id', vehicleId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function setActiveVehicle(sessionId: string, vehicleId: string) {
  await supabase
    .from('vehicles')
    .update({ is_active: false })
    .eq('session_id', sessionId);

  const { data, error } = await supabase
    .from('vehicles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteVehicle(vehicleId: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
}

// ============================================
// SKILLS FUNCTIONS
// ============================================

export async function getSkills(sessionId: string) {
  const { data, error } = await supabase
    .from('player_skills')
    .select('*')
    .eq('session_id', sessionId)
    .order('skill_category', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createSkill(skillData: {
  session_id: string;
  skill_name: string;
  skill_category: 'combat' | 'social' | 'criminal' | 'survival';
  level?: number;
  experience?: number;
  experience_to_next?: number;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('player_skills')
    .insert([skillData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSkill(skillId: string, updates: {
  level?: number;
  experience?: number;
  experience_to_next?: number;
  last_used?: number;
  times_used?: number;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('player_skills')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', skillId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addSkillExperience(sessionId: string, skillName: string, xpGained: number) {
  // Get current skill state
  const { data: skill, error: fetchError } = await supabase
    .from('player_skills')
    .select('*')
    .eq('session_id', sessionId)
    .eq('skill_name', skillName)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!skill) throw new Error(`Skill ${skillName} not found`);

  let newXP = skill.experience + xpGained;
  let newLevel = skill.level;
  let xpToNext = skill.experience_to_next;

  // Check for level up
  while (newXP >= xpToNext && newLevel < 10) {
    newXP -= xpToNext;
    newLevel += 1;
    xpToNext = Math.floor(xpToNext * 1.5); // Each level requires 50% more XP
  }

  // Cap at level 10
  if (newLevel >= 10) {
    newLevel = 10;
    newXP = 0;
    xpToNext = 0;
  }

  const { data, error } = await supabase
    .from('player_skills')
    .update({
      level: newLevel,
      experience: newXP,
      experience_to_next: xpToNext,
      times_used: skill.times_used + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', skill.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return { skill: data, leveledUp: newLevel > skill.level };
}

export async function initializeDefaultSkills(sessionId: string) {
  const defaultSkills = [
    { skill_name: 'Negotiation', skill_category: 'social' as const, description: 'Affects deal prices, NPC trust gains, and persuasion success' },
    { skill_name: 'Intimidation', skill_category: 'social' as const, description: 'Affects NPC fear responses, aggressive confrontations, and extortion' },
    { skill_name: 'Combat', skill_category: 'combat' as const, description: 'Affects fight outcomes, weapon handling, and damage dealt' },
    { skill_name: 'Stealth', skill_category: 'criminal' as const, description: 'Affects avoiding detection, sneaking, and surveillance evasion' },
    { skill_name: 'Streetwise', skill_category: 'criminal' as const, description: 'Affects finding deals, spotting scams, and reading situations' },
    { skill_name: 'Driving', skill_category: 'survival' as const, description: 'Affects vehicle handling, chases, and getaway success' },
    { skill_name: 'Resilience', skill_category: 'survival' as const, description: 'Affects recovery from injuries, stress tolerance, and endurance' },
  ];

  const skillsToInsert = defaultSkills.map(skill => ({
    session_id: sessionId,
    ...skill,
    level: 1,
    experience: 0,
    experience_to_next: 100
  }));

  const { data, error } = await supabase
    .from('player_skills')
    .insert(skillsToInsert)
    .select();

  if (error) throw error;
  return data || [];
}

// ============================================
// SAFE HOUSES FUNCTIONS
// ============================================

export async function getSafeHouses(sessionId: string) {
  const { data, error } = await supabase
    .from('safe_houses')
    .select('*')
    .eq('session_id', sessionId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSafeHouse(safeHouseData: {
  session_id: string;
  name: string;
  location: string;
  property_type: 'penthouse' | 'flat' | 'warehouse' | 'lockup' | 'bedsit' | 'house';
  ownership: 'owned' | 'rented' | 'squatting' | 'family';
  monthly_cost?: number;
  security_level?: number;
  storage_capacity?: number;
  heat_protection?: number;
  is_primary?: boolean;
  features?: string[];
  description?: string;
}) {
  const { data, error } = await supabase
    .from('safe_houses')
    .insert([safeHouseData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSafeHouse(safeHouseId: string, updates: {
  stored_cash?: number;
  stored_drugs?: Record<string, number>;
  stored_weapons?: string[];
  security_level?: number;
  discovered_by_police?: boolean;
  last_visited?: number;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('safe_houses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', safeHouseId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function setPrimarySafeHouse(sessionId: string, safeHouseId: string) {
  // Clear all primary flags
  await supabase
    .from('safe_houses')
    .update({ is_primary: false })
    .eq('session_id', sessionId);

  // Set new primary
  const { data, error } = await supabase
    .from('safe_houses')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', safeHouseId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSafeHouse(safeHouseId: string) {
  const { error } = await supabase
    .from('safe_houses')
    .delete()
    .eq('id', safeHouseId);

  if (error) throw error;
}

export async function stashAtSafeHouse(safeHouseId: string, stash: {
  cash?: number;
  drugs?: Record<string, number>;
  weapons?: string[];
}) {
  // Get current safe house data
  const { data: safeHouse, error: fetchError } = await supabase
    .from('safe_houses')
    .select('*')
    .eq('id', safeHouseId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!safeHouse) throw new Error('Safe house not found');

  const updates: any = {};

  if (stash.cash !== undefined) {
    updates.stored_cash = (safeHouse.stored_cash || 0) + stash.cash;
  }

  if (stash.drugs) {
    const currentDrugs = safeHouse.stored_drugs || {};
    const newDrugs = { ...currentDrugs };
    for (const [drug, amount] of Object.entries(stash.drugs)) {
      newDrugs[drug] = (newDrugs[drug] || 0) + amount;
    }
    updates.stored_drugs = newDrugs;
  }

  if (stash.weapons) {
    updates.stored_weapons = [...(safeHouse.stored_weapons || []), ...stash.weapons];
  }

  const { data, error } = await supabase
    .from('safe_houses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', safeHouseId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function initializeKensingtonPenthouse(sessionId: string) {
  const penthouse = {
    session_id: sessionId,
    name: 'Kensington Penthouse',
    location: 'Kensington',
    property_type: 'penthouse' as const,
    ownership: 'family' as const,
    monthly_cost: 0, // Family owns it
    security_level: 8,
    storage_capacity: 200,
    heat_protection: 7,
    is_primary: true,
    stored_cash: 0,
    stored_drugs: {},
    stored_weapons: [],
    features: ['concierge', 'parking_garage', 'hidden_safe', 'cctv', 'panic_room'],
    description: 'A luxurious penthouse overlooking Hyde Park. Floor-to-ceiling windows, marble countertops, the kind of place that screams money. Your family owns it, but they\'re never around. Mrs. O keeps it running.'
  };

  const { data, error } = await supabase
    .from('safe_houses')
    .insert([penthouse])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
