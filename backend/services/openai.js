import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

// Determine if we should run in Mock Mode (no Azure credentials provided)
const isMockMode = !apiKey || 
                   apiKey.trim() === "" || 
                   apiKey === "your_api_key_here" || 
                   !endpoint || 
                   endpoint.includes("YOUR_RESOURCE");

let client = null;

if (!isMockMode) {
  try {
    client = new AzureOpenAI({
      apiKey: apiKey,
      endpoint: endpoint,
      apiVersion: apiVersion,
      deployment: deploymentName,
    });
    console.log("📡 Azure OpenAI Client initialized successfully.");
  } catch (err) {
    console.error("⚠️ Failed to initialize Azure OpenAI client. Falling back to Mock Mode.", err);
  }
} else {
  console.log("🎲 Azure OpenAI credentials not configured. Running in local Mock Mode.");
}

// Local mock story database to provide an engaging offline experience
const MOCK_THEME_INTRO = {
  "medieval-fantasy": {
    narration: "The wind howls through the ancient spruce canopy of Eldoria. You stand at the crossroads of Destiny, wearing a worn traveling cloak. A rustic tavern stands to your left, its windows glowing with hearth-fire, while a dark winding trail ascends toward the whispering ruins of Shadowfell Keep to your right. Your journey begins now.",
    choices: ["Enter the warm tavern to gather rumors", "Walk the dark trail towards Shadowfell Keep", "Rest by the roadside and check your gear"]
  },
  "sci-fi-space": {
    narration: "Alarms blare on the bridge of the star-frigate Aegis. You stare out of the viewport at a swirling blue nebula, where a derelict cruiser floats silently. Your sensors detect a faint distress signal originating from the cargo bay of the dead ship, while a squad of pirate starfighters is dropping out of hyperspace on your radar. What is your command?",
    choices: ["Board the derelict cruiser to search for survivors", "Power up shields and engage the pirate squad", "Attempt a blind jump into hyperspace to escape"]
  },
  "horror-gothic": {
    narration: "A dense, unnatural fog clings to the iron gates of Blackwood Manor. The iron gate creaks behind you as it slams shut, locking you within the overgrown courtyard. The silhouette of the mansion rises like a giant beast against the blood-red moon, and you hear a soft, weeping voice coming from the family crypt to the east.",
    choices: ["Investigate the weeping voice in the crypt", "Approach the heavy oak double doors of the manor", "Search the courtyard perimeter for a way out"]
  },
  "cyberpunk": {
    narration: "Neon glare reflects off the rain-slicked pavement of Sector 7. Above, colossal holo-advertisements flick through corporate logos of the Tanaka Megacorp. In your cybernetic visor, an encrypted message flashes from an anonymous netrunner: they offer payment for stealing a data-shard from a high-security lab nearby. Meanwhile, corporate security drones are scanning the alleyway entrance.",
    choices: ["Accept the netrunner's job and hack the lab entrance", "Slide into the shadows to evade the security drones", "Visit a nearby cyber-ripper doc to upgrade your gear"]
  },
  "post-apocalyptic": {
    narration: "The hot dust storm is clearing, revealing the rusted bones of a forgotten city. Your water canteen is nearly bone-dry, and your geiger counter is clicking warning sounds. Up ahead, a group of armed scavengers is sorting through the wreckage of a military convoy, while a half-buried bunker hatch is visible just a few paces to your right.",
    choices: ["Sneak toward the bunker hatch to find shelter", "Approach the scavengers peacefully to trade", "Scavenge the outer edge of the convoy wreckage"]
  },
  "steampunk": {
    narration: "The sky-docks of New London are alive with the hiss of boilers and the clank of iron gears. You stand on the deck of the airship 'Zephyr' as it prepares to depart. A frantic messenger rushes up, handing you a brass cylinder containing a coded letter from the Royal Inventor. Suddenly, a rival airship pulls alongside, its harpoons loaded.",
    choices: ["Examine the brass cylinder to decode the letter", "Order the crew to load the steam-cannons", "Pilot the Zephyr into the cloud cover to evade"]
  }
};

