export interface GameSession {
  id: string;
  player_name: string;
  appearance: string;
  bio: string;
  current_location: string;
  current_day: number;
  current_hour: number;
  current_minute: number;
  day_of_week: string;
  month: number;
  year: number;
  season: string;
  weather: string;
  temperature: number;
  reputation: number;
  heat_level: number;
  game_status: 'active' | 'paused' | 'ended' | 'won';
  session_token: string;
  custom_system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  region: string;
  dangers: number;
  npc_contacts: string[];
  available_goods: string[];
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  location: string;
  personality: string;
  appearance: string;
  bio: string;
  base_trust_threshold: number;
  description: string;
  primary_business: string;
}

export interface PlayerInventory {
  id: string;
  session_id: string;
  cash: number;
  bank_balance: number;
  last_bank_deposit: number;
  last_income_payment: number;
  weapons: string[];
  drugs: Record<string, number>;
  equipment: string[];
}

export interface Relationship {
  id: string;
  session_id: string;
  npc_id: string;
  npc?: NPC;
  trust_score: number;
  interaction_count: number;
  last_interaction: string | null;
  status: 'unknown' | 'allied' | 'neutral' | 'hostile';
}

export interface ActiveDeal {
  id: string;
  session_id: string;
  npc_id: string;
  npc?: NPC;
  deal_type: 'buy' | 'sell' | 'transport' | 'protect';
  item: string;
  quantity: number;
  price_per_unit: number;
  total_value: number;
  risk_level: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  start_day: number;
  due_day: number;
  location: string;
  completion_details: Record<string, unknown> | null;
}

export interface GameEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_category: 'major' | 'recent' | 'minor';
  importance: number;
  description: string;
  day_occurred: number;
  consequences: Record<string, unknown>;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  speaker: string;
  message: string;
  message_type: 'narrative' | 'dialogue' | 'system' | 'action';
  turn_number: number;
  created_at: string;
  reasoning?: string;
}

export interface ItemState {
  id: string;
  session_id: string;
  item_type: 'weapon' | 'equipment' | 'drug' | 'consumable';
  item_id: string;
  item_name: string;
  description: string;
  equipped: boolean;
  quantity: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NPCConversation {
  id: string;
  session_id: string;
  npc_id: string;
  player_message: string;
  npc_response: string;
  conversation_day: number;
  conversation_time: string;
  context_summary: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  session_id: string;
  vehicle_type: 'car' | 'motorcycle' | 'e-bike' | 'moped' | 'bicycle';
  make_model: string;
  registration: string | null;
  color: string;
  fuel_level: number;
  condition: number;
  is_stolen: boolean;
  is_active: boolean;
  parked_location: string | null;
  storage_location: string | null;
  insurance_status: 'none' | 'basic' | 'full';
  modifications: Record<string, unknown>;
  metadata: Record<string, unknown>;
  purchase_price: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerSkill {
  id: string;
  session_id: string;
  skill_name: string;
  skill_category: 'combat' | 'social' | 'criminal' | 'survival';
  level: number;
  experience: number;
  experience_to_next: number;
  description: string;
  last_used: number | null;
  times_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SafeHouse {
  id: string;
  session_id: string;
  name: string;
  location: string;
  property_type: 'penthouse' | 'flat' | 'warehouse' | 'lockup' | 'bedsit' | 'house';
  ownership: 'owned' | 'rented' | 'squatting' | 'family';
  monthly_cost: number;
  security_level: number;
  storage_capacity: number;
  heat_protection: number;
  is_primary: boolean;
  stored_cash: number;
  stored_drugs: Record<string, number>;
  stored_weapons: string[];
  features: string[];
  description: string;
  discovered_by_police: boolean;
  last_visited: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GameState {
  session: GameSession | null;
  inventory: PlayerInventory | null;
  relationships: Relationship[];
  activeDeals: ActiveDeal[];
  currentLocation: Location | null;
  conversationHistory: ConversationMessage[];
  npcConversations: NPCConversation[];
  gameEvents: GameEvent[];
  itemStates: ItemState[];
  vehicles: Vehicle[];
  skills: PlayerSkill[];
  safeHouses: SafeHouse[];
  loading: boolean;
  error: string | null;
}
