import React, { createContext, useReducer, useCallback } from 'react';
import { GameState, GameSession, PlayerInventory, Relationship, ActiveDeal, Location, ConversationMessage, ItemState, NPCConversation, GameEvent, Vehicle } from '../types/game';
import * as supabaseService from '../services/supabase';

export const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  initializeGame: () => Promise<void>;
  addConversationMessage: (speaker: string, message: string, type: string) => Promise<void>;
  updateHeatLevel: (amount: number) => Promise<void>;
  addReputation: (amount: number) => Promise<void>;
  updateNPCRelationship: (npcId: string, trustDelta: number) => Promise<void>;
  updatePlayerLocation: (location: string) => Promise<void>;
  updateItemState: (itemId: string, updates: { equipped?: boolean; quantity?: number; metadata?: Record<string, unknown> }) => Promise<void>;
  updateCash: (amount: number) => Promise<void>;
  updateBankBalance: (amount: number) => Promise<void>;
  transferToBank: (amount: number) => Promise<void>;
  withdrawFromBank: (amount: number) => Promise<void>;
  checkMonthlyIncome: () => Promise<void>;
  advanceTime: (minutes: number) => Promise<void>;
  initializeDefaultItems: () => Promise<void>;
  updateCustomSystemPrompt: (prompt: string) => Promise<void>;
  updateCharacterInfo: (appearance: string, bio: string) => Promise<void>;
  addGameEvent: (event: Omit<GameEvent, 'id' | 'session_id' | 'created_at'>) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'session_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<void>;
  setActiveVehicle: (vehicleId: string) => Promise<void>;
  refuelVehicle: (vehicleId: string, amount: number) => Promise<void>;
  repairVehicle: (vehicleId: string, cost: number) => Promise<void>;
}

