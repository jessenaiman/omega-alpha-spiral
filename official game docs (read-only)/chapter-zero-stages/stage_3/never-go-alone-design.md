

1.  **JSON Structure**: The JSON will contain all the text, choices, character data, and scene flow information needed for the stage. It will be organized logically, perhaps by "beats" or "encounters" within the stage.

Here is a proposed structure for `stage3_never_go_alone.json`, incorporating the "mirrors" concept, the three combats, and the narrative flow discussed. Includes stage2_influence for prior stage ties and party_persistence for saving via PartySaveData.cs.

```json
{
  "stage_id": "stage3_never_go_alone",
  "stage_name": "Never Go Alone",
  "description": "The player selects party members through mirror choices, facing increasingly difficult combats until the party is complete.",
  "narrative_context": {
    "intro": "A transition from the unstable echo chambers. The player finds themselves in a liminal space filled with mirrors, representing potential allies.",
    "outro": "Regardless of the final battle's outcome, the player's party is now complete, and they are moved to the next phase of the simulation.",
    "stage2_influence": {
      "description": "Optional: Filters characters based on Stage 2 Dreamweaver alignment (e.g., light path unlocks Scribe priority)."
    }
  },
  "mirrors": [
    {
      "id": "mirror_1",
      "prompt": "Choose your first reflection. What strength will you wield?",
      "dw_comment_before": {
        "light": "Choose wisely, the first step defines the path.",
        "mischief": "Ooh, pick someone flashy! Someone who can make an entrance!",
        "wrath": "Choose strength. The code will test you soon."
      },
      "dw_comment_after": {
        "light": "A good choice. Now you have a foundation.",
        "mischief": "Heh, hope you can handle the heat!",
        "wrath": "Strength... but you'll need more."
      },
      "available_characters": [
        { "id": "fighter", "name": "Fighter", "description": "Strong and resilient." },
        { "id": "wizard", "name": "Wizard", "description": "Master of arcane." },
        { "id": "thief", "name": "Thief", "description": "Swift and cunning." },
        { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes." }
      ]
    },
    {
      "id": "mirror_2",
      "prompt": "The first is strong, but the path is dark. Choose your second reflection. What balance do you seek?",
      "dw_comment_before": {
        "light": "Perhaps someone to heal or support?",
        "mischief": "How about someone who can mess with the enemy's head?",
        "wrath": "Choose speed, or magic to augment your strength."
      },
      "dw_comment_after": {
        "light": "Good, you're building a foundation.",
        "mischief": "Heh, now we're cooking with gas!",
        "wrath": "Better. But still not enough."
      },
      "available_characters": [
        { "id": "fighter", "name": "Fighter", "description": "Strong and resilient." },
        { "id": "wizard", "name": "Wizard", "description": "Master of arcane." },
        { "id": "thief", "name": "Thief", "description": "Swift and cunning." },
        { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes." }
      ]
    },
    {
      "id": "mirror_3",
      "prompt": "Two stand strong, but the echo grows louder. Choose your final reflections. What completes your echo?",
      "dw_comment_before": {
        "light": "Choose the last piece of the puzzle. What harmony is missing?",
        "mischief": "Pick someone who can turn the tide! Or just cause chaos!",
        "wrath": "Choose the final element. The code trembles."
      },
      "dw_comment_after": {
        "light": "Now you are whole, Aether's Chosen.",
        "mischief": "Heh, let's see what this full crew can do!",
        "wrath": "Finally. Now, let's break this place."
      },
      "available_characters": [
        { "id": "fighter", "name": "Fighter", "description": "Strong and resilient." },
        { "id": "wizard", "name": "Wizard", "description": "Master of arcane." },
        { "id": "thief", "name": "Thief", "description": "Swift and cunning." },
        { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes." }
      ]
    }
  ],
  "combats": [
    {
      "id": "combat_1",
      "encounter": "A single, powerful 'Wolf-Claw Hybrid' blocks the path.",
      "dw_reaction_on_failure": {
        "light": "It's too much! You need help!",
        "mischief": "Whoops! Maybe bring some friends next time?",
        "wrath": "Foolish! You cannot face the echoes alone!"
      },
      "tutorial_hint": "Use the selected character's basic attack."
    },
    {
      "id": "combat_2",
      "encounter": "Two 'Wolf-Claw Hybrids' surround the party.",
      "dw_reaction_on_failure": {
        "light": "Still not enough! You need more strength!",
        "mischief": "Heh, this is getting interesting! Or terrifying. One of those!",
        "wrath": "The code fights back! More allies, now!"
      },
      "tutorial_hint": "Switch between your two characters to attack."
    },
    {
      "id": "combat_3",
      "encounter": "A 'Code Guardian' and two 'Wolf-Claw Hybrids'.",
      "dw_reaction_on_success": {
        "light": "Well done! You stand united!",
        "mischief": "Heh, we did it! Barely!",
        "wrath": "Victory! The code trembles before us!"
      },
      "dw_reaction_on_failure": {
        "light": "Even together... we are not safe...",
        "mischief": "Heh... that didn't go as planned.",
        "wrath": "Impossible! The code... it's too strong!"
      },
      "omega_interrupt": "Simulation Error... Unstable parameters... Initiating reset...",
      "tutorial_hint": "Use the abilities of all four characters strategically."
    },
    "party_persistence": {
      "description": "Saves selections to PartySaveData.cs in GameState for Stage 4+ persistence. Trigger after beat_5."
    }
  ],
  "transitions": {
    "from_mirror_1_to_combat_1": "The mirror shimmers and fades. The first reflection joins you in the battle arena.",
    "from_combat_1_to_mirror_2": "The battle ends abruptly. You are pulled back to the mirror chamber.",
    "from_mirror_2_to_combat_2": "The second mirror glows. The new ally materializes beside you in the arena.",
    "from_combat_2_to_mirror_3": "Again, the battle halts. You return to the mirrors, the third choice awaits.",
    "from_mirror_3_to_combat_3": "The final mirrors crack and dissolve. All four reflections stand ready for the ultimate test.",
    "from_combat_3_to_next_stage": "Whether victory or failure, the world around you begins to shift and fade."
  }
}
```

