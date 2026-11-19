import { DurableObject } from "cloudflare:workers";

const CHANNELS = new Set(["welcome", "general", "minecraft"]);
const SESSION_DAYS = 30;
const encoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function storeCall(env, path, body) {
  const id = env.AUTH_STORE.idFromName("tyqora-auth");
  return env.AUTH_STORE.get(id).fetch("https://auth.internal" + path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {})
  });
}
async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}
function validName(name) {
  return typeof name === "string" && /^[\p{L}\p{N}_-]{3,24}$/u.test(name);
}
function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": url.origin, "Access-Control-Allow-Methods": "GET,POST", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" } });
    }

    if (url.pathname === "/api/register" && request.method === "POST") {
      try {
        const data = await readBody(request);
        if (!validName(data.name) || !validPassword(data.password) || typeof data.inviteCode !== "string") return json({ error: "Bitte gültigen Benutzernamen, Passwort (mindestens 8 Zeichen) und Registrierungscode eingeben." }, 400);
        const isOwner = !!env.OWNER_REGISTRATION_CODE && data.inviteCode === env.OWNER_REGISTRATION_CODE;
        if (!isOwner && (!env.REGISTRATION_CODE || data.inviteCode !== env.REGISTRATION_CODE)) return json({ error: "Der Registrierungscode ist falsch." }, 403);
        const salt = randomToken();
        const passHash = await passwordHash(data.password, salt);
        const response = await storeCall(env, "/register", { name: data.name, salt, passHash, role: isOwner ? "owner" : "member" });
        const responseText = await response.text();
        return new Response(responseText, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      } catch (error) {
        console.error("TYQORA registration failed:", error?.stack || error);
        return json({ error: "Interner Registrierungsfehler. Bitte Cloudflare Worker Logs prüfen." }, 500);
      }
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      const data = await readBody(request);
      if (!validName(data.name) || !validPassword(data.password)) return json({ error: "Benutzername oder Passwort ist ungültig." }, 400);
      const lookup = await storeCall(env, "/get-user", { name: data.name });
      const user = await lookup.json();
      if (!lookup.ok || !user.user) return json({ error: "Benutzername oder Passwort ist falsch." }, 401);
      const candidate = await passwordHash(data.password, user.user.salt);
      if (candidate !== user.user.passHash) return json({ error: "Benutzername oder Passwort ist falsch." }, 401);
      const token = randomToken();
      const tokenHash = await hashText(token);
      const session = await storeCall(env, "/session", { tokenHash, userId: user.user.id, expiresAt: Date.now() + SESSION_DAYS * 86400000 });
      if (!session.ok) return new Response(session.body, { status: session.status, headers: { "Content-Type": "application/json" } });
      return json({ token, user: session.headers.get("X-User-Data") ? JSON.parse(session.headers.get("X-User-Data")) : user.user.public });
    }

    if (url.pathname === "/api/me" || url.pathname.startsWith("/api/admin/") || url.pathname === "/api/logout") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Nicht angemeldet." }, 401);
      const tokenHash = await hashText(token);
      const authResponse = await storeCall(env, "/validate", { tokenHash });
      const auth = await authResponse.json();
      if (!authResponse.ok || !auth.user) return json({ error: auth.error || "Sitzung abgelaufen." }, 401);
      if (url.pathname === "/api/me" && request.method === "GET") return json({ user: auth.user });
      if (url.pathname === "/api/logout" && request.method === "POST") {
        await storeCall(env, "/logout", { tokenHash });
        return json({ ok: true });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        if (auth.user.role !== "owner") return json({ error: "Nur der Owner darf diese Aktion ausführen." }, 403);
        if (url.pathname === "/api/admin/users" && request.method === "GET") {
          const result = await storeCall(env, "/users", {});
          return new Response(result.body, { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }
        const data = await readBody(request);
        if (url.pathname === "/api/admin/role" && request.method === "POST") return storeCall(env, "/role", data);
        if (url.pathname === "/api/admin/ban" && request.method === "POST") return storeCall(env, "/ban", data);
        if (url.pathname === "/api/admin/delete" && request.method === "POST") return storeCall(env, "/delete", data);
        if (url.pathname === "/api/admin/reset-all" && request.method === "POST") return storeCall(env, "/reset-all", {});
      }
    }

    if (url.pathname === "/api/chat") {
      const channel = url.searchParams.get("channel") || "welcome";
      if (!CHANNELS.has(channel)) return new Response("Unbekannter Kanal", { status: 404 });
      if (request.headers.get("Origin") !== url.origin) return new Response("Unzulässiger Ursprung", { status: 403 });
      const token = url.searchParams.get("token") || "";
      if (!token) return new Response("Anmeldung erforderlich", { status: 401 });
      const tokenHash = await hashText(token);
      const authResponse = await storeCall(env, "/validate", { tokenHash });
      const auth = await authResponse.json();
      if (!authResponse.ok || !auth.user) return new Response(auth.error || "Sitzung abgelaufen", { status: 401 });
      const headers = new Headers(request.headers);
      headers.set("X-TYQORA-User", JSON.stringify({ id: auth.user.id, name: auth.user.name, role: auth.user.role }));
      const id = env.CHAT_ROOM.idFromName(channel);
      return env.CHAT_ROOM.get(id).fetch(new Request(request, { headers }));
    }

    return env.ASSETS.fetch(request);
  }
};

