# pi agent settings

My private dotfiles/config for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent) (`~/.pi/agent`).

## What's here

- `settings.json` — model, theme, packages, and behavior settings
- `models.json` — custom model definitions
- `extensions/` — custom extensions (agent-browser, grill-question, omarchy-system-theme)
- `skills/` — all shared skills, including `orient`, `diagnosing-bugs`, `grilling`, `tdd`, and the other skills previously installed under `~/.agents/skills`
- `npm/package.json` + lockfile — pi extension packages installed via npm

## Restore on a new machine

Install pi first, then run:

```bash
git clone git@github.com:ochanomizu21/pi-settings.git ~/.pi/agent
cd ~/.pi/agent/npm && npm ci   # restores extension packages
npm install --global agent-browser && agent-browser install  # browser extension
pi   # the cloned global skills/extensions/settings are loaded automatically
```

Because pi automatically discovers `~/.pi/agent/skills/`, this clone is
self-contained and does not require a separate `~/.agents/skills/` directory.

Note: `auth.json` (API credentials), sessions, and caches are intentionally
gitignored and must be re-created with pi / `/login` on a new machine.
