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
