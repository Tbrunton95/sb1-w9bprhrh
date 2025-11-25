import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MapPin, DollarSign, Target, AlertCircle, User, Package, Users, Briefcase, Send, Map, Settings, Bell, Car, Smartphone, Zap, Home } from 'lucide-react';
import CharacterPanel from './CharacterPanel';
import InventoryPanel from './InventoryPanel';
import RelationshipsPanel from './RelationshipsPanel';
import ActiveDealsPanel from './ActiveDealsPanel';
import StoryPanel from './StoryPanel';
import MapPanel from './MapPanel';
import { SettingsPanel } from './SettingsPanel';
import VehiclesPanel from './VehiclesPanel';
import TelephonePanel from './TelephonePanel';
import SkillsPanel from './SkillsPanel';
import SafeHousesPanel from './SafeHousesPanel';
import TestDataButton from './TestDataButton';
import NotificationLog from './NotificationLog';
import { supabase } from '../services/supabase';
import * as supabaseService from '../services/supabase';
import StateChangeNotification, { useStateChangeNotifications } from './StateChangeNotification';

type TabType = 'inventory' | 'npcs' | 'skills' | 'deals' | 'map' | 'vehicles' | 'phone' | 'properties' | 'settings';

export default function GameContainer() {
  const { state, dispatch, addConversationMessage, updateItemState, updateHeatLevel, addReputation, updateCash, advanceTime, addVehicle, updateVehicle } = useGame();
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [enhanceRP, setEnhanceRP] = useState(false);
  const [showNotificationLog, setShowNotificationLog] = useState(false);
  const { changes, addChange } = useStateChangeNotifications();

  const handleTravel = async (locationName: string, travelTime: number) => {
    if (!state.session) return;

    try {
      setIsProcessing(true);

      await supabaseService.changeLocation(state.session.id, locationName);
      await advanceTime(travelTime);

      dispatch({
        type: 'UPDATE_SESSION',
        payload: { ...state.session, current_location: locationName },
      });

      await addConversationMessage(
        'You',
        `Travel to ${locationName}`,
        'action'
      );

      addChange({
        type: 'location',
        message: `Traveled to ${locationName}`,
        value: travelTime,
      });

      // Generate AI response about arriving at new location
      const location = await supabaseService.getLocationByName(locationName);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-narrative`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: `Arrive at ${locationName}`,
          customSystemPrompt: state.session.custom_system_prompt,
          playerCharacter: {
            name: state.session.player_name,
            appearance: state.session.appearance,
            bio: state.session.bio,
          },
          gameState: {
            location: locationName,
            locationDetails: location,
            cash: state.inventory?.cash || 0,
            bankBalance: state.inventory?.bank_balance || 0,
            reputation: state.session.reputation,
            heatLevel: state.session.heat_level,
            day: state.session.current_day,
            currentHour: state.session.current_hour,
            currentMinute: state.session.current_minute,
            dayOfWeek: state.session.day_of_week,
            month: state.session.month,
            year: state.session.year,
            season: state.session.season,
            weather: state.session.weather,
            temperature: state.session.temperature,
            inventory: state.inventory,
            equippedItems: state.itemStates.filter(i => i.equipped),
            recentConversation: state.conversationHistory.slice(-5).map(m => `${m.speaker}: ${m.message}`),
            npcConversations: state.npcConversations,
            majorEvents: state.gameEvents.filter(e => e.event_category === 'major'),
            recentEvents: state.gameEvents.filter(e => e.event_category === 'recent').slice(0, 10),
            relationships: state.relationships,
            skills: state.skills,
            safeHouses: state.safeHouses,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.narrative) {
          await addConversationMessage('Narrator', data.narrative, 'narrative');
        }
      }
    } catch (error) {
      console.error('Travel failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemAction = async (item: any, action: string) => {
    if (action === 'draw' || action === 'equip') {
      await updateItemState(item.item_id, { equipped: true });
      await addConversationMessage('System', `You ${action === 'draw' ? 'drew' : 'equipped'} ${item.item_name}`, 'system');
    } else if (action === 'holster' || action === 'unequip') {
      await updateItemState(item.item_id, { equipped: false });
      await addConversationMessage('System', `You ${action === 'holster' ? 'holstered' : 'unequipped'} ${item.item_name}`, 'system');
    }
  };

  const handleDrugUse = async (drugId: string, drugName: string, currentAmount: number) => {
    if (!state.session || !state.inventory || currentAmount <= 0) return;

    try {
      const amountUsed = drugId === 'cocaine' ? 1 : drugId === 'mdma' ? 1 : 0.5;

      const drugKeyMap: { [key: string]: string } = {
        'cocaine': 'Cocaine',
        'mdma': 'MDMA',
        'cannabis': 'Cannabis',
      };

      const dbKey = drugKeyMap[drugId];
      const newAmount = Math.max(0, currentAmount - amountUsed);

      await supabaseService.updateInventory(state.session.id, {
        drugs: {
          ...state.inventory.drugs,
          [dbKey]: newAmount,
        },
      });

      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: {
          ...state.inventory,
          drugs: {
            ...state.inventory.drugs,
            [dbKey]: newAmount,
          },
        },
      });

      await supabaseService.saveGameEvent({
        session_id: state.session.id,
        event_type: 'drug_use',
        description: `Used ${amountUsed}g of ${drugName}`,
        event_category: 'recent',
      });

      await addConversationMessage(
        'System',
        `You used ${amountUsed}g of ${drugName}`,
        'system'
      );

      addChange({
        type: 'inventory',
        message: `Used ${amountUsed}g ${drugName}`,
        value: -amountUsed,
      });
    } catch (error) {
      console.error('Failed to use drug:', error);
      addChange({
        type: 'error',
        message: 'Failed to use drug',
        value: 0,
      });
    }
  };

  const handleAction = async () => {
    if (!userInput.trim() || !state.session || isProcessing) return;

    setIsProcessing(true);
    try {
      let actionText = userInput;

      // Enhance RP dialogue if toggle is enabled
      if (enhanceRP) {
        const enhancePrompt = `Transform this player dialogue into in-character, contextually accurate speech for ${state.session.player_name}. Keep it brief and natural. Only return the transformed dialogue, nothing else.\n\nPlayer's raw input: "${userInput}"\n\nCharacter context:\n- Name: ${state.session.player_name}\n- Appearance: ${state.session.appearance || 'Not specified'}\n- Bio: ${state.session.bio || 'Not specified'}\n- Location: ${state.session.current_location}\n- Reputation: ${state.session.reputation}\n\nTransformed dialogue:`;

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const enhanceApiUrl = `${supabaseUrl}/functions/v1/generate-narrative`;

          const enhanceResponse = await fetch(enhanceApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              action: enhancePrompt,
              playerCharacter: {
                name: state.session.player_name,
                appearance: state.session.appearance,
                bio: state.session.bio,
              },
              gameState: {
                location: state.session.current_location,
                locationDetails: state.currentLocation,
                cash: state.inventory?.cash || 0,
                reputation: state.session.reputation,
                heatLevel: state.session.heat_level,
                day: state.session.current_day,
                currentHour: state.session.current_hour,
                currentMinute: state.session.current_minute,
                dayOfWeek: state.session.day_of_week,
                month: state.session.month,
                year: state.session.year,
                season: state.session.season,
                weather: state.session.weather,
                temperature: state.session.temperature,
                weapons: state.itemStates.filter(i => i.item_type === 'weapon'),
                equipment: state.itemStates.filter(i => i.item_type === 'equipment'),
                drugs: state.inventory?.drugs || {},
                equippedItems: state.itemStates.filter(i => i.equipped),
                relationships: state.relationships,
                enhanceMode: enhanceRP,
              },
            }),
          });

          if (enhanceResponse.ok) {
            const { narrative } = await enhanceResponse.json();
            actionText = narrative.replace(/^["']|["']$/g, '').trim();
          }
        } catch (error) {
          console.error('Failed to enhance RP dialogue:', error);
        }
      }

      await addConversationMessage('You', actionText, 'action');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-narrative`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: actionText,
          customSystemPrompt: state.session.custom_system_prompt,
          playerCharacter: {
            name: state.session.player_name,
            appearance: state.session.appearance,
            bio: state.session.bio,
          },
          gameState: {
            location: state.session.current_location,
            locationDetails: state.currentLocation,
            cash: state.inventory?.cash || 0,
            bankBalance: state.inventory?.bank_balance || 0,
            reputation: state.session.reputation,
            heatLevel: state.session.heat_level,
            day: state.session.current_day,
            currentHour: state.session.current_hour,
            currentMinute: state.session.current_minute,
            dayOfWeek: state.session.day_of_week,
            month: state.session.month,
            year: state.session.year,
            season: state.session.season,
            weather: state.session.weather,
            temperature: state.session.temperature,
            inventory: state.inventory,
            weapons: state.itemStates.filter(i => i.item_type === 'weapon'),
            equipment: state.itemStates.filter(i => i.item_type === 'equipment'),
            drugs: state.inventory?.drugs || {},
            equippedItems: state.itemStates.filter(i => i.equipped),
            recentConversation: state.conversationHistory.slice(-5).map(m => `${m.speaker}: ${m.message}`),
            npcConversations: state.npcConversations,
            majorEvents: state.gameEvents.filter(e => e.event_category === 'major'),
            recentEvents: state.gameEvents.filter(e => e.event_category === 'recent').slice(0, 10),
            relationships: state.relationships,
            vehicles: state.vehicles,
            skills: state.skills,
            safeHouses: state.safeHouses,
            enhanceMode: enhanceRP,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('Reasoning present?', !!data.reasoning);
      console.log('Reasoning content:', data.reasoning);

      if (data.narrative) {
        await addConversationMessage('Narrator', data.narrative, 'narrative', data.reasoning);
      }


      if (data.stateChanges) {
        const changes = data.stateChanges;

        if (changes.heat !== undefined && changes.heat !== 0) {
          // changes.heat is a DELTA, not an absolute value
          await updateHeatLevel(changes.heat);
          const newHeat = Math.max(0, Math.min(10, state.session.heat_level + changes.heat));
          addChange({
            type: 'heat',
            message: `Heat ${changes.heat > 0 ? 'increased' : 'decreased'} to ${newHeat}/10`,
            value: changes.heat,
          });
        }

        if (changes.reputation !== undefined && changes.reputation !== 0) {
          // changes.reputation is a DELTA, not an absolute value
          await addReputation(changes.reputation);
          const newRep = state.session.reputation + changes.reputation;
          addChange({
            type: 'reputation',
            message: `Reputation ${changes.reputation > 0 ? 'increased' : 'decreased'} to ${newRep}`,
            value: changes.reputation,
          });
        }

        if (changes.timeAdvance) {
          await advanceTime(changes.timeAdvance);
          addChange({
            type: 'time',
            message: `Time advanced ${changes.timeAdvance} minutes`,
            value: changes.timeAdvance,
          });
        }

        if (changes.temporalUpdates) {
          const temporalChanges = changes.temporalUpdates;
          const updates: any = {};

          if (temporalChanges.dayOfWeek) updates.day_of_week = temporalChanges.dayOfWeek;
          if (temporalChanges.month !== undefined) updates.month = temporalChanges.month;
          if (temporalChanges.year !== undefined) updates.year = temporalChanges.year;
          if (temporalChanges.season) updates.season = temporalChanges.season;
          if (temporalChanges.weather) updates.weather = temporalChanges.weather;
          if (temporalChanges.temperature !== undefined) updates.temperature = temporalChanges.temperature;

          if (Object.keys(updates).length > 0) {
            const updatedSession = await supabaseService.updateSession(state.session.id, updates);
            dispatch({ type: 'SET_SESSION', payload: updatedSession });

            if (temporalChanges.weather || temporalChanges.temperature) {
              addChange({
                type: 'other',
                message: `Weather: ${temporalChanges.weather || state.session.weather}, ${temporalChanges.temperature ?? state.session.temperature}°C`,
                value: 0,
              });
            }
          }
        }

        if (changes.inventoryChanges && state.session && state.inventory) {
          const invChanges = changes.inventoryChanges;
          const updates: any = {};

          if (invChanges.drugs && Object.keys(invChanges.drugs).length > 0) {
            const currentDrugs = state.inventory.drugs || {};
            const updatedDrugs = { ...currentDrugs };

            Object.entries(invChanges.drugs).forEach(([drug, amount]) => {
              const currentAmount = updatedDrugs[drug] || 0;
              const newAmount = currentAmount + (amount as number);
              if (newAmount <= 0) {
                delete updatedDrugs[drug];
              } else {
                updatedDrugs[drug] = newAmount;
              }
            });

            updates.drugs = updatedDrugs;

            Object.entries(invChanges.drugs).forEach(([drug, amount]) => {
              if ((amount as number) > 0) {
                addChange({
                  type: 'item',
                  message: `Acquired ${amount}g of ${drug}`,
                  value: amount as number,
                });
              } else if ((amount as number) < 0) {
                addChange({
                  type: 'item',
                  message: `Lost ${Math.abs(amount as number)}g of ${drug}`,
                  value: amount as number,
                });
              }
            });
          }

          if (invChanges.weapons && invChanges.weapons.length > 0) {
            const currentWeapons = state.inventory.weapons || [];
            const updatedWeapons = [...currentWeapons, ...invChanges.weapons];
            updates.weapons = updatedWeapons;

            invChanges.weapons.forEach((weapon: string) => {
              addChange({
                type: 'item',
                message: `Acquired ${weapon}`,
                value: 1,
              });
            });
          }

          if (invChanges.equipment && invChanges.equipment.length > 0) {
            const currentEquipment = state.inventory.equipment || [];
            const updatedEquipment = [...currentEquipment, ...invChanges.equipment];
            updates.equipment = updatedEquipment;

            invChanges.equipment.forEach((item: string) => {
              addChange({
                type: 'item',
                message: `Acquired ${item}`,
                value: 1,
              });
            });
          }

          if (Object.keys(updates).length > 0) {
            await supabaseService.updateInventory(state.session.id, updates);
            const updatedInventory = await supabaseService.getPlayerInventory(state.session.id);
            dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
          }
        }

        if (changes.cash !== undefined && changes.cash !== 0) {
          // changes.cash is a DELTA, not an absolute value
          await updateCash(changes.cash);
          addChange({
            type: 'cash',
            message: `${changes.cash > 0 ? 'Gained' : 'Lost'} £${Math.abs(changes.cash)}`,
            value: changes.cash,
          });
        }

        if (changes.equipItem && state.session) {
          const equipData = changes.equipItem;
          const { data: existingItem } = await supabase
            .from('item_states')
            .select('*')
            .eq('session_id', state.session.id)
            .eq('item_name', equipData.itemName)
            .maybeSingle();

          if (existingItem) {
            await supabase
              .from('item_states')
              .update({ equipped: true })
              .eq('id', existingItem.id);
          } else {
            await supabase
              .from('item_states')
              .insert({
                session_id: state.session.id,
                item_type: equipData.itemType,
                item_id: crypto.randomUUID(),
                item_name: equipData.itemName,
                description: equipData.description || '',
                equipped: true,
                quantity: 1,
                metadata: {},
              });
          }

          const updatedItemStates = await supabaseService.getItemStates(state.session.id);
          dispatch({ type: 'SET_ITEM_STATES', payload: updatedItemStates });

          addChange({
            type: 'item',
            message: `Equipped ${equipData.itemName}`,
            value: 1,
          });
        }

        if (changes.equipItems && Array.isArray(changes.equipItems) && changes.equipItems.length > 0 && state.session) {
          for (const equipData of changes.equipItems) {
            const { data: existingItem } = await supabase
              .from('item_states')
              .select('*')
              .eq('session_id', state.session.id)
              .eq('item_name', equipData.itemName)
              .maybeSingle();

            if (existingItem) {
              await supabase
                .from('item_states')
                .update({ equipped: true })
                .eq('id', existingItem.id);
            } else {
              await supabase
                .from('item_states')
                .insert({
                  session_id: state.session.id,
                  item_type: equipData.itemType,
                  item_id: crypto.randomUUID(),
                  item_name: equipData.itemName,
                  description: equipData.description || '',
                  equipped: true,
                  quantity: 1,
                  metadata: {},
                });
            }

            addChange({
              type: 'item',
              message: `Equipped ${equipData.itemName}`,
              value: 1,
            });
          }

          const updatedItemStates = await supabaseService.getItemStates(state.session.id);
          dispatch({ type: 'SET_ITEM_STATES', payload: updatedItemStates });
        }

        if (changes.unequipItems && Array.isArray(changes.unequipItems) && changes.unequipItems.length > 0 && state.session) {
          for (const unequipData of changes.unequipItems) {
            const itemName = typeof unequipData === 'string' ? unequipData : unequipData.itemName;

            const { data: existingItem } = await supabase
              .from('item_states')
              .select('*')
              .eq('session_id', state.session.id)
              .eq('item_name', itemName)
              .maybeSingle();

            if (existingItem) {
              await supabase
                .from('item_states')
                .update({ equipped: false })
                .eq('id', existingItem.id);

              addChange({
                type: 'item',
                message: `Unequipped ${itemName}`,
                value: -1,
              });
            }
          }

          const updatedItemStates = await supabaseService.getItemStates(state.session.id);
          dispatch({ type: 'SET_ITEM_STATES', payload: updatedItemStates });
        }
      }

      if (data.createNPC && state.session) {
        const npcData = data.createNPC;
        console.log('Creating NPC:', npcData);
        try {
          const { data: existingNPC, error: checkError } = await supabase
            .from('npcs')
            .select('id')
            .eq('name', npcData.name)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking for existing NPC:', checkError);
            throw checkError;
          }

          if (!existingNPC) {
            console.log('NPC does not exist, creating new NPC...');
            const isSignificant = npcData.significance === 'major' || npcData.significance === 'moderate';
            const { data: newNPC, error: insertError } = await supabase
              .from('npcs')
              .insert([{
                name: npcData.name,
                role: npcData.role,
                location: state.location || 'Unknown',
                appearance: npcData.appearance || '',
                personality: npcData.personality || '',
                story_importance: npcData.significance || 'moderate',
                is_significant: isSignificant,
                first_met_day: state.day || 1,
              }])
              .select()
              .single();

            if (insertError) {
              console.error('Error inserting NPC:', insertError);
              throw insertError;
            }

            if (newNPC) {
              console.log('NPC created successfully:', newNPC);
              const { error: relError } = await supabase
                .from('relationships')
                .insert([{
                  session_id: state.session.id,
                  npc_id: newNPC.id,
                  npc_name: npcData.name,
                  trust_score: 50,
                  trust_level: 50,
                  status: 'neutral',
                  interaction_count: 0,
                  last_interaction_day: state.day || 1,
                }]);

              if (relError) {
                console.error('Error creating NPC relationship:', relError);
                throw relError;
              }

              const relationships = await supabaseService.getRelationships(state.session.id);
              dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });

              addChange({
                type: 'npc',
                message: `Met ${npcData.name}`,
                value: 1,
              });
            }
          } else {
            console.log('NPC already exists:', existingNPC);

            const existingRelationship = state.relationships.find(r => r.npc_id === existingNPC.id);

            if (!existingRelationship) {
              console.log('Creating relationship for existing NPC...');
              const { error: relError } = await supabase
                .from('relationships')
                .insert([{
                  session_id: state.session.id,
                  npc_id: existingNPC.id,
                  npc_name: npcData.name,
                  trust_score: 50,
                  trust_level: 50,
                  status: 'neutral',
                  interaction_count: 0,
                  last_interaction_day: state.day || 1,
                }]);

              if (relError) {
                console.error('Error creating relationship for existing NPC:', relError);
              } else {
                console.log('Relationship created successfully');
                const relationships = await supabaseService.getRelationships(state.session.id);
                dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });

                addChange({
                  type: 'npc',
                  message: `Connected with ${npcData.name}`,
                  value: 1,
                });
              }
            } else {
              console.log('Relationship already exists for this NPC');
            }
          }
        } catch (error) {
          console.error('Failed to create NPC:', error);
          addChange({
            type: 'error',
            message: `Failed to create NPC: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value: 0,
          });
        }
      }

      if (data.createDeal && state.session) {
        const deal = data.createDeal;
        try {
          let npcId = null;

          if (deal.npcName) {
            const { data: npc } = await supabase
              .from('npcs')
              .select('id')
              .eq('name', deal.npcName)
              .maybeSingle();

            if (npc) {
              npcId = npc.id;
            }
          }

          const totalValue = deal.quantity * deal.pricePerUnit;

          await supabase.from('active_deals').insert([{
            session_id: state.session.id,
            npc_id: npcId,
            deal_type: deal.dealType,
            item: deal.item,
            quantity: deal.quantity,
            price_per_unit: deal.pricePerUnit,
            total_value: totalValue,
            risk_level: deal.riskLevel || 5,
            status: 'pending',
            start_day: state.session.current_day,
            due_day: deal.dueDay || (state.session.current_day + 7),
            location: deal.location || state.session.current_location,
          }]);

          const activeDeals = await supabaseService.getActiveDeals(state.session.id);
          dispatch({ type: 'SET_ACTIVE_DEALS', payload: activeDeals });

          addChange({
            type: 'deal',
            message: `New deal available: ${deal.item}`,
            value: totalValue,
          });
        } catch (error) {
          console.error('Failed to create deal:', error);
        }
      }

      if (data.createVehicle && state.session) {
        const vehicleData = data.createVehicle;
        try {
          await addVehicle({
            vehicle_type: vehicleData.vehicleType,
            make_model: vehicleData.makeModel,
            registration: vehicleData.registration || null,
            color: vehicleData.color,
            fuel_level: vehicleData.fuelLevel || 100,
            condition: vehicleData.condition || 100,
            is_stolen: vehicleData.isStolen || false,
            is_active: true,
            parked_location: vehicleData.parkedLocation || null,
            storage_location: vehicleData.storageLocation || null,
            insurance_status: 'none',
            modifications: {},
            metadata: {},
            purchase_price: 0,
          });

          addChange({
            type: 'vehicle',
            message: `Acquired ${vehicleData.makeModel}`,
            value: 1,
          });
        } catch (error) {
          console.error('Failed to create vehicle:', error);
        }
      }

      if (data.updateVehicle && state.session) {
        const updateData = data.updateVehicle;
        try {
          const updates: any = {};
          if (updateData.parkedLocation !== undefined) updates.parked_location = updateData.parkedLocation;
          if (updateData.fuelLevel !== undefined) updates.fuel_level = updateData.fuelLevel;
          if (updateData.condition !== undefined) updates.condition = updateData.condition;

          if (Object.keys(updates).length > 0 && updateData.vehicleId) {
            await updateVehicle(updateData.vehicleId, updates);
          } else if (Object.keys(updates).length > 0) {
            const activeVehicle = state.vehicles.find(v => v.is_active);
            if (activeVehicle) {
              await updateVehicle(activeVehicle.id, updates);
            }
          }
        } catch (error) {
          console.error('Failed to update vehicle:', error);
        }
      }

      setUserInput('');
    } catch (error) {
      console.error('Failed to process action:', error);
      await addConversationMessage('System', 'Failed to process your action. Please try again.', 'system');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSuggestedActions = () => {
    const actions: string[] = [];

    if (state.session) {
      if (state.session.heat_level > 6) {
        actions.push('Lay low for a while');
      }
      if (state.itemStates.some(i => i.equipped && i.item_name.includes('Gun'))) {
        actions.push('Look for business opportunities');
      }
      actions.push('Talk to someone nearby');
      actions.push('Assess the situation');
    }

    return actions.slice(0, 4);
  };

  if (!state.session || !state.inventory) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary font-mono">Loading...</h1>
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  const suggestedActions = getSuggestedActions();

  return (
    <div className="min-h-screen bg-background text-foreground scanline-bg p-3 md:p-6">
      <StateChangeNotification changes={changes} />
      {showNotificationLog && (
        <NotificationLog changes={changes} onClose={() => setShowNotificationLog(false)} />
      )}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(120,255,180,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(255,200,100,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-[2000px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/50">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h1 className="font-mono text-2xl md:text-3xl font-black tracking-tighter text-primary neon-glow">
                {state.session.player_name.toUpperCase()}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground font-mono tracking-wide">
              {state.session.current_location} • Reputation: {state.session.reputation}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotificationLog(true)}
              className="relative p-2 bg-secondary/50 border border-border/50 rounded-lg hover:bg-secondary hover:border-primary/50 transition-all group"
              title="View Notification Log"
            >
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              {changes.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {changes.length > 99 ? '99+' : changes.length}
                </div>
              )}
            </button>
            <div className="text-right">
              <div className="font-mono text-xs text-muted-foreground">DAY {state.session.current_day}</div>
              <div className="font-mono text-lg font-bold text-primary">
                {String(state.session.current_hour).padStart(2, '0')}:{String(state.session.current_minute).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="space-y-4 lg:col-span-3 lg:space-y-6 max-h-[calc(100vh-150px)] overflow-y-auto">
            <CharacterPanel
              session={state.session}
              inventory={state.inventory}
              location={state.currentLocation}
              onLocationClick={() => setActiveTab('map')}
            />

            <div className="glass-panel overflow-hidden">
              <div className="flex border-b border-border/50 bg-secondary/30">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'inventory'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Gear
                </button>
                <button
                  onClick={() => setActiveTab('npcs')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'npcs'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Network
                </button>
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'skills'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Skills
                </button>
              </div>
              <div className="p-4">
                {activeTab === 'inventory' && <InventoryPanel inventory={state.inventory} itemStates={state.itemStates} onItemAction={handleItemAction} onDrugUse={handleDrugUse} />}
                {activeTab === 'npcs' && <RelationshipsPanel relationships={state.relationships} />}
                {activeTab === 'skills' && <SkillsPanel skills={state.skills} />}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-6 lg:space-y-6">
            <StoryPanel
              messages={state.conversationHistory}
              session={state.session}
              location={state.currentLocation}
              isProcessing={isProcessing}
              userInput={userInput}
              onInputChange={setUserInput}
              onSubmit={handleAction}
              enhanceRP={enhanceRP}
              onEnhanceRPChange={setEnhanceRP}
              suggestedActions={suggestedActions}
            />

            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition">
                  <input
                    type="checkbox"
                    checked={enhanceRP}
                    onChange={(e) => setEnhanceRP(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary"
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">Enhance RP</span>
                </label>
                {enhanceRP && (
                  <span className="text-xs text-primary/70 italic font-mono">
                    (Transform to character speech)
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAction()}
                  placeholder="What do you do?"
                  className="flex-1 px-4 py-3 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleAction}
                  disabled={isProcessing || !userInput.trim()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded font-mono font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  ACT
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserInput(action)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-secondary border border-border rounded text-xs text-secondary-foreground hover:bg-secondary/80 hover:border-primary/30 transition disabled:opacity-50 font-mono"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3 lg:space-y-6">
            <div className="glass-panel overflow-hidden">
              <div className="flex border-b border-border/50 bg-secondary/30">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'map'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Map
                </button>
                <button
                  onClick={() => setActiveTab('deals')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'deals'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Deals
                </button>
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'vehicles'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Cars
                </button>
                <button
                  onClick={() => setActiveTab('phone')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'phone'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Phone
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'properties'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Cribs
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase transition ${
                    activeTab === 'settings'
                      ? 'bg-card text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Config
                </button>
              </div>
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {activeTab === 'map' && (
                  <MapPanel
                    currentLocationName={state.session?.current_location || 'East End'}
                    onTravel={handleTravel}
                  />
                )}
                {activeTab === 'deals' && (
                  <ActiveDealsPanel
                    deals={state.activeDeals}
                    currentDay={state.session?.current_day || 1}
                    currentHour={state.session?.current_hour || 0}
                  />
                )}
                {activeTab === 'vehicles' && <VehiclesPanel vehicles={state.vehicles} />}
                {activeTab === 'phone' && (
                  <TelephonePanel
                    relationships={state.relationships}
                    activeDeals={state.activeDeals}
                    vehicles={state.vehicles}
                    currentLocation={state.session?.current_location || 'Unknown'}
                  />
                )}
                {activeTab === 'properties' && <SafeHousesPanel safeHouses={state.safeHouses} />}
                {activeTab === 'settings' && <SettingsPanel />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TestDataButton />
    </div>
  );
}
