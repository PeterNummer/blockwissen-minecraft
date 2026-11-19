const overlay=document.getElementById('chatOverlay');
function openChat(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';if(typeof authToken!=='undefined'&&authToken&&typeof chatUser!=='undefined'&&chatUser)connectChat()}
function closeChat(){
  if (typeof chatSocket !== 'undefined' && chatSocket) {
    const socket = chatSocket;
    chatSocket = null;
    socket.close();
  }
  if (typeof chatIdentity !== 'undefined') chatIdentity = null;
  if (typeof chatAuthenticated !== 'undefined') chatAuthenticated = false;
  if (typeof showChatLogin === 'function') showChatLogin();
  if (typeof setChatConnection === 'function') setChatConnection('offline', 'Nicht verbunden');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.getElementById('closeChat').addEventListener('click',closeChat);

const guideModal=document.getElementById('guideModal');
const guideBody=document.getElementById('guideBody');
const guides={
 survival:{icon:'🧭',title:'Survival – gut starten',intro:'Mit einer guten Vorbereitung kommst du sicher durch die ersten Tage und baust dir Schritt für Schritt eine stabile Basis.',steps:['Sammle zuerst Holz und stelle Werkzeuge sowie eine Werkbank her.','Sorge vor der ersten Nacht für einen geschützten Schlafplatz und ausreichend Licht.','Baue eine kleine Nahrungsquelle auf und halte immer etwas Essen bereit.','Lege wichtige Ressourcen in beschrifteten Kisten ab.'],note:'Tipp: Ein Schild oder eine auffällige Blockmarkierung hilft dir, den Weg zurück zu deiner Basis zu finden.'},
 redstone:{icon:'🔴',title:'Redstone – Grundlagen',intro:'Redstone ermöglicht einfache Schaltungen bis hin zu komplexen Maschinen. Beginne mit den grundlegenden Bauteilen.',steps:['Lerne den Unterschied zwischen Redstone-Staub, Fackeln und Repeatern kennen.','Baue zuerst einen einfachen Schalter, der eine Lampe ein- und ausschaltet.','Nutze Repeater, um Signale zu verlängern und zu verzögern.','Teste Schaltungen in einer separaten Kreativwelt, bevor du sie in deiner Hauptwelt einsetzt.'],note:'Hinweis: Redstone-Verhalten und Schaltungen können sich zwischen Java und Bedrock unterscheiden.'},
 building:{icon:'🏡',title:'Bauen – schönere Bauwerke',intro:'Mit Formen, Tiefe und einer abgestimmten Blockpalette wirken Gebäude lebendiger.',steps:['Wähle drei bis fünf Blöcke, die farblich und thematisch zusammenpassen.','Setze Fenster, Dächer und Eingänge leicht zurück oder hervor.','Vermeide große, völlig flache Wände: Nutze Balken, Stufen und Mauern für Struktur.','Ergänze Wege, Beleuchtung und kleine Details rund um dein Gebäude.'],note:'Tipp: Baue zuerst eine kleine Version deines Hauses und erweitere sie anschließend.'},
 farms:{icon:'🌾',title:'Farmen – Ressourcen sammeln',intro:'Eine Farm kann dir wiederkehrende Arbeit abnehmen und wichtige Materialien liefern.',steps:['Beginne mit einer kleinen Weizen-, Karotten- oder Kartoffelfarm.','Sorge für Wasser in der Nähe der Ackerflächen und ausreichend Licht.','Plane einen gut erreichbaren Lagerplatz für die Ernte.','Erweitere die Farm erst, wenn du den Ablauf getestet hast.'],note:'Hinweis: Spawnregeln und Farmmechaniken unterscheiden sich teilweise zwischen Java und Bedrock.'},
 alchemy:{icon:'🧪',title:'Tränke & Verzauberungen',intro:'Mit Tränken und verzauberter Ausrüstung kannst du dich gezielt auf Erkundungen und Kämpfe vorbereiten.',steps:['Sammle frühzeitig Zuckerrohr für Papier und Bücher.','Richte einen sicheren Platz für den Zaubertisch und Bücherregale ein.','Bewahre seltene Zutaten geordnet auf.','Lies die Wirkung eines Tranks oder einer Verzauberung, bevor du wertvolle Ressourcen einsetzt.'],note:'Tipp: Eine gut sortierte Ausrüstungskiste spart Zeit, wenn du zu einem Abenteuer aufbrichst.'},
 mobs:{icon:'🐲',title:'Mobs & Abenteuer',intro:'Die Welt ist voller Kreaturen. Beobachte ihr Verhalten und bereite dich passend auf neue Gebiete vor.',steps:['Nimm ausreichend Nahrung, Werkzeuge und Lichtquellen mit.','Markiere erkundete Wege und wichtige Orte.','Informiere dich über die Kreaturen in einem Gebiet, bevor du dich näherst.','Bewahre wertvolle Fundstücke sicher in deiner Basis auf.'],note:'Tipp: Ein sicherer Rückweg ist genauso wichtig wie die Ausrüstung für den Hinweg.'},
 java:{icon:'☕',title:'Minecraft Java Edition',intro:'Die Java Edition ist die PC-Version mit einer großen Modding- und Server-Community.',steps:['Java Edition läuft offiziell auf Windows, macOS und Linux.','Mods und Modloader können das Spiel erweitern – achte immer auf die passende Spielversion.','Bei Multiplayer-Servern müssen Spielversion und erforderliche Mods zusammenpassen.','Sichere deine Welten regelmäßig, bevor du Mods oder größere Änderungen ausprobierst.'],note:'Dieser Bereich wird künftig um konkrete Java-Anleitungen, Mods und Server-Tipps ergänzt.'},
 bedrock:{icon:'🌍',title:'Minecraft Bedrock Edition',intro:'Die Bedrock Edition verbindet Windows, Konsolen und mobile Geräte und unterstützt plattformübergreifendes Spielen.',steps:['Prüfe bei Multiplayer-Problemen zuerst, ob alle dieselbe kompatible Spielversion verwenden.','Aktiviere Welt-Backups, bevor du Add-ons oder Ressourcenpakete ausprobierst.','Nutze den Marktplatz oder vertrauenswürdige Quellen für Inhalte.','Beachte, dass manche Java-Tutorials nicht unverändert in Bedrock funktionieren.'],note:'Dieser Bereich wird künftig um konkrete Bedrock-Anleitungen, Add-ons und Multiplayer-Tipps ergänzt.'},
 both:{icon:'🔀',title:'Tipps für beide Editionen',intro:'Viele Minecraft-Grundlagen sind in Java und Bedrock ähnlich, einzelne Mechaniken funktionieren aber unterschiedlich.',steps:['Grundlagen wie Crafting, Erkundung und Bauen lassen sich oft übertragen.','Prüfe bei Farmen und Redstone immer, für welche Edition eine Anleitung geschrieben wurde.','Achte bei Tutorials auf die angegebene Spielversion.','Teste größere Konstruktionen zuerst in einer Kopie deiner Welt.'],note:'Blockwissen kennzeichnet künftig deutlich, ob ein Guide für Java, Bedrock oder beide Editionen gilt.'},
 guides:{icon:'📚',title:'Die Blockwissen-Guide-Übersicht',intro:'Hier findest du die Themenbereiche, die wir Schritt für Schritt zu ausführlichen Anleitungen ausbauen.',steps:['Survival: Start, Ausrüstung, Erkundung und Basisbau.','Redstone: Schaltungen, Türen und automatische Systeme.','Bauen: Häuser, Dekoration und Landschaften.','Farmen: Nahrung, Materialien und Mob-Drops.','Java & Bedrock: versionsspezifische Unterschiede und Tipps.'],note:'Die Karten auf der Startseite öffnen jeweils einen passenden Themenüberblick. Ausführliche Einzel-Guides werden nach und nach ergänzt.'}
};
function openGuide(key){
 const guide=guides[key];if(!guide)return;
 guideBody.innerHTML='<div class="welcome-icon">'+guide.icon+'</div><h2 id="guideTitle">'+guide.title+'</h2><p>'+guide.intro+'</p><div class="guide-subtitle">Das solltest du wissen</div><ul>'+guide.steps.map(item=>'<li>'+item+'</li>').join('')+'</ul><div class="guide-callout">'+guide.note+'</div>';
 guideModal.classList.add('open');guideModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('closeGuide').focus();
}
function closeGuide(){guideModal.classList.remove('open');guideModal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.querySelectorAll('[data-guide]').forEach(card=>{
 card.addEventListener('click',()=>openGuide(card.dataset.guide));
 card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openGuide(card.dataset.guide)}});
});
document.getElementById('closeGuide').addEventListener('click',closeGuide);
guideModal.addEventListener('click',event=>{if(event.target===guideModal)closeGuide()});
document.getElementById('closeChat').addEventListener('click',closeChat);
document.addEventListener('keydown',event=>{
 if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='k'){event.preventDefault();if(guideModal.classList.contains('open'))closeGuide();overlay.classList.contains('open')?closeChat():openChat()}
 if(event.key==='Escape'){if(guideModal.classList.contains('open'))closeGuide();if(overlay.classList.contains('open'))closeChat()}
});


