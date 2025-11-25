import React from 'react';
import { Beaker } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useGame } from '../context/GameContext';

export default function TestDataButton() {
  const { state } = useGame();

  const createTestData = async () => {
    if (!state.session) {
      alert('No active session');
      return;
    }

    try {
      const testNPCs = [
        {
          name: 'Tyrell',
          role: 'Supplier',
          location: 'Brixton',
          appearance: 'Mid-20s, North Face puffer, gold chain',
          personality: 'Professional plug with good connects',
          story_importance: 'major',
          first_met_day: state.session.current_day
        },
        {
          name: 'Jazmine',
          role: 'Customer',
          location: 'Shoreditch',
          appearance: 'Early 30s, designer clothes, always busy',
          personality: 'Regular buyer, reliable payments',
          story_importance: 'moderate',
          first_met_day: state.session.current_day
        },
        {
          name: 'Kyan',
          role: 'Runner',
          location: 'East End',
          appearance: 'Young, trackie, always on e-bike',
          personality: 'Eager younger, wants to prove himself',
          story_importance: 'moderate',
          first_met_day: state.session.current_day
        }
      ];

      for (const npcData of testNPCs) {
        const { data: existingNPC } = await supabase
          .from('npcs')
          .select('id, name')
          .eq('name', npcData.name)
          .maybeSingle();

        let npcId;
        let npcName;

        if (!existingNPC) {
          const { data: newNPC } = await supabase
            .from('npcs')
            .insert([npcData])
            .select()
            .maybeSingle();
          npcId = newNPC?.id;
          npcName = newNPC?.name;
        } else {
          npcId = existingNPC.id;
          npcName = existingNPC.name;
        }

        if (npcId && npcName) {
          const { data: existingRel } = await supabase
            .from('relationships')
            .select('id')
            .eq('session_id', state.session.id)
            .eq('npc_id', npcId)
            .maybeSingle();

          if (!existingRel) {
            await supabase
              .from('relationships')
              .insert([{
                session_id: state.session.id,
                npc_id: npcId,
                npc_name: npcName,
                trust_score: Math.floor(Math.random() * 40) + 30,
                status: 'neutral',
                interaction_count: 0,
                last_interaction: '',
              }]);
          }
        }
      }

      const { data: allNPCs } = await supabase
        .from('npcs')
        .select('id, name')
        .in('name', testNPCs.map(n => n.name));

      if (allNPCs && allNPCs.length > 0) {
        const testDeals = [
          {
            session_id: state.session.id,
            npc_id: allNPCs.find(n => n.name === 'Tyrell')?.id,
            deal_type: 'buy',
            item: 'Cocaine',
            quantity: 100,
            price_per_unit: 80,
            total_value: 8000,
            risk_level: 7,
            status: 'pending',
            start_day: state.session.current_day,
            due_day: state.session.current_day + 3,
            location: 'Brixton Market'
          },
          {
            session_id: state.session.id,
            npc_id: allNPCs.find(n => n.name === 'Jazmine')?.id,
            deal_type: 'sell',
            item: 'MDMA',
            quantity: 50,
            price_per_unit: 120,
            total_value: 6000,
            risk_level: 4,
            status: 'active',
            start_day: state.session.current_day - 1,
            due_day: state.session.current_day + 2,
            location: 'Shoreditch Club'
          }
        ];

        await supabase.from('active_deals').insert(testDeals);

        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('session_id', state.session.id)
          .maybeSingle();

        if (!existingVehicle) {
          await supabase.from('vehicles').insert([{
            session_id: state.session.id,
            vehicle_type: 'car',
            make_model: 'Audi A4 Black Edition',
            registration: 'LD24 KTZ',
            color: 'Midnight Black',
            fuel_level: 75,
            condition: 95,
            is_stolen: false,
            is_active: true,
            parked_location: 'Kensington Underground Car Park',
            insurance_status: 'full',
            purchase_price: 35000,
            modifications: {
              tinted_windows: true,
              upgraded_sound: true,
              performance_exhaust: false
            }
          }]);
        }
      }

      alert('Test data created! Refresh the page to see NPCs, deals, and vehicle.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to create test data:', error);
      alert('Failed to create test data. Check console.');
    }
  };

  return (
    <button
      onClick={createTestData}
      className="fixed bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg z-50 transition"
      title="Create Test Data"
    >
      <Beaker className="w-5 h-5" />
    </button>
  );
}
