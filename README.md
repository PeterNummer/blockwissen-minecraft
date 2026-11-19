# Blockwissen Minecraft

Minecraft-Tipps und Tricks für **Java Edition** und **Bedrock Edition**.

## Hinweis

Blockwissen Minecraft ist ein unabhängiges Fanprojekt und steht nicht in Verbindung mit Mojang oder Microsoft.

## TYQORA Chat

TYQORA Chat nutzt Cloudflare Workers, Durable Objects und WebSockets. Die Kanäle `# willkommen`, `# allgemein` und `# minecraft` behalten jeweils einen Nachrichtenverlauf mit bis zu 100 Nachrichten.

### Cloudflare-Secrets einrichten

Öffne in Cloudflare **Workers & Pages → blockwissen-minecraft → Settings → Variables and Secrets** und füge diese drei Einträge jeweils als **Secret** hinzu:

- `REGISTRATION_CODE`: gemeinsamer Code, den neue Mitglieder bei der Registrierung eingeben müssen.
- `OWNER_REGISTRATION_CODE`: separater, besonders geheimer Code für die einmalige Erstellung des Owner-Kontos.
- `CHAT_ACCESS_CODE`: wird von der neuen Account-Anmeldung nicht mehr verwendet und kann nach erfolgreichem Wechsel entfernt werden.

**Wichtig:** Bewahre den Owner-Code sicher auf und gib ihn niemandem weiter. Registriere zuerst deinen Owner-Account. Der erste erfolgreiche Owner-Account wird dauerhaft als einziger Owner festgelegt; weitere Registrierungen mit dem Owner-Code werden abgewiesen. Danach können sich alle mit Benutzername und Passwort anmelden. Normale Registrierungen erhalten die Rolle Mitglied.

Passwörter werden mit PBKDF2 gehasht. Sitzungen werden als Hash gespeichert und laufen nach 30 Tagen ab. Der Owner kann im Bereich **Einstellungen** Accounts ansehen, Rollen ändern, sperren und löschen. Der Owner-Account selbst ist vor diesen Aktionen geschützt.

### Deployment

Nach dem Einrichten der Secrets deploye den Worker mit:

```bash
npx wrangler deploy --config wrangler.toml
```

Die Durable-Object-Migration für `AuthStore` wird durch die Migration `v2` in `wrangler.toml` angelegt.
