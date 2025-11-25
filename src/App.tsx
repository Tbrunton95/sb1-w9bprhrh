import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import GameContainer from './components/GameContainer';
import WelcomeScreen from './components/WelcomeScreen';

function AppContent() {
  const { state, initializeGame, initializeDefaultItems } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-initialize game on mount if session token exists
  useEffect(() => {
    const existingToken = localStorage.getItem('gameSessionToken');
    if (existingToken && !gameStarted && !isInitializing) {
      console.log('Auto-initializing game from existing session...');
      setIsInitializing(true);
      initializeGame()
        .then(() => initializeDefaultItems())
        .then(() => {
          setGameStarted(true);
          setIsInitializing(false);
          console.log('Auto-initialization complete');
        })
        .catch((error) => {
          console.error('Failed to auto-initialize game:', error);
          localStorage.removeItem('gameSessionToken');
          setIsInitializing(false);
        });
    }
  }, [initializeGame, initializeDefaultItems, gameStarted, isInitializing]);

  const handleStartGame = async () => {
    setIsInitializing(true);
    try {
      await initializeGame();
      await initializeDefaultItems();
      setGameStarted(true);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      alert('Failed to start game. Please check console for details.');
    } finally {
      setIsInitializing(false);
    }
  };

  if (state.loading || isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Starting your criminal empire...</p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return <WelcomeScreen onStartGame={handleStartGame} />;
  }

  return <GameContainer />;
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
