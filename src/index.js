import { DurableObject } from "cloudflare:workers";

const CHANNELS = new Set(["welcome", "general", "minecraft"]);
const SESSION_DAYS = 30;
const encoder = new TextEncoder();
const SHOP_ITEMS = [
  { id: "mint_name", name: "Mint-Name", description: "Dein Name erscheint in frischem Mintgrün.", price: 50, type: "name", color: "#70e1b5", icon: "🌿" },
  { id: "gold_name", name: "Gold-Name", description: "Ein goldener Name für deinen Chat-Auftritt.", price: 100, type: "name", color: "#ffd166", icon: "✨" },
  { id: "violet_name", name: "Violett-Name", description: "Ein auffälliger violetter Namensstil.", price: 250, type: "name", color: "#c4a1ff", icon: "💜" },
  { id: "ocean_name", name: "Ozean-Blau", description: "Ein kühler, leuchtender Blauton für deinen Namen.", price: 120, type: "name", color: "#54b9ff", icon: "🌊" },
  { id: "ruby_name", name: "Rubin-Rot", description: "Ein kräftiger roter Farbverlauf.", price: 160, type: "name", color: "#ff647c", icon: "❤️" },
  { id: "sunset_name", name: "Sonnenuntergang", description: "Exklusiver Namensstil nur für den Owner – ein warmer Verlauf aus Orange und Pink.", price: 0, type: "name", color: "#ff9b61", icon: "🌅", ownerOnly: true },
  { id: "ice_name", name: "Eis-Kristall", description: "Ein frostiger Look in hellem Cyan.", price: 220, type: "name", color: "#8be9ff", icon: "❄️" },
  { id: "emerald_name", name: "Smaragd-Grün", description: "Ein satter grüner Farbverlauf.", price: 240, type: "name", color: "#6ee7a8", icon: "💎" },
  { id: "star_badge", name: "Stern-Badge", description: "Ein Stern neben deinem Namen.", price: 180, type: "badge", badge: "⭐", icon: "⭐" },
  { id: "crown_badge", name: "Kronen-Badge", description: "Eine Krone neben deinem Namen.", price: 220, type: "badge", badge: "👑", icon: "👑" },
  { id: "fire_badge", name: "Feuer-Badge", description: "Eine Flamme neben deinem Namen.", price: 150, type: "badge", badge: "🔥", icon: "🔥" },
  { id: "diamond_badge", name: "Diamant-Badge", description: "Ein Diamant neben deinem Namen.", price: 200, type: "badge", badge: "💎", icon: "💎" },
  { id: "rocket_badge", name: "Raketen-Badge", description: "Eine Rakete neben deinem Namen.", price: 170, type: "badge", badge: "🚀", icon: "🚀" },
  { id: "heart_badge", name: "Herz-Badge", description: "Ein Herz neben deinem Namen.", price: 130, type: "badge", badge: "💜", icon: "💜" },
  { id: "leaf_badge", name: "Blatt-Badge", description: "Ein Blatt neben deinem Namen.", price: 110, type: "badge", badge: "🍀", icon: "🍀" },
  { id: "ghost_badge", name: "Geister-Badge", description: "Ein Geist neben deinem Namen.", price: 190, type: "badge", badge: "👻", icon: "👻" },
  { id: "frame_neon", name: "Neon-Rahmen", description: "Ein leuchtender Rahmen für dein Profilbild.", price: 220, type: "profile_frame", value: "neon", icon: "🟦" },
  { id: "frame_gold", name: "Goldrahmen", description: "Ein edler goldener Profilbild-Rahmen.", price: 350, type: "profile_frame", value: "gold", icon: "🟨" },
  { id: "frame_ice", name: "Eisrahmen", description: "Ein frostiger Rahmen mit kühlem Leuchten.", price: 280, type: "profile_frame", value: "ice", icon: "❄️" },
  { id: "background_space", name: "Weltraum-Profil", description: "Ein dunkler Weltraum-Look für dein Profil.", price: 260, type: "profile_background", value: "space", icon: "🌌" },
  { id: "background_minecraft", name: "Overworld-Profil", description: "Ein grüner Look inspiriert von Minecraft-Biomen.", price: 240, type: "profile_background", value: "minecraft", icon: "🌳" },
  { id: "effect_sparkle", name: "Funkel-Chat", description: "Deine Chatnachrichten erhalten einen dezenten Glitzereffekt.", price: 180, type: "chat_effect", value: "sparkle", icon: "✨" },
  { id: "effect_glow", name: "Glow-Chat", description: "Ein sanft leuchtender Rand für deine Nachrichten.", price: 230, type: "chat_effect", value: "glow", icon: "💡" },
  { id: "theme_cyber", name: "Cyberpunk-Design", description: "Ein futuristischer Neon-Look für deine Nachrichten.", price: 300, type: "chat_theme", value: "cyber", icon: "🌃" },
  { id: "theme_amoled", name: "AMOLED-Design", description: "Ein besonders dunkles Chat-Design.", price: 200, type: "chat_theme", value: "amoled", icon: "🌑" },
  { id: "sticker_minecraft", name: "Minecraft-Sticker", description: "Schaltet ein kleines Minecraft-Sticker-Menü im Chat frei.", price: 250, type: "sticker_pack", value: "minecraft", icon: "⛏️" },
  { id: "sticker_fun", name: "Emoji-Sticker", description: "Schaltet zusätzliche Emoji-Sticker im Chat frei.", price: 180, type: "sticker_pack", value: "fun", icon: "🎉" },
  { id: "status_star", name: "Stern-Status", description: "Ein Stern-Symbol neben deinem Namen.", price: 120, type: "status_icon", value: "⭐", icon: "⭐" },
  { id: "status_lightning", name: "Blitz-Status", description: "Ein Blitz-Symbol neben deinem Namen.", price: 140, type: "status_icon", value: "⚡", icon: "⚡" },
  { id: "title_builder", name: "Titel: Weltenbauer", description: "Der Titel Weltenbauer erscheint in deinem Profil und Chat.", price: 280, type: "profile_title", value: "Weltenbauer", icon: "🧱" },
  { id: "title_explorer", name: "Titel: Entdecker", description: "Der Titel Entdecker erscheint in deinem Profil und Chat.", price: 220, type: "profile_title", value: "Entdecker", icon: "🧭" },
  { id: "entry_portal", name: "Portal-Auftritt", description: "Ein dezenter Portal-Effekt bei deinen Chatnachrichten.", price: 320, type: "entry_effect", value: "portal", icon: "🌀" },
  { id: "entry_spark", name: "Sternen-Auftritt", description: "Ein kurzer Sternen-Akzent bei deinen Chatnachrichten.", price: 260, type: "entry_effect", value: "spark", icon: "🌠" },
  { id: "collectible_pixel", name: "Pixel-Sammlerstück", description: "Ein seltenes Pixel-Sammler-Badge für dein Profil.", price: 400, type: "collectible", value: "pixel", badge: "🟪", icon: "🟪" },
  { id: "collectible_mythic", name: "Mythischer Kristall", description: "Ein besonders seltenes Sammlerstück.", price: 650, type: "collectible", value: "mythic", badge: "🔮", icon: "🔮" },
  { id: "music_profile", name: "Profil-Musik", description: "Schaltet die Möglichkeit frei, einen eigenen Musiklink im Profil zu hinterlegen.", price: 500, type: "profile_music", value: "enabled", icon: "🎵" },
  { id: "font_pixel", name: "Pixel-Schrift", description: "Eine pixelige Schrift für deine Chatnachrichten.", price: 180, type: "message_font", value: "pixel", icon: "👾" },
  { id: "font_serif", name: "Klassische Schrift", description: "Eine elegante Serifenschrift für deine Chatnachrichten.", price: 150, type: "message_font", value: "serif", icon: "📜" },
  { id: "gradient_spectrum", name: "Spektrum-Name", description: "Ein bunter Farbverlauf für deinen Namen.", price: 300, type: "name", color: "spectrum", icon: "🌈" },
  { id: "gradient_fire", name: "Flammen-Name", description: "Ein warmer Orange-Rot-Verlauf für deinen Namen.", price: 280, type: "name", color: "fire", icon: "🔥" },
  { id: "badge_moon", name: "Mond-Badge", description: "Ein Mond neben deinem Namen.", price: 160, type: "badge", badge: "🌙", icon: "🌙" },
  { id: "badge_comet", name: "Kometen-Badge", description: "Ein Komet neben deinem Namen.", price: 210, type: "badge", badge: "☄️", icon: "☄️" }
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
    if (url.pathname === "/api/mobile-gate" && request.method === "POST") {
      if (request.headers.get("Origin") !== url.origin) return json({ error: "Unzulässiger Ursprung." }, 403);
      if (!env.TYQORA_MOBILE_PIN || env.TYQORA_MOBILE_PIN.length < 4) return json({ error: "Der mobile Geheimzugang ist noch nicht eingerichtet." }, 503);
      try {
        const data = await readBody(request);
        if (typeof data.pin !== "string" || data.pin.length > 32) return json({ error: "Die PIN ist nicht richtig." }, 401);
        const encoder = new TextEncoder();
        const expected = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(env.TYQORA_MOBILE_PIN)));
        const supplied = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(data.pin)));
        let difference = 0;
        for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ supplied[i];
        if (difference !== 0) return json({ error: "Die PIN ist nicht richtig." }, 401);
        return json({ ok: true });
      } catch {
        return json({ error: "Die PIN konnte nicht geprüft werden." }, 400);
      }
    }
    if (url.pathname === "/api/avatar-proxy" && request.method === "GET") {
      const source = url.searchParams.get("url") || "";
      let imageUrl;
      try { imageUrl = new URL(source); } catch { return new Response("Ungültige Bildadresse.", { status: 400 }); }
      if (imageUrl.protocol !== "https:" || imageUrl.hostname !== "ugc.production.linktr.ee" || imageUrl.username || imageUrl.password) {
        return new Response("Bildquelle nicht erlaubt.", { status: 403 });
      }
      try {
        const imageResponse = await fetch(imageUrl.href, {
          headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
          redirect: "follow"
        });
        const contentType = imageResponse.headers.get("Content-Type") || "";
        const length = Number(imageResponse.headers.get("Content-Length") || 0);
        if (!imageResponse.ok || !contentType.toLowerCase().startsWith("image/")) return new Response("Bildquelle liefert keine Bilddatei.", { status: 502 });
        if (length > 5 * 1024 * 1024) return new Response("Bild ist zu groß (maximal 5 MB).", { status: 413 });
        const bytes = await imageResponse.arrayBuffer();
        if (bytes.byteLength > 5 * 1024 * 1024) return new Response("Bild ist zu groß (maximal 5 MB).", { status: 413 });
        return new Response(bytes, { headers: {
          "Content-Type": contentType,
          "Content-Length": String(bytes.byteLength),
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff"
        }});
      } catch (error) {
        console.error("TYQORA avatar proxy failed:", error);
        return new Response("Bild konnte nicht vom Bildserver geladen werden.", { status: 502 });
      }
    }

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
        const itemType = typeof data.itemType === "string" ? data.itemType : "name";
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

    if (url.pathname.startsWith("/api/community/")) {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Nicht angemeldet." }, 401);
      const tokenHash = await hashText(token);
      const authResponse = await storeCall(env, "/validate", { tokenHash });
      const auth = await authResponse.json();
      if (!authResponse.ok || !auth.user) return json({ error: "Sitzung abgelaufen." }, 401);
      const data = request.method === "POST" ? await readBody(request) : {};
      const action = url.pathname.slice("/api/community/".length);
      const payload = { ...data, userId: auth.user.id };
      if (action === "profile" && request.method === "GET") payload.targetId = url.searchParams.get("id") || auth.user.id;
      if (action === "members" && request.method === "GET") return storeCall(env, "/community/members", payload);
      if (action === "notifications" && request.method === "GET") return storeCall(env, "/community/notifications", payload);
      if (action === "notifications/read" && request.method === "POST") return storeCall(env, "/community/notifications-read", payload);
      if (action === "dm" && request.method === "GET") { payload.otherId = url.searchParams.get("with") || ""; return storeCall(env, "/community/dm-list", payload); }
      if (action === "dm" && request.method === "POST") return storeCall(env, "/community/dm-send", payload);
      if (action === "reactions" && request.method === "GET") { payload.messageId = url.searchParams.get("messageId") || ""; return storeCall(env, "/community/reactions-get", payload); }
      if (action === "react" && request.method === "POST") return storeCall(env, "/community/react", payload);
      if (action === "xp" && request.method === "POST") return storeCall(env, "/community/xp", payload);

      if (action === "profile" && request.method === "GET") return storeCall(env, "/community/profile-get", payload);
      if (action === "profile" && request.method === "POST") return storeCall(env, "/community/profile-save", payload);
      if (action === "friends" && request.method === "GET") return storeCall(env, "/community/friends", payload);
      if (action === "friend-request" && request.method === "POST") return storeCall(env, "/community/friend-request", payload);
      if (action === "friend-respond" && request.method === "POST") return storeCall(env, "/community/friend-respond", payload);
      if (action === "friend-remove" && request.method === "POST") return storeCall(env, "/community/friend-remove", payload);
      if (action === "theme" && request.method === "GET") return storeCall(env, "/community/theme", payload);
      if (action === "theme" && request.method === "POST") return storeCall(env, "/community/theme", payload);
      return json({ error: "Unbekannte Community-Aktion." }, 404);
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
      headers.set("X-TYQORA-User", JSON.stringify({ id: auth.user.id, name: auth.user.name, role: auth.user.role, equippedItem: auth.user.equippedItem || "", equippedBadge: auth.user.equippedBadge || "", equippedCosmetics: auth.user.equippedCosmetics || {} }));
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
    this.sql.exec(`CREATE TABLE IF NOT EXISTS user_cosmetics (user_id TEXT NOT NULL, slot TEXT NOT NULL, item_id TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id,slot))`);
    try { this.sql.exec("ALTER TABLE users ADD COLUMN coins INTEGER NOT NULL DEFAULT 100"); } catch {}
    try { this.sql.exec("ALTER TABLE users ADD COLUMN equipped_item TEXT NOT NULL DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE users ADD COLUMN equipped_badge TEXT NOT NULL DEFAULT ''"); } catch {}
    this.sql.exec("UPDATE users SET equipped_badge=equipped_item,equipped_item='' WHERE equipped_item='star_badge' AND equipped_badge=''");
    this.sql.exec("CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY, bio TEXT NOT NULL DEFAULT '', avatar_url TEXT NOT NULL DEFAULT '', banner_url TEXT NOT NULL DEFAULT '', background_url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '', music_url TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL)");
    try { this.sql.exec("ALTER TABLE profiles ADD COLUMN title TEXT NOT NULL DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE profiles ADD COLUMN music_url TEXT NOT NULL DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE profiles ADD COLUMN banner_url TEXT NOT NULL DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE profiles ADD COLUMN background_url TEXT NOT NULL DEFAULT ''"); } catch {}
    this.sql.exec("CREATE TABLE IF NOT EXISTS friend_requests (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, recipient_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, UNIQUE(sender_id,recipient_id))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS user_preferences (user_id TEXT PRIMARY KEY, theme TEXT NOT NULL DEFAULT 'default', updated_at INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS user_achievements (user_id TEXT NOT NULL, achievement_id TEXT NOT NULL, unlocked_at INTEGER NOT NULL, PRIMARY KEY(user_id,achievement_id))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS dm_messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, recipient_id TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, read_at INTEGER NOT NULL DEFAULT 0)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS message_reactions (message_id TEXT NOT NULL, user_id TEXT NOT NULL, emoji TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(message_id,user_id,emoji))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, read_at INTEGER NOT NULL DEFAULT 0)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS user_stats (user_id TEXT PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, last_xp_at INTEGER NOT NULL DEFAULT 0)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS user_presence (user_id TEXT PRIMARY KEY, last_seen INTEGER NOT NULL)");


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
      const equippedCosmetics = Object.fromEntries(this.sql.exec("SELECT slot,item_id AS itemId FROM user_cosmetics WHERE user_id=?", row.user_id).toArray().map(item => [item.slot,item.itemId]));
      return json({ user: { id: row.user_id, name: row.name, role: row.role, createdAt: row.createdAt, coins: row.coins, equippedItem: row.equippedItem || "", equippedBadge: row.equippedBadge || "", equippedCosmetics } });
    }
    if (path === "/logout") { this.sql.exec("DELETE FROM sessions WHERE token_hash=?", data.tokenHash); return json({ ok: true }); }
    if (path === "/shop") {
      const user = one("SELECT coins,role,equipped_item AS equippedItem,equipped_badge AS equippedBadge FROM users WHERE id=?", data.userId);
      if (!user) return json({ error: "Account nicht gefunden." }, 404);
      const owned = this.sql.exec("SELECT item_id AS id FROM user_items WHERE user_id=?", data.userId).toArray().map(item => item.id);
      if (user.role === "owner") {
        owned.push("sunset_name");
        if (user.equippedItem === "owner_red_name") {
          this.sql.exec("UPDATE users SET equipped_item='sunset_name' WHERE id=?", data.userId);
          user.equippedItem = "sunset_name";
        }
      }
      const equippedCosmetics = Object.fromEntries(this.sql.exec("SELECT slot,item_id AS itemId FROM user_cosmetics WHERE user_id=?", data.userId).toArray().map(row => [row.slot,row.itemId]));
      return json({ coins: user.coins, equippedItem: user.equippedItem || "", equippedBadge: user.equippedBadge || "", equippedCosmetics, owned, items: SHOP_ITEMS });
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
      const type = typeof data.itemType === "string" ? data.itemType : "name";
      const item = data.itemId ? SHOP_ITEMS.find(entry => entry.id === data.itemId && entry.type === type) : null;
      const allowedTypes = new Set(["name","badge","profile_frame","profile_background","chat_effect","chat_theme","sticker_pack","status_icon","profile_title","entry_effect","collectible","profile_music","message_font"]);
      if (!allowedTypes.has(type) || (data.itemId && !item)) return json({ error: "Ungültiges Cosmetic." }, 400);
      const user = one("SELECT role FROM users WHERE id=?", data.userId);
      if (!user) return json({ error: "Account nicht gefunden." }, 404);
      if (item?.ownerOnly && user.role !== "owner") return json({ error: "Dieses Cosmetic ist exklusiv für den Owner." }, 403);
      if (data.itemId && !item?.ownerOnly && !one("SELECT item_id FROM user_items WHERE user_id=? AND item_id=?", data.userId, data.itemId)) return json({ error: "Diesen Artikel besitzt du nicht." }, 403);
      if (type === "badge") {
        this.sql.exec("UPDATE users SET equipped_badge=? WHERE id=?", data.itemId || "", data.userId);
        return json({ ok: true, equippedBadge: data.itemId || "" });
      }
      if (type === "name") {
        this.sql.exec("UPDATE users SET equipped_item=? WHERE id=?", data.itemId || "", data.userId);
        return json({ ok: true, equippedItem: data.itemId || "" });
      }
      if (data.itemId) this.sql.exec("INSERT INTO user_cosmetics (user_id,slot,item_id,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,slot) DO UPDATE SET item_id=excluded.item_id,updated_at=excluded.updated_at", data.userId, type, data.itemId, Date.now());
      else this.sql.exec("DELETE FROM user_cosmetics WHERE user_id=? AND slot=?", data.userId, type);
      return json({ ok: true, itemType: type, itemId: data.itemId || "" });
    }
    if (path === "/community/profile-get") {
      const targetId = data.targetId || data.userId;
      const profile = one("SELECT bio,avatar_url AS avatarUrl,banner_url AS bannerUrl,background_url AS backgroundUrl,title,music_url AS musicUrl,updated_at AS updatedAt FROM profiles WHERE user_id=?", targetId) || { bio: "", avatarUrl: "", bannerUrl: "", backgroundUrl: "", title: "", musicUrl: "", updatedAt: 0 };
      const equippedCosmetics = Object.fromEntries(this.sql.exec("SELECT slot,item_id AS itemId FROM user_cosmetics WHERE user_id=?", targetId).toArray().map(item => [item.slot,item.itemId]));
      const musicUnlocked = !!one("SELECT item_id FROM user_items WHERE user_id=? AND item_id='music_profile'", targetId);
      const user = one("SELECT id,name,role,created_at AS createdAt,equipped_item AS equippedItem,equipped_badge AS equippedBadge FROM users WHERE id=?", targetId);
      if (!user) return json({ error: "Mitglied nicht gefunden." }, 404);
      const stats = one("SELECT xp,level FROM user_stats WHERE user_id=?", targetId) || { xp: 0, level: 1 };
      const definitions=[["first_message","Erste Nachricht","💬"],["xp_100","100 XP gesammelt","⭐"],["level_5","Level 5 erreicht","🌟"],["level_10","Level 10 erreicht","👑"]];
      const achievements=this.sql.exec("SELECT achievement_id AS id,unlocked_at AS unlockedAt FROM user_achievements WHERE user_id=?",targetId).toArray();
      const unlocked=new Set(achievements.map(a=>a.id));
      const conditions=[["first_message",stats.xp>=5],["xp_100",stats.xp>=100],["level_5",stats.level>=5],["level_10",stats.level>=10]];
      for(const [id,ok] of conditions) if(ok&&!unlocked.has(id)) { this.sql.exec("INSERT OR IGNORE INTO user_achievements (user_id,achievement_id,unlocked_at) VALUES (?,?,?)",targetId,id,Date.now()); unlocked.add(id); }
      const achievementList=definitions.map(([id,name,icon])=>({id,name,icon,unlocked:unlocked.has(id)}));
      return json({ profile: { ...user, ...profile, equippedCosmetics, musicUnlocked, ...stats, achievements: achievementList }, own: targetId === data.userId });
    }
    if (path === "/community/profile-save") {
      const bio = typeof data.bio === "string" ? data.bio.trim().slice(0, 240) : "";
      const avatarUrl = typeof data.avatarUrl === "string" ? data.avatarUrl.trim().slice(0, 500) : "";
      const bannerUrl = typeof data.bannerUrl === "string" ? data.bannerUrl.trim().slice(0, 500) : "";
      const backgroundUrl = typeof data.backgroundUrl === "string" ? data.backgroundUrl.trim().slice(0, 500) : "";
      const title = typeof data.title === "string" ? data.title.trim().slice(0, 40) : "";
      const musicUrl = typeof data.musicUrl === "string" ? data.musicUrl.trim().slice(0, 500) : "";
      for (const value of [avatarUrl,bannerUrl,backgroundUrl,musicUrl]) if (value && !/^https:\/\//i.test(value)) return json({ error: "Alle Links müssen HTTPS verwenden." }, 400);
      if (musicUrl && !one("SELECT item_id FROM user_items WHERE user_id=? AND item_id='music_profile'", data.userId)) return json({ error: "Du benötigst zuerst das Profil-Musik-Cosmetic aus dem Shop." }, 403);
      this.sql.exec("INSERT INTO profiles (user_id,bio,avatar_url,banner_url,background_url,title,music_url,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio,avatar_url=excluded.avatar_url,banner_url=excluded.banner_url,background_url=excluded.background_url,title=excluded.title,music_url=excluded.music_url,updated_at=excluded.updated_at", data.userId, bio, avatarUrl, bannerUrl, backgroundUrl, title, musicUrl, Date.now());
      return json({ ok: true });
    }
    if (path === "/community/friends") {
      const friends = this.sql.exec("SELECT u.id,u.name,u.role,COALESCE(p.last_seen,0) AS lastSeen FROM friend_requests f JOIN users u ON u.id=CASE WHEN f.sender_id=? THEN f.recipient_id ELSE f.sender_id END LEFT JOIN user_presence p ON p.user_id=u.id WHERE (f.sender_id=? OR f.recipient_id=?) AND f.status='accepted' AND u.banned=0 ORDER BY u.name COLLATE NOCASE", data.userId, data.userId, data.userId).toArray().map(u=>({...u,isOnline:Date.now()-u.lastSeen<90000}));
      const requests = this.sql.exec("SELECT f.id,u.id AS userId,u.name,f.created_at AS createdAt FROM friend_requests f JOIN users u ON u.id=f.sender_id WHERE f.recipient_id=? AND f.status='pending' ORDER BY f.created_at DESC", data.userId).toArray();
      return json({friends,requests});
    }
    if (path === "/community/friend-request") {
      const target = one("SELECT id FROM users WHERE id=? AND banned=0", data.targetId);
      if (!target || target.id===data.userId) return json({error:"Mitglied nicht gefunden."},404);
      const existing = one("SELECT id,status,sender_id FROM friend_requests WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)",data.userId,target.id,target.id,data.userId);
      if(existing?.status==="accepted") return json({error:"Ihr seid bereits befreundet."},409);
      if(existing?.status==="pending" && existing.sender_id===target.id) {
        this.sql.exec("UPDATE friend_requests SET status='accepted' WHERE id=?",existing.id);
        return json({ok:true,accepted:true});
      }
      if(existing) return json({error:"Eine Anfrage besteht bereits."},409);
      this.sql.exec("INSERT INTO friend_requests (id,sender_id,recipient_id,status,created_at) VALUES (?,?,?,'pending',?)",crypto.randomUUID(),data.userId,target.id,Date.now());
      this.sql.exec("INSERT INTO notifications (id,user_id,kind,text,created_at) VALUES (?,?,?,?,?)",crypto.randomUUID(),target.id,"friend","Du hast eine neue Freundschaftsanfrage.",Date.now());
      return json({ok:true});
    }
    if (path === "/community/friend-respond") {
      const request = one("SELECT id FROM friend_requests WHERE id=? AND recipient_id=? AND status='pending'",data.requestId,data.userId);
      if(!request) return json({error:"Anfrage nicht gefunden."},404);
      if(data.accept) this.sql.exec("UPDATE friend_requests SET status='accepted' WHERE id=?",request.id);
      else this.sql.exec("DELETE FROM friend_requests WHERE id=?",request.id);
      return json({ok:true});
    }
    if (path === "/community/friend-remove") {
      this.sql.exec("DELETE FROM friend_requests WHERE status='accepted' AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?))",data.userId,data.targetId,data.targetId,data.userId);
      return json({ok:true});
    }
    if (path === "/community/theme") {
      if(request.method==="GET") return json({theme:(one("SELECT theme FROM user_preferences WHERE user_id=?",data.userId)||{}).theme||"default"});
      const allowed=["default","midnight","forest","violet","ocean"];
      const theme=allowed.includes(data.theme)?data.theme:"default";
      this.sql.exec("INSERT INTO user_preferences (user_id,theme,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme,updated_at=excluded.updated_at",data.userId,theme,Date.now());
      return json({ok:true,theme});
    }
    if (path === "/community/reactions-get") {
      if (!data.messageId) return json({ reactions: [] });
      return json({ reactions: this.sql.exec("SELECT emoji,COUNT(*) AS count FROM message_reactions WHERE message_id=? GROUP BY emoji", data.messageId).toArray() });
    }
    if (path === "/presence") {
      if (typeof data.userId === "string") this.sql.exec("INSERT INTO user_presence (user_id,last_seen) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen", data.userId, Date.now());
      return json({ ok: true });
    }
    if (path === "/notify-mention") {
      const target = one("SELECT id FROM users WHERE name=? COLLATE NOCASE AND banned=0", data.name);
      if (target && target.id !== data.senderId) this.sql.exec("INSERT INTO notifications (id,user_id,kind,text,created_at) VALUES (?,?,?,?,?)", crypto.randomUUID(), target.id, "mention", "Du wurdest im Chat erwähnt.", Date.now());
      return json({ ok: true });
    }
    if (path === "/community/members") {
      const users = this.sql.exec("SELECT u.id,u.name,u.role,COALESCE(p.last_seen,0) AS lastSeen FROM users u LEFT JOIN user_presence p ON p.user_id=u.id WHERE u.banned=0 AND u.id<>? ORDER BY u.name COLLATE NOCASE LIMIT 100", data.userId).toArray().map(user => ({ ...user, isOnline: Date.now() - user.lastSeen < 90000 }));
      return json({ users });
    }
    if (path === "/community/notifications") {
      const items = this.sql.exec("SELECT id,kind,text,created_at AS createdAt,read_at AS readAt FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50", data.userId).toArray();
      return json({ notifications: items, unread: items.filter(item => !item.readAt).length });
    }
    if (path === "/community/notifications-read") {
      this.sql.exec("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at=0", Date.now(), data.userId);
      return json({ ok: true });
    }
    if (path === "/community/dm-list") {
      if (!data.otherId) {
        const users = this.sql.exec("SELECT DISTINCT u.id,u.name FROM users u JOIN dm_messages m ON (m.sender_id=u.id OR m.recipient_id=u.id) WHERE (m.sender_id=? OR m.recipient_id=?) AND u.id<>? ORDER BY u.name COLLATE NOCASE", data.userId, data.userId, data.userId).toArray();
        return json({ users });
      }
      const other = one("SELECT id,name FROM users WHERE id=? AND banned=0", data.otherId);
      if (!other) return json({ error: "Mitglied nicht gefunden." }, 404);
      const messages = this.sql.exec("SELECT id,sender_id AS senderId,recipient_id AS recipientId,text,created_at AS createdAt,read_at AS readAt FROM dm_messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY created_at DESC LIMIT 100", data.userId, data.otherId, data.otherId, data.userId).toArray().reverse();
      this.sql.exec("UPDATE dm_messages SET read_at=? WHERE sender_id=? AND recipient_id=? AND read_at=0", Date.now(), data.otherId, data.userId);
      return json({ other, messages });
    }
    if (path === "/community/dm-send") {
      const text = typeof data.text === "string" ? data.text.trim().slice(0, 1000) : "";
      const recipient = one("SELECT id FROM users WHERE id=? AND banned=0", data.recipientId);
      if (!recipient || recipient.id === data.userId) return json({ error: "Empfänger ungültig." }, 400);
      if (!text) return json({ error: "Nachricht darf nicht leer sein." }, 400);
      const id = crypto.randomUUID(), now = Date.now();
      this.sql.exec("INSERT INTO dm_messages (id,sender_id,recipient_id,text,created_at) VALUES (?,?,?,?,?)", id, data.userId, data.recipientId, text, now);
      this.sql.exec("INSERT INTO notifications (id,user_id,kind,text,created_at) VALUES (?,?,?,?,?)", crypto.randomUUID(), data.recipientId, "dm", "Neue private Nachricht", now);
      return json({ ok: true, message: { id, senderId: data.userId, recipientId: data.recipientId, text, createdAt: now, readAt: 0 } });
    }
    if (path === "/community/react") {
      const emoji = ["❤️","😂","⭐","🔥","👍","😮"].includes(data.emoji) ? data.emoji : "";
      if (!emoji || typeof data.messageId !== "string" || data.messageId.length > 80) return json({ error: "Ungültige Reaktion." }, 400);
      const existing = one("SELECT message_id FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?", data.messageId, data.userId, emoji);
      if (existing) this.sql.exec("DELETE FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?", data.messageId, data.userId, emoji);
      else this.sql.exec("INSERT INTO message_reactions (message_id,user_id,emoji,created_at) VALUES (?,?,?,?)", data.messageId, data.userId, emoji, Date.now());
      return json({ reactions: this.sql.exec("SELECT emoji,COUNT(*) AS count FROM message_reactions WHERE message_id=? GROUP BY emoji", data.messageId).toArray() });
    }
    if (path === "/community/xp") {
      const row = one("SELECT xp,level,last_xp_at AS lastXpAt FROM user_stats WHERE user_id=?", data.userId) || { xp: 0, level: 1, lastXpAt: 0 };
      if (Date.now() - row.lastXpAt < 30000) return json({ xp: row.xp, level: row.level, gained: 0 });
      const xp = row.xp + 5, level = Math.floor(xp / 100) + 1;
      this.sql.exec("INSERT INTO user_stats (user_id,xp,level,last_xp_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET xp=excluded.xp,level=excluded.level,last_xp_at=excluded.last_xp_at", data.userId, xp, level, Date.now());
      if (level > row.level) this.sql.exec("INSERT INTO notifications (id,user_id,kind,text,created_at) VALUES (?,?,?,?,?)", crypto.randomUUID(), data.userId, "level", "Du hast Level " + level + " erreicht!", Date.now());
      return json({ xp, level, gained: 5 });
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
  constructor(ctx, env) { super(ctx, env); this.env = env; }
  async fetch(request) {
    if (new URL(request.url).pathname === "/cosmetic-update" && request.method === "POST") {
      const update = await readBody(request);
      const history = await this.ctx.storage.get("history") || [];
      for (const message of history) {
        if (message.userId !== update.userId) continue;
        if (update.itemType === "badge") message.equippedBadge = update.itemId || "";
        else if (update.itemType === "name") message.equippedItem = update.itemId || "";
        else {
          message.equippedCosmetics = message.equippedCosmetics || {};
          if (update.itemId) message.equippedCosmetics[update.itemType] = update.itemId;
          else delete message.equippedCosmetics[update.itemType];
        }
      }
      await this.ctx.storage.put("history", history);
      for (const socket of this.ctx.getWebSockets()) {
        const state = socket.deserializeAttachment() || {};
        if (state.id === update.userId) {
          if (update.itemType === "badge") socket.serializeAttachment({ ...state, equippedBadge: update.itemId || "" });
          else if (update.itemType === "name") socket.serializeAttachment({ ...state, equippedItem: update.itemId || "" });
          else {
            const equippedCosmetics = { ...(state.equippedCosmetics || {}) };
            if (update.itemId) equippedCosmetics[update.itemType] = update.itemId;
            else delete equippedCosmetics[update.itemType];
            socket.serializeAttachment({ ...state, equippedCosmetics });
          }
        }
        if (state?.authenticated && socket.readyState === WebSocket.OPEN) {
          try { socket.send(JSON.stringify({ type: "cosmetic_update", userId: update.userId, itemId: update.itemId || "", itemType: update.itemType })); } catch {}
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
    server.serializeAttachment({ authenticated: true, id: user.id, name: user.name, role: user.role, equippedItem: user.equippedItem || "", equippedBadge: user.equippedBadge || "", equippedCosmetics: user.equippedCosmetics || {}, lastMessageAt: 0 });
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
    if (data.type === "presence_ping") {
      const authId = this.env.AUTH_STORE.idFromName("tyqora-auth");
      await this.env.AUTH_STORE.get(authId).fetch("https://auth.internal/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: attachment.id }) });
      return;
    }
    if (data.type === "sticker") {
      const stickerOwned = Object.values(attachment.equippedCosmetics || {}).some(id => id === "sticker_minecraft" || id === "sticker_fun");
      const sticker = ["⛏️","🧱","🌳","💎","🐉","🎉","😂","❤️","⭐","🔥","🚀","🌙"].includes(data.emoji) ? data.emoji : "";
      if (!stickerOwned || !sticker) { ws.send(JSON.stringify({ type: "notice", message: "Sticker sind nicht freigeschaltet oder ungültig." })); return; }
      const stickerMessage = { id: crypto.randomUUID(), userId: attachment.id, name: attachment.name, role: attachment.role, equippedItem: attachment.equippedItem || "", equippedBadge: attachment.equippedBadge || "", equippedCosmetics: attachment.equippedCosmetics || {}, text: sticker, sticker: true, time: Date.now() };
      history.push(stickerMessage);
      await this.ctx.storage.put("history", history.slice(-100));
      broadcast({ type: "message", message: stickerMessage });
      return;
    }
    if (data.type === "message_pin") {
      if (!["owner","admin","moderator"].includes(attachment.role)) {
        ws.send(JSON.stringify({ type: "error", message: "Nur Owner, Admins und Moderatoren dürfen Nachrichten anpinnen." }));
        return;
      }
      const index = history.findIndex(item => item.id === data.id);
      if (index < 0) { ws.send(JSON.stringify({ type: "error", message: "Nachricht nicht gefunden." })); return; }
      history[index].pinned = data.pinned !== false;
      await this.ctx.storage.put("history", history);
      broadcast({ type: "message_pin", id: data.id, pinned: history[index].pinned, by: attachment.name });
      return;
    }
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
    if (data.type === "command") {
      if (typeof data.text !== "string") return;
      const input = data.text.trim().slice(0, 300);
      const match = input.match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
      if (!match) { ws.send(JSON.stringify({ type: "notice", message: "Ungültiger Befehl. Tippe /help für die Übersicht." })); return; }
      const command = match[1].toLowerCase();
      const args = (match[2] || "").trim();
      const now = Date.now();
      if (attachment.lastMessageAt && now - attachment.lastMessageAt < 700) {
        ws.send(JSON.stringify({ type: "notice", message: "Bitte warte kurz vor dem nächsten Befehl." }));
        return;
      }
      ws.serializeAttachment({ ...attachment, lastMessageAt: now });
      const help = [
        "TYQORA BOT — BEFEHLSÜBERSICHT",
        "/help — Zeigt diese Befehlsübersicht.",
        "/me <aktion> — Teilt eine Aktion mit deinem Namen.",
        "/roll — Würfelt eine Zahl von 1 bis 100.",
        "/shrug <text> — Ergänzt deinen Text um ¯\\_(ツ)_/¯.",
        "/time — Zeigt die Uhrzeit in Deutschland.",
        "/about — Zeigt das Bot-Profil und seine Funktionen."
      ].join("\n");
      let reply;
      switch (command) {
        case "help": reply = help; break;
        case "me": reply = args ? "* " + attachment.name + " " + args : "Verwendung: /me <aktion>"; break;
        case "roll": reply = "🎲 " + attachment.name + " würfelt: " + (Math.floor(Math.random() * 100) + 1); break;
        case "shrug": reply = (args ? args + " " : "") + "¯\\_(ツ)_/¯"; break;
        case "time": reply = "🕒 Uhrzeit in Deutschland: " + new Date().toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }); break;
        case "about": reply = "🤖 TYQORA BOT\nOffizieller Chat-Bot für Blockwissen / TYQORA.\nIch kann Befehle ausführen und dir mit /help die komplette Liste anzeigen. Bot-Nachrichten werden für alle im aktuellen Kanal gespeichert und live angezeigt."; break;
        default: reply = "Unbekannter Befehl: /" + command + ". Tippe /help für alle verfügbaren Befehle.";
      }
      const botMessage = { id: crypto.randomUUID(), userId: "tyqora-bot", name: "TYQORA BOT", role: "bot", bot: true, text: reply.slice(0, 1000), time: now };
      history.push(botMessage);
      await this.ctx.storage.put("history", history.slice(-100));
      broadcast({ type: "message", message: botMessage });
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
    const message = { id: crypto.randomUUID(), userId: attachment.id, name: attachment.name, role: attachment.role, equippedItem: attachment.equippedItem || "", equippedBadge: attachment.equippedBadge || "", equippedCosmetics: attachment.equippedCosmetics || {}, text, time: now };
    history.push(message);
    await this.ctx.storage.put("history", history.slice(-100));
    broadcast({ type: "message", message });
    const mentionNames = [...text.matchAll(/@([\p{L}\p{N}_-]{3,24})/gu)].map(match => match[1]);
    if (mentionNames.length) {
      const authId = this.env.AUTH_STORE.idFromName("tyqora-auth");
      await Promise.all(mentionNames.map(name => this.env.AUTH_STORE.get(authId).fetch("https://auth.internal/notify-mention", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, senderId: attachment.id })
      })));
    }
    const authId = this.env.AUTH_STORE.idFromName("tyqora-auth");
    await this.env.AUTH_STORE.get(authId).fetch("https://auth.internal/community/xp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: attachment.id })
    });

  }
  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch { try { ws.close(); } catch {} }
  }
}
