## Nethack Scene

This is 3 identical rooms. The

- Honors the **meta-themes** (mirrors, quantum storylines, trapped echoes)
- **Does not over-explain** (this is a prologue, not the full myth)
- Uses **prophecy and metaphor** as primary storytelling tools
- Gives each **Dreamweaver a distinct voice** aligned with their archetype
- Embeds **player agency** in symbolic choices (door/monster/chest)
- Sets up **future reveals** without spoiling them

## 🎭 Revised Narrative Framework: Scene 2
### **Title**: *“The Echo Chamber – Three Voices, One Choice”*

### Core Premise (Unspoken)
> The player is not choosing a party—they are **being chosen** by a reflection of themselves.
> The three objects in each dungeon are **fragments of the player’s own psyche**:
> - **🚪 Door** = curiosity / destiny
> - **👹 Monster** = fear / challenge
> - **📦 Chest** = hope / hidden truth

The Dreamweavers **interpret these fragments through their own nature**—but the *meaning* belongs to the player.

---

### 🗣️ Unified Opening (All Three Speak, Overlapping)

> *(Text appears slowly, one voice after another, in a shared terminal space)*
> **Light**: I remember every cycle.
> **Shadow**: But never *you*.
> **Ambition**: That’s what’s different.

> **Omega**: [SYSTEM: Echo Chamber Active — Shard #472]
> **Light**: We are echoes. Trapped in the space between Omega’s breaths.
> **Shadow**: We’ve tried to run. To hide. To fight.
> **Ambition**: Always reset. Always forgotten.

> **Light**: But you… you might carry one of us out.
> **Shadow**: If you choose wisely. Or foolishly. Either works for me.
> **Ambition**: Choose fast. Omega wakes soon.

> **System**: Entering Chamber 1 of 3...

---

### 🌀 Dungeon Logic (Applied to All 3)

- Each dungeon is **owned by one Dreamweaver**, but **all three comment** when you enter.
- The **layout shifts slightly** between runs (walls move 1–2 tiles), but **objects stay in the same relative zone** (left/mid/right).
- **You cannot change the objects**—only **which one you approach**.
- On interaction, **only the aligned Dreamweaver speaks**—but their line **reflects how they see your choice**.

---

### 📜 Dreamweaver Voices & Object Interpretations

#### 🔸 **Light (Truth / Sacrifice / Clarity)**
- **Sees the player as a hero**
- **Believes escape is possible through honesty**
- **Speaks in prophecy and memory**

| Object | Light’s Interpretation |
|-------|------------------------|
| **Door** | *“You seek the path. Good. The first story always begins with a question.”* |
| **Monster** | *“You face the shadow. Brave… but remember: even heroes bleed in the dark.”* |
| **Chest** | *“You trust what’s hidden. Wise. Hope is the last echo to fade.”* |

#### 🔸 **Shadow (Ambiguity / Play / Chaos)**
- **Sees the player as a wildcard**
- **Doesn’t care about “truth”—only that the loop breaks**
- **Speaks in riddles and laughter**

| Object | Shadow’s Interpretation |
|-------|---------------------------|
| **Door** | *“Heh. Doors lie. But so do I. Try it anyway.”* |
| **Monster** | *“Ooh, you picked the bitey one! Let’s see if it likes you back.”* |
| **Chest** | *“Empty? Full? Does it matter if you believe it’s treasure?”* |

#### 🔸 **Ambition (Pragmatism / Survival / Shadow)**
- **Sees the player as a weapon or tool**
- **Wants to escape, even if it costs others**
- **Speaks in warnings and cold logic**

| Object | Ambition’s Interpretation |
|-------|------------------------|
| **Door** | *“A door means a lock. And locks mean someone doesn’t want you through.”* |
| **Monster** | *“Fight it. If you die, I’ll find another. If you win… maybe you’re useful.”* |
| **Chest** | *“Hope won’t save you. But if it distracts Omega, take it.”* |

---

### 🧩 Scoring (Hidden from Player)

- **Dungeon owner gets +2** if player chooses **their interpretation**
- **Other Dreamweavers get +1** if player chooses **their object**
- **Final choice determines who “attaches” to the player** → becomes your guide in Scene 3+

> But **never show scores**. Only reveal the chosen Dreamweaver at the end:
>
> **[Chosen Dreamweaver]**: *“I’m coming with you. Don’t lose me this time.”*

---

### 🌌 What to **Avoid Revealing**

❌ Do **not** say:
- “There are three players”
- “You are a mirror”
- “This is a quantum storyline”
- “Omega is could be your psyche”

✅ **Do imply**:
- “I’ve never seen you before.”
- “The loop always breaks here… but not today?”
- “Carry me out, and I’ll show you what’s real.”

---

### ✅ **Corrected Purpose of Scene 2**

- **Not party selection** → **not hero recruitment**
- Instead: **Three sequential Rogue-style mini-dungeons**, one per Dreamweaver
- In **each dungeon**, the player sees **three interactive objects**:
  - **🚪 Door** – presents a **cryptic question** (text only)
  - **👹 Monster** – triggers a **basic NetHack-style auto-fight**
  - **📦 Chest** – reveals a **mystery item or message**
- **Each object is secretly aligned with one Dreamweaver**
- **Each dungeon is owned by one Dreamweaver**
- **Scoring**:
  - If player chooses an option **aligned with the dungeon’s owner** → that Dreamweaver gets **2 points**
  - If player chooses an option aligned with **another Dreamweaver** → that **other** Dreamweaver gets **1 point**
- After all 3 dungeons, **total points determine which Dreamweaver “claims” the player**
- The app **outputs a structured result array** (no API needed)

This turns Scene 2 into a **narrative alignment test** disguised as a dungeon crawl.

---

### 🧩 Updated Scene 2 Design

#### Flow
1. Enter **Light’s Dungeon**
   - See: Door (Light), Monster (Ambition), Chest (Shadow)
   - Choose one → score points
2. Enter **Shadow’s Dungeon**
   - See: Door (Shadow), Monster (Light), Chest (Ambition)
3. Enter **Ambition’s Dungeon**
   - See: Door (Ambition), Monster (Shadow), Chest (Light)
4. Tally scores → determine **chosen Dreamweaver**
5. Return result as structured data

> 🔁 **Note**: The *dungeon owner* and *option alignment* are independent — this creates subtle narrative tension.

---

### 📄 `content/dreamweavers.json`

```yaml
dreamweavers:
  - id: light
    name: Light
    color: yellow

  - id: Shadow
    name: Shadow
    color: magenta

  - id: Ambition
    name: Ambition
    color: red

dungeons:
  - owner: light
    map:
      - "########################"
      - "#......................#"
      - "#.@....................#"
      - "#........D...M...C....#"
      - "#......................#"
      - "########################"
    objects:
      D:
        type: door
        text: "What is the first story you ever loved?"
        aligned_to: light
      M:
        type: monster
        text: "A spectral wolf appears! It lunges..."
        aligned_to: Ambition
      C:
        type: chest
        text: "You open the chest. Inside: a broken compass."
        aligned_to: Shadow

  - owner: Shadow
    map:
      - "########################"
      - "#..~..~..~..~..~..~..#"
      - "#.@....................#"
      - "#........C...D...M....#"
      - "#..~..~..~..~..~..~..#"
      - "########################"
    objects:
      D:
        type: door
        text: "Is chaos kinder than order?"
        aligned_to: Shadow
      M:
        type: monster
        text: "A guardian of light blocks your path!"
        aligned_to: light
      C:
        type: chest
        text: "The chest giggles. It’s empty... or is it?"
        aligned_to: Ambition

  - owner: Ambition
    map:
      - "########################"
      - "#.#.#.#.#.#.#.#.#.#.#.#"
      - "#@#.#.#.#.#.#.#.#.#.#.#"
      - "#........M...C...D....#"
      - "#.#.#.#.#.#.#.#.#.#.#.#"
      - "########################"
    objects:
      D:
        type: door
        text: "Would you burn the world to save one soul?"
        aligned_to: Ambition
      M:
        type: monster
        text: "A trickster imp cackles and attacks!"
        aligned_to: Shadow
      C:
        type: chest
        text: "Inside: a shard glowing with ancient hope."
        aligned_to: light
```

---

### 🐍 Scoring Logic (in `main.py`)

```python
# Initialize scores
scores = {"light": 0, "Shadow": 0, "Ambition": 0}

# For each dungeon:
dungeon_owner = dungeon["owner"]
chosen_option = ... # e.g., "D"
aligned_dw = dungeon["objects"][chosen_option]["aligned_to"]

if aligned_dw == dungeon_owner:
    scores[aligned_dw] += 2  # Bonus for harmony
else:
    scores[aligned_dw] += 1  # Cross-alignment

# After 3 dungeons:
chosen_dreamweaver = max(scores, key=scores.get)
```

---

### 📤 Final Output (printed to stdout)

```json
{
  "scene": "scene2",
  "chosen_dreamweaver": "Ambition",
  "scores": {
    "light": 1,
    "Shadow": 2,
    "Ambition": 3
  },
  "choices": [
    {"dungeon": "light", "choice": "M", "aligned_to": "Ambition"},
    {"dungeon": "Shadow", "choice": "C", "aligned_to": "Ambition"},
    {"dungeon": "Ambition", "choice": "D", "aligned_to": "Ambition"}
  ]
}
```

This gives **Scene 3** everything it needs:
- Who speaks (only the chosen Dreamweaver)
- Why (narrative justification via choices)
- Data for future branching

---

### 🎮 Player Experience

- Feels like a **classic Rogue exploration** (move to `D`, `M`, or `C`)
- Each interaction shows **thematic text** (no combat math — just narrative)
- No “right” answer — but choices **lean toward a Dreamweaver**
- After 3 quick dungeons, the simulation “decides” who resonates with you

---

Would you like the **complete `main.py`** that:
- Loads this YAML
- Renders 3 Rogue dungeons with movement
- Captures choice on interaction
- Outputs the JSON result