type GameAction =
  | { type: 'SET_SESSION'; payload: GameSession }
  | { type: 'SET_INVENTORY'; payload: PlayerInventory }
  | { type: 'SET_RELATIONSHIPS'; payload: Relationship[] }
  | { type: 'SET_ACTIVE_DEALS'; payload: ActiveDeal[] }
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_CONVERSATION'; payload: ConversationMessage[] }
  | { type: 'ADD_CONVERSATION_MESSAGE'; payload: ConversationMessage }
  | { type: 'SET_NPC_CONVERSATIONS'; payload: NPCConversation[] }
  | { type: 'SET_GAME_EVENTS'; payload: GameEvent[] }
  | { type: 'ADD_GAME_EVENT'; payload: GameEvent }
  | { type: 'SET_ITEM_STATES'; payload: ItemState[] }
  | { type: 'UPDATE_ITEM_STATE'; payload: ItemState }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: GameState = {
  session: null,
  inventory: null,
  relationships: [],
  activeDeals: [],
  currentLocation: null,
  conversationHistory: [],
  npcConversations: [],
  gameEvents: [],
  itemStates: [],
  vehicles: [],
  loading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    case 'SET_RELATIONSHIPS':
      return { ...state, relationships: action.payload };
    case 'SET_ACTIVE_DEALS':
      return { ...state, activeDeals: action.payload };
    case 'SET_LOCATION':
      return { ...state, currentLocation: action.payload };
    case 'SET_CONVERSATION':
      return { ...state, conversationHistory: action.payload };
    case 'ADD_CONVERSATION_MESSAGE':
      return {
        ...state,
        conversationHistory: [...state.conversationHistory, action.payload],
      };
    case 'SET_NPC_CONVERSATIONS':
      return { ...state, npcConversations: action.payload };
    case 'SET_GAME_EVENTS':
      return { ...state, gameEvents: action.payload };
    case 'ADD_GAME_EVENT':
      return {
        ...state,
        gameEvents: [action.payload, ...state.gameEvents],
      };
    case 'SET_ITEM_STATES':
      return { ...state, itemStates: action.payload };
    case 'UPDATE_ITEM_STATE':
      return {
        ...state,
        itemStates: state.itemStates.map(item =>
          item.item_id === action.payload.item_id ? action.payload : item
        ),
      };
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    case 'ADD_VEHICLE':
      return {
        ...state,
        vehicles: [...state.vehicles, action.payload],
      };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.id ? action.payload : vehicle
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const initializeGame = useCallback(async () => {
    try {
      console.log('Initializing game...');
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check for existing session token
      const existingToken = localStorage.getItem('gameSessionToken');
      let session, inventory;

      if (existingToken) {
        console.log('Found existing session token, attempting to load...');
        const existingSession = await supabaseService.loadExistingSession(existingToken);

        if (existingSession) {
          console.log('Existing session loaded:', existingSession.session);
          session = existingSession.session;
          inventory = existingSession.inventory;
        } else {
          console.log('Session token invalid, creating new game...');
          const newGame = await supabaseService.createNewGame();
          session = newGame.session;
          inventory = newGame.inventory;
        }
      } else {
        console.log('No existing session, creating new game...');
        const newGame = await supabaseService.createNewGame();
        session = newGame.session;
        inventory = newGame.inventory;
      }

      console.log('Game session ready:', session);

      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_INVENTORY', payload: inventory });

      console.log('Fetching location:', session.current_location);
      const location = await supabaseService.getLocation(session.current_location);
      if (location) {
        dispatch({ type: 'SET_LOCATION', payload: location });
        console.log('Location loaded:', location);
      }

      console.log('Fetching relationships...');
      const relationships = await supabaseService.getRelationships(session.id);
      dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });

      console.log('Fetching NPC conversations...');
      const npcConversations = await supabaseService.getNPCConversations(session.id);
      dispatch({ type: 'SET_NPC_CONVERSATIONS', payload: npcConversations });

      console.log('Fetching game events...');
      const gameEvents = await supabaseService.getGameEvents(session.id);
      dispatch({ type: 'SET_GAME_EVENTS', payload: gameEvents });

      console.log('Fetching active deals...');
      const activeDeals = await supabaseService.getActiveDeals(session.id);
      dispatch({ type: 'SET_ACTIVE_DEALS', payload: activeDeals });

      console.log('Fetching vehicles...');
      const vehicles = await supabaseService.getVehicles(session.id);
      dispatch({ type: 'SET_VEHICLES', payload: vehicles });

      console.log('Fetching item states...');
      const itemStates = await supabaseService.getItemStates(session.id);
      dispatch({ type: 'SET_ITEM_STATES', payload: itemStates });

      console.log('Fetching conversation history...');
      const conversationHistory = await supabaseService.getConversationHistory(session.id);
      dispatch({ type: 'SET_CONVERSATION', payload: conversationHistory });

      localStorage.setItem('gameSessionToken', session.session_token);
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('Game initialization complete!');
    } catch (error) {
      console.error('Game initialization failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to initialize game' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addConversationMessage = useCallback(async (speaker: string, message: string, type: string = 'narrative', reasoning?: string) => {
    if (!state.session) return;
    try {
      const turnNumber = state.conversationHistory.length + 1;
      const newMessage = await supabaseService.saveConversationMessage({
        session_id: state.session.id,
        speaker,
        message,
        message_type: type,
        turn_number: turnNumber,
        reasoning,
      });
      dispatch({ type: 'ADD_CONVERSATION_MESSAGE', payload: newMessage });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save message' });
    }
  }, [state.session, state.conversationHistory]);

  const updateHeatLevel = useCallback(async (amount: number) => {
    if (!state.session) return;
    try {
      const newHeat = Math.max(0, Math.min(10, state.session.heat_level + amount));
      const updated = await supabaseService.updateSession(state.session.id, {
        heat_level: newHeat,
      });
      dispatch({ type: 'SET_SESSION', payload: updated });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update heat level' });
    }
  }, [state.session]);

  const addReputation = useCallback(async (amount: number) => {
    if (!state.session) return;
    try {
      const newReputation = Math.max(0, state.session.reputation + amount);
      const updated = await supabaseService.updateSession(state.session.id, {
        reputation: newReputation,
      });
      dispatch({ type: 'SET_SESSION', payload: updated });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update reputation' });
    }
  }, [state.session]);

  const updateNPCRelationship = useCallback(async (npcId: string, trustDelta: number) => {
    return;
  }, []);

  const updatePlayerLocation = useCallback(async (location: string) => {
    if (!state.session) return;
    try {
      const locationData = await supabaseService.getLocation(location);
      if (locationData) {
        dispatch({ type: 'SET_LOCATION', payload: locationData });
      }
      await supabaseService.updateSession(state.session.id, {
        current_location: location,
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update location' });
    }
  }, [state.session]);

  const initializeDefaultItems = useCallback(async () => {
    if (!state.session) return;
    try {
      // Initialize weapons
      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'weapon',
        item_id: 'glock_19',
        item_name: 'Glock 19',
        equipped: false,
        quantity: 15,
        metadata: { ammo: 15, maxAmmo: 15 },
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'weapon',
        item_id: 'ceramic_shank',
        item_name: 'Ceramic Shank',
        equipped: false,
        quantity: 1,
        metadata: {},
      });

      // Initialize equipment
      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'encrypted_burner',
        item_name: 'Encrypted Burner Phone',
        equipped: false,
        quantity: 1,
        metadata: { battery: 100 },
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'kevlar_vest',
        item_name: 'Kevlar Vest',
        equipped: false,
        quantity: 1,
        metadata: { durability: 100 },
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'stone_island_jacket',
        item_name: 'Stone Island Jacket',
        equipped: false,
        quantity: 1,
        metadata: {},
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'trapstar_hoodie',
        item_name: 'Trapstar Hoodie',
        equipped: false,
        quantity: 1,
        metadata: {},
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'audi_rs3_keys',
        item_name: 'Audi RS3 Keys',
        equipped: false,
        quantity: 1,
        metadata: { vehicle: 'Audi RS3 - Blacked out, underground car park' },
      });

      await supabaseService.upsertItemState(state.session.id, {
        item_type: 'equipment',
        item_id: 'yamaha_r6_keys',
        item_name: 'Yamaha R6 Keys',
        equipped: false,
        quantity: 1,
        metadata: { vehicle: 'Yamaha R6 Sport Bike - Underground car park' },
      });

      // Load all item states
      const itemStates = await supabaseService.getItemStates(state.session.id);
      dispatch({ type: 'SET_ITEM_STATES', payload: itemStates });
    } catch (error) {
      console.error('Failed to initialize default items:', error);
    }
  }, [state.session]);

  const updateItemState = useCallback(async (
    itemId: string,
    updates: { equipped?: boolean; quantity?: number; metadata?: Record<string, unknown> }
  ) => {
    if (!state.session) return;
    try {
      const updated = await supabaseService.updateItemState(state.session.id, itemId, updates);
      if (updated) {
        dispatch({ type: 'UPDATE_ITEM_STATE', payload: updated });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update item' });
    }
  }, [state.session]);

  const updateCash = useCallback(async (amount: number) => {
    if (!state.session) return;
    try {
      const currentCash = state.inventory?.cash || 0;
      const updatedInventory = await supabaseService.updateInventory(state.session.id, {
        cash: currentCash + amount
      });
      dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update cash' });
    }
  }, [state.session, state.inventory]);

  const checkMonthlyIncome = useCallback(async () => {
    if (!state.session || !state.inventory) return;

    const DAYS_PER_MONTH = 30;
    const MONTHLY_INCOME = 12500;
    const currentDay = state.session.current_day;
    const lastPayment = state.inventory.last_income_payment || 0;
    const monthsPassed = Math.floor((currentDay - lastPayment) / DAYS_PER_MONTH);

    if (monthsPassed >= 1) {
      const totalIncome = monthsPassed * MONTHLY_INCOME;
      try {
        const updatedInventory = await supabaseService.updateInventory(state.session.id, {
          bank_balance: state.inventory.bank_balance + totalIncome,
          last_income_payment: currentDay
        });
        dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
        await addConversationMessage(
          'System',
          `Trust fund payment received: £${totalIncome.toLocaleString()} deposited to your bank account (${monthsPassed} month${monthsPassed > 1 ? 's' : ''}).`,
          'system'
        );
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to process monthly income' });
      }
    }
  }, [state.session, state.inventory, addConversationMessage]);

  const advanceTime = useCallback(async (minutes: number) => {
    if (!state.session) return;
    try {
      const newMinutes = state.session.current_minute + minutes;
      const hoursToAdd = Math.floor(newMinutes / 60);
      const finalMinutes = newMinutes % 60;
      const finalHours = (state.session.current_hour + hoursToAdd) % 24;
      const daysToAdd = Math.floor((state.session.current_hour + hoursToAdd) / 24);

      const updatedSession = await supabaseService.updateSession(state.session.id, {
        current_minute: finalMinutes,
        current_hour: finalHours,
        current_day: state.session.current_day + daysToAdd,
      });
      dispatch({ type: 'SET_SESSION', payload: updatedSession });

      // Check for monthly income if day changed
      if (daysToAdd > 0) {
        await checkMonthlyIncome();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to advance time' });
    }
  }, [state.session, checkMonthlyIncome]);

  const updateCustomSystemPrompt = useCallback(async (prompt: string) => {
    if (!state.session) return;
    try {
      const updated = await supabaseService.updateSession(state.session.id, {
        custom_system_prompt: prompt,
      });
      dispatch({ type: 'SET_SESSION', payload: updated });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update custom prompt' });
    }
  }, [state.session]);

  const updateCharacterInfo = useCallback(async (appearance: string, bio: string) => {
    if (!state.session) return;
    try {
      const updated = await supabaseService.updateSession(state.session.id, {
        appearance,
        bio,
      });
      dispatch({ type: 'SET_SESSION', payload: updated });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update character info' });
    }
  }, [state.session]);

  const addGameEvent = useCallback(async (event: Omit<GameEvent, 'id' | 'session_id' | 'created_at'>) => {
    if (!state.session) return;
    try {
      const newEvent = await supabaseService.saveGameEvent({
        session_id: state.session.id,
        ...event,
      });
      dispatch({ type: 'ADD_GAME_EVENT', payload: newEvent });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add game event' });
    }
  }, [state.session]);

  const updateBankBalance = useCallback(async (amount: number) => {
    if (!state.session || !state.inventory) return;
    try {
      const currentBank = state.inventory.bank_balance || 0;
      const updatedInventory = await supabaseService.updateInventory(state.session.id, {
        bank_balance: currentBank + amount
      });
      dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update bank balance' });
    }
  }, [state.session, state.inventory]);

  const transferToBank = useCallback(async (amount: number) => {
    if (!state.session || !state.inventory) return;
    if (amount <= 0 || amount > state.inventory.cash) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid transfer amount' });
      return;
    }
    try {
      const updatedInventory = await supabaseService.updateInventory(state.session.id, {
        cash: state.inventory.cash - amount,
        bank_balance: state.inventory.bank_balance + amount,
        last_bank_deposit: state.session.current_day
      });
      dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
      await addConversationMessage('System', `You deposited £${amount.toLocaleString()} into your bank account.`, 'system');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to transfer to bank' });
    }
  }, [state.session, state.inventory, addConversationMessage]);

  const withdrawFromBank = useCallback(async (amount: number) => {
    if (!state.session || !state.inventory) return;
    if (amount <= 0 || amount > state.inventory.bank_balance) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid withdrawal amount' });
      return;
    }
    try {
      const updatedInventory = await supabaseService.updateInventory(state.session.id, {
        cash: state.inventory.cash + amount,
        bank_balance: state.inventory.bank_balance - amount
      });
      dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
      await addConversationMessage('System', `You withdrew £${amount.toLocaleString()} from your bank account.`, 'system');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to withdraw from bank' });
    }
  }, [state.session, state.inventory, addConversationMessage]);

  const addVehicle = useCallback(async (vehicle: any) => {
    if (!state.session) return;
    try {
      const newVehicle = await supabaseService.createVehicle({
        ...vehicle,
        session_id: state.session.id,
      });
      dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add vehicle' });
    }
  }, [state.session]);

  const updateVehicle = useCallback(async (vehicleId: string, updates: any) => {
    try {
      const updatedVehicle = await supabaseService.updateVehicle(vehicleId, updates);
      dispatch({ type: 'UPDATE_VEHICLE', payload: updatedVehicle });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update vehicle' });
    }
  }, []);

  const setActiveVehicle = useCallback(async (vehicleId: string) => {
    if (!state.session) return;
    try {
      const updatedVehicle = await supabaseService.setActiveVehicle(state.session.id, vehicleId);
      const vehicles = await supabaseService.getVehicles(state.session.id);
      dispatch({ type: 'SET_VEHICLES', payload: vehicles });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to set active vehicle' });
    }
  }, [state.session]);

  const refuelVehicle = useCallback(async (vehicleId: string, amount: number) => {
    if (!state.inventory) return;
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const fuelCost = Math.ceil(amount * 1.5);
    if (state.inventory.cash < fuelCost) {
      dispatch({ type: 'SET_ERROR', payload: 'Not enough cash to refuel' });
      return;
    }

    try {
      const newFuelLevel = Math.min(100, vehicle.fuel_level + amount);
      await updateVehicle(vehicleId, { fuel_level: newFuelLevel });
      await updateCash(-fuelCost);
      await addConversationMessage('System', `Refueled ${vehicle.make_model} for £${fuelCost}. Fuel level: ${newFuelLevel}%`, 'system');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to refuel vehicle' });
    }
  }, [state.vehicles, state.inventory, updateCash, addConversationMessage]);

  const repairVehicle = useCallback(async (vehicleId: string, cost: number) => {
    if (!state.inventory) return;
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    if (state.inventory.cash < cost) {
      dispatch({ type: 'SET_ERROR', payload: 'Not enough cash to repair vehicle' });
      return;
    }

    try {
      const repairAmount = Math.min(100 - vehicle.condition, Math.floor(cost / 10));
      const newCondition = Math.min(100, vehicle.condition + repairAmount);
      await updateVehicle(vehicleId, { condition: newCondition });
      await updateCash(-cost);
      await addConversationMessage('System', `Repaired ${vehicle.make_model} for £${cost}. Condition: ${newCondition}%`, 'system');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to repair vehicle' });
    }
  }, [state.vehicles, state.inventory, updateCash, addConversationMessage]);

  const value: GameContextType = {
    state,
    dispatch,
    initializeGame,
    addConversationMessage,
    updateHeatLevel,
    addReputation,
    updateNPCRelationship,
    updatePlayerLocation,
    updateItemState,
    updateCash,
    updateBankBalance,
    transferToBank,
    withdrawFromBank,
    checkMonthlyIncome,
    advanceTime,
    initializeDefaultItems,
    updateCustomSystemPrompt,
    updateCharacterInfo,
    addGameEvent,
    addVehicle,
    updateVehicle,
    setActiveVehicle,
    refuelVehicle,
    repairVehicle,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const context = React.useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
