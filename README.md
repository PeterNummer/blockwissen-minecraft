# Blockwissen Minecraft

Minecraft-Tipps und Tricks für **Java Edition** und **Bedrock Edition**.

## Projektstruktur

```text
public/
├── index.html
├── _headers
├── css/style.css
└── js/main.js
wrangler.jsonc
README.md
```

## Cloudflare Workers Deployment

Dieses Repository wird als **Cloudflare Worker mit Static Assets** veröffentlicht (nicht als Cloudflare Pages Projekt).

Cloudflare Workers Builds:

- **Repository:** `PeterNummer/blockwissen-minecraft`
- **Branch:** `main`
- **Root directory:** `.`
- **Build command:** leer lassen
- **Deploy command:** `npx wrangler deploy --config wrangler.jsonc`

Die Datei `wrangler.jsonc` weist Wrangler an, den Ordner `./public` als statische Assets des Workers bereitzustellen. Nach jedem Commit auf `main` kann Cloudflare Workers Builds den Worker automatisch neu deployen.

## TYQORA CHAT

Mit `Strg` + `Umschalt` + `K` lässt sich die vorbereitete Chat-Oberfläche öffnen. `Esc` schließt sie wieder. Die Chat-Oberfläche ist derzeit ein Frontend-Prototyp; Anmeldung, Nachrichtenversand und Speicherung benötigen noch ein Backend.

## Hinweis

Blockwissen Minecraft ist ein unabhängiges Fanprojekt und steht nicht in Verbindung mit Mojang oder Microsoft.
