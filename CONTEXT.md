# Omega Spiral

The game context for this repository: a browser game in which a player answers a broken machine's questions, and the world those questions build collapses and restarts.

## Demo Game Loop
Omega has managed to cobble together some game code from the earliest days of the computer and boots up a script that's been on a loop for a long time. The players are introduced to 3 unseen dreamweavers who pose existential and alignment questions
- Each dreamweaver represents the whole of Omega (a fact that the game does not, and must not reveal)
Each scene the dreamweavers challenge the player and offer 3 choices that represent one of the 3.

## Language

**Dreamweaver**:
One of the three presences that speak to the player — Light, Shadow, and Ambition. Fragments of Omega's shattered soul, each believing itself the real guide, competing to be the one that leads the player.
_Avoid_: Echo, shard, persona, narrator, "echo of Light"

**Light**:
The Dreamweaver of order and lawfulness. Straight, purposeful lines; white-blue.
_Avoid_: Luminari, Luminary, LIGHT
Code id: `luminary`

**Shadow**:
The neutral and ambivalent Dreamweaver. Sharp, angular lines; yellow-gold.
_Avoid_: Mischief, Trickster, SHADOW
Code id: `shadow`

**Ambition**:
The Dreamweaver of opportunity, potential, and possible greed. Smooth, circular paths that turn back on themselves; crimson-red.
_Avoid_: Wrath, MISCHIEF, WRATH
Code id: `ambition`

**NOTE**
- Only one dreamweaver can eventually be bound to the players
- The dreamweavers are not bound during the beginning scenes

**Dreamweaver Rules**
- There are exactly three Dreamweavers.

**Identity colour**:
A Dreamweaver's canonical colour, taken from the logo's palette. Only these three carry identity. Any other colour is illumination or glow at low opacity, never identity.
_Avoid_: accent colour, theme colour, thread colour