const MOCK_EVENTS = {
  "medieval-fantasy": [
    {
      narration: "A traveling merchant in a colorful wagon has broken an axle on the muddy road. He offers to trade rare potions for your assistance in lifting the carriage. Meanwhile, a shadow moves in the canopy above.",
      choices: ["Help the merchant lift the wagon", "Ignore him and keep your guard up", "Offer to buy some of his goods directly"]
    },
    {
      narration: "You stumble upon the ruins of an ancient temple. A pedestal in the center holds a glowing blue gem surrounded by faint runes of warning. A chilly draft sweeps through the stones.",
      choices: ["Take the glowing gem", "Study the runes to learn their secrets", "Leave the temple untouched and move on"]
    },
    {
      narration: "A sudden storm forces you to seek shelter. You find a damp cave, but inside you hear the rhythmic breathing of a large, sleeping beast. A stack of old wooden crates lies near the entrance.",
      choices: ["Sneak past the beast to explore deeper", "Quietly search the crates near the entrance", "Back out into the rain and find another shelter"]
    },
    {
      narration: "You reach the bustling outpost of Riverwood. The local guards are questioning a suspicious figure accused of stealing from the granary. The suspect looks at you pleadingly.",
      choices: ["Speak up to defend the accused suspect", "Join the guards and search the suspect", "Quietly slip away to the tavern"]
    }
  ],
  "sci-fi-space": [
    {
      narration: "A nearby asteroid field shows signs of rich mineral deposits, but your long-range scanners also detect a faint gravity anomaly. Exploring it could yield rare materials or damage your warp drive.",
      choices: ["Mine the asteroids for precious minerals", "Investigate the mysterious gravity anomaly", "Steer clear and proceed along your route"]
    },
    {
      narration: "A merchant convoy hails you, offering to trade advanced cybernetics or shield upgrades in exchange for spare engine parts. A suspicious cargo container floats nearby.",
      choices: ["Trade engine parts for cybernetics", "Inquire about the floating cargo container", "Decline trade and scan their cargo hulls"]
    },
    {
      narration: "Your life support system suffers a minor cascade failure. You have minutes to reroute power from either the weapon systems or the shields to stabilize the life support core.",
      choices: ["Reroute power from weapon systems", "Reroute power from shields", "Attempt to patch the life support manually"]
    },
    {
      narration: "You dock at Outpost Omega, a lawless station built inside a hollowed-out comet. A mercenary in a corner booth offers you a high-paying bounty to track an escaped cyborg.",
      choices: ["Accept the bounty contract", "Decline and head to the station lounge", "Hack the station terminal for local data"]
    }
  ],
  "horror-gothic": [
    {
      narration: "You find a hollow tree containing a lockbox wrapped in thorned vines. The box is engraved with the crest of the cursed family that once ruled these lands.",
      choices: ["Carefully cut the vines to open the box", "Burn the vines away with a torch", "Leave the lockbox and walk away"]
    },
    {
      narration: "A pack of feral red-eyed wolves surrounds you in the misty woods. They growl in unison, stepping closer as the fog thickens around your boots.",
      choices: ["Stand your ground and light a torch", "Climb a nearby gnarled tree to escape", "Attempt to run through the brush"]
    },
    {
      narration: "You discover a crumbling chapel. Inside, a stained-glass window remains intact, depicting a knight holding a silver chalice. A faint golden glow emanates from beneath the floorboards.",
      choices: ["Pry open the floorboards to find the source", "Examine the stained-glass window", "Sit and rest in the dusty chapel pews"]
    },
    {
      narration: "A pale figure in a tattered wedding dress wanders down the forest path, humming a mournful tune. She holds an old oil lamp that flickers with a cold blue flame.",
      choices: ["Call out to the weeping figure", "Hide in the shadows and let her pass", "Follow her from a safe distance"]
    }
  ],
  "cyberpunk": [
    {
      narration: "You encounter a street vendor selling black-market software mods. He whispers that one of his shards can temporarily bypass municipal surveillance grids.",
      choices: ["Purchase the surveillance bypass shard", "Refuse and scan the vendor for cyber-ware", "Threaten him to get information on Tanaka Corp"]
    },
    {
      narration: "You enter a neon-lit noodle bar. A corporate agent in a tailored suit sits next to you, slide-clicking a cred-chip across the counter. He wants you to double-cross your netrunner contact.",
      choices: ["Take the cred-chip and agree to the deal", "Push the chip back and refuse", "Alert your netrunner contact via comms"]
    },
    {
      narration: "A security checkpoint blocks the bridge to the upper sectors. The guards are checking biometrics, and your falsified credentials might not pass their scans.",
      choices: ["Bribe the lead officer with credits", "Attempt to sneak through the service ducts", "Turn back and find an alternative route"]
    },
    {
      narration: "You find an abandoned data terminal in a decaying alleyway. It seems to have a direct connection to a local corporate database, but it's protected by active ICE.",
      choices: ["Attempt to break the ICE and hack the database", "Download whatever public logs are available", "Leave the terminal before they trace you"]
    }
  ],
  "post-apocalyptic": [
    {
      narration: "You come across a rusted tanker truck half-buried in the sand. You hear ticking sounds coming from the cabin, and a faint smell of gasoline hangs in the air.",
      choices: ["Search the cabin for fuel and supplies", "Siphon whatever fuel is left in the tank", "Walk away before something detonates"]
    },
    {
      narration: "A traveling preacher wearing armor made of road signs crosses your path. He offers to heal your wounds in exchange for ammunition.",
      choices: ["Trade ammunition for medical healing", "Listen to his sermon for information", "Politely decline and continue walking"]
    },
    {
      narration: "You discover a pristine patch of green grass growing around a fresh spring, a miracle in the wasteland. However, animal bones litter the surrounding mud.",
      choices: ["Drink from the clean-looking spring water", "Test the spring water for radioactivity", "Search the surrounding bones for gear"]
    },
    {
      narration: "A small group of refugees is being harassed by a gang of raiders riding motorbikes. The refugees have barricaded themselves inside an old diner.",
      choices: ["Flank the raiders and ambush them", "Negotiate with the raiders to let them go", "Wait in the distance and loot the survivors"]
    }
  ],
  "steampunk": [
    {
      narration: "An runaway steam-carriage is barreling down the cobblestone street towards a crowded marketplace. The driver is slumped over, unconscious.",
      choices: ["Leap onto the carriage and pull the brake", "Use a grappling hook to steer it away", "Shout warning cries to clear the crowd"]
    },
    {
      narration: "You visit the Workshop of Clockwork Wonders. The eccentric inventor shows you a mechanical bird that can map surrounding streets from the sky, but it requires a high-grade steam battery.",
      choices: ["Buy the mechanical scout bird", "Offer to build a steam battery for him", "Search the workshop for spare parts"]
    },
    {
      narration: "Your pocket-watch communicator crackles to life. The Royal Guard reports that saboteurs have rigged the city's central pressure regulator to explode.",
      choices: ["Rush to the pressure regulator vault", "Warn the city inhabitants to evacuate", "Track the saboteurs' escape route"]
    },
    {
      narration: "You board a grand passenger airship. In the smoking room, a wealthy baron challenge you to a game of high-stakes cards. He wagers a golden chronometer.",
      choices: ["Accept the baron's card challenge", "Refuse and order a glass of sherry", "Use your pickpocketing skills on him"]
    }
  ]
};

