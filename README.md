# Blockwissen Minecraft

Minecraft-Tipps und Tricks für **Java Edition** und **Bedrock Edition**.

## Hinweis

Blockwissen Minecraft ist ein unabhängiges Fanprojekt und steht nicht in Verbindung mit Mojang oder Microsoft.


## TYQORA Chat

TYQORA Chat nutzt Cloudflare Workers Durable Objects und WebSockets. Die Kanäle `# willkommen`, `# allgemein` und `# minecraft` haben jeweils einen eigenen Nachrichtenverlauf (bis zu 100 Nachrichten).

### Einmalige Einrichtung

1. Öffne in Cloudflare **Workers & Pages** und wähle den Worker `blockwissen-minecraft`.
2. Öffne **Settings → Variables and Secrets**.
3. Füge eine neue Variable vom Typ **Secret** hinzu:
   - Name: `CHAT_ACCESS_CODE`
   - Wert: ein eigener, schwer zu erratender Zugangscode
4. Speichere die Einstellung und deploye den Worker, falls Cloudflare das nicht automatisch erledigt.

Der Zugangscode ist ein gemeinsamer Einladungscode, kein persönliches Benutzerkonto. Jeder, der ihn kennt, kann den Chat betreten und die Nachrichten der Kanäle lesen. Teile ihn nur mit Personen, denen du vertraust. Poste keine privaten Informationen. Direktnachrichten und individuelle Benutzerkonten sind noch nicht enthalten.

### Deployment

Der Worker wird mit folgender Konfiguration bereitgestellt:

```bash
npx wrangler deploy --config wrangler.toml
```
