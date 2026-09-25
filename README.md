# pi agent settings

My private dotfiles/config for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent) (`~/.pi/agent`).

## What's here

- `settings.json` — model, theme, packages, and behavior settings
- `models.json` — custom model definitions
- `extensions/` — custom extensions (agent-browser, grill-question, omarchy-system-theme)
- `skills/` — custom skills (orient)
- `npm/package.json` — pi extension packages installed via npm

## Restore on a new machine

```bash
git clone git@github.com:ochanomizu21/pi-settings.git ~/.pi/agent
cd ~/.pi/agent/npm && npm install   # restores extension packages
```

Note: `auth.json` (API credentials), sessions, and caches are intentionally
gitignored and must be re-created with `pi` / `/login` on a new machine.
