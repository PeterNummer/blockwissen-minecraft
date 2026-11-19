import { DurableObject } from "cloudflare:workers";

const CHANNELS = new Set(["welcome", "general", "minecraft"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      const channel = url.searchParams.get("channel") || "welcome";
      if (!CHANNELS.has(channel)) {
        return new Response("Unbekannter Kanal", { status: 404 });
      }

      const id = env.CHAT_ROOM.idFromName(channel);
      return env.CHAT_ROOM.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export class ChatRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket-Verbindung erforderlich", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ authenticated: false, name: "Gast" });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, rawMessage) {
    let data;
    try {
      data = JSON.parse(rawMessage);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Ungültige Nachricht." }));
      return;
    }

    const attachment = ws.deserializeAttachment() || { authenticated: false };

    if (!attachment.authenticated) {
      if (data.type !== "auth" || typeof data.code !== "string" ||
          !this.env.CHAT_ACCESS_CODE || data.code !== this.env.CHAT_ACCESS_CODE) {
        ws.send(JSON.stringify({ type: "error", message: "Der Zugangscode ist falsch." }));
        ws.close(1008, "Nicht autorisiert");
        return;
      }

      const name = typeof data.name === "string"
        ? data.name.trim().replace(/[<>]/g, "").slice(0, 24)
        : "";
      if (name.length < 2) {
        ws.send(JSON.stringify({ type: "error", message: "Der Anzeigename muss mindestens 2 Zeichen lang sein." }));
        ws.close(1008, "Ungültiger Name");
        return;
      }

      ws.serializeAttachment({ authenticated: true, name });
      const history = await this.ctx.storage.get("history") || [];
      ws.send(JSON.stringify({ type: "history", messages: history }));
      ws.send(JSON.stringify({ type: "status", message: "Verbunden." }));
      return;
    }

    if (data.type !== "message" || typeof data.text !== "string") return;
    const text = data.text.trim().slice(0, 1000);
    if (!text) return;

    const message = {
      id: crypto.randomUUID(),
      name: attachment.name,
      text,
      time: Date.now()
    };

    const history = await this.ctx.storage.get("history") || [];
    history.push(message);
    const saved = history.slice(-100);
    await this.ctx.storage.put("history", saved);

    const payload = JSON.stringify({ type: "message", message });
    for (const socket of this.ctx.getWebSockets()) {
      const state = socket.deserializeAttachment();
      if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
        try { socket.send(payload); } catch {}
      }
    }
  }

  async webSocketClose(ws, code, reason) {
    if (code >= 1000 && code < 5000 && ![1004, 1005, 1006, 1015].includes(code)) {
      ws.close(code, reason);
    } else {
      ws.close();
    }
  }
}