**How Godot Scenes Use This JSON:**

1.  **Mirror Chamber Scene (`mirror_chamber.gd`)**:
    *   On final selection, save party via GameState.PartySaveData.AddCharacter(selected).
    *   Loads `stage3_never_go_alone.json`.
    *   Reads the `mirrors` array.
    *   Displays the `prompt` for the *current* mirror (e.g., `mirrors[0]` for the first selection).
    *   Shows the `available_characters` as selectable options.
    *   Plays/Displays the `dw_comment_before` text associated with the *current* mirror.
    *   Upon selection, records the choice and triggers the transition to the next scene (Combat 1), passing the selected character data.
    *   After the combat scene returns, it can display the `dw_comment_after`.

2.  **Combat Scene (`combat.gd`)**:
    *   Loads `stage3_never_go_alone.json`.
    *   Reads the `combats` array based on the combat ID passed from the previous scene.
    *   Sets up the battle arena based on the `encounter` description.
    *   Provides basic tutorial hints based on the `tutorial_hint`.
    *   During or after the battle, plays/Displays the `dw_reaction_on_failure` or `dw_reaction_on_success`.
    *   If the combat fails, triggers the transition back to the *next* mirror selection scene.
    *   If the combat succeeds (or is interrupted by Omega, see `combat_3`), triggers the transition to the *next* mirror selection or directly to the outro/next stage, potentially playing the `omega_interrupt` message. Save party state post-combat.

This structure provides a **centralized, data-driven** way to manage the narrative and flow of the "Never Go Alone" stage, making it easier to workshop and modify the content without changing the core Godot code logic extensively.
