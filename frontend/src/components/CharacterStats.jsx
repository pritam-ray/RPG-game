import React from 'react';

function CharacterStats({ stats, inventory }) {
  const getHealthColor = (health) => {
    if (health > 70) return '#4ade80';
    if (health > 30) return '#fbbf24';
    return '#ef4444';
  };

  const getManaColor = (mana) => {
    if (mana > 70) return '#60a5fa';
    if (mana > 30) return '#a78bfa';
    return '#818cf8';
  };

  return (
    <div className="character-stats">
      <h3>Character Stats</h3>
      
      {/* Level and Experience */}
      {stats.level && (
        <div className="level-container">
          <div className="level-badge">
            ⭐ Level {stats.level}
          </div>
          <div className="xp-bar">
            <div className="xp-label">XP: {stats.experience || 0}/{stats.level * 100}</div>
            <div className="xp-progress">
              <div 
                className="xp-fill" 
                style={{ 
                  width: `${((stats.experience || 0) / (stats.level * 100)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="stats-grid">
        {(() => {
          const maxHealth = stats.maxHealth || 100;
          const maxMana = stats.maxMana || 50;
          const healthPct = Math.min(100, Math.max(0, (stats.health / maxHealth) * 100));
          const manaPct = Math.min(100, Math.max(0, (stats.mana / maxMana) * 100));

          return (
            <>
              <div className="stat-item health">
                <div className="stat-label">❤️ Health</div>
                <div className="stat-bar">
                  <div 
                    className="stat-fill" 
                    style={{ 
                      width: `${healthPct}%`,
                      backgroundColor: getHealthColor(healthPct)
                    }}
                  ></div>
                </div>
                <div className="stat-value">{stats.health}/{maxHealth}</div>
              </div>

              <div className="stat-item mana">
                <div className="stat-label">✨ Mana</div>
                <div className="stat-bar">
                  <div 
                    className="stat-fill" 
                    style={{ 
                      width: `${manaPct}%`,
                      backgroundColor: getManaColor(manaPct)
                    }}
                  ></div>
                </div>
                <div className="stat-value">{stats.mana}/{maxMana}</div>
              </div>
            </>
          );
        })()}

        <div className="stat-item">
          <div className="stat-label">💪 Strength</div>
          <div className="stat-value-large">{stats.strength}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">🧠 Intelligence</div>
          <div className="stat-value-large">{stats.intelligence}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">💬 Charisma</div>
          <div className="stat-value-large">{stats.charisma}</div>
        </div>
      </div>

      {inventory && inventory.length > 0 && (
        <div className="inventory">
          <h4>🎒 Inventory</h4>
          <div className="inventory-items">
            {inventory.map((item, index) => (
              <div key={index} className="inventory-item">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterStats;
