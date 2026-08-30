# P-Hacking: The Game

A dependency-free, browser-based implementation of the two-player p-hacking card game.

## Run locally

Open `src/index.html` in a modern browser. For the most reliable local experience, serve the `src` directory with any static-file server, for example:

```sh
cd src && python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

No build step, package installation, or backend is required. This makes the project ready to deploy to any static host.

## Included files

- `src/index.html`, `src/styles.css`, and `src/app.js`: the playable application.
- `rules.md`: source game rules.
- `src/images/`: supplied board and action-card visual assets.
