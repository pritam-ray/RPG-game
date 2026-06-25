import React from 'react';

function StoryDisplay({ narration, loading, lastAction }) {
  return (
    <div className="story-display">
      {narration && (
        <div className={`narration ${loading ? 'narration-loading' : ''}`}>
          {narration.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {lastAction && loading && (
        <div className="pending-action">
          <span className="action-tag">YOUR ACTION</span>
          <span className="action-text">"{lastAction}"</span>
        </div>
      )}

      {loading && (
        <div className="story-loading-inline">
          <div className="spinner-small"></div>
          <span>The Dungeon Master is writing the next chapter...</span>
        </div>
      )}
    </div>
  );
}

export default StoryDisplay;