export class AuthStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      salt TEXT NOT NULL, pass_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER NOT NULL, banned INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
    )`);
  }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const data = await readBody(request);
    const one = (sql, ...args) => this.sql.exec(sql, ...args).toArray()[0] || null;
    if (path === "/register") {
      if (data.role === "owner" && one("SELECT id FROM users WHERE role = 'owner'")) return json({ error: "Der Owner-Account wurde bereits erstellt. Der Owner-Code ist nicht mehr gültig." }, 409);
      if (one("SELECT id FROM users WHERE name = ?", data.name)) return json({ error: "Dieser Benutzername ist bereits vergeben." }, 409);
      const id = crypto.randomUUID();
      this.sql.exec("INSERT INTO users (id,name,salt,pass_hash,role,created_at) VALUES (?,?,?,?,?,?)", id, data.name, data.salt, data.passHash, data.role, Date.now());
      return json({ ok: true, message: "Account erstellt. Du kannst dich jetzt anmelden." });
    }
    if (path === "/get-user") {
      const user = one("SELECT id,name,salt,pass_hash AS passHash,role,created_at AS createdAt,banned FROM users WHERE name = ?", data.name);
      if (!user || user.banned) return json({ error: "Account nicht verfügbar." }, 404);
      user.public = { id: user.id, name: user.name, role: user.role, createdAt: user.createdAt };
      return json({ user });
    }
    if (path === "/session") {
      const user = one("SELECT id,name,role,created_at AS createdAt,banned FROM users WHERE id = ?", data.userId);
      if (!user || user.banned) return json({ error: "Dieser Account ist gesperrt." }, 403);
      this.sql.exec("INSERT OR REPLACE INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)", data.tokenHash, data.userId, data.expiresAt);
      return json({ ok: true, user: { id: user.id, name: user.name, role: user.role, createdAt: user.createdAt } });
    }
    if (path === "/validate") {
      const row = one("SELECT s.user_id,u.name,u.role,u.created_at AS createdAt,u.banned,s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", data.tokenHash);
      if (!row || row.banned || row.expiresAt < Date.now()) {
        this.sql.exec("DELETE FROM sessions WHERE token_hash=?", data.tokenHash);
        return json({ error: "Sitzung ungültig oder Account gesperrt." }, 401);
      }
      return json({ user: { id: row.user_id, name: row.name, role: row.role, createdAt: row.createdAt } });
    }
    if (path === "/logout") { this.sql.exec("DELETE FROM sessions WHERE token_hash=?", data.tokenHash); return json({ ok: true }); }
    if (path === "/users") {
      const users = this.sql.exec("SELECT id,name,role,created_at AS createdAt,banned FROM users ORDER BY created_at DESC").toArray();
      return json({ users });
    }
    if (path === "/role") {
      if (!["admin","moderator","member"].includes(data.role)) return json({ error: "Ungültige Rolle." }, 400);
      const target = one("SELECT role FROM users WHERE id=?", data.userId);
      if (!target || target.role === "owner") return json({ error: "Der Owner kann nicht geändert werden." }, 403);
      this.sql.exec("UPDATE users SET role=? WHERE id=?", data.role, data.userId);
      return json({ ok: true });
    }
    if (path === "/ban") {
      const target = one("SELECT role FROM users WHERE id=?", data.userId);
      if (!target || target.role === "owner") return json({ error: "Der Owner kann nicht gesperrt werden." }, 403);
      this.sql.exec("UPDATE users SET banned=? WHERE id=?", data.banned ? 1 : 0, data.userId);
      if (data.banned) this.sql.exec("DELETE FROM sessions WHERE user_id=?", data.userId);
      return json({ ok: true });
    }
    if (path === "/reset-all") {
      this.sql.exec("DELETE FROM sessions");
      this.sql.exec("DELETE FROM users");
      return json({ ok: true, message: "Alle Accounts und Sitzungen wurden gelöscht." });
    }
    if (path === "/delete") {
      const target = one("SELECT role FROM users WHERE id=?", data.userId);
      if (!target || target.role === "owner") return json({ error: "Der Owner kann nicht gelöscht werden." }, 403);
      this.sql.exec("DELETE FROM sessions WHERE user_id=?", data.userId);
      this.sql.exec("DELETE FROM users WHERE id=?", data.userId);
      return json({ ok: true });
    }
    return json({ error: "Unbekannte Aktion." }, 404);
  }
}

export class ChatRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket-Verbindung erforderlich", { status: 426 });
    let user;
    try { user = JSON.parse(request.headers.get("X-TYQORA-User") || "null"); } catch {}
    if (!user?.id || !user?.name) return new Response("Anmeldung erforderlich", { status: 401 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ authenticated: true, id: user.id, name: user.name, role: user.role, lastMessageAt: 0 });
    const history = await this.ctx.storage.get("history") || [];
    server.send(JSON.stringify({ type: "history", messages: history }));
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, rawMessage) {
    let data;
    try { data = JSON.parse(rawMessage); } catch { ws.send(JSON.stringify({ type: "error", message: "Ungültige Nachricht." })); return; }
    const attachment = ws.deserializeAttachment() || {};
    if (!attachment.authenticated) { ws.close(1008, "Nicht autorisiert"); return; }
    if (data.type !== "message" || typeof data.text !== "string") return;
    const text = data.text.trim().slice(0, 1000);
    if (!text) return;
    const now = Date.now();
    if (attachment.lastMessageAt && now - attachment.lastMessageAt < 700) {
      ws.send(JSON.stringify({ type: "notice", message: "Bitte warte kurz vor der nächsten Nachricht." }));
      return;
    }
    ws.serializeAttachment({ ...attachment, lastMessageAt: now });
    const message = { id: crypto.randomUUID(), userId: attachment.id, name: attachment.name, role: attachment.role, text, time: now };
    const history = await this.ctx.storage.get("history") || [];
    history.push(message);
    await this.ctx.storage.put("history", history.slice(-100));
    const payload = JSON.stringify({ type: "message", message });
    for (const socket of this.ctx.getWebSockets()) {
      const state = socket.deserializeAttachment();
      if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
        try { socket.send(payload); } catch {}
      }
    }
  }
  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch { try { ws.close(); } catch {} }
  }
}
