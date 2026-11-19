# Blockwissen Minecraft

Minecraft-Tipps und Tricks für **Java Edition** und **Bedrock Edition**.

## Projektstruktur

```text
public/
├── index.html       # Website-Einstiegspunkt
├── _headers         # Cloudflare Pages HTTP-Header
├── css/style.css    # Gestaltung
└── js/main.js       # Interaktionen und TYQORA-CHAT-Tastenkürzel
```

## Cloudflare Pages Deployment

Dieses Projekt ist eine statische Website und benötigt keinen Build-Schritt.

- **Framework preset:** None
- **Root directory:** `/` (Repository-Root)
- **Build command:** leer lassen
- **Build output directory:** `public`

Nach dem Verbinden des GitHub-Repositories veröffentlicht Cloudflare Pages den Inhalt des Ordners `public` automatisch bei jedem Push auf den ausgewählten Produktionsbranch.

## TYQORA CHAT

Mit `Strg` + `Umschalt` + `K` lässt sich die vorbereitete Chat-Oberfläche öffnen. `Esc` schließt sie wieder. Die Chat-Oberfläche ist derzeit ein Frontend-Prototyp; Anmeldung, Nachrichtenversand und Speicherung benötigen noch ein Backend.

## Hinweis

Blockwissen Minecraft ist ein unabhängiges Fanprojekt und steht nicht in Verbindung mit Mojang oder Microsoft.