// TYQORA CHAT – Accounts, Sessions, Rollen und Owner-Verwaltung
const chatLogin = document.getElementById('chatLogin');
const chatRoom = document.getElementById('chatRoom');
const adminPanel = document.getElementById('adminPanel');
const chatLoginForm = document.getElementById('chatLoginForm');
const chatLoginFeedback = document.getElementById('chatLoginFeedback');
const chatMessages = document.getElementById('chatMessages');
const chatMessageForm = document.getElementById('chatMessageForm');
const chatMessageInput = document.getElementById('chatMessageInput');
const chatNameInput = document.getElementById('chatName');
const chatPasswordInput = document.getElementById('chatPassword');
const chatInviteCode = document.getElementById('chatInviteCode');
const chatOwnerCode = document.getElementById('chatOwnerCode');
const registerFields = document.getElementById('registerFields');
const chatLoginButton = document.getElementById('chatLoginButton');
const connectionDot = document.getElementById('connectionDot');
const connectionLabel = document.getElementById('connectionLabel');
const activeChannel = document.getElementById('activeChannel');
const channelButtons = document.querySelectorAll('[data-channel]');
const authTabs = document.querySelectorAll('[data-auth-tab]');
const chatAccount = document.getElementById('chatAccount');
const openAdminButton = document.getElementById('openAdmin');
const userList = document.getElementById('userList');
const userSearch = document.getElementById('userSearch');
let chatSocket = null;
let chatUser = null;
let authToken = sessionStorage.getItem('tyqora_session') || '';
let selectedChannel = 'welcome';
let chatAuthenticated = false;
let authMode = 'login';

