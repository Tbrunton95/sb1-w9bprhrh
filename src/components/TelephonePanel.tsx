import React, { useState } from 'react';
import { Smartphone, MessageCircle, Users, ShoppingBag, Briefcase, MapPin, X, Send, Instagram, TrendingUp, Phone, Search, Navigation, PhoneCall, Clock, AlertCircle, Trash2, MoreVertical } from 'lucide-react';
import { Relationship, ActiveDeal, Vehicle } from '../types/game';
import { useGame } from '../context/GameContext';
import * as supabaseService from '../services/supabase';

interface TelephonePanelProps {
  relationships: Relationship[];
  activeDeals: ActiveDeal[];
  vehicles: Vehicle[];
  currentLocation: string;
}

type PhoneScreen = 'home' | 'messages' | 'contacts' | 'socials' | 'deals' | 'shop' | 'chat' | 'maps' | 'calls' | 'search' | 'calling';

interface CallHistory {
  contact: string;
  time: string;
  duration: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

const LONDON_LOCATIONS = [
  { name: 'East End', description: 'Your manor, familiar streets', danger: 3, distance: 0 },
  { name: 'Brixton', description: 'Market vibes, plug central', danger: 5, distance: 8 },
  { name: 'Shoreditch', description: 'Gentrified, rich clientele', danger: 2, distance: 4 },
  { name: 'Peckham', description: 'Real ends, proper road', danger: 7, distance: 6 },
  { name: 'Camden', description: 'Tourists and Camden Market', danger: 4, distance: 5 },
  { name: 'Kensington', description: 'Rich area, penthouse territory', danger: 1, distance: 7 },
  { name: 'Hackney', description: 'Gentrifying, mixed crowd', danger: 5, distance: 3 },
  { name: 'Croydon', description: 'South London hub', danger: 6, distance: 12 },
];

export default function TelephonePanel({ relationships, activeDeals, vehicles, currentLocation }: TelephonePanelProps) {
  const { state, dispatch } = useGame();
  const [screen, setScreen] = useState<PhoneScreen>('home');
  const [selectedContact, setSelectedContact] = useState<Relationship | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{sender: string; message: string; time: string; thinking?: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [callHistory] = useState<CallHistory[]>([
    { contact: 'Tyrell', time: '2 hours ago', duration: '2:34', type: 'outgoing' },
    { contact: 'Jazmine', time: '5 hours ago', duration: '0:45', type: 'incoming' },
    { contact: 'Unknown', time: 'Yesterday', duration: 'Missed', type: 'missed' },
  ]);

  const unreadMessages = relationships.filter(r => r.trust_score > 60).length;
  const unreadDeals = activeDeals.filter(d => d.status === 'pending').length;

  const openChat = async (contact: Relationship) => {
    setSelectedContact(contact);
    setScreen('chat');

    if (state.session && contact.npc?.id) {
      try {
        const conversations = await supabaseService.getNPCConversations(state.session.id, contact.npc.id);

        const history = conversations.flatMap(conv => [
          {
            sender: 'You',
            message: conv.player_message,
            time: new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            sender: contact.npc?.name || 'Unknown',
            message: conv.npc_response,
            time: new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setChatHistory(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setChatHistory([]);
      }
    }
  };

  const deleteConversation = async (contact: Relationship) => {
    if (!state.session || !contact.npc?.id) return;

    try {
      await supabaseService.deleteNPCConversations(state.session.id, contact.npc.id);
      setChatHistory([]);

      const updatedConversations = await supabaseService.getNPCConversations(state.session.id);
      dispatch({ type: 'SET_NPC_CONVERSATIONS', payload: updatedConversations });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || !state.session) return;

    const newMsg = {
      sender: 'You',
      message: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory([...chatHistory, newMsg]);
    const userMessage = messageInput;
    setMessageInput('');
    setIsGenerating(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-narrative`;

      const npcContext = `You are ${selectedContact.npc?.name || 'an NPC'}, a ${selectedContact.npc?.role || 'contact'} in London. ${selectedContact.npc?.personality || 'You are street-smart and cautious.'}

Current relationship: Trust ${selectedContact.trust_score}/100, Status: ${selectedContact.status}

CRITICAL INSTRUCTIONS FOR TEXT MESSAGING:
- You are replying to a TEXT MESSAGE on a phone
- DO NOT use JSON format - just write plain text
- Reply ONLY with the actual text message - NO narration, NO descriptions, NO scene setting
- Keep it SHORT (1-2 sentences max) like a real text
- Use modern UK slang naturally and authentically
- NO phrases like "Marcus replies:", "You see:", "The phone shows:", etc.
- Just write what ${selectedContact.npc?.name} would actually TYPE in the message
- Be direct and to the point like real texting
- DO NOT include any JSON, metadata, or structured data
- Your entire response should be ONLY the text message content

EXAMPLES OF GOOD RESPONSES:
"Yeah can sort. £1.8k per, 90 flat for the lot. Usual spot, 2 hours?"
"Nah fam not rn. Hit me up next week yeah"
"Safe. Meet at the car park 10pm"

EXAMPLES OF BAD RESPONSES (DO NOT DO THIS):
"Marcus replies quickly: 'Yeah can sort.' He's being cautious as usual."
"The message comes through. Marcus says he can help."
"Your phone buzzes. Marcus: 'Yeah' - short and sweet as always."
{"type": "text_message", "content": "Yeah can sort"}
{ "relationship_change": 0, "content": "Yeah fam" }`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: `${selectedContact.npc?.name} responds to message: "${userMessage}"`,
          customSystemPrompt: npcContext,
          playerCharacter: {
            name: state.session.player_name,
            appearance: state.session.appearance || '',
            bio: state.session.bio || '',
          },
          gameState: {
            location: state.session.current_location,
            cash: state.inventory?.cash || 0,
            reputation: state.session.reputation,
            heatLevel: state.session.heat_level,
            day: state.session.current_day,
            currentHour: state.session.current_hour,
            currentMinute: state.session.current_minute,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Phone message API response:', data);

        let npcReply = "Seen. I'll check that for you fam.";

        if (data.narrative) {
          try {
            const parsed = JSON.parse(data.narrative);
            if (parsed.type === 'text_message' && parsed.content) {
              npcReply = parsed.content;
            } else {
              npcReply = data.narrative;
            }
          } catch {
            npcReply = data.narrative;
          }
        }

        setChatHistory(prev => [...prev, {
          sender: selectedContact.npc?.name || 'Unknown',
          message: npcReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thinking: data.reasoning
        }]);

        if (state.session && selectedContact.npc?.id) {
          await supabaseService.saveNPCConversation({
            session_id: state.session.id,
            npc_id: selectedContact.npc.id,
            player_message: userMessage,
            npc_response: npcReply,
            conversation_day: state.session.current_day,
          });

          const updatedConversations = await supabaseService.getNPCConversations(state.session.id);
          dispatch({ type: 'SET_NPC_CONVERSATIONS', payload: updatedConversations });
        }
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.error('Message send error:', error);
      setChatHistory(prev => [...prev, {
        sender: selectedContact.npc?.name || 'Unknown',
        message: "Seen. I'll get back to you yeah.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const startCall = (contact: Relationship) => {
    setSelectedContact(contact);
    setScreen('calling');
    setTimeout(() => {
      setScreen('contacts');
      alert(`Call ended with ${contact.npc?.name}. This feature will be fully implemented soon.`);
    }, 3000);
  };

  const filterContent = (query: string) => {
    const q = query.toLowerCase();
    const results = {
      contacts: relationships.filter(r =>
        r.npc?.name?.toLowerCase().includes(q) ||
        r.npc?.role?.toLowerCase().includes(q)
      ),
      deals: activeDeals.filter(d =>
        d.item.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      ),
      locations: LONDON_LOCATIONS.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      )
    };
    return results;
  };

  const renderHomeScreen = () => (
    <div className="p-4 space-y-3">
      <div className="text-center mb-4">
        <div className="text-xs font-mono text-muted-foreground mb-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
        <div className="text-3xl font-mono font-black text-foreground">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setScreen('messages')}
          className="relative flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 rounded-xl transition"
        >
          <MessageCircle className="w-6 h-6 text-blue-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Messages</span>
          {unreadMessages > 0 && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadMessages}
            </div>
          )}
        </button>

        <button
          onClick={() => setScreen('contacts')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 rounded-xl transition"
        >
          <Users className="w-6 h-6 text-green-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Contacts</span>
        </button>

        <button
          onClick={() => setScreen('socials')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl transition"
        >
          <Instagram className="w-6 h-6 text-pink-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Socials</span>
        </button>

        <button
          onClick={() => setScreen('deals')}
          className="relative flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl transition"
        >
          <Briefcase className="w-6 h-6 text-yellow-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Deals</span>
          {unreadDeals > 0 && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadDeals}
            </div>
          )}
        </button>

        <button
          onClick={() => setScreen('shop')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-xl transition"
        >
          <ShoppingBag className="w-6 h-6 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Shop</span>
        </button>

        <button
          onClick={() => setScreen('maps')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-red-500/20 to-rose-600/20 hover:from-red-500/30 hover:to-rose-600/30 rounded-xl transition"
        >
          <MapPin className="w-6 h-6 text-red-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Maps</span>
        </button>

        <button
          onClick={() => setScreen('calls')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 rounded-xl transition"
        >
          <Phone className="w-6 h-6 text-indigo-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Calls</span>
        </button>

        <button
          onClick={() => setScreen('search')}
          className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 rounded-xl transition"
        >
          <Search className="w-6 h-6 text-gray-400" />
          <span className="text-[10px] font-mono font-bold text-foreground">Search</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-bold text-primary">Your Location</span>
        </div>
        <div className="text-sm font-mono text-foreground">{currentLocation}</div>
        {vehicles.filter(v => v.is_active).length > 0 && (
          <div className="text-xs font-mono text-muted-foreground mt-1">
            🚗 {vehicles.find(v => v.is_active)?.make_model}
          </div>
        )}
      </div>
    </div>
  );

  const renderMapsScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">London Map</h3>
        <Navigation className="w-5 h-5 text-red-400" />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-mono font-bold text-primary">Current Location</div>
              <div className="text-xs font-mono text-foreground">{currentLocation}</div>
            </div>
          </div>
        </div>

        {LONDON_LOCATIONS.map((loc) => (
          <div
            key={loc.name}
            className={`p-3 rounded-lg border transition ${
              loc.name === currentLocation
                ? 'bg-primary/20 border-primary/50'
                : 'bg-card/30 border-border/20 hover:border-primary/30'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-mono font-bold text-foreground">{loc.name}</div>
                <div className="text-xs font-mono text-muted-foreground">{loc.description}</div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">{loc.distance}km</div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-yellow-400" />
                <span className={`${loc.danger > 6 ? 'text-red-400' : loc.danger > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                  Risk: {loc.danger}/10
                </span>
              </div>
              {loc.name !== currentLocation && (
                <button className="ml-auto px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded transition">
                  <Navigation className="w-3 h-3 inline mr-1" />
                  Navigate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCallsScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">Recent Calls</h3>
        <Phone className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 border-b border-border/20">
          <div className="text-xs font-mono font-bold text-primary mb-2">CONTACTS</div>
          {relationships.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground font-mono">
              No contacts to call. Build relationships first.
            </div>
          ) : (
            relationships.slice(0, 5).map((rel) => (
              <button
                key={rel.id}
                onClick={() => startCall(rel)}
                className="w-full p-2 mb-2 bg-card/30 hover:bg-card/50 rounded-lg border border-border/20 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {rel.npc?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-mono font-bold text-foreground">
                      {rel.npc?.name || 'Unknown'}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {rel.npc?.role || 'Contact'}
                    </div>
                  </div>
                  <PhoneCall className="w-4 h-4 text-green-400" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3">
          <div className="text-xs font-mono font-bold text-muted-foreground mb-2">RECENT</div>
          {callHistory.map((call, idx) => (
            <div
              key={idx}
              className="p-2 mb-2 bg-card/20 rounded-lg border border-border/10"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  call.type === 'missed' ? 'bg-red-500/20' :
                  call.type === 'incoming' ? 'bg-blue-500/20' :
                  'bg-green-500/20'
                }`}>
                  <Phone className={`w-4 h-4 ${
                    call.type === 'missed' ? 'text-red-400' :
                    call.type === 'incoming' ? 'text-blue-400' :
                    'text-green-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-mono font-bold text-foreground">{call.contact}</div>
                  <div className="text-xs font-mono text-muted-foreground">{call.time}</div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">{call.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSearchScreen = () => {
    const results = searchQuery ? filterContent(searchQuery) : { contacts: [], deals: [], locations: [] };

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border/30 bg-card/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
              <X className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, deals, locations..."
              autoFocus
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {!searchQuery ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              Start typing to search...
            </div>
          ) : (
            <div className="space-y-3">
              {results.contacts.length > 0 && (
                <div>
                  <div className="text-xs font-mono font-bold text-primary mb-2">CONTACTS</div>
                  {results.contacts.map(rel => (
                    <button
                      key={rel.id}
                      onClick={() => openChat(rel)}
                      className="w-full p-2 mb-2 bg-card/30 hover:bg-card/50 rounded-lg border border-border/20 transition text-left"
                    >
                      <div className="text-sm font-mono font-bold text-foreground">{rel.npc?.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{rel.npc?.role}</div>
                    </button>
                  ))}
                </div>
              )}

              {results.deals.length > 0 && (
                <div>
                  <div className="text-xs font-mono font-bold text-primary mb-2">DEALS</div>
                  {results.deals.map(deal => (
                    <div key={deal.id} className="p-2 mb-2 bg-card/30 rounded-lg border border-border/20">
                      <div className="text-sm font-mono font-bold text-foreground">{deal.item}</div>
                      <div className="text-xs font-mono text-muted-foreground">{deal.location}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.locations.length > 0 && (
                <div>
                  <div className="text-xs font-mono font-bold text-primary mb-2">LOCATIONS</div>
                  {results.locations.map(loc => (
                    <div key={loc.name} className="p-2 mb-2 bg-card/30 rounded-lg border border-border/20">
                      <div className="text-sm font-mono font-bold text-foreground">{loc.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{loc.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.contacts.length === 0 && results.deals.length === 0 && results.locations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCallingScreen = () => {
    if (!selectedContact) return null;

    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-primary">
            {selectedContact.npc?.name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="text-xl font-mono font-bold text-foreground mb-2">
          {selectedContact.npc?.name || 'Unknown'}
        </div>
        <div className="text-sm font-mono text-muted-foreground mb-8">
          Calling...
        </div>
        <div className="flex items-center gap-2 text-primary animate-pulse">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-primary animation-delay-150"></div>
          <div className="w-2 h-2 rounded-full bg-primary animation-delay-300"></div>
        </div>
      </div>
    );
  };

  const renderMessagesScreen = () => {
    const getLastMessage = (npcId: string) => {
      const convos = state.npcConversations.filter(c => c.npc_id === npcId);
      if (convos.length === 0) return 'Tap to start messaging';
      const last = convos[convos.length - 1];
      return last.npc_response;
    };

    const getLastMessageTime = (npcId: string) => {
      const convos = state.npcConversations.filter(c => c.npc_id === npcId);
      if (convos.length === 0) return '';
      const last = convos[convos.length - 1];
      return new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
          <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-mono font-bold text-sm">Messages</h3>
          <div className="w-5"></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {relationships.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground font-mono">
              No contacts yet. Meet people in the game to unlock messaging.
            </div>
          ) : (
            relationships.map((rel) => {
              const lastMsg = getLastMessage(rel.npc?.id || '');
              const lastTime = getLastMessageTime(rel.npc?.id || '');
              return (
                <button
                  key={rel.id}
                  onClick={() => openChat(rel)}
                  className="w-full p-3 border-b border-border/20 hover:bg-card/30 transition text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {rel.npc?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono font-bold text-foreground">
                          {rel.npc?.name || 'Unknown'}
                        </span>
                        {lastTime && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {lastTime}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground truncate">
                        {lastMsg}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderContactsScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">Contacts</h3>
        <div className="w-5"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {relationships.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground font-mono">
            No contacts saved. Build relationships in the game.
          </div>
        ) : (
          relationships.map((rel) => (
            <div
              key={rel.id}
              className="p-3 bg-card/30 rounded-lg border border-border/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-mono font-bold text-foreground">
                    {rel.npc?.name || 'Unknown'}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {rel.npc?.role || 'Contact'}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  rel.status === 'allied' ? 'bg-green-500/20 text-green-400' :
                  rel.status === 'hostile' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {rel.status.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${rel.trust_score}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{rel.trust_score}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openChat(rel)}
                  className="flex-1 px-2 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition"
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Message
                </button>
                <button
                  onClick={() => startCall(rel)}
                  className="flex-1 px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono font-bold rounded transition"
                >
                  <Phone className="w-3 h-3 inline mr-1" />
                  Call
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSocialsScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">Socials Feed</h3>
        <Instagram className="w-5 h-5 text-pink-400" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 border-b border-border/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">DK</span>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-foreground">damian_khaine</div>
              <div className="text-[10px] font-mono text-muted-foreground">2 hours ago • {currentLocation}</div>
            </div>
          </div>
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-2 flex items-center justify-center">
            <span className="text-xs font-mono text-muted-foreground">Your latest post</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono mb-2">
            <span className="text-foreground"><TrendingUp className="w-3 h-3 inline mr-1" />124 likes</span>
            <span className="text-muted-foreground">8 comments</span>
          </div>
          <div className="text-sm font-mono text-foreground">Out here moving smart 💯 #roadlife</div>
        </div>

        {relationships.slice(0, 5).map((rel, idx) => (
          <div key={rel.id} className="p-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                  {rel.npc?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-foreground">
                  {rel.npc?.name?.toLowerCase().replace(' ', '_') || 'unknown'}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {idx + 3} hours ago
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-foreground mb-2">
              {idx === 0 && "Out here in the ends 💯 #roadlife"}
              {idx === 1 && "Got that new pack in. HMU 📱 #business"}
              {idx === 2 && "Just copped the new whip 🚗💨 #winning"}
              {idx === 3 && "Real ones know 🤝 #loyalty"}
              {idx === 4 && "Late night grinds 🌙 #hustle"}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-muted-foreground">{42 + idx * 7} likes</span>
              <span className="text-muted-foreground">{3 + idx} comments</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDealsScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">Active Deals</h3>
        <div className="w-5"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeDeals.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground font-mono">
            No active deals. Connect with NPCs to get business opportunities.
          </div>
        ) : (
          activeDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-3 bg-card/30 rounded-lg border border-border/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-mono font-bold text-foreground">{deal.item}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {deal.npc?.name || 'Unknown Contact'}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  deal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  deal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  deal.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {deal.status.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="text-foreground ml-1 font-bold">{deal.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-foreground ml-1 font-bold">£{deal.total_value.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk:</span>
                  <span className={`ml-1 font-bold ${deal.risk_level > 7 ? 'text-red-400' : deal.risk_level > 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {deal.risk_level}/10
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Due:</span>
                  <span className="text-foreground ml-1 font-bold">Day {deal.due_day}</span>
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 inline mr-1" />
                {deal.location}
              </div>
              <button className="w-full px-2 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderShopScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/30 bg-card/50">
        <button onClick={() => setScreen('home')} className="text-primary hover:text-primary/80">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-mono font-bold text-sm">Dark Web Market</h3>
        <ShoppingBag className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="p-3 bg-card/30 rounded-lg border border-border/20">
          <div className="text-sm font-mono font-bold text-foreground mb-1">Encrypted Burner Phone</div>
          <div className="text-xs font-mono text-muted-foreground mb-2">Untraceable comms, auto-wipe</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-black text-primary">£450</span>
            <button className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
              Buy
            </button>
          </div>
        </div>

        <div className="p-3 bg-card/30 rounded-lg border border-border/20">
          <div className="text-sm font-mono font-bold text-foreground mb-1">Fake ID Set</div>
          <div className="text-xs font-mono text-muted-foreground mb-2">Multiple identities, passport quality</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-black text-primary">£2,500</span>
            <button className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
              Buy
            </button>
          </div>
        </div>

        <div className="p-3 bg-card/30 rounded-lg border border-border/20">
          <div className="text-sm font-mono font-bold text-foreground mb-1">Police Scanner</div>
          <div className="text-xs font-mono text-muted-foreground mb-2">Live Met Police frequencies</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-black text-primary">£800</span>
            <button className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
              Buy
            </button>
          </div>
        </div>

        <div className="p-3 bg-card/30 rounded-lg border border-border/20">
          <div className="text-sm font-mono font-bold text-foreground mb-1">GPS Jammer</div>
          <div className="text-xs font-mono text-muted-foreground mb-2">Block tracking devices</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-black text-primary">£1,200</span>
            <button className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
              Buy
            </button>
          </div>
        </div>

        <div className="p-3 bg-card/30 rounded-lg border border-border/20">
          <div className="text-sm font-mono font-bold text-foreground mb-1">Counterfeit Cash Kit</div>
          <div className="text-xs font-mono text-muted-foreground mb-2">High quality polymer notes</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-black text-primary">£5,000</span>
            <button className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition">
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatScreen = () => {
    if (!selectedContact) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-3 border-b border-border/30 bg-card/50">
          <button onClick={() => setScreen('messages')} className="text-primary hover:text-primary/80">
            <X className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {selectedContact.npc?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-mono font-bold text-foreground">
              {selectedContact.npc?.name || 'Unknown'}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {selectedContact.npc?.role || 'Contact'}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showChatMenu && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={async () => {
                    if (confirm(`Delete all messages with ${selectedContact.npc?.name}?`)) {
                      await deleteConversation(selectedContact);
                      setShowChatMenu(false);
                      setScreen('messages');
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-mono flex items-center gap-2 hover:bg-destructive/10 text-destructive rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-2 rounded-lg ${
                  msg.sender === 'You'
                    ? 'bg-primary/20 text-foreground'
                    : 'bg-card/50 text-foreground'
                }`}
              >
                <div className="text-sm font-mono">{msg.message}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-card/50 p-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/30 bg-card/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isGenerating && sendMessage()}
              placeholder="Type a message..."
              disabled={isGenerating}
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={isGenerating || !messageInput.trim()}
              className="px-3 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-0 overflow-hidden">
      <div className="relative mx-auto max-w-sm">
        <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>

          <div className="relative bg-gradient-to-b from-gray-950 to-black rounded-[2rem] overflow-hidden h-[600px] border border-gray-700">
            {screen === 'home' && renderHomeScreen()}
            {screen === 'messages' && renderMessagesScreen()}
            {screen === 'contacts' && renderContactsScreen()}
            {screen === 'socials' && renderSocialsScreen()}
            {screen === 'deals' && renderDealsScreen()}
            {screen === 'shop' && renderShopScreen()}
            {screen === 'chat' && renderChatScreen()}
            {screen === 'maps' && renderMapsScreen()}
            {screen === 'calls' && renderCallsScreen()}
            {screen === 'search' && renderSearchScreen()}
            {screen === 'calling' && renderCallingScreen()}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
