import { DurableObject } from "cloudflare:workers";

const CHANNELS = new Set(["welcome", "general", "minecraft"]);
const SESSION_DAYS = 30;
const encoder = new TextEncoder();
const SHOP_ITEMS = [
  { id: "mint_name", name: "Mint-Name", description: "Dein Name erscheint in frischem Mintgrün.", price: 50, type: "name", color: "#70e1b5", icon: "🌿" },
  { id: "gold_name", name: "Gold-Name", description: "Ein goldener Name für deinen Chat-Auftritt.", price: 100, type: "name", color: "#ffd166", icon: "✨" },
  { id: "violet_name", name: "Violett-Name", description: "Ein auffälliger violetter Namensstil.", price: 250, type: "name", color: "#c4a1ff", icon: "💜" },
  { id: "owner_red_name", name: "Owner-Rot", description: "Exklusiver roter Namensstil für den Owner.", price: 0, type: "name", color: "#ff5b65", icon: "🔴", ownerOnly: true },
  { id: "star_badge", name: "Stern-Badge", description: "Ein Stern neben deinem Namen – auch zusammen mit einer Namensfarbe.", price: 180, type: "badge", badge: "⭐", icon: "⭐" }
];

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

    if (url.pathname === "/api/owner/recover" && request.method === "POST") {
      try {
        const data = await readBody(request);
        if (!env.OWNER_RECOVERY_CODE || typeof data.recoveryCode !== "string" || data.recoveryCode !== env.OWNER_RECOVERY_CODE) {
          return json({ error: "Der Wiederherstellungscode ist ungültig oder nicht eingerichtet." }, 403);
        }
        if (!validName(data.name) || !validPassword(data.password)) {
          return json({ error: "Bitte Owner-Benutzernamen und ein neues Passwort (mindestens 8 Zeichen) eingeben." }, 400);
        }
        const salt = randomToken();
        const passHash = await passwordHash(data.password, salt);
        const result = await storeCall(env, "/recover-owner", { name: data.name, salt, passHash });
        const resultText = await result.text();
        return new Response(resultText, { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      } catch (error) {
        console.error("TYQORA owner recovery failed:", error?.stack || error);
        return json({ error: "Interner Wiederherstellungsfehler. Bitte Worker Logs prüfen." }, 500);
      }
    }

    if (url.pathname === "/api/owner/reset-all" && request.method === "POST") {
      const data = await readBody(request);
      if (!env.OWNER_RECOVERY_CODE || data.recoveryCode !== env.OWNER_RECOVERY_CODE) return json({ error: "Wiederherstellungscode ungültig oder nicht eingerichtet." }, 403);
      const result = await storeCall(env, "/reset-all", {});
      const body = await result.text();
      return new Response(body, { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
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

    if (url.pathname === "/api/me" || url.pathname.startsWith("/api/admin/") || url.pathname.startsWith("/api/shop") || url.pathname === "/api/logout") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Nicht angemeldet." }, 401);
      const tokenHash = await hashText(token);
      const authResponse = await storeCall(env, "/validate", { tokenHash });
      const auth = await authResponse.json();
      if (!authResponse.ok || !auth.user) return json({ error: auth.error || "Sitzung abgelaufen." }, 401);
      if (url.pathname === "/api/me" && request.method === "GET") return json({ user: auth.user });
      if (url.pathname === "/api/shop" && request.method === "GET") return storeCall(env, "/shop", { userId: auth.user.id });
      if (url.pathname === "/api/shop/buy" && request.method === "POST") {
        const data = await readBody(request);
        return storeCall(env, "/shop-buy", { userId: auth.user.id, itemId: data.itemId });
      }
      if (url.pathname === "/api/shop/equip" && request.method === "POST") {
        const data = await readBody(request);
        const itemType = data.itemType === "badge" ? "badge" : "name";
        const result = await storeCall(env, "/shop-equip", { userId: auth.user.id, itemId: data.itemId || "", itemType });
        if (result.ok) {
          const update = { userId: auth.user.id, itemId: data.itemId || "", itemType };
          await Promise.all([...CHANNELS].map(channel => env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(channel)).fetch("https://chat.internal/cosmetic-update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) })));
        }
        return result;
      }
      if (url.pathname === "/api/logout" && request.method === "POST") {
        await storeCall(env, "/logout", { tokenHash });
        return json({ ok: true });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        if (auth.user.role !== "owner") return json({ error: "Nur der Owner darf diese Aktion ausführen." }, 403);
        if (url.pathname === "/api/admin/coins" && request.method === "POST") {
          const data = await readBody(request);
          return storeCall(env, "/coins", data);
        }
        if (url.pathname === "/api/admin/users" && request.method === "GET") {
          const result = await storeCall(env, "/users", {});
          return new Response(result.body, { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
        }
        const data = await readBody(request);
        if (url.pathname === "/api/admin/role" && request.method === "POST") {
          const changed = await storeCall(env, "/role", data);
          if (changed.ok) {
            const update = { userId: data.userId, role: data.role };
            await Promise.all([...CHANNELS].map(channel => env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(channel)).fetch("https://chat.internal/role-update", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update)
            })));
          }
          return changed;
        }
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
      headers.set("X-TYQORA-User", JSON.stringify({ id: auth.user.id, name: auth.user.name, role: auth.user.role, equippedItem: auth.user.equippedItem || "", equippedBadge: auth.user.equippedBadge || "" }));
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
      created_at INTEGER NOT NULL, banned INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 100, equipped_item TEXT NOT NULL DEFAULT ''
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS user_items (user_id TEXT NOT NULL, item_id TEXT NOT NULL, purchased_at INTEGER NOT NULL, PRIMARY KEY(user_id,item_id))`);
    try { this.sql.exec("ALTER TABLE users ADD COLUMN coins INTEGER NOT NULL DEFAULT 100"); } catch {}
    try { this.sql.exec("ALTER TABLE users ADD COLUMN equipped_item TEXT NOT NULL DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE users ADD COLUMN equipped_badge TEXT NOT NULL DEFAULT ''"); } catch {}
    this.sql.exec("UPDATE users SET equipped_badge=equipped_item,equipped_item='' WHERE equipped_item='star_badge' AND equipped_badge=''");
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
    if (path === "/recover-owner") {
      const owner = one("SELECT id FROM users WHERE name = ? AND role = 'owner'", data.name);
      if (!owner) return json({ error: "Der angegebene Owner-Account wurde nicht gefunden." }, 404);
      this.sql.exec("UPDATE users SET salt=?, pass_hash=? WHERE id=? AND role='owner'", data.salt, data.passHash, owner.id);
      this.sql.exec("DELETE FROM sessions WHERE user_id=?", owner.id);
      return json({ ok: true, message: "Owner-Passwort wurde zurückgesetzt. Bitte jetzt anmelden." });
    }
    if (path === "/get-user") {
      const user = one("SELECT id,name,salt,pass_hash AS passHash,role,created_at AS createdAt,banned FROM users WHERE name = ?", data.name);
      if (!user || user.banned) return json({ error: "Account nicht verfügbar." }, 404);
      user.public = { id: user.id, name: user.name, role: user.role, createdAt: user.createdAt, coins: user.coins, equippedItem: user.equipped_item || "" };
      return json({ user });
    }
    if (path === "/session") {
      const user = one("SELECT id,name,role,created_at AS createdAt,banned FROM users WHERE id = ?", data.userId);
      if (!user || user.banned) return json({ error: "Dieser Account ist gesperrt." }, 403);
      this.sql.exec("INSERT OR REPLACE INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)", data.tokenHash, data.userId, data.expiresAt);
      return json({ ok: true, user: { id: user.id, name: user.name, role: user.role, createdAt: user.createdAt } });
    }
    if (path === "/validate") {
      const row = one("SELECT s.user_id,u.name,u.role,u.created_at AS createdAt,u.banned,u.coins,u.equipped_item AS equippedItem,u.equipped_badge AS equippedBadge,s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", data.tokenHash);
      if (!row || row.banned || row.expiresAt < Date.now()) {
        this.sql.exec("DELETE FROM sessions WHERE token_hash=?", data.tokenHash);
        return json({ error: "Sitzung ungültig oder Account gesperrt." }, 401);
      }
      return json({ user: { id: row.user_id, name: row.name, role: row.role, createdAt: row.createdAt, coins: row.coins, equippedItem: row.equippedItem || "", equippedBadge: row.equippedBadge || "" } });
    }
    if (path === "/logout") { this.sql.exec("DELETE FROM sessions WHERE token_hash=?", data.tokenHash); return json({ ok: true }); }
    if (path === "/shop") {
      const user = one("SELECT coins,role,equipped_item AS equippedItem,equipped_badge AS equippedBadge FROM users WHERE id=?", data.userId);
      if (!user) return json({ error: "Account nicht gefunden." }, 404);
      const owned = this.sql.exec("SELECT item_id AS id FROM user_items WHERE user_id=?", data.userId).toArray().map(item => item.id);
      if (user.role === "owner") owned.push("owner_red_name");
      return json({ coins: user.coins, equippedItem: user.equippedItem || "", equippedBadge: user.equippedBadge || "", owned, items: SHOP_ITEMS });
    }
    if (path === "/shop-buy") {
      const item = SHOP_ITEMS.find(entry => entry.id === data.itemId);
      if (!item) return json({ error: "Dieses Shop-Produkt gibt es nicht." }, 404);
      const user = one("SELECT coins,role FROM users WHERE id=?", data.userId);
      if (!user) return json({ error: "Account nicht gefunden." }, 404);
      if (item.ownerOnly) return json({ error: "Dieses Cosmetic ist exklusiv für den Owner." }, 403);
      if (one("SELECT item_id FROM user_items WHERE user_id=? AND item_id=?", data.userId, item.id)) return json({ error: "Diesen Artikel besitzt du bereits." }, 409);
      if (user.coins < item.price) return json({ error: "Du hast nicht genug TYQORA Coins." }, 400);
      this.sql.exec("UPDATE users SET coins=coins-? WHERE id=? AND coins>=?", item.price, data.userId, item.price);
      this.sql.exec("INSERT INTO user_items (user_id,item_id,purchased_at) VALUES (?,?,?)", data.userId, item.id, Date.now());
      const balance = one("SELECT coins FROM users WHERE id=?", data.userId);
      return json({ ok: true, coins: balance.coins, purchased: item.id });
    }
    if (path === "/shop-equip") {
      const type = data.itemType === "badge" ? "badge" : "name";
      const item = data.itemId ? SHOP_ITEMS.find(entry => entry.id === data.itemId && entry.type === type) : null;
      if (data.itemId && !item) return json({ error: "Ungültiges Cosmetic." }, 400);
      const user = one("SELECT role FROM users WHERE id=?", data.userId);
      if (!user) return json({ error: "Account nicht gefunden." }, 404);
      if (item?.ownerOnly && user.role !== "owner") return json({ error: "Dieses Cosmetic ist exklusiv für den Owner." }, 403);
      if (data.itemId && !item?.ownerOnly && !one("SELECT item_id FROM user_items WHERE user_id=? AND item_id=?", data.userId, data.itemId)) return json({ error: "Diesen Artikel besitzt du nicht." }, 403);
      if (type === "badge") {
        this.sql.exec("UPDATE users SET equipped_badge=? WHERE id=?", data.itemId || "", data.userId);
        return json({ ok: true, equippedBadge: data.itemId || "" });
      }
      this.sql.exec("UPDATE users SET equipped_item=? WHERE id=?", data.itemId || "", data.userId);
      return json({ ok: true, equippedItem: data.itemId || "" });
    }
    if (path === "/users") {
      const users = this.sql.exec("SELECT id,name,role,created_at AS createdAt,banned,coins FROM users ORDER BY created_at DESC").toArray();
      return json({ users });
    }
    if (path === "/coins") {
      const amount = Number(data.amount);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) return json({ error: "Bitte gib eine ganze Zahl zwischen 1 und 100.000 ein." }, 400);
      const target = one("SELECT id FROM users WHERE id=?", data.userId);
      if (!target) return json({ error: "Account nicht gefunden." }, 404);
      this.sql.exec("UPDATE users SET coins=coins+? WHERE id=?", amount, data.userId);
      const updated = one("SELECT coins FROM users WHERE id=?", data.userId);
      return json({ ok: true, coins: updated.coins });
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
    if (new URL(request.url).pathname === "/cosmetic-update" && request.method === "POST") {
      const update = await readBody(request);
      const history = await this.ctx.storage.get("history") || [];
      for (const message of history) {
        if (message.userId !== update.userId) continue;
        if (update.itemType === "badge") message.equippedBadge = update.itemId || "";
        else message.equippedItem = update.itemId || "";
      }
      await this.ctx.storage.put("history", history);
      for (const socket of this.ctx.getWebSockets()) {
        const state = socket.deserializeAttachment() || {};
        if (state.id === update.userId) socket.serializeAttachment({ ...state, ...(update.itemType === "badge" ? { equippedBadge: update.itemId || "" } : { equippedItem: update.itemId || "" }) });
        if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
          try { socket.send(JSON.stringify({ type: "cosmetic_update", userId: update.userId, itemId: update.itemId || "", itemType: update.itemType === "badge" ? "badge" : "name" })); } catch {}
        }
      }
      return json({ ok: true });
    }
    if (new URL(request.url).pathname === "/role-update" && request.method === "POST") {
      const update = await readBody(request);
      if (!update.userId || !["owner","admin","moderator","member"].includes(update.role)) return json({ error: "Ungültiges Rollenupdate." }, 400);
      const history = await this.ctx.storage.get("history") || [];
      let historyChanged = false;
      for (const message of history) {
        if (message.userId === update.userId && message.role !== update.role) {
          message.role = update.role;
          historyChanged = true;
        }
      }
      if (historyChanged) await this.ctx.storage.put("history", history);
      for (const socket of this.ctx.getWebSockets()) {
        const state = socket.deserializeAttachment() || {};
        if (state.id === update.userId) {
          socket.serializeAttachment({ ...state, role: update.role });
        }
        if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
          try { socket.send(JSON.stringify({ type: "role_update", userId: update.userId, role: update.role })); } catch {}
        }
      }
      return json({ ok: true });
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket-Verbindung erforderlich", { status: 426 });
    let user;
    try { user = JSON.parse(request.headers.get("X-TYQORA-User") || "null"); } catch {}
    if (!user?.id || !user?.name) return new Response("Anmeldung erforderlich", { status: 401 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ authenticated: true, id: user.id, name: user.name, role: user.role, equippedItem: user.equippedItem || "", equippedBadge: user.equippedBadge || "", lastMessageAt: 0 });
    const history = await this.ctx.storage.get("history") || [];
    server.send(JSON.stringify({ type: "history", messages: history }));
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, rawMessage) {
    let data;
    try { data = JSON.parse(rawMessage); } catch { ws.send(JSON.stringify({ type: "error", message: "Ungültige Nachricht." })); return; }
    const attachment = ws.deserializeAttachment() || {};
    if (!attachment.authenticated) { ws.close(1008, "Nicht autorisiert"); return; }
    const history = await this.ctx.storage.get("history") || [];
    const broadcast = payload => {
      for (const socket of this.ctx.getWebSockets()) {
        const state = socket.deserializeAttachment();
        if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
          try { socket.send(JSON.stringify(payload)); } catch {}
        }
      }
    };
    if (data.type === "message_edit" || data.type === "message_delete") {
      const canDelete = ["owner", "admin", "moderator"].includes(attachment.role);
      if (data.type === "message_edit" && attachment.role !== "owner") {
        ws.send(JSON.stringify({ type: "error", message: "Nur der Owner darf Nachrichten bearbeiten." }));
        return;
      }
      if (data.type === "message_delete" && !canDelete) {
        ws.send(JSON.stringify({ type: "error", message: "Nur Owner, Admins und Moderatoren dürfen Nachrichten löschen." }));
        return;
      }
      const index = history.findIndex(item => item.id === data.id);
      if (index < 0) {
        ws.send(JSON.stringify({ type: "error", message: "Nachricht nicht gefunden." }));
        return;
      }
      if (data.type === "message_delete") {
        history.splice(index, 1);
        await this.ctx.storage.put("history", history);
        broadcast({ type: "message_delete", id: data.id });
        return;
      }
      if (typeof data.text !== "string" || !data.text.trim()) {
        ws.send(JSON.stringify({ type: "error", message: "Die Nachricht darf nicht leer sein." }));
        return;
      }
      history[index].text = data.text.trim().slice(0, 1000);
      history[index].editedAt = Date.now();
      await this.ctx.storage.put("history", history);
      broadcast({ type: "message_update", message: history[index] });
      return;
    }
    if (data.type !== "message" || typeof data.text !== "string") return;
    const text = data.text.trim().slice(0, 1000);
    if (!text) return;
    const now = Date.now();
    if (attachment.lastMessageAt && now - attachment.lastMessageAt < 700) {
      ws.send(JSON.stringify({ type: "notice", message: "Bitte warte kurz vor der nächsten Nachricht." }));
      return;
    }
    ws.serializeAttachment({ ...attachment, lastMessageAt: now });
    const message = { id: crypto.randomUUID(), userId: attachment.id, name: attachment.name, role: attachment.role, equippedItem: attachment.equippedItem || "", equippedBadge: attachment.equippedBadge || "", text, time: now };
    history.push(message);
    await this.ctx.storage.put("history", history.slice(-100));
    broadcast({ type: "message", message });
  }
  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch { try { ws.close(); } catch {} }
  }
}
