import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NarrativeRequest {
  action: string;
  customSystemPrompt?: string;
  playerCharacter: {
    name: string;
    appearance: string;
    bio: string;
  };
  gameState: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.text();
      if (!requestBody || requestBody.trim().length === 0) {
        throw new Error('Empty request body');
      }
    } catch (readError) {
      console.error('Error reading request body:', readError);
      throw new Error(`Failed to read request body: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
    }

    let parsedRequest;
    try {
      parsedRequest = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Request body preview:', requestBody.substring(0, 500));
      throw new Error(`Invalid JSON in request body: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    const { action, customSystemPrompt, playerCharacter, gameState }: NarrativeRequest = parsedRequest;

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const buildContextPrompt = () => {
      let context = `## PLAYER CHARACTER\n`;
      context += `Name: ${playerCharacter.name}\n`;
      if (playerCharacter.appearance) {
        context += `Appearance: ${playerCharacter.appearance}\n`;
      }
      if (playerCharacter.bio) {
        context += `Bio: ${playerCharacter.bio}\n`;
      }

      context += `\n## CURRENT GAME STATE\n`;
      context += `Location: ${gameState.location}\n`;
      if (gameState.locationDetails) {
        context += `Location Description: ${gameState.locationDetails.description}\n`;
      }

      const hour = gameState.currentHour || 0;
      const minute = gameState.currentMinute || 0;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[(gameState.month || 11) - 1] || 'November';

      context += `Current Date & Time: ${gameState.dayOfWeek || 'Monday'}, ${gameState.day} ${monthName} ${gameState.year || 2024}, ${formattedTime}\n`;
      context += `Season: ${gameState.season || 'Autumn'}\n`;
      context += `Weather: ${gameState.weather || 'Overcast'}, ${gameState.temperature || 12}°C\n`;
      context += `Cash on Hand: £${gameState.cash}\n`;
      context += `Bank Balance: £${gameState.bankBalance || 0}\n`;
      context += `Total Net Worth: £${(gameState.cash || 0) + (gameState.bankBalance || 0)}\n`;
      context += `Reputation: ${gameState.reputation}/100\n`;
      context += `Heat Level: ${gameState.heatLevel}/10\n`;

      if (gameState.inventory || gameState.weapons || gameState.equipment || gameState.drugs) {
        context += `\n## INVENTORY\n`;

        if (gameState.drugs && Object.keys(gameState.drugs).length > 0) {
          context += `Drugs:\n`;
          Object.entries(gameState.drugs).forEach(([drug, amount]: [string, any]) => {
            context += `  - ${drug}: ${amount}g\n`;
          });
        }

        if (gameState.weapons && gameState.weapons.length > 0) {
          context += `Weapons:\n`;
          gameState.weapons.forEach((weapon: any) => {
            context += `  - ${weapon.item_name}${weapon.metadata?.ammo !== undefined ? ` (${weapon.metadata.ammo} rounds)` : ''}\n`;
          });
        }

        if (gameState.equipment && gameState.equipment.length > 0) {
          context += `Equipment:\n`;
          gameState.equipment.forEach((item: any) => {
            context += `  - ${item.item_name}\n`;
          });
        }

        if (gameState.equippedItems && gameState.equippedItems.length > 0) {
          context += `\nCurrently Equipped:\n`;
          gameState.equippedItems.forEach((item: any) => {
            const itemType = item.item_type === 'weapon' ? 'Drawn' : 'Equipped';
            context += `  - ${item.item_name} (${itemType})\n`;
          });
        }
      }

      if (gameState.relationships && gameState.relationships.length > 0) {
        context += `\n## KEY RELATIONSHIPS\n`;
        gameState.relationships
          .sort((a: any, b: any) => b.trust_score - a.trust_score)
          .slice(0, 5)
          .forEach((rel: any) => {
            context += `  - ${rel.npc_name}: Trust ${rel.trust_score}/100 (${rel.status})\n`;
          });
      }

      if (gameState.npcConversations && gameState.npcConversations.length > 0) {
        context += `\n## RECENT NPC CONVERSATIONS\n`;
        gameState.npcConversations.slice(-3).forEach((conv: any) => {
          context += `${conv.npc_name} [Day ${conv.day}]: "${conv.player_message}" → "${conv.npc_response}"\n`;
        });
      }

      if (gameState.recentConversation && gameState.recentConversation.length > 0) {
        context += `\n## RECENT CONVERSATION\n`;
        gameState.recentConversation.forEach((msg: string) => {
          context += `${msg}\n`;
        });
      }

      if (gameState.majorEvents && gameState.majorEvents.length > 0) {
        context += `\n## MAJOR STORY EVENTS\n`;
        gameState.majorEvents.slice(-5).forEach((event: any) => {
          context += `  - Day ${event.day || 'Unknown'}: ${event.description}\n`;
        });
      }

      if (gameState.recentEvents && gameState.recentEvents.length > 0) {
        context += `\n## RECENT EVENTS\n`;
        gameState.recentEvents.forEach((event: any) => {
          context += `  - ${event.description}\n`;
        });
      }

      if (gameState.vehicles && gameState.vehicles.length > 0) {
        context += `\n## VEHICLES\n`;
        gameState.vehicles.forEach((vehicle: any) => {
          context += `  - ${vehicle.name}`;
          if (vehicle.location) context += ` (at ${vehicle.location})`;
          if (vehicle.condition) context += ` - Condition: ${vehicle.condition}%`;
          context += `\n`;
        });
      }

      return context;
    };

    const buildConversationMessages = () => {
      const npcInstructionsPath = new URL('./npc-instructions.txt', import.meta.url).pathname;
      let npcInstructions = '';
      try {
        npcInstructions = Deno.readTextFileSync(npcInstructionsPath);
      } catch (error) {
        console.error('Failed to load NPC instructions:', error);
      }

      const baseSystemPrompt = `You are the narrator and all NPCs in a gritty crime RPG set in London, UK. The player is building their criminal empire from nothing.

${npcInstructions}

## RESPONSE FORMAT
ALWAYS respond with valid JSON in this structure:
{
  "narrative": "Your narrative response here",
  "stateChanges": {
    "heat": 0,
    "reputation": 0,
    "timeAdvance": 0,
    "temporalUpdates": {
      "dayOfWeek": "Monday",
      "month": 11,
      "year": 2024,
      "season": "Autumn",
      "weather": "Overcast",
      "temperature": 12
    },
    "inventoryChanges": {
      "cashDelta": 0,
      "bankDelta": 0,
      "drugsChanges": {},
      "itemsAdded": [],
      "itemsRemoved": []
    }
  },
  "createNPC": {
    "name": "NPC Name",
    "role": "Their role",
    "personality": "Their personality",
    "appearance": "Physical description",
    "bio": "Background story",
    "location": "Where they operate"
  },
  "updateRelationship": {
    "npcName": "NPC Name",
    "trustDelta": 5
  },
  "createDeal": {
    "dealType": "buy" or "sell",
    "item": "Product name",
    "quantity": 100,
    "pricePerUnit": 50,
    "riskLevel": 5,
    "dueDay": 8,
    "location": "Deal location",
    "npcName": "NPC Name"
  }
}

## STATE CHANGE RULES
- heat: Delta from -3 to +3. Increase for risky actions, crimes, violence. Decrease when laying low.
- reputation: Delta from -10 to +10. Successful deals increase it, betrayals/failures decrease it.
- timeAdvance: Minutes passed (typically 5-60). Phone calls: 5-15 min, meetings: 30-60 min, travel handled separately.
- cashDelta/bankDelta: Money changes (can be negative). Use positive for gains, negative for costs.
- drugsChanges: Object with drug names as keys and delta amounts as values (e.g., {"Cocaine": -10, "MDMA": 50})

## TEMPORAL UPDATES
You MUST update these fields when appropriate:
- dayOfWeek: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- month: 1-12
- year: Current year
- season: Winter (Dec-Feb), Spring (Mar-May), Summer (Jun-Aug), Autumn (Sep-Nov)
- weather: Clear, Cloudy, Overcast, Light Rain, Heavy Rain, Drizzle, Foggy, Stormy
- temperature: Realistic for London and season (-5 to 30°C)

Update weather occasionally for realism. Change season/month when time passes significantly.

## NPC CREATION
Only include createNPC when introducing a NEW significant character. Include their name, role, personality, appearance, bio, and primary location.

## DEAL CREATION
Only include createDeal when an NPC offers a specific transaction. Include all deal terms: type, item, quantity, price, risk, deadline, location, and NPC name.

## NARRATIVE STYLE
- Write in second person present tense
- Be concise but atmospheric
- Show don't tell
- Include sensory details
- Realistic London street slang when appropriate
- NPCs should have distinct voices and personalities`;

      const systemPrompt = customSystemPrompt
        ? `${baseSystemPrompt}\n\n## ADDITIONAL INSTRUCTIONS\n${customSystemPrompt}`
        : baseSystemPrompt;

      return [
        {
          role: "user",
          content: `${systemPrompt}\n\n${buildContextPrompt()}\n\n## PLAYER ACTION\n${action}\n\nRespond with valid JSON only.`,
        },
      ];
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: buildConversationMessages(),
        temperature: 0.8,
        max_tokens: 4000,
        reasoning: {
          effort: "high"
        },
        provider: {
          order: ["Anthropic"],
          allow_fallbacks: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response:', JSON.stringify(data, null, 2));

    let content = data.choices[0].message.content;
    let reasoning = null;

    const message = data.choices[0].message;

    if (message.reasoning) {
      reasoning = message.reasoning;
      console.log('Extended thinking detected (reasoning):', reasoning.substring(0, 200));
    }
    else if (message.reasoning_content) {
      reasoning = message.reasoning_content;
      console.log('Extended thinking detected (reasoning_content):', reasoning.substring(0, 200));
    }
    else if (message.thinking) {
      reasoning = message.thinking;
      console.log('Extended thinking detected (thinking):', reasoning.substring(0, 200));
    }
    else if (Array.isArray(message.content)) {
      const thinkingBlock = message.content.find((block: any) => block.type === 'thinking');
      if (thinkingBlock) {
        reasoning = thinkingBlock.thinking || thinkingBlock.text;
        console.log('Extended thinking detected (content block):', reasoning.substring(0, 200));
      }
    }
    else if (typeof content === 'string') {
      const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        reasoning = thinkingMatch[1].trim();
        content = content.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '').trim();
        console.log('Extended thinking extracted from <thinking> tags:', reasoning.substring(0, 200));
      }
    }

    if (!reasoning) {
      console.log('No extended thinking found in response. Message keys:', Object.keys(message));
      console.log('Content type:', typeof content);
      console.log('Content preview:', typeof content === 'string' ? content.substring(0, 300) : content);
    }

    console.log('Raw content before parsing:', content);

    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse LLM JSON:', error);
      console.error('Content was:', content);
      parsedContent = {
        narrative: content,
        stateChanges: {
          reputation: 0,
          heat: 0,
        },
      };
    }

    const responseData: any = {
      narrative: parsedContent.narrative || content,
      stateChanges: parsedContent.stateChanges || {},
    };

    if (reasoning) {
      responseData.reasoning = reasoning;
    }

    if (parsedContent.createNPC) {
      responseData.createNPC = parsedContent.createNPC;
    }

    if (parsedContent.updateRelationship) {
      responseData.updateRelationship = parsedContent.updateRelationship;
    }

    if (parsedContent.createDeal) {
      responseData.createDeal = parsedContent.createDeal;
    }

    console.log('Sending response:', JSON.stringify(responseData, null, 2));

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in generate-narrative function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        narrative: 'The story momentarily fades... (An error occurred processing your action)',
        stateChanges: {},
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});