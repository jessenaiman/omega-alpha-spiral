The Windows + `uv` + credential-probe reliability problem: the image/audio/3d generator skills assume `uv run` and a profiled shell that sources the right dotfiles. On this host the
 agent runs through git-bash, the env doc says the agent process usually doesn't inherit
 the user's profile, and `uv` may or may not be on PATH. The probe says MISSING for all three. Do we make the skills robust to that,
 or do we treat credential availability as a gate and make the procedural path the documented default for
 this repo?