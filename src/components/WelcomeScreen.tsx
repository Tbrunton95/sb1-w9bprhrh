import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface WelcomeScreenProps {
  onStartGame: () => void;
}

export default function WelcomeScreen({ onStartGame }: WelcomeScreenProps) {
  const [showStory, setShowStory] = useState(false);

  const handleBegin = () => {
    console.log('Begin button clicked');
    setShowStory(true);
  };

  const handleStartGame = () => {
    console.log('Start Game button clicked');
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {!showStory ? (
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-6xl font-bold mb-2">
                <span className="text-amber-600">Damian</span>
                <br />
                <span className="text-slate-400">Khaine</span>
              </h1>
              <p className="text-slate-400 text-lg">The London Underground</p>
            </div>

            <div className="space-y-4 text-slate-300">
              <p>You are Damian Khaine, a drug dealer navigating the dangerous streets of London.</p>
              <p>Build relationships with NPCs, manage your inventory, execute deals, and survive in the criminal underworld.</p>
              <p className="text-sm text-slate-500">Each decision carries weight. The city is watching.</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBegin}
                className="px-6 py-3 bg-amber-700 text-white rounded font-semibold hover:bg-amber-600 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Begin
              </button>
            </div>

            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              This is a text-based narrative RPG powered by AI. Your choices shape the story.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-amber-600 mb-4">Kensington, November 2024</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  Your penthouse apartment overlooks Hyde Park. Floor-to-ceiling windows, marble countertops, the kind of place that screams money. Your parents are "too caught up" in their work—always have been. Tech investments, board meetings, international business. They don't ask questions about what you do, and you don't tell.
                </p>
                <p>
                  Mrs. O has been more of a mother to you than your own ever was. African-British, late fifties, warm smile but sharp eyes. She's been looking after you since you were young. This morning she knocked on your door with breakfast and that look—the one that says she knows you're walking a dangerous line, but she won't stop you. Just worries.
                </p>
                <p>
                  "Be safe out there, Damian," she said, setting down the plate. "I know you're grown, but... be smart, yeah?"
                </p>
                <p>
                  She left you to it. Your apartment is stocked: Glock 19 in the drawer, ceramic shank backup, Kevlar vest hanging in the closet. Keys to your Audi RS3 and your Yamaha R6 sport bike on the counter. In the hidden safe: 100g of cocaine ready to move, 50g of MDMA, and a quarter ounce of weed for personal use. Five hundred quid cash in your wallet.
                </p>
                <p>
                  The city's out there. Brixton, Peckham, East End—different worlds from Kensington, but that's where the real money moves. You've got the product, the gear, and the means. Now you need the connects.
                </p>
                <p className="text-amber-400 font-semibold">What do you do?</p>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-3 bg-amber-700 text-white rounded font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