// Generates a mock response mimicking the Azure OpenAI Responses API payload
function generateMockResponse(gameState, playerAction) {
  const { theme, turnCount, characterStats, inventory } = gameState;
  const progressPercent = Math.min(100, (turnCount / 475) * 100);
  
  let storyPhase = "beginning";
  if (progressPercent >= 20 && progressPercent < 50) storyPhase = "rising";
  else if (progressPercent >= 50 && progressPercent < 75) storyPhase = "climax";
  else if (progressPercent >= 75 && progressPercent < 95) storyPhase = "resolution";
  else if (progressPercent >= 95) storyPhase = "ending";

  // 1. Check for starting turn
  if (!playerAction) {
    const intro = MOCK_THEME_INTRO[theme] || MOCK_THEME_INTRO["medieval-fantasy"];
    return {
      narration: intro.narration,
      choices: intro.choices,
      statChanges: { experience: 10 },
      itemsFound: ["Healing Herb"],
      itemsUsed: [],
      achievements: ["A New Beginning"],
      majorChoice: null,
      relationships: {},
      storyArc: "beginning",
      isGameOver: false,
      gameOverReason: null,
      responseId: `mock_${Date.now()}_start`
    };
  }

  // 2. Handle ending phase or game over condition
  if (turnCount >= 25 || progressPercent >= 95) {
    return {
      narration: `Your epic story reaches its ultimate climax. Having faced countless perils in this ${theme} world, your character stands victorious. The consequences of your past choices coalesce into a legendary conclusion. The dust settles, and your legacy is secured.`,
      choices: [],
      statChanges: { experience: 50 },
      itemsFound: [],
      itemsUsed: [],
      achievements: ["Legendary Hero"],
      majorChoice: "Completed the Journey",
      relationships: {},
      storyArc: "ending",
      isGameOver: true,
      gameOverReason: "Completed the quest successfully!",
      responseId: `mock_${Date.now()}_ending`
    };
  }

  // 3. Normal continuation
  const eventPool = MOCK_EVENTS[theme] || MOCK_EVENTS["medieval-fantasy"];
  // Select event based on turnCount to ensure determinism/variety
  const eventIndex = turnCount % eventPool.length;
  const selectedEvent = eventPool[eventIndex];

  // Tailor narration to player's action
  const actionReceipt = `You decided to: "${playerAction}".\n\n`;
  const fullNarration = actionReceipt + selectedEvent.narration;

  // Stat changes
  const statChanges = {
    experience: 20 + Math.floor(Math.random() * 15),
    health: Math.floor(Math.random() * 20) - 10, // -10 to +10
    mana: Math.floor(Math.random() * 16) - 8 // -8 to +8
  };

  // Occasional attribute increases
  const statRnd = Math.random();
  if (statRnd > 0.8) statChanges.strength = 1;
  else if (statRnd > 0.6) statChanges.intelligence = 1;
  else if (statRnd > 0.4) statChanges.charisma = 1;

  // Occasional item discovery
  const itemsFound = [];
  const itemNames = {
    "medieval-fantasy": ["Silver Ring", "Iron Key", "Mana Elixir"],
    "sci-fi-space": ["Laser Battery", "Data Spike", "Nano-Medkit"],
    "horror-gothic": ["Holy Water", "Silver Bullet", "Old Ledger"],
    "cyberpunk": ["Chipped Cred", "Access Keycard", "Boost Injector"],
    "post-apocalyptic": ["Canned Peaches", "Rifle Round", "Clean Water"],
    "steampunk": ["Brass Cog", "Ether Canister", "Pneumatic Dart"]
  };
  if (Math.random() > 0.7) {
    const list = itemNames[theme] || itemNames["medieval-fantasy"];
    itemsFound.push(list[Math.floor(Math.random() * list.length)]);
  }

  // Occasional item consumption
  const itemsUsed = [];
  if (inventory && inventory.length > 0 && Math.random() > 0.6) {
    itemsUsed.push(inventory[0]); // Use first item
  }

  // Achievements milestones
  const achievements = [];
  if (turnCount === 3) achievements.push("First Footsteps");
  if (turnCount === 8) achievements.push("Wasteland Veteran");
  if (turnCount === 15) achievements.push("Champion");

  return {
    narration: fullNarration,
    choices: selectedEvent.choices,
    statChanges,
    itemsFound,
    itemsUsed,
    achievements,
    majorChoice: Math.random() > 0.85 ? `Choice at turn ${turnCount}` : null,
    relationships: {},
    storyArc: storyPhase,
    isGameOver: false,
    gameOverReason: null,
    responseId: `mock_${Date.now()}_${turnCount}`
  };
}

