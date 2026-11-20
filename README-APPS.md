# Blockwissen Minecraft – Apps

Die Apps verwenden dieselbe Online-Website wie die Browser-Version:
https://blockwissen-minecraft.antlon.workers.dev/

## Windows

Die Windows-Version wird mit Electron gebaut. Sie prüft beim Start auf neue GitHub-Releases, lädt Updates automatisch herunter und bietet den Neustart zur Installation an.

## Android

Die Android-Version wird mit Capacitor gebaut und prüft beim Start das neueste GitHub-Release. Wenn eine neuere Version mit der APK-Datei `Blockwissen-Minecraft-Android.apk` veröffentlicht wurde, öffnet die App den Download im Browser. Android verlangt anschließend eine Bestätigung für die Installation.

## Neue Version veröffentlichen

1. Versionsnummer in `package.json` erhöhen.
2. Änderungen im Branch `apps` committen.
3. Einen Tag auf diesem Branch erstellen und pushen, zum Beispiel `v1.0.1`.
4. GitHub Actions baut die Windows-App und Android-APK.

### Android-Signierung für Updates

Android akzeptiert Updates nur, wenn sie mit demselben Signaturschlüssel wie die installierte App signiert wurden. Vor einer öffentlichen Android-Veröffentlichung muss daher ein dauerhaft gesicherter Release-Keystore eingerichtet werden. Den privaten Keystore niemals ins Repository hochladen. Bis dahin stellt der Workflow die Android-Debug-APK als Build-Artefakt bereit; sie ist nur für Tests gedacht und nicht für nahtlose Updates über mehrere Builds hinweg geeignet.

## Hinweis

Die App benötigt eine Internetverbindung, weil Website, Community-Chat und Konten weiterhin vom bestehenden Cloudflare-Dienst bereitgestellt werden.
