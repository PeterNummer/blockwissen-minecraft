# Blockwissen Minecraft – Apps

Die Apps verwenden dieselbe Online-Website wie die Browser-Version:
https://blockwissen-minecraft.antlon.workers.dev/

**Inhalte und Website-Funktionen sind dadurch immer aktuell**, sobald du sie auf der Website veröffentlichst. Neue Versionen der Windows- und Android-App selbst werden über GitHub Releases verteilt.

## Windows

Die Windows-Version wird mit Electron gebaut. Sie prüft beim Start auf neue GitHub-Releases, lädt Updates automatisch herunter und bietet den Neustart zur Installation an.

## Android

Die Android-Version wird mit Capacitor gebaut und prüft beim Start das neueste GitHub-Release. Wenn eine neuere Version mit der APK-Datei `Blockwissen-Minecraft-Android.apk` veröffentlicht wurde, öffnet die App den Download im Browser. Android verlangt anschließend eine Bestätigung für die Installation.

## Neue Version veröffentlichen

1. Änderungen im Branch `apps` committen.
2. `package.json` Versionsnummer erhöhen.
3. Einen Tag auf dem Branch `apps` erstellen und pushen, zum Beispiel `v1.0.1`.
4. GitHub Actions baut die Windows-App und Android-APK. Die Windows-Installationsdatei wird direkt im Release veröffentlicht.

Das Tag muss zur Versionsnummer in `package.json` passen.

## Android-Signierung für automatische Updates

Android akzeptiert Updates nur, wenn sie mit demselben Signaturschlüssel wie die installierte App signiert wurden. Dafür muss einmalig ein privater Release-Keystore erstellt und als GitHub Actions Secret hinterlegt werden. Den Keystore niemals ins Repository hochladen.

### Keystore erstellen (einmalig)

Auf einem PC mit Java:

```powershell
keytool -genkeypair -v -keystore blockwissen-release.jks -alias blockwissen -keyalg RSA -keysize 2048 -validity 10000
```

Die Datei `blockwissen-release.jks` und die dabei gewählten Passwörter sicher aufbewahren. Wenn der Schlüssel verloren geht, können bestehende Android-Installationen nicht mit einer neuen APK aktualisiert werden.

Den Keystore für GitHub Base64-kodieren (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\\blockwissen-release.jks")) | Set-Clipboard
```

Im GitHub-Repository unter **Settings → Secrets and variables → Actions → New repository secret** diese vier Secrets anlegen:

- `ANDROID_KEYSTORE_BASE64` – den kopierten Base64-Inhalt
- `ANDROID_KEYSTORE_PASSWORD` – Keystore-Passwort
- `ANDROID_KEY_ALIAS` – `blockwissen`
- `ANDROID_KEY_PASSWORD` – Passwort des Schlüssels

Danach hängt der Workflow signierte APKs als `Blockwissen-Minecraft-Android.apk` an jedes Release an. Die Android-App kann diese Versionen dann erkennen und zum Update führen.

Ohne diese vier Secrets erstellt der Workflow nur eine Android-Test-APK als Actions-Artefakt. Sie ist nicht für reguläre Updates geeignet.

## Internetverbindung

Die App benötigt eine Internetverbindung, weil Website, Community-Chat und Konten weiterhin vom bestehenden Cloudflare-Dienst bereitgestellt werden.