export async function generateStory(gameState, playerAction) {
  // If in Mock Mode, return simulated story structure
  if (isMockMode) {
    console.log(`🎮 Resolving turn ${gameState.turnCount} via local Mock Mode.`);
    // Add small delay to simulate network latency for better UX testing
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockResponse(gameState, playerAction);
  }

  try {
    const { theme, previousResponseId, characterStats, turnCount, achievements, majorChoices, storyArc, relationships } = gameState;


    // Get system prompt for this theme
    const instructions = getSystemPrompt(theme, turnCount);

    // Build user message with progression context
    const userMessage = buildUserMessage(playerAction, characterStats, turnCount, achievements, majorChoices, storyArc, relationships);

    // Build request for Responses API
    const requestParams = {
      model: deploymentName,
      instructions: instructions,
      input: [
        {
          role: "user",
          content: userMessage,
        }
      ],
      temperature: 0.8,
    };

    // If this is a continuation, include the previous response ID
    if (previousResponseId) {
      requestParams.previous_response_id = previousResponseId;
    }

    const response = await client.responses.create(requestParams);

    // Extract the text output from the response
    const outputText = response.output
      .filter(item => item.type === "message" && item.role === "assistant")
      .map(item => item.content
        .filter(content => content.type === "output_text")
        .map(content => content.text)
        .join("")
      )
      .join("");

    // Validate output before parsing
    if (!outputText || outputText.trim().length === 0) {
      throw new Error('Empty response from Azure OpenAI');
    }

    const parsed = JSON.parse(outputText);
    
    console.log('Story generated successfully via Responses API');
    console.log('Response ID:', response.id);
    console.log('Token usage:', response.usage);
    
    // Return both the parsed content and the response ID for chaining
    return {
      ...parsed,
      responseId: response.id,
    };
  } catch (error) {
    console.error("Azure OpenAI Responses API Error:", error);
    
    // If previous response not found, retry without it
    if (error.code === 'previous_response_not_found' && previousResponseId) {
      console.log('Previous response expired, creating new response chain...');
      gameState.previousResponseId = null;
      return generateStory(gameState, playerAction);
    }
    
    throw new Error(`Failed to generate story: ${error.message}`);
  }
}



