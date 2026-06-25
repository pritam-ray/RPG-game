import React from 'react';

function ThemeSelector({ 
  themes, 
  onSelectTheme, 
  loading, 
  characterName, 
  setCharacterName, 
  hasSavedSession, 
  onResumeSession 
}) {
  return (
    <div className="theme-selector">
      <div className="theme-header">
        <h1>🎲 AI Dungeon Master</h1>
        <p>Choose your adventure theme to begin your epic journey</p>
      </div>

      {hasSavedSession && (
        <div className="resume-container">
          <div className="resume-card">
            <div className="resume-icon">🔮</div>
            <div className="resume-text">
              <h3>Continue Your Adventure</h3>
              <p>You have an active quest in progress. Would you like to resume?</p>
            </div>
            <button className="resume-button" onClick={onResumeSession} disabled={loading}>
              Resume Journey
            </button>
          </div>
        </div>
      )}

      <div className="name-entry-container">
        <h3>Create Your Character</h3>
        <div className="name-input-wrapper">
          <span className="input-icon">🖋️</span>
          <input
            type="text"
            className="character-name-input"
            placeholder="Enter character name... (defaults to Adventurer)"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            disabled={loading}
            maxLength={25}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading themes...</div>
      ) : (
        <div className="themes-grid">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="theme-card"
              onClick={() => onSelectTheme(theme.id)}
            >
              <div className="theme-icon">{theme.icon}</div>
              <h3>{theme.name}</h3>
              <p>{theme.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
