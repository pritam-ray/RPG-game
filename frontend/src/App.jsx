import React, { useState, useEffect } from 'react';
import ThemeSelector from './components/ThemeSelector';
import CharacterStats from './components/CharacterStats';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButtons from './components/ChoiceButtons';
import GameHistory from './components/GameHistory';
import { gameAPI } from './services/api';
import './styles/App.css';

function App() {
  const [gameState, setGameState] = useState('theme-selection'); // theme-selection, playing
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [characterStats, setCharacterStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [currentNarration, setCurrentNarration] = useState('');
  const [currentChoices, setCurrentChoices] = useState([]);
  const [storyHistory, setStoryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statChanges, setStatChanges] = useState(null);
  const [itemChanges, setItemChanges] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
  const [storyArc, setStoryArc] = useState('beginning');
  const [isGameEnding, setIsGameEnding] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Load themes and wake up backend on mount
  useEffect(() => {
    // Fire wake up request to sleeping Render service
    gameAPI.checkHealth().catch((err) => {
      console.warn('Backend wake-up call initiated/pending:', err.message);
    });

    loadThemes();
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedSession = localStorage.getItem('dungeonMasterSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        console.log('Found saved session in localStorage:', session.sessionId);
        
        // Verify session is active on server
        try {
          const state = await gameAPI.getGameState(session.sessionId);
          if (state) {
            setSavedSessionId(session.sessionId);
            console.log('Saved session is active and verified.');
          }
        } catch (err) {
          console.warn('Saved session expired or invalid on server. Clearing from storage.');
          localStorage.removeItem('dungeonMasterSession');
        }
      }
    } catch (err) {
      console.error('Failed to load saved session:', err);
    }
  };

  const handleResumeSession = async () => {
    if (!savedSessionId) return;
    try {
      setLoading(true);
      setError(null);

      const state = await gameAPI.getGameState(savedSessionId);

      setSessionId(savedSessionId);
      setSelectedTheme(state.theme);
      setCharacterName(state.characterName);
      setCharacterStats(state.characterStats);
      setInventory(state.inventory || []);
      setTurnCount(state.turnCount || 0);
      setAchievements(state.achievements || []);
      setStoryArc(state.storyArc || 'beginning');
      setIsGameEnding(state.isGameEnding || false);
      setIsGameOver(state.isGameOver || false);
      setGameOverReason(state.gameOverReason || null);
      setStoryHistory(state.storyHistory || []);

      if (state.storyHistory && state.storyHistory.length > 0) {
        const lastEntry = state.storyHistory[state.storyHistory.length - 1];
        setCurrentNarration(lastEntry.narration);
        setCurrentChoices(lastEntry.choices || []);
      }

      setGameState('playing');
      setLoading(false);
    } catch (err) {
      setError('Failed to resume game. Starting a new adventure.');
      localStorage.removeItem('dungeonMasterSession');
      setSavedSessionId(null);
      setLoading(false);
      console.error(err);
    }
  };

  const loadThemes = async () => {
    try {
      setLoading(true);
      const themesData = await gameAPI.getThemes();
      setThemes(themesData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load themes. Please refresh the page.');
      setLoading(false);
    }
  };

  const handleSelectTheme = async (themeId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedTheme(themeId);

      const finalName = characterName.trim() || 'Adventurer';
      const response = await gameAPI.startGame(themeId, finalName);

      setSessionId(response.sessionId);
      setCurrentNarration(response.narration);
      setCurrentChoices(response.choices);
      setCharacterStats(response.characterStats);
      setInventory(response.inventory || []);
      setTurnCount(response.turnCount || 0);
      setAchievements(response.achievements || []);
      setStoryArc(response.storyArc || 'beginning');
      setIsGameEnding(response.isGameEnding || false);
      setIsGameOver(response.isGameOver || false);
      setGameOverReason(response.gameOverReason || null);
      setStoryHistory([{
        narration: response.narration,
        choices: response.choices,
        playerAction: null,
      }]);

      // Save session to localStorage
      localStorage.setItem('dungeonMasterSession', JSON.stringify({
        sessionId: response.sessionId,
        responseId: response.responseId,
        timestamp: Date.now()
      }));

      setGameState('playing');
      setLoading(false);
    } catch (err) {
      setError('Failed to start game. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  const handleChoice = async (choice) => {
    try {
      setLoading(true);
      setError(null);
      setStatChanges(null);
      setItemChanges(null);
      setLastAction(choice);

      const response = await gameAPI.sendAction(sessionId, choice);

      // Update story history with player's action
      const updatedHistory = [...storyHistory];
      if (updatedHistory.length > 0) {
        updatedHistory[updatedHistory.length - 1].playerAction = choice;
      }

      // Add new story entry
      updatedHistory.push({
        narration: response.narration,
        choices: response.choices,
        playerAction: null,
      });

      setCurrentNarration(response.narration);
      setCurrentChoices(response.choices);
      setCharacterStats(response.characterStats);
      setInventory(response.inventory || []);
      setTurnCount(response.turnCount || 0);
      setStoryArc(response.storyArc || 'beginning');
      setIsGameEnding(response.isGameEnding || false);
      setIsGameOver(response.isGameOver || false);
      setGameOverReason(response.gameOverReason || null);
      setStoryHistory(updatedHistory);

      // Update session in localStorage with new responseId
      const savedSession = localStorage.getItem('dungeonMasterSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        session.responseId = response.responseId;
        session.timestamp = Date.now();
        localStorage.setItem('dungeonMasterSession', JSON.stringify(session));
      }

      // Update achievements
      if (response.achievements && response.achievements.length > 0) {
        setAchievements(prev => [...prev, ...response.achievements]);
      }

      // Show new achievements notification
      if (response.newAchievements && response.newAchievements.length > 0) {
        setNewAchievements(response.newAchievements);
        setTimeout(() => setNewAchievements([]), 5000);
      }

      // Show stat changes notification
      if (response.statChanges) {
        setStatChanges(response.statChanges);
        setTimeout(() => setStatChanges(null), 3000);
      }

      // Show item changes notification
      const hasItemChanges = 
        (response.itemsFound && response.itemsFound.length > 0) ||
        (response.itemsUsed && response.itemsUsed.length > 0);
      
      if (hasItemChanges) {
        setItemChanges({
          found: response.itemsFound || [],
          used: response.itemsUsed || []
        });
        setTimeout(() => setItemChanges(null), 4000);
      }

      setLastAction(null);
      setLoading(false);

      // Scroll to top to see new narration
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to process action. Please try again.');
      setLastAction(null);
      setLoading(false);
      console.error(err);
    }
  };

  const handleNewGame = () => {
    // Clear localStorage
    localStorage.removeItem('dungeonMasterSession');
    
    setGameState('theme-selection');
    setSessionId(null);
    setSelectedTheme(null);
    setCurrentNarration('');
    setCurrentChoices([]);
    setCharacterStats(null);
    setInventory([]);
    setStoryHistory([]);
    setError(null);
    setStatChanges(null);
    setItemChanges(null);
    setTurnCount(0);
    setAchievements([]);
    setNewAchievements([]);
    setStoryArc('beginning');
    setIsGameEnding(false);
    setIsGameOver(false);
    setGameOverReason(null);
    setSavedSessionId(null);
    setLastAction(null);
  };

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {gameState === 'theme-selection' && (
        <ThemeSelector
          themes={themes}
          onSelectTheme={handleSelectTheme}
          loading={loading}
          characterName={characterName}
          setCharacterName={setCharacterName}
          hasSavedSession={!!savedSessionId}
          onResumeSession={handleResumeSession}
        />
      )}

      {gameState === 'playing' && (
        <div className="game-container">
          <div className="game-header">
            <h1>🎲 AI Dungeon Master</h1>
            <button className="new-game-button" onClick={handleNewGame}>
              New Game
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-info">
              <span>📊 Turn {turnCount}/475 ({Math.floor((turnCount / 475) * 100)}%)</span>
              <span>📖 {storyArc.toUpperCase()}</span>
              <span>🏆 {achievements.length} Achievements</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (turnCount / 475) * 100)}%` }}
              />
            </div>
            {isGameEnding && (
              <div className="ending-warning">
                ⚠️ Story approaching conclusion...
              </div>
            )}
          </div>

          {/* New Achievement Notifications */}
          {newAchievements && newAchievements.length > 0 && (
            <div className="achievement-notification">
              🏆 Achievement Unlocked: {newAchievements.join(', ')}
            </div>
          )}

          <div className="game-layout">
            <div className="main-content">
              <StoryDisplay narration={currentNarration} loading={loading} lastAction={lastAction} />

              {statChanges && (
                <div className="stat-changes-notification">
                  {Object.entries(statChanges).map(([stat, change]) => {
                    if (change !== 0) {
                      return (
                        <div key={stat} className={change > 0 ? 'stat-gain' : 'stat-loss'}>
                          {stat}: {change > 0 ? '+' : ''}{change}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {itemChanges && (
                <div className="item-changes-notification">
                  {itemChanges.found.length > 0 && (
                    <div className="items-found">
                      {itemChanges.found.map((item, index) => (
                        <div key={`found-${index}`} className="item-found">
                          ✨ Found: {item}
                        </div>
                      ))}
                    </div>
                  )}
                  {itemChanges.used.length > 0 && (
                    <div className="items-used">
                      {itemChanges.used.map((item, index) => (
                        <div key={`used-${index}`} className="item-used">
                          📦 Used: {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loading && currentChoices.length > 0 && !isGameOver && (
                <ChoiceButtons
                  choices={currentChoices}
                  onChoice={handleChoice}
                  disabled={loading}
                />
              )}

              {isGameOver && (
                <div className="game-over-container">
                  <div className="game-over-badge">
                    {characterStats && characterStats.health <= 0 ? '💀' : '🎭'} GAME OVER
                  </div>
                  <div className="game-over-reason">
                    {gameOverReason || 'Your journey has ended'}
                  </div>
                  <div className="game-over-stats">
                    <h3>📊 Final Statistics</h3>
                    <p>🎯 Turns Survived: {turnCount}</p>
                    <p>⭐ Level Reached: {characterStats?.level || 1}</p>
                    <p>🏆 Achievements: {achievements.length}</p>
                    <p>📖 Story Phase: {storyArc}</p>
                  </div>
                  <button className="new-game-button-large" onClick={handleNewGame}>
                    Start New Adventure
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar">
              {characterStats && (
                <CharacterStats stats={characterStats} inventory={inventory} />
              )}
            </div>
          </div>

          {storyHistory.length > 1 && (
            <GameHistory history={storyHistory} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
