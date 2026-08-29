# P-Hacking: The Game

A dependency-free, browser-based implementation of the two-player p-hacking card game.

## Run locally

Open `index.html` in a modern browser. For the most reliable local experience, serve this folder with any static-file server, for example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

No build step, package installation, or backend is required. This makes the project ready to deploy to any static host.

## Included files

- `index.html`, `styles.css`, and `app.js`: the playable application.
- `rules.md`: source game rules.
- `game_board.png` and `cards.png`: supplied visual rule references, available from within the app.
