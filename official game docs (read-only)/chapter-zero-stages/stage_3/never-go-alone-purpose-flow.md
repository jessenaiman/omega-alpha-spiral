### 🧩 **Stage 3: Never Go Alone – Mirrors of the Party**

#### **Purpose & Narrative Flow**

This stage explores the **player's identity** through the act of **choosing party members**, who serve as **mirrors** of different aspects of the player (or potential paths). Stage 2 influence: JSON modifiers filter/prioritize characters based on prior Dreamweaver alignment (light path favors Scribe). Each character choice is followed by a **test** in combat using existing basic RPG mechanics. The initial party is too weak, forcing a return to the "mirror" (character selection) for reinforcement. This cycle repeats until the party is complete (4 members). Party saves via PartySaveData.cs post-final selection. The final battle is winnable with basics, but regardless of the outcome (or Omega interrupt), transitions to Stage 4.

#### **Creative Concepts**

*   **Mirrors as Choices**: The character selection screen isn't just a menu; it's a **chamber of mirrors** where the player sees reflections of themselves (the potential heroes). Picking one is like *stepping into* that reflection.
*   **Escalating Stakes**: Each return to the mirror represents a deeper commitment or a forced adaptation to survive. The player starts alone, then pairs up, then forms a trio, then a full party.
*   **Dreamweaver Agency**: The Dreamweavers are *active* here, not just narrators. They *insist* the player needs help, *guide* the selection process, and *react* to the combat outcomes. Their desperation grows with each failure.
*   **Combat as Validation**: Each combat scenario validates the need for more allies, making the subsequent character selection feel necessary and urgent, not arbitrary.
*   **Meaningful Tutorial**: Each character's first turn in battle serves as a *very brief* tutorial for their core mechanic, embedded within the narrative of "using this new ally."

#### **Rough Draft Flow**

1.  **Intro: The First Mirror**
    *   **Narrative**: A transition from Stage 2 (e.g., a fade from the glitched escape chamber). The player finds themselves in a liminal space – perhaps a room with several glowing, reflective surfaces (mirrors).
    *   **Tutorial Element**: The Ui presents the character selection screen (Fighter, Wizard, Thief, Scribe). The player is implicitly the "leader" but needs others.
    *   **Meaningful Storytelling**: The Dreamweavers (all three might speak here, or the one most aligned from Stage 2 takes the lead) explain the need for allies. "You cannot face the echoes alone. Look into the mirrors... choose your reflection."
    *   **Action**: Player selects their *first* party member (e.g., Fighter). This character becomes the initial protagonist of the first battle.

2.  **Combat 1: Alone or With One**
    *   **Narrative**: The player is placed in a simple, stylized battle arena (could be a visual callback to the Stage 2 dungeon or something new).
    *   **Tutorial Element**: If the player controls only the first character, they take their turn (e.g., Attack). This teaches the basic combat flow for *one* character.
    *   **Meaningful Storytelling**: The enemy (or enemies) are clearly too strong. The Dreamweavers react: "It's too much! You need help!" or "This path is folly without allies!"
    *   **Action**: The player either takes significant damage or clearly cannot win. The battle *abruptly* ends (not necessarily lost, but interrupted by the Dreamweavers stepping in).

3.  **Return to the Mirror 1: Adding a Second**
    *   **Narrative**: The battle scene fades. The player is back in the mirror chamber.
    *   **Tutorial Element**: Ui returns to character selection, but now *two* slots are visible (one filled by the first choice). The player selects the *second* party member.
    *   **Meaningful Storytelling**: "You need another echo, another strength." The Dreamweavers might comment on the first character's performance and the need for balance (e.g., "The Fighter's strength is good, but we need cunning/speed/magic").
    *   **Action**: Player selects the second character (e.g., Wizard).

4.  **Combat 2: Two Against the Tide**
    *   **Narrative**: Return to the battle arena, now with two party members.
    *   **Tutorial Element**: Player takes turns for both characters. This demonstrates controlling multiple units and introduces the *slight* complexity of strategy between two.
    *   **Meaningful Storytelling**: The battle is harder (more enemies or stronger ones). The Dreamweavers: "Better, but still not enough!" or "The code fights back!"
    *   **Action**: Again, the player is overwhelmed. The battle ends prematurely by Dreamweaver intervention.

5.  **Return to the Mirror 2: Adding the Third & Fourth**
    *   **Narrative**: Back to the mirror chamber.
    *   **Tutorial Element**: Ui shows three/four slots available now. The player selects the *third* and *fourth* party members in sequence or simultaneously.
    *   **Meaningful Storytelling**: "Now! Quickly! We must make you whole!" or "Four echoes, four reflections – this is the number Omega fears!" The urgency is palpable.
    *   **Action**: Player selects the remaining two characters (e.g., Thief, Scribe).

6.  **Combat 3: The Full Echo Party**
    *   **Narrative**: Return to the arena with all four characters.
    *   **Tutorial Element**: Player controls all four, demonstrating the full combat system. This is the "meat" of the tutorial, showing the synergy between