function setChatConnection(state, label) {
  connectionDot.className = 'connection-dot ' + state;
  connectionLabel.textContent = label;
}
function showChatLogin(message = '') {
  chatLogin.hidden = false;
  chatRoom.hidden = true;
  adminPanel.hidden = true;
  chatLoginFeedback.textContent = message;
  chatLoginButton.disabled = false;
  chatLoginButton.textContent = authMode === 'register' ? 'Account erstellen' : 'Anmelden';
}
function setAuthMode(mode) {
  authMode = mode;
  authTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === mode));
  registerFields.hidden = mode !== 'register';
  chatPasswordInput.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  chatLoginButton.textContent = mode === 'register' ? 'Account erstellen' : 'Anmelden';
  chatLoginFeedback.textContent = '';
}
document.addEventListener('click', event => {
  const tab = event.target.closest('[data-auth-tab]');
  if (!tab) return;
  event.preventDefault();
  setAuthMode(tab.dataset.authTab);
});

async function api(path, body, method = 'POST') {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = 'Bearer ' + authToken;
  let response;
  try {
    response = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (error) {
    throw new Error('Server nicht erreichbar. Bitte prüfe deine Internetverbindung und lade die Seite neu.');
  }
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}
  if (!response.ok) {
    const fallback = raw && !raw.trim().startsWith('<') ? raw.slice(0, 180) : 'Der Server hat keine lesbare Fehlermeldung zurückgegeben.';
    throw new Error(data.error || ('Serverfehler ' + response.status + ': ' + fallback));
  }
  if (raw && !Object.keys(data).length) throw new Error('Der Server hat eine ungültige Antwort gesendet.');
  return data;
}
function showAccount() {
  if (!chatUser) return;
  chatAccount.hidden = false;
  document.getElementById('accountName').textContent = chatUser.name;
  document.getElementById('accountRole').textContent = ({owner:'OWNER',admin:'ADMIN',moderator:'MODERATOR',member:'MITGLIED'})[chatUser.role] || 'MITGLIED';
  openAdminButton.hidden = chatUser.role !== 'owner';
}
function renderChatMessage(message) {
  const row = document.createElement('article');
  row.className = 'chat-message';
  row.dataset.messageId = message.id;
  const meta = document.createElement('div');
  meta.className = 'chat-message-meta';
  const name = document.createElement('strong');
  name.textContent = message.name || 'Mitglied';
  if (message.role) {
    const role = document.createElement('span');
    role.className = 'message-role role-' + message.role;
    role.textContent = ({owner:'OWNER',admin:'ADMIN',moderator:'MOD',member:''})[message.role] || '';
    meta.append(name, role);
  } else meta.append(name);
  const time = document.createElement('time');
  time.dateTime = new Date(message.time).toISOString();
  time.textContent = new Date(message.time).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
  const body = document.createElement('p');
  body.className = 'chat-message-body';
  body.textContent = message.text || '';
  if (message.editedAt) {
    const edited = document.createElement('span');
    edited.className = 'message-edited';
    edited.textContent = ' (bearbeitet)';
    time.append(edited);
  }
  meta.append(time);
  row.append(meta, body);
  if (["owner","admin","moderator"].includes(chatUser?.role)) {
    const menuWrap = document.createElement('div');
    menuWrap.className = 'message-menu-wrap';
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'message-menu-button';
    menuButton.textContent = '⋯';
    menuButton.setAttribute('aria-label', 'Nachrichtenoptionen');
    menuButton.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.className = 'message-menu';
    menu.hidden = true;
    if (chatUser.role === 'owner') {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Bearbeiten';
      edit.addEventListener('click', () => {
        const updated = window.prompt('Nachricht bearbeiten:', body.textContent);
        menu.hidden = true;
        menuButton.setAttribute('aria-expanded', 'false');
        if (updated === null || !updated.trim()) return;
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) chatSocket.send(JSON.stringify({type:'message_edit', id:message.id, text:updated}));
      });
      menu.append(edit);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'message-menu-delete';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', () => {
      menu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      if (!window.confirm('Diese Nachricht wirklich löschen?')) return;
      if (chatSocket && chatSocket.readyState === WebSocket.OPEN) chatSocket.send(JSON.stringify({type:'message_delete', id:message.id}));
    });
    menu.append(remove);
    menuButton.addEventListener('click', event => {
      event.stopPropagation();
      const opening = menu.hidden;
      document.querySelectorAll('.message-menu').forEach(item => item.hidden = true);
      document.querySelectorAll('.message-menu-button').forEach(item => item.setAttribute('aria-expanded', 'false'));
      menu.hidden = !opening;
      menuButton.setAttribute('aria-expanded', String(opening));
    });
    menuWrap.append(menuButton, menu);
    row.append(menuWrap);
  }
  chatMessages.append(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function connectChat() {
  if (!authToken || !chatUser) return;
  if (chatSocket) chatSocket.close();
  chatAuthenticated = false;
  chatMessages.replaceChildren();
  setChatConnection('connecting', 'Verbinde …');
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(protocol + '//' + location.host + '/api/chat?channel=' + encodeURIComponent(selectedChannel) + '&token=' + encodeURIComponent(authToken));
  chatSocket = socket;
  socket.addEventListener('message', event => {
    if (socket !== chatSocket) return;
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    if (data.type === 'notice') {
      const note = document.createElement('div');
      note.className = 'chat-system-note';
      note.textContent = data.message || 'Hinweis';
      chatMessages.append(note);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else if (data.type === 'error') {
      showChatLogin(data.message || 'Verbindung fehlgeschlagen.');
      setChatConnection('offline', 'Nicht verbunden');
    } else if (data.type === 'history') {
      chatAuthenticated = true;
      chatLogin.hidden = true;
      adminPanel.hidden = true;
      chatRoom.hidden = false;
      setChatConnection('online', 'Verbunden');
      (Array.isArray(data.messages) ? data.messages : []).forEach(renderChatMessage);
      chatMessageInput.focus();
    } else if (data.type === 'message' && data.message) renderChatMessage(data.message);
    else if (data.type === 'role_update' && data.userId === chatUser?.id) {
      chatUser.role = data.role;
      showAccount();
      connectChat();
    }
    else if (data.type === 'message_update' && data.message) {
      const existing = chatMessages.querySelector('[data-message-id="' + CSS.escape(data.message.id) + '"]');
      if (existing) {
        const body = existing.querySelector('.chat-message-body');
        if (body) body.textContent = data.message.text;
        const time = existing.querySelector('time');
        if (time && !time.querySelector('.message-edited')) {
          const edited = document.createElement('span');
          edited.className = 'message-edited';
          edited.textContent = ' (bearbeitet)';
          time.append(edited);
        }
      }
    } else if (data.type === 'message_delete' && data.id) {
      chatMessages.querySelector('[data-message-id="' + CSS.escape(data.id) + '"]')?.remove();
    }
  });
  socket.addEventListener('close', () => {
    if (socket !== chatSocket) return;
    chatAuthenticated = false;
    setChatConnection('offline', 'Nicht verbunden');
  });
  socket.addEventListener('error', () => {
    if (socket !== chatSocket) return;
    setChatConnection('offline', 'Verbindungsfehler');
  });
}
async function loadAdminUsers() {
  const result = await api('/api/admin/users', null, 'GET');
  const users = result.users || [];
  document.getElementById('userCount').textContent = users.length;
  document.getElementById('ownerCount').textContent = users.filter(user => user.role === 'owner').length;
  const query = (userSearch.value || '').trim().toLowerCase();
  userList.replaceChildren();
  users.filter(user => user.name.toLowerCase().includes(query)).forEach(user => {
    const card = document.createElement('article');
    card.className = 'user-card';
    const details = document.createElement('div');
    details.className = 'user-details';
    const name = document.createElement('strong');
    name.textContent = user.name;
    const meta = document.createElement('span');
    meta.textContent = new Date(user.createdAt).toLocaleDateString('de-DE') + (user.banned ? ' · Gesperrt' : '');
    details.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'user-actions';
    const role = document.createElement('select');
    role.setAttribute('aria-label', 'Rolle für ' + user.name);
    ['member','moderator','admin'].forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = ({member:'Mitglied',moderator:'Moderator',admin:'Admin'})[value];
      role.append(option);
    });
    role.value = ['member','moderator','admin'].includes(user.role) ? user.role : 'member';
    const save = document.createElement('button');
    save.textContent = 'Rolle speichern';
    save.addEventListener('click', async () => {
      try { await api('/api/admin/role', {userId:user.id, role:role.value}); document.getElementById('adminFeedback').textContent = 'Rolle aktualisiert. Die Änderung wird sofort in allen offenen Chats übernommen.'; await loadAdminUsers(); }
      catch (error) { document.getElementById('adminFeedback').textContent = error.message; }
    });
    const ban = document.createElement('button');
    ban.textContent = user.banned ? 'Entsperren' : 'Sperren';
    ban.addEventListener('click', async () => {
      try { await api('/api/admin/ban', {userId:user.id, banned:!user.banned}); await loadAdminUsers(); }
      catch (error) { document.getElementById('adminFeedback').textContent = error.message; }
    });
    const remove = document.createElement('button');
    remove.textContent = 'Löschen';
    remove.className = 'danger-button';
    remove.addEventListener('click', async () => {
      if (!confirm('Account "' + user.name + '" wirklich dauerhaft löschen?')) return;
      try { await api('/api/admin/delete', {userId:user.id}); await loadAdminUsers(); }
      catch (error) { document.getElementById('adminFeedback').textContent = error.message; }
    });
    if (user.role === 'owner') {
      role.disabled = true; save.disabled = true; ban.disabled = true; remove.disabled = true;
    }
    actions.append(role, save, ban, remove);
    card.append(details, actions);
    userList.append(card);
  });
}
chatLoginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = chatNameInput.value.trim();
  const password = chatPasswordInput.value;
  if (name.length < 3 || password.length < 8) {
    showChatLogin('Benutzername: 3–24 Zeichen. Passwort: mindestens 8 Zeichen.');
    return;
  }
  chatLoginButton.disabled = true;
  chatLoginButton.textContent = authMode === 'register' ? 'Erstelle Account …' : 'Anmelden …';
  chatLoginFeedback.textContent = '';
  try {
    if (authMode === 'register') {
      const inviteCode = chatOwnerCode.value || chatInviteCode.value;
      await api('/api/register', {name, password, inviteCode});
      setAuthMode('login');
      chatPasswordInput.value = '';
      chatInviteCode.value = '';
      chatOwnerCode.value = '';
      showChatLogin('Account erstellt. Du kannst dich jetzt anmelden.');
    } else {
      const result = await api('/api/login', {name, password});
      authToken = result.token;
      sessionStorage.setItem('tyqora_session', authToken);
      chatUser = result.user;
      showAccount();
      connectChat();
    }
  } catch (error) {
    showChatLogin(error.message);
  } finally {
    chatLoginButton.disabled = false;
  }
});
chatMessageForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = chatMessageInput.value.trim();
  if (!text || !chatAuthenticated || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;
  chatSocket.send(JSON.stringify({type:'message', text}));
  chatMessageInput.value = '';
  chatMessageInput.focus();
});
channelButtons.forEach(button => button.addEventListener('click', () => {
  if (selectedChannel === button.dataset.channel) return;
  selectedChannel = button.dataset.channel;
  channelButtons.forEach(item => item.classList.toggle('active', item === button));
  activeChannel.textContent = '# ' + selectedChannel;
  chatMessageInput.placeholder = 'Nachricht an # ' + selectedChannel;
  if (chatUser) connectChat();
}));
openAdminButton.addEventListener('click', async () => {
  if (chatUser?.role !== 'owner') return;
  chatRoom.hidden = true;
  chatLogin.hidden = true;
  adminPanel.hidden = false;
  document.getElementById('adminFeedback').textContent = '';
  try { await loadAdminUsers(); }
  catch (error) { document.getElementById('adminFeedback').textContent = error.message; }
});
document.getElementById('adminRefresh').addEventListener('click', loadAdminUsers);
document.getElementById('deleteAllAccounts').addEventListener('click', async () => {
  if (!confirm('Wirklich ALLE Accounts einschließlich des Owner-Accounts dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
  const confirmation = prompt('Gib zum Bestätigen ALLE ACCOUNTS LÖSCHEN ein:');
  if (confirmation !== 'ALLE ACCOUNTS LÖSCHEN') return;
  const button = document.getElementById('deleteAllAccounts');
  button.disabled = true;
  try {
    await api('/api/admin/reset-all', {});
    if (chatSocket) chatSocket.close();
    authToken = ''; chatUser = null; chatAuthenticated = false;
    sessionStorage.removeItem('tyqora_session');
    chatAccount.hidden = true;
    adminPanel.hidden = true;
    showChatLogin('Alle Accounts wurden gelöscht. Der Owner kann sich jetzt neu registrieren.');
    setChatConnection('offline', 'Nicht verbunden');
  } catch (error) {
    document.getElementById('adminFeedback').textContent = error.message;
  } finally { button.disabled = false; }
});
userSearch.addEventListener('input', () => loadAdminUsers().catch(() => {}));
document.getElementById('chatLogout').addEventListener('click', async () => {
  try { await api('/api/logout', {}); } catch {}
  if (chatSocket) chatSocket.close();
  authToken = ''; chatUser = null; chatAuthenticated = false;
  sessionStorage.removeItem('tyqora_session');
  chatAccount.hidden = true; showChatLogin('Du wurdest abgemeldet.'); setChatConnection('offline', 'Nicht verbunden');
});
async function restoreSession() {
  if (!authToken) return;
  try {
    const result = await api('/api/me', null, 'GET');
    chatUser = result.user;
    showAccount();
    connectChat();
  } catch {
    authToken = '';
    sessionStorage.removeItem('tyqora_session');
  }
}


const resetAccountsForm = document.getElementById('resetAccountsForm');
resetAccountsForm.addEventListener('submit', async event => {
  event.preventDefault();
  const code = document.getElementById('resetRecoveryCode').value;
  const confirmation = document.getElementById('resetConfirmText').value.trim();
  if (confirmation !== 'ALLE ACCOUNTS LÖSCHEN') {
    chatLoginFeedback.textContent = 'Die Bestätigung stimmt nicht überein.';
    return;
  }
  if (!window.confirm('Wirklich alle Accounts einschließlich des Owner-Accounts endgültig löschen?')) return;
  const button = document.getElementById('resetAccountsButton');
  button.disabled = true;
  button.textContent = 'Lösche Accounts …';
  try {
    const result = await api('/api/owner/reset-all', { recoveryCode: code });
    if (chatSocket) chatSocket.close();
    authToken = ''; chatUser = null; chatAuthenticated = false;
    sessionStorage.removeItem('tyqora_session');
    chatAccount.hidden = true;
    adminPanel.hidden = true;
    resetAccountsForm.reset();
    chatLoginFeedback.textContent = result.message || 'Alle Accounts wurden gelöscht. Du kannst jetzt einen neuen Owner registrieren.';
    setAuthMode('register');
  } catch (error) {
    chatLoginFeedback.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Alle Accounts endgültig löschen';
  }
});

restoreSession();
