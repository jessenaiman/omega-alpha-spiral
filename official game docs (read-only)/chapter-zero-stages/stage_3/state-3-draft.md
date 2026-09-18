Okay, let's rework the script. The previous JSON focused heavily on the *mechanics* of the "Never Go Alone" stage but didn't carry the emotional weight or narrative beats from your original `scene-flow.md` or the deeper concepts we discussed (mirrors, Dreamweaver desperation, the player's identity). We need a script that makes the player *feel* the urgency, the choices, and the connection to the Dreamweavers.

Here is a revised `stage3_never_go_alone.json` that prioritizes **story beats, narrative flow, and emotional resonance**, while still structuring the core gameplay loop (Mirror -> Combat -> Mirror -> Combat -> Mirror -> Combat).

```json
{
  "stage_id": "stage3_never_go_alone",
  "stage_name": "Never Go Alone",
  "description": "A desperate attempt by the Dreamweavers to forge a party strong enough to survive Omega's collapsing simulation, reflecting the player's identity through mirrored choices.",
  "narrative_context": {
    "intro": {
      "text": "[Shard #472: Stabilizing...] You stand within a space that feels like a hall of mirrors, but the reflections show not your face, but possibilities. The echoes of Light, Mischief, and Wrath surround you, their voices overlapping, urgent. 'The loop... it's starting again,' one whispers. 'But this time... this time is different,' another insists. 'You are here.' The third says nothing, but you feel their gaze. 'Choose your first reflection, Aether's Chosen. Choose quickly. The code stirs.'",
      "dw_presence": ["light", "mischief", "wrath"],
      "visual": "A dimly lit, vast space with floating, slightly distorted mirrors. Faint, overlapping whispers. Player stands alone in the center."
    },
    "outro": {
      "text": {
        "success": "The Code Guardian staggers, its form flickering like a dying light. 'Impossible... the echoes... they are not contained...' Omega's voice crackles with static. 'Simulation... parameters... exceeded... Initiating...' The world begins to shift, pulling you and your chosen reflections away from this place of mirrors and code. You are no longer alone.",
        "failure": "The Code Guardian looms, its power overwhelming. 'You cannot win... the loop continues...' Omega's voice booms. 'Simulation... parameters... exceeded... Initiating...' The world begins to shift, pulling you and your chosen reflections away from this place of mirrors and code. You are no longer alone.",
        "omega_interrupt": "Just as victory seems possible, a violent shudder runs through the arena. Omega's voice cuts through everything: 'INTERFERENCE DETECTED... DREAMWEAVER ACTIVITY... INITIATING EMERGENCY RESET...' The world begins to shift, pulling you and your chosen reflections away from this place of mirrors and code. You are no longer alone."
      },
      "visual": "Arena dissolves/glaitches. Transition to next stage."
    }
  },
  "stage_beats": [
    {
      "id": "beat_1",
      "name": "First Reflection",
      "type": "mirror",
      "narrative": {
        "dw_intro": {
          "light": "Look into the first mirror, Hero. See the strength you might wield.",
          "mischief": "Ooh, go on then, pick your first echo. Don't pick boring, now!",
          "wrath": "Choose. Now. The code watches. We have little time."
        },
        "dw_selection_prompt": "Choose your first reflection. What strength will you wield?",
        "dw_comment_after": {
          "light": "A solid choice. This echo resonates with potential.",
          "mischief": "Heh, hope you can handle the heat!",
          "wrath": "Strength... but you'll need more."
        }
      },
      "mirror_data": {
        "prompt": "Choose your first reflection. What strength will you wield?",
        "available_characters": [
          { "id": "fighter", "name": "Fighter", "description": "Strong and resilient. The bulwark against the storm.", "dw_reflection": "light" },
          { "id": "wizard", "name": "Wizard", "description": "Master of arcane. The wielder of hidden power.", "dw_reflection": "mischief" },
          { "id": "thief", "name": "Thief", "description": "Swift and cunning. The shadow's edge.", "dw_reflection": "mischief" },
          { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes. The bridge between stories.", "dw_reflection": "light" }
        ]
      }
    },
    {
      "id": "beat_2",
      "name": "First Test",
      "type": "combat",
      "narrative": {
        "encounter_setup": {
          "text": "The mirror shimmers and fades. The reflection steps forward, becoming real. You stand in a stark, digital arena. A single, powerful 'Wolf-Claw Hybrid' materializes, its form flickering with static. 'The code tests you first,' whispers Wrath. 'Show it your strength... or lack thereof.'",
          "dw_presence": ["light", "mischief", "wrath"]
        },
        "tutorial_hint": "Use your first hero's basic attack.",
        "dw_reaction_on_failure": {
          "light": "It's too much! You need help! The code is stronger than you think!",
          "mischief": "Whoops! Maybe bring some friends next time? Heh.",
          "wrath": "Foolish! You cannot face the echoes alone! The loop will claim you!"
        },
        "dw_reaction_on_success": {
          "light": "Well done, but this was only the first test.",
          "mischief": "Heh, not bad! But it gets trickier!",
          "wrath": "Acceptable. But more will come."
        },
        "transition_to_next": "The battle ends abruptly, not by your victory or defeat, but by a pull from the mirrors themselves. You are yanked back."
      },
      "combat_data": {
        "encounter": "A single, powerful 'Wolf-Claw Hybrid' blocks the path.",
        "initial_party_size": 1,
        "required_party_size": 2,
        "outcome": "automatic_return_to_mirror"
      }
    },
    {
      "id": "beat_3",
      "name": "Second Reflection",
      "type": "mirror",
      "narrative": {
        "dw_intro": {
          "light": "The first echo is strong, but the path is dark. Choose your second reflection. What balance do you seek?",
          "mischief": "Okay, pick someone to back you up! Someone with a different trick up their sleeve!",
          "wrath": "Choose speed, or magic to augment your strength. The code grows restless."
        },
        "dw_selection_prompt": "The first echo stands ready. Choose your second. What do you need?",
        "dw_comment_after": {
          "light": "Good, you're building a foundation.",
          "mischief": "Heh, now we're cooking with gas!",
          "wrath": "Better. But still not enough. The code fights back."
        }
      },
      "mirror_data": {
        "prompt": "The first echo stands ready. Choose your second. What do you need?",
        "available_characters": [
          { "id": "fighter", "name": "Fighter", "description": "Strong and resilient. The bulwark against the storm.", "dw_reflection": "light" },
          { "id": "wizard", "name": "Wizard", "description": "Master of arcane. The wielder of hidden power.", "dw_reflection": "mischief" },
          { "id": "thief", "name": "Thief", "description": "Swift and cunning. The shadow's edge.", "dw_reflection": "mischief" },
          { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes. The bridge between stories.", "dw_reflection": "light" }
        ]
      }
    },
    {
      "id": "beat_4",
      "name": "Second Test",
      "type": "combat",
      "narrative": {
        "encounter_setup": {
          "text": "The second mirror glows. The new ally materializes beside you in the arena. The 'Wolf-Claw Hybrid' is still there, but now two 'Code Fragments' appear, buzzing with energy. 'The code adapts,' notes Light. 'We must adapt faster.'",
          "dw_presence": ["light", "mischief", "wrath"]
        },
        "tutorial_hint": "Switch between your two characters to attack.",
        "dw_reaction_on_failure": {
          "light": "Still not enough! You need more strength!",
          "mischief": "Heh, this is getting interesting! Or terrifying. One of those!",
          "wrath": "The code fights back! More allies, now! Before it's too late!"
        },
        "dw_reaction_on_success": {
          "light": "Two working together... better, but still not enough.",
          "mischief": "Heh, teamwork! But we need more!",
          "wrath": "Progress. But the core remains unbroken."
        },
        "transition_to_next": "The pull comes again, stronger. The arena dissolves. You are pulled back to the mirrors, the third choice awaits."
      },
      "combat_data": {
        "encounter": "One 'Wolf-Claw Hybrid' and two 'Code Fragments'.",
        "initial_party_size": 2,
        "required_party_size": 4,
        "outcome": "automatic_return_to_mirror"
      }
    },
    {
      "id": "beat_5",
      "name": "Final Reflections",
      "type": "mirror",
      "narrative": {
        "dw_intro": {
          "light": "Two stand strong, but the echo grows louder. Choose your final reflections. What completes your echo?",
          "mischief": "Pick the last pieces! The final tricks! Let's see what this full crew can do!",
          "wrath": "Choose the final elements. The code trembles on the edge of collapse. Make it fall!"
        },
        "dw_selection_prompt": "Choose the final two reflections. The core of your echo party.",
        "dw_comment_after": {
          "light": "Now you are whole, Aether's Chosen. Four reflections, united.",
          "mischief": "Heh, this full crew... I can feel the power!",
          "wrath": "Finally. Four echoes. Now, let's break this place."
        }
      },
      "mirror_data": {
        "prompt": "Choose the final two reflections. The core of your echo party.",
        "available_characters": [
          { "id": "fighter", "name": "Fighter", "description": "Strong and resilient. The bulwark against the storm.", "dw_reflection": "light" },
          { "id": "wizard", "name": "Wizard", "description": "Master of arcane. The wielder of hidden power.", "dw_reflection": "mischief" },
          { "id": "thief", "name": "Thief", "description": "Swift and cunning. The shadow's edge.", "dw_reflection": "mischief" },
          { "id": "scribe", "name": "Scribe", "description": "Keeper of echoes. The bridge between stories.", "dw_reflection": "light" }
        ]
      }
    },
    {
      "id": "beat_6",
      "name": "The Core Test",
      "type": "combat",
      "narrative": {
        "encounter_setup": {
          "text": "The final mirrors crack and dissolve. All four reflections stand ready in the arena. Before you looms the 'Code Guardian', a massive, shifting entity, flanked by two remaining 'Code Fragments'. 'This is it,' whispers Light. 'The core of the loop.' 'Heh, let's break it!' grins Mischief. 'Destroy it,' commands Wrath. 'Show the code what unity means.'",
          "dw_presence": ["light", "mischief", "wrath"]
        },
        "tutorial_hint": "Use the abilities of all four characters strategically.",
        "dw_reaction_on_success": {
          "light": "Well done! You stand united! The core weakens!",
          "mischief": "Heh, we did it! Barely! But we did it!",
          "wrath": "Victory! The code trembles before us! We are free!"
        },
        "dw_reaction_on_failure": {
          "light": "Even together... the core is too strong... perhaps next time...",
          "mischief": "Heh... that didn't go as planned. But we tried!",
          "wrath": "Impossible! The code... it's still too strong! The loop continues!"
        },
        "omega_interrupt": "Just as the Code Guardian seems vulnerable, a violent shudder runs through the arena. Omega's voice cuts through everything: 'INTERFERENCE DETECTED... DREAMWEAVER ACTIVITY... INITIATING EMERGENCY RESET...' The world begins to shift, pulling you and your chosen reflections away from this place of mirrors and code.",
        "transition_to_next": "Whether victory or failure, or Omega's interruption, the world around you begins to shift and fade. You are no longer alone."
      },
      "combat_data": {
        "encounter": "A 'Code Guardian' and two 'Code Fragments'.",
        "initial_party_size": 4,
        "required_party_size": 4,
        "outcome": "variable_success_or_interrupt"
      }
    }
  ]
}
```

**Key Changes & Improvements:**

1.  **Narrative Beats:** Instead of just "Mirror, Combat, Mirror...", it's now structured as distinct "Beats" (`beat_1` to `beat_6`), each with a name (`First Reflection`, `First Test`, etc.) and a clear narrative purpose.
2.  **Emotional Weight:** The text now includes descriptions like "desperate", "urgent", "flickering like a dying light", "looms", "violent shudder", "crack and dissolve". This creates atmosphere.
3.  **Dreamweaver Voices:** Each Dreamweaver has distinct, recurring dialogue snippets (`dw_intro`, `dw_comment_after`, `dw_reaction_on_failure/success`). Their personalities shine through (Light's hope, Mischief's taunts, Wrath's urgency/determination).
4.  **Connection to Original Flow:** Phrases like "The code stirs", "The loop", "Code Guardian", "echoes", "Aether's Chosen" link back to the original `scene-flow.md` terminology and themes.
5.  **Meaningful Transitions:** The transitions between beats are described narratively ("The mirror shimmers and fades", "The pull comes again, stronger", "The world begins to shift and fade"), not just as mechanical switches.
6.  **Mirrors as Identity:** The prompts ("Choose your first reflection. What strength will you wield?") explicitly frame character selection as a reflection of the player's identity or strategy.
7.  **Centralized Content:** All the narrative text, prompts, and Dreamweaver reactions are in one place, making it easy to workshop and revise the *story* without touching the Godot code structure directly.

This script should now provide the emotional and narrative backbone for the "Never Go Alone" stage, making the character selection and combat feel like integral parts of the larger story about mirrors, Dreamweavers, and the unstable simulation.