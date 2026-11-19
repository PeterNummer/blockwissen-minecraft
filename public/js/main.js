const overlay=document.getElementById('chatOverlay');
function openChat(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
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


// TYQORA CHAT – echte Echtzeitverbindung über Cloudflare Durable Objects
const chatLogin = document.getElementById('chatLogin');
const chatRoom = document.getElementById('chatRoom');
const chatLoginForm = document.getElementById('chatLoginForm');
const chatLoginFeedback = document.getElementById('chatLoginFeedback');
const chatMessages = document.getElementById('chatMessages');
const chatMessageForm = document.getElementById('chatMessageForm');
const chatMessageInput = document.getElementById('chatMessageInput');
const chatNameInput = document.getElementById('chatName');
const chatCodeInput = document.getElementById('chatCode');
const chatLoginButton = document.getElementById('chatLoginButton');
const connectionDot = document.getElementById('connectionDot');
const connectionLabel = document.getElementById('connectionLabel');
const activeChannel = document.getElementById('activeChannel');
const channelButtons = document.querySelectorAll('[data-channel]');
let chatSocket = null;
let chatIdentity = null;
let selectedChannel = 'welcome';
let chatAuthenticated = false;

function setChatConnection(state, label) {
  connectionDot.className = 'connection-dot ' + state;
  connectionLabel.textContent = label;
}
function showChatLogin(message = '') {
  chatLogin.hidden = false;
  chatRoom.hidden = true;
  chatLoginFeedback.textContent = message;
  chatLoginButton.disabled = false;
  chatLoginButton.textContent = 'Chat betreten';
}
function renderChatMessage(message) {
  const row = document.createElement('article');
  row.className = 'chat-message';
  const meta = document.createElement('div');
  meta.className = 'chat-message-meta';
  const name = document.createElement('strong');
  name.textContent = message.name || 'Gast';
  const time = document.createElement('time');
  time.dateTime = new Date(message.time).toISOString();
  time.textContent = new Date(message.time).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
  const body = document.createElement('p');
  body.textContent = message.text || '';
  meta.append(name, time);
  row.append(meta, body);
  chatMessages.append(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function connectChat() {
  if (!chatIdentity) return;
  if (chatSocket) chatSocket.close();
  chatAuthenticated = false;
  chatMessages.replaceChildren();
  setChatConnection('connecting', 'Verbinde …');
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(protocol + '//' + location.host + '/api/chat?channel=' + encodeURIComponent(selectedChannel));
  chatSocket = socket;
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({type:'auth', name:chatIdentity.name, code:chatIdentity.code}));
  });
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
      chatIdentity = null;
      socket.close();
    } else if (data.type === 'history') {
      chatAuthenticated = true;
      chatLogin.hidden = true;
      chatRoom.hidden = false;
      setChatConnection('online', 'Verbunden');
      (Array.isArray(data.messages) ? data.messages : []).forEach(renderChatMessage);
      chatMessageInput.focus();
    } else if (data.type === 'message' && data.message) {
      renderChatMessage(data.message);
    } else if (data.type === 'status') {
      setChatConnection('online', data.message || 'Verbunden');
    }
  });
  socket.addEventListener('close', () => {
    if (socket !== chatSocket) return;
    chatAuthenticated = false;
    setChatConnection('offline', 'Nicht verbunden');
    if (chatIdentity && overlay.classList.contains('open')) {
      showChatLogin('Die Verbindung wurde getrennt. Bitte erneut anmelden.');
      chatIdentity = null;
    }
  });
  socket.addEventListener('error', () => {
    if (socket !== chatSocket) return;
    setChatConnection('offline', 'Verbindungsfehler');
    showChatLogin('Der Chatserver ist nicht erreichbar. Bitte später erneut versuchen.');
  });
}
chatLoginForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = chatNameInput.value.trim();
  const code = chatCodeInput.value;
  if (name.length < 2 || !code) {
    showChatLogin('Bitte Anzeigename und Zugangscode eingeben.');
    return;
  }
  chatIdentity = {name, code};
  chatLoginButton.disabled = true;
  chatLoginButton.textContent = 'Verbinde …';
  chatLoginFeedback.textContent = '';
  connectChat();
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
  if (chatIdentity) connectChat();
}));