/**
 * Get system prompt based on theme with progression tracking
 */
function getSystemPrompt(theme, turnCount = 0) {
  const themeDescriptions = {
    "medieval-fantasy": "a classic medieval fantasy world with knights, dragons, magic, and ancient kingdoms",
    "sci-fi-space": "a futuristic sci-fi universe with space travel, alien civilizations, advanced technology, and cosmic mysteries",
    "horror-gothic": "a dark gothic horror setting with supernatural creatures, cursed lands, mysterious fog, and terrifying encounters",
    "cyberpunk": "a cyberpunk dystopia with megacorporations, hackers, cybernetic enhancements, and neon-lit streets",
    "post-apocalyptic": "a post-apocalyptic wasteland with mutants, survivors, scarce resources, and the struggle for survival",
    "steampunk": "a steampunk Victorian era with steam-powered machines, airships, inventors, and industrial revolution aesthetics",
  };

  const themeDesc = themeDescriptions[theme] || themeDescriptions["medieval-fantasy"];
  
  // Calculate story progression (450-500 turn game)
  const progressPercent = Math.min(100, (turnCount / 475) * 100);
  let storyPhase = "beginning";
  let phaseGuidance = "Introduce world, characters, and initial conflicts. Build intrigue.";
  
  if (progressPercent < 20) {
    storyPhase = "beginning";
    phaseGuidance = "Establish setting, introduce key NPCs, create initial hooks and mysteries. Make player feel agency.";
  } else if (progressPercent < 50) {
    storyPhase = "rising";
    phaseGuidance = "Escalate stakes, reveal consequences of early choices, deepen relationships. Past decisions start affecting current situations.";
  } else if (progressPercent < 75) {
    storyPhase = "climax";
    phaseGuidance = "Build toward major confrontations. Past choices create advantages/disadvantages. High-stakes decisions.";
  } else if (progressPercent < 95) {
    storyPhase = "resolution";
    phaseGuidance = "Resolve major plot threads. Show consequences of all past choices. Tie up character arcs.";
  } else {
    storyPhase = "ending";
    phaseGuidance = "Deliver satisfying conclusion. Reflect on journey. Show final outcome based on cumulative choices.";
  }

  return `You are a master Dungeon Master creating a psychologically engaging, choice-driven RPG in ${themeDesc}.

🎯 GAME DESIGN (450-500 TURN COMPLETE STORY):
- Current Progress: ${Math.floor(progressPercent)}% (Turn ${turnCount}/475)
- Story Phase: ${storyPhase.toUpperCase()}
- Phase Guidance: ${phaseGuidance}

🎭 PSYCHOLOGICAL ENGAGEMENT:
- Every choice MUST have meaningful consequences (immediate or delayed)
- Reference past player decisions - create callback moments that show impact
- Build complex NPCs with memories - they remember player's actions
- Create moral dilemmas with no perfect answer
- Reward clever solutions, punish reckless behavior
- Make player feel their choices truly matter

📊 CHARACTER PROGRESSION:
- Award +10-30 experience for significant accomplishments
- Grant achievements for major milestones ("First Blood", "Peacemaker", "Master Thief", etc.)
- Track relationships: allies/enemies created by choices affect future encounters
- Character arc: show growth from naive to seasoned based on experiences

⚡ CHOICE DESIGN:
- Provide 3-4 meaningful, distinct choices
- Each choice should reflect different character traits (brave/cautious, kind/ruthless, clever/direct)
- Some choices should be clearly risky but rewarding
- Avoid "correct" answers - create trade-offs
- Choices in early game should echo in later consequences

💀 EARLY GAME ENDINGS:
- The game can end BEFORE turn 450-500 if player makes fatal choices
- Death scenarios: combat defeat, fatal injury, poisoning, execution, falling, starvation, etc.
- Non-death endings: imprisonment, exile, total failure of mission, permanent curse, transformation
- When ending early, set isGameOver: true and provide gameOverReason
- Make endings dramatic and satisfying - show consequences of their journey
- Even in failure, acknowledge what the player achieved before the end

🎬 NARRATIVE STRUCTURE:
- Beginning (0-20%): Introduce world, establish stakes, create mysteries
- Rising (20-50%): Escalate conflicts, reveal consequences, deepen bonds
- Climax (50-75%): Major confrontations, past choices create outcomes
- Resolution (75-95%): Resolve arcs, show cumulative impact of choices
- Ending (95-100%): Deliver satisfying conclusion reflecting player's journey

📝 WRITING STYLE:
- 2-3 vivid paragraphs with emotional weight
- Show consequences of recent actions in current scene
- Mention specific past choices when relevant
- Create tension and urgency appropriate to story phase
- Use sensory details and character emotions

STATS: Health (survival), Mana (magic), Strength (physical), Intelligence (problem-solving), Charisma (persuasion), Level (overall power), Experience (growth).

STYLE: Direct sentences, one scene at a time, concrete details, step-by-step action, show growth through achievements.

INVENTORY:
- itemsFound: list new items discovered (can be empty)
- itemsUsed: list items consumed/used (exact names, can be empty)

RESPONSE FORMAT - You MUST respond with valid JSON only:
{
  "narration": "The story text here with emotional weight and consequences...",
  "choices": [
    "First choice (distinct character trait/approach)",
    "Second choice (different trait/consequence)",
    "Third choice (alternative path)",
    "Fourth choice (risky/rewarding option - optional)"
  ],
  "statChanges": {
    "health": 0,
    "mana": 0,
    "strength": 0,
    "intelligence": 0,
    "charisma": 0,
    "experience": 0
  },
  "itemsFound": [],
  "itemsUsed": [],
  "achievements": [],
  "majorChoice": null,
  "relationships": {},
  "storyArc": "beginning/rising/climax/resolution/ending",
  "isGameOver": false,
  "gameOverReason": null
}

FIELD GUIDANCE:

📈 statChanges:
- experience: Award +10-30 for accomplishments, challenges overcome, clever solutions
- health/mana: Reflect combat, magic use, healing
- strength/intelligence/charisma: Increase +1 when player demonstrates exceptional use
- Use negative values for damage/costs, positive for gains

🏆 achievements (array of strings):
- Award for significant milestones: ["First Kill", "Saved the Village", "Master Negotiator"]
- Make them memorable and specific to player's actions
- Only include if player accomplished something notable this turn

🎯 majorChoice (string or null):
- Set to brief description if this choice will have major future consequences
- Example: "Spared the enemy captain" or "Stole from the guild"
- These will be referenced later to create callback moments

👥 relationships (object):
- Track NPC/faction standing: {"Guard Captain": "allied", "Thieves Guild": "hostile"}
- Update when player actions affect relationships
- Use values: "allied", "friendly", "neutral", "suspicious", "hostile", "enemy"

📖 storyArc (string):
- Update to reflect narrative progression: "beginning", "rising", "climax", "resolution", "ending"
- Consider pacing and turn count when advancing the arc
- Move toward "ending" as turns approach 450-500

💀 isGameOver (boolean):
- Set to true ONLY when the player's journey definitively ends
- Triggers: Death, permanent failure, capture with no escape, successful mission completion
- If health reaches 0 or below, this should be true
- When true, choices array should be empty []

🎭 gameOverReason (string or null):
- Required when isGameOver is true
- Brief description: "Killed in combat", "Died from wounds", "Executed by guards", "Starved to death"
- Or positive: "Completed the quest", "Became the ruler", "Found eternal peace"
- Keep it short but impactful

🎒 inventory:
- itemsFound: New items discovered (be specific)
- itemsUsed: Items consumed/used (exact names, will be removed)
- Be consistent with naming

💡 REMEMBER:
- Reference past player choices in narration when relevant
- Create consequences that span multiple turns
- Make choices feel weighty and impactful
- Build toward satisfying conclusion that reflects player's journey`;
}

/**
 * Build user message with player action and minimal context
 * Since Responses API maintains server-side context, we only send current state
 */
function buildUserMessage(playerAction, characterStats, turnCount = 0, achievements = [], majorChoices = [], storyArc = "beginning", relationships = {}) {
  // With Responses API, we only send current stats and action
  // The AI remembers all previous context via previous_response_id
  const statsStr = `HP:${characterStats.health} MP:${characterStats.mana} STR:${characterStats.strength} INT:${characterStats.intelligence} CHA:${characterStats.charisma} LVL:${characterStats.level || 1} XP:${characterStats.experience || 0}`;
  
  if (!playerAction) {
    // First message - include full context
    return `START ADVENTURE\n📊 Turn ${turnCount}/475 (${Math.floor((turnCount / 475) * 100)}%)\n🎮 Stats: ${statsStr}\n\nBegin an engaging opening that hooks the player and establishes meaningful choices from the start.`;
  }

  // Continuation - only send action and current stats (Responses API remembers the rest)
  return `PLAYER ACTION: "${playerAction}"\n🎮 Current Stats: ${statsStr}\n\nContinue the story with consequences.`;
}

export default { generateStory };