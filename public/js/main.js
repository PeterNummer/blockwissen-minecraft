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
document.getElementById('chatRefresh')?.addEventListener('click', () => {
  const button = document.getElementById('chatRefresh');
  if (!authToken || !chatUser) return;
  button.disabled = true;
  button.textContent = '↻ Aktualisiere …';
  connectChat();
  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = '↻ Aktualisieren';
  }, 1200);
});
document.getElementById('closeChat').addEventListener('click',closeChat);

const guideModal=document.getElementById('guideModal');
const guideBody=document.getElementById('guideBody');
const guides={
 survival:{icon:'🧭',title:'Survival – gut starten',intro:'Mit einer guten Vorbereitung kommst du sicher durch die ersten Tage und baust dir Schritt für Schritt eine stabile Basis.',steps:['Sammle zuerst Holz und stelle Werkzeuge sowie eine Werkbank her.','Stelle eine Steinspitzhacke her und sammle damit bessere Grundressourcen.','Sorge vor der ersten Nacht für einen geschützten Schlafplatz und ausreichend Licht.','Baue eine kleine Nahrungsquelle auf und halte immer etwas Essen bereit.','Stelle Fackeln her und beleuchte Höhlen, Wege und den Bereich deiner Basis.','Lege wichtige Ressourcen in beschrifteten Kisten ab.','Bewahre seltene Gegenstände sicher auf und nimm auf Erkundungen nur das Nötige mit.'],note:'Tipp: Ein Schild oder eine auffällige Blockmarkierung hilft dir, den Weg zurück zu deiner Basis zu finden.'},
 redstone:{icon:'🔴',title:'Redstone – Grundlagen',intro:'Redstone ermöglicht einfache Schaltungen bis hin zu komplexen Maschinen. Beginne mit den grundlegenden Bauteilen.',steps:['Lerne den Unterschied zwischen Redstone-Staub, Fackeln und Repeatern kennen.','Baue zuerst einen einfachen Schalter, der eine Lampe ein- und ausschaltet.','Nutze Repeater, um Signale zu verlängern und zu verzögern.','Teste Schaltungen in einer separaten Kreativwelt, bevor du sie in deiner Hauptwelt einsetzt.'],note:'Hinweis: Redstone-Verhalten und Schaltungen können sich zwischen Java und Bedrock unterscheiden.'},
 building:{icon:'🏡',title:'Bauen – schönere Bauwerke',intro:'Mit Formen, Tiefe und einer abgestimmten Blockpalette wirken Gebäude lebendiger.',steps:['Wähle drei bis fünf Hauptblöcke und ergänze sie mit einem Akzentmaterial.','Beginne mit einer klaren Grundform und markiere Ecken sowie Eingänge.','Setze Fenster, Dächer und Eingänge leicht zurück oder hervor.','Vermeide große, völlig flache Wände: Nutze Balken, Stufen und Mauern für Struktur.','Arbeite mit Dachüberständen, Fensterrahmen und unterschiedlichen Wandtiefen.','Ergänze Wege, Beleuchtung, Pflanzen und kleine Details rund um dein Gebäude.','Baue zuerst einen kleinen Prototyp, bevor du viele seltene Blöcke einsetzt.'],note:'Tipp: Baue zuerst eine kleine Version deines Hauses und erweitere sie anschließend.'},
 farms:{icon:'🌾',title:'Farmen – Ressourcen sammeln',intro:'Eine Farm kann dir wiederkehrende Arbeit abnehmen und wichtige Materialien liefern.',steps:['Beginne mit einer kleinen Weizen-, Karotten- oder Kartoffelfarm.','Sorge für Wasser in der Nähe der Ackerflächen und ausreichend Licht.','Plane einen gut erreichbaren Lagerplatz für die Ernte.','Erweitere die Farm erst, wenn du den Ablauf getestet hast.'],note:'Hinweis: Spawnregeln und Farmmechaniken unterscheiden sich teilweise zwischen Java und Bedrock.'},
 alchemy:{icon:'🧪',title:'Tränke & Verzauberungen',intro:'Mit Tränken und verzauberter Ausrüstung kannst du dich gezielt auf Erkundungen und Kämpfe vorbereiten.',steps:['Sammle frühzeitig Zuckerrohr für Papier und Bücher.','Richte einen sicheren Platz für den Zaubertisch und Bücherregale ein.','Bewahre seltene Zutaten geordnet auf.','Lies die Wirkung eines Tranks oder einer Verzauberung, bevor du wertvolle Ressourcen einsetzt.'],note:'Tipp: Eine gut sortierte Ausrüstungskiste spart Zeit, wenn du zu einem Abenteuer aufbrichst.'},
 mobs:{icon:'🐲',title:'Mobs & Abenteuer',intro:'Die Welt ist voller Kreaturen. Beobachte ihr Verhalten und bereite dich passend auf neue Gebiete vor.',steps:['Nimm ausreichend Nahrung, Werkzeuge und Lichtquellen mit.','Markiere erkundete Wege und wichtige Orte.','Informiere dich über die Kreaturen in einem Gebiet, bevor du dich näherst.','Bewahre wertvolle Fundstücke sicher in deiner Basis auf.'],note:'Tipp: Ein sicherer Rückweg ist genauso wichtig wie die Ausrüstung für den Hinweg.'},
 mining:{icon:'⛏️',title:'Bergbau & Erze',intro:'Mit einer klaren Vorbereitung findest du Ressourcen gezielter und kannst deine Ausflüge besser planen.',steps:['Nimm eine passende Spitzhacke, ausreichend Fackeln, Nahrung und einen Ersatzstapel Blöcke mit.','Lege am Eingang deiner Mine eine Kiste für Erze, Stein und überschüssige Gegenstände an.','Achte auf Geräusche, Höhlenöffnungen und Lava; sichere Wege und beleuchte Abzweigungen.','Nutze Koordinaten oder Schilder, damit du den Rückweg und besonders ergiebige Stellen wiederfindest.','Prüfe vor dem gezielten Suchen die Höhenempfehlungen für deine Minecraft-Version und Weltgeneration.','Baue niemals direkt unter dir oder blind in unbekannte Hohlräume, wenn du nicht weißt, was darunter liegt.'],note:'Die besten Höhen für einzelne Erze hängen von der Weltgeneration ab. Prüfe deshalb die Version deiner Welt, bevor du eine alte Mining-Anleitung verwendest.'},
 nether:{icon:'🔥',title:'Nether – gut vorbereitet',intro:'Der Nether ist ein gefährlicher Ort für Erkundung und seltene Ressourcen. Eine feste Rückkehrstrategie ist besonders wichtig.',steps:['Sichere dein Inventar und nimm Goldrüstung oder ein Goldrüstungsteil mit, damit Piglins dich normalerweise nicht sofort als Gegner ansehen.','Notiere die Koordinaten deines Portals in der Oberwelt und im Nether.','Baue den Portalbereich mit nicht brennbaren Blöcken aus und markiere den Weg deutlich.','Nimm reichlich Nahrung, Blöcke, eine Fernkampfoption und eine Ersatzspitzhacke mit.','Öffne Truhen in Bastionen nicht unbedacht: Piglins reagieren auf das Öffnen von Behältern in ihrer Nähe.','Bewahre seltene Funde zwischendurch sicher auf, statt alles auf einmal mitzunehmen.'],note:'Bastionen und Netherfestungen sind unterschiedlich aufgebaut. Erkunde langsam und sichere zuerst einen Rückweg.'},
 villagers:{icon:'🧑‍🌾',title:'Dorfbewohner & Handel',intro:'Dorfbewohner können dir durch Handel nützliche Gegenstände und verlässliche Versorgung bieten.',steps:['Baue einen gut beleuchteten und geschützten Wohnbereich mit Betten.','Stelle sicher, dass Dorfbewohner ihre Arbeitsblöcke erreichen können, wenn du Berufe vergeben möchtest.','Prüfe Angebote, bevor du Ressourcen investierst; nicht jedes Angebot ist für deinen Spielstand sinnvoll.','Trenne Arbeitsbereiche und Laufwege, damit Dorfbewohner nicht ständig blockiert werden.','Lege eine sichere Transport- und Lagerplanung an, bevor du ein größeres Handelsdorf baust.','Beachte, dass Handels- und Berufssysteme je nach Edition und Einstellungen abweichen können.'],note:'Wenn du einen Dorfbewohner bereits gehandelt hast, kann sein Beruf festgelegt sein. Teste neue Anlagen am besten zuerst mit einem einzelnen Dorfbewohner.'},
 enchanting:{icon:'✨',title:'Verzaubern – Ausrüstung verbessern',intro:'Ein gut geplanter Verzauberungsplatz hilft dir, Werkzeuge und Rüstung langfristig zu verbessern.',steps:['Stelle einen Zaubertisch her und platziere Bücherregale mit dem nötigen Abstand darum, damit die stärkeren Angebote freigeschaltet werden.','Lass den Raum zunächst frei von störenden Blöcken zwischen Tisch und Bücherregalen.','Sammle Erfahrungspunkte, bevor du mehrere Gegenstände hintereinander verzauberst.','Nutze einen Amboss, um passende Verzauberungen zusammenzuführen oder Namen zu vergeben.','Vergleiche die angebotenen Verzauberungen und gib wertvolle Materialien nicht für zufällige Verbesserungen aus.','Bewahre eine Ersatzspitzhacke und Ersatzrüstung auf, damit du nicht unvorbereitet losziehen musst.'],note:'Die angezeigten Angebote sind zufällig. Ein neu eingelegter Gegenstand kann andere Angebote zeigen.'},
 inventory:{icon:'🎒',title:'Inventar & Lager organisieren',intro:'Ein übersichtliches Lager spart Zeit und verhindert, dass wichtige Materialien verloren gehen.',steps:['Ordne Kisten nach Gruppen wie Stein, Holz, Erze, Nahrung, Redstone und seltene Gegenstände.','Beschrifte Kisten mit Schildern oder Rahmen, damit du Inhalte auf einen Blick erkennst.','Lege eine kleine Abenteurerkiste mit Nahrung, Fackeln, Werkzeug und Baumaterial bereit.','Sortiere nach jeder Expedition dein Inventar, statt volle Kisten und unklare Stapel anzusammeln.','Bewahre besonders wertvolle Gegenstände getrennt von gewöhnlichen Baumaterialien auf.','Plane Erweiterungsplatz ein, damit dein Lagersystem mit deiner Welt wachsen kann.'],note:'Ein einfaches, konsequent verwendetes Kistensystem ist oft praktischer als eine komplizierte Sortieranlage.'},
 multiplayer:{icon:'👥',title:'Mehrspieler & Server',intro:'Mit ein paar gemeinsamen Regeln bleibt eine Welt mit Freunden übersichtlich und macht langfristig mehr Spaß.',steps:['Stimmt vor dem Start Spielversion, Edition und benötigte Add-ons oder Mods ab.','Legt gemeinsam fest, ob ihr gemeinsam baut, eigene Grundstücke nutzt oder Ressourcen teilt.','Bestimmt, wer Einstellungen und Backups verwaltet.','Erstellt regelmäßig Sicherungskopien der Welt und testet gelegentlich, ob sie sich wiederherstellen lassen.','Teilt Serveradresse und Zugangsdaten nur mit den Personen, die wirklich mitspielen sollen.','Bei Verbindungsproblemen prüft zuerst Version, Netzwerkverbindung und Serverstatus.'],note:'Ein Backup sollte außerhalb des aktiven Spielordners liegen. So ist es auch bei Problemen mit der Weltdatei noch verfügbar.'},
 java:{icon:'☕',title:'Minecraft Java Edition',intro:'Die Java Edition ist die PC-Version mit einer großen Modding- und Server-Community.',steps:['Java Edition läuft offiziell auf Windows, macOS und Linux.','Mods und Modloader können das Spiel erweitern – achte immer auf die passende Spielversion.','Bei Multiplayer-Servern müssen Spielversion und erforderliche Mods zusammenpassen.','Sichere deine Welten regelmäßig, bevor du Mods oder größere Änderungen ausprobierst.'],note:'Dieser Bereich wird künftig um konkrete Java-Anleitungen, Mods und Server-Tipps ergänzt.'},
 bedrock:{icon:'🌍',title:'Minecraft Bedrock Edition',intro:'Die Bedrock Edition verbindet Windows, Konsolen und mobile Geräte und unterstützt plattformübergreifendes Spielen.',steps:['Prüfe bei Multiplayer-Problemen zuerst, ob alle dieselbe kompatible Spielversion verwenden.','Aktiviere Welt-Backups, bevor du Add-ons oder Ressourcenpakete ausprobierst.','Nutze den Marktplatz oder vertrauenswürdige Quellen für Inhalte.','Beachte, dass manche Java-Tutorials nicht unverändert in Bedrock funktionieren.'],note:'Dieser Bereich wird künftig um konkrete Bedrock-Anleitungen, Add-ons und Multiplayer-Tipps ergänzt.'},
 both:{icon:'🔀',title:'Tipps für beide Editionen',intro:'Viele Minecraft-Grundlagen sind in Java und Bedrock ähnlich, einzelne Mechaniken funktionieren aber unterschiedlich.',steps:['Grundlagen wie Crafting, Erkundung und Bauen lassen sich oft übertragen.','Prüfe bei Farmen und Redstone immer, für welche Edition eine Anleitung geschrieben wurde.','Achte bei Tutorials auf die angegebene Spielversion.','Teste größere Konstruktionen zuerst in einer Kopie deiner Welt.'],note:'Blockwissen kennzeichnet künftig deutlich, ob ein Guide für Java, Bedrock oder beide Editionen gilt.'},
 guides:{icon:'📚',title:'Die Blockwissen-Guide-Übersicht',intro:'Hier findest du die Themenbereiche, die wir Schritt für Schritt zu ausführlichen Anleitungen ausbauen.',steps:['Survival: Start, Ausrüstung, Erkundung und Basisbau.','Redstone: Schaltungen, Türen und automatische Systeme.','Bauen: Häuser, Dekoration und Landschaften.','Farmen: Nahrung, Materialien und Mob-Drops.','Java & Bedrock: versionsspezifische Unterschiede und Tipps.'],note:'Die Karten auf der Startseite öffnen jeweils einen passenden Themenüberblick. Ausführliche Einzel-Guides werden nach und nach ergänzt.'}
};
function openGuide(key){
 const guide=guides[key];if(!guide)return;
 guideBody.innerHTML='<div class="welcome-icon">'+guide.icon+'</div><h2 id="guideTitle">'+guide.title+'</h2><p>'+guide.intro+'</p><div class="guide-subtitle">Schritt-für-Schritt-Tipps</div><ol class="guide-steps">'+guide.steps.map(item=>'<li>'+item+'</li>').join('')+'</ol><div class="guide-callout">'+guide.note+'</div><p class="guide-version-note">Hinweis: Einzelne Spielmechaniken können sich zwischen Java und Bedrock sowie zwischen Versionen unterscheiden.</p>';
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
 
// Versteckter mobiler Zugang: Kreisgeste + serverseitig geprüfte PIN.
(() => {
 const pinLayer=document.getElementById('mobileChatPin');
 const pinForm=document.getElementById('mobileChatPinForm');
 const pinInput=document.getElementById('mobileChatPinInput');
 const pinFeedback=document.getElementById('mobileChatPinFeedback');
 const closePin=()=>{pinLayer.hidden=true;pinForm.reset();pinFeedback.textContent='';};
 document.getElementById('closeMobilePin')?.addEventListener('click',closePin);
 pinLayer?.addEventListener('click',event=>{if(event.target===pinLayer)closePin();});
 pinForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  const submit=document.getElementById('mobileChatPinSubmit');
  submit.disabled=true;pinFeedback.textContent='Prüfe Zugang …';
  try{
   const response=await fetch('/api/mobile-gate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pinInput.value})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.ok)throw new Error(data.error||'Die PIN ist nicht richtig.');
   closePin();openChat();
  }catch(error){pinFeedback.textContent=error.message;pinInput.select();}
  finally{submit.disabled=false;}
 });
 let points=[],drawing=false,lastPoint=0;
 function isCircle(path){
  if(path.length<12)return false;
  const xs=path.map(p=>p.x),ys=path.map(p=>p.y);
  const cx=xs.reduce((a,b)=>a+b,0)/xs.length,cy=ys.reduce((a,b)=>a+b,0)/ys.length;
  const radii=path.map(p=>Math.hypot(p.x-cx,p.y-cy));
  const radius=radii.reduce((a,b)=>a+b,0)/radii.length;
  if(radius<24||radius>190)return false;
  const variance=Math.sqrt(radii.reduce((sum,r)=>sum+(r-radius)**2,0)/radii.length)/radius;
  const closure=Math.hypot(path[0].x-path.at(-1).x,path[0].y-path.at(-1).y)/radius;
  let angle=0;
  for(let i=1;i<path.length;i++){
   const a=Math.atan2(path[i-1].y-cy,path[i-1].x-cx);
   const b=Math.atan2(path[i].y-cy,path[i].x-cx);
   let delta=b-a;if(delta>Math.PI)delta-=Math.PI*2;if(delta< -Math.PI)delta+=Math.PI*2;
   angle+=delta;
  }
  return variance<0.48&&closure<0.65&&Math.abs(angle)>Math.PI*1.55;
 }
 document.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='touch'||overlay.classList.contains('open')||!pinLayer.hidden)return;
  drawing=true;points=[{x:event.clientX,y:event.clientY}];lastPoint=Date.now();
 },{passive:true});
 document.addEventListener('pointermove',event=>{
  if(!drawing)return;
  if(Date.now()-lastPoint>1800){drawing=false;points=[];return;}
  const previous=points[points.length-1];
  if(!previous||Math.hypot(event.clientX-previous.x,event.clientY-previous.y)>5)points.push({x:event.clientX,y:event.clientY});
 },{passive:true});
 const finishGesture=()=>{
  if(!drawing)return;drawing=false;
  if(isCircle(points)){pinLayer.hidden=false;pinInput.focus();}
  points=[];
 };
 document.addEventListener('pointerup',finishGesture,{passive:true});
 document.addEventListener('pointercancel',()=>{drawing=false;points=[];},{passive:true});
})();


// TYQORA CHAT – Accounts, Sessions, Rollen und Owner-Verwaltung
const chatLogin = document.getElementById('chatLogin');
const chatRoom = document.getElementById('chatRoom');
const adminPanel = document.getElementById('adminPanel');
const shopPanel = document.getElementById('shopPanel');
let shopState = { coins: 100, owned: [], equippedItem: '', items: [] };
const chatLoginForm = document.getElementById('chatLoginForm');
const chatLoginFeedback = document.getElementById('chatLoginFeedback');
const chatMessages = document.getElementById('chatMessages');
const chatMessageForm = document.getElementById('chatMessageForm');
const chatMessageInput = document.getElementById('chatMessageInput');
const chatCommandsButton = document.getElementById('chatCommandsButton');
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
let authToken = localStorage.getItem('tyqora_session') || sessionStorage.getItem('tyqora_session') || '';
if (authToken) localStorage.setItem('tyqora_session', authToken);
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
  shopPanel.hidden = true;
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
  document.getElementById('coinBalance').textContent = '🪙 ' + Number(chatUser.coins ?? shopState.coins ?? 100) + ' Coins';
  openAdminButton.hidden = chatUser.role !== 'owner';
}
function renderMentionText(container,text){
  container.replaceChildren();
  const pattern=/(@[\p{L}\p{N}_-]{3,24})/gu;
  let last=0,match;
  while((match=pattern.exec(text))){
    if(match.index>last)container.append(document.createTextNode(text.slice(last,match.index)));
    const tag=document.createElement('span');tag.className='chat-mention';tag.textContent=match[0];container.append(tag);
    last=pattern.lastIndex;
  }
  if(last<text.length)container.append(document.createTextNode(text.slice(last)));
}
function renderChatMessage(message) {
  const row = document.createElement('article');
  row.className = 'chat-message' + (message.bot ? ' bot-message' : '');
  row.dataset.messageId = message.id;
  if (message.userId) row.dataset.userId = message.userId;
  const meta = document.createElement('div');
  meta.className = 'chat-message-meta';
  const name = document.createElement('strong');
  name.textContent = message.name || 'Mitglied';
  const nameCosmetic = shopState.items.find(item => item.id === message.equippedItem && item.type === 'name') || null;
  const badgeCosmetic = shopState.items.find(item => item.id === message.equippedBadge && item.type === 'badge') || null;
  if (nameCosmetic) name.classList.add('cosmetic-name', 'cosmetic-name-' + nameCosmetic.id);
  meta.append(name);
  if (badgeCosmetic) {
    const badge = document.createElement('span');
    badge.className = 'cosmetic-badge';
    badge.textContent = badgeCosmetic.badge;
    badge.title = badgeCosmetic.name;
    meta.append(badge);
  }
  if (message.bot) {
    const verified = document.createElement('span');
    verified.className = 'bot-verified';
    verified.textContent = '✓ BOT';
    verified.title = 'Offizieller TYQORA-Systembot';
    meta.append(verified);
  } else if (message.role) {
    const role = document.createElement('span');
    role.className = 'message-role role-' + message.role;
    role.textContent = ({owner:'OWNER',admin:'ADMIN',moderator:'MOD',member:''})[message.role] || '';
    meta.append(role);
  }
  const time = document.createElement('time');
  time.dateTime = new Date(message.time).toISOString();
  time.textContent = new Date(message.time).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
  const body = document.createElement('p');
  body.className = 'chat-message-body';
  renderMentionText(body, message.text || '');
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
    if (chatUser.role === 'owner' && !message.bot) {
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
function updateMessageRoleBadges(userId, role) {
  chatMessages.querySelectorAll('.chat-message').forEach(row => {
    if (row.dataset.userId !== userId) return;
    const meta = row.querySelector('.chat-message-meta');
    if (!meta) return;
    let badge = meta.querySelector('.message-role');
    const label = ({owner:'OWNER',admin:'ADMIN',moderator:'MOD',member:''})[role] || '';
    if (!label) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'message-role';
      const name = meta.querySelector('strong');
      if (name) name.after(badge);
    }
    badge.className = 'message-role role-' + role;
    badge.textContent = label;
  });
}
document.addEventListener('click', event => {
  if (event.target.closest('.message-menu-wrap')) return;
  document.querySelectorAll('.message-menu').forEach(menu => { menu.hidden = true; });
  document.querySelectorAll('.message-menu-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
});

function connectChat() {
  if (!authToken || !chatUser) return;
  if (chatSocket) chatSocket.close();
  chatAuthenticated = false;
  chatMessages.replaceChildren();
  setChatConnection('connecting', 'Verbinde …');
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(protocol + '//' + location.host + '/api/chat?channel=' + encodeURIComponent(selectedChannel) + '&token=' + encodeURIComponent(authToken));
  chatSocket = socket;
  const sendPresence = () => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type:'presence_ping'})); };
  socket.addEventListener('open', sendPresence);
  const presenceTimer = window.setInterval(sendPresence, 30000);
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
      shopPanel.hidden = true;
      chatRoom.hidden = false;
      setChatConnection('online', 'Verbunden');
      (Array.isArray(data.messages) ? data.messages : []).forEach(renderChatMessage);
      chatMessageInput.focus();
    } else if (data.type === 'message' && data.message) renderChatMessage(data.message);
    else if (data.type === 'role_update' && data.userId && data.role) {
      updateMessageRoleBadges(data.userId, data.role);
      if (data.userId === chatUser?.id && chatUser.role !== data.role) {
        chatUser.role = data.role;
        showAccount();
        connectChat();
      }
    }
    else if (data.type === 'cosmetic_update' && data.userId) {
      chatMessages.querySelectorAll('.chat-message').forEach(row => {
        if (row.dataset.userId !== data.userId) return;
        const meta = row.querySelector('.chat-message-meta');
        const name = meta?.querySelector('strong');
        if (!name) return;
        if (data.itemType === 'badge') {
          meta.querySelector('.cosmetic-badge')?.remove();
          const badgeItem = shopState.items.find(entry => entry.id === data.itemId && entry.type === 'badge');
          if (badgeItem) {
            const badge = document.createElement('span');
            badge.className = 'cosmetic-badge';
            badge.textContent = badgeItem.badge;
            badge.title = badgeItem.name;
            name.after(badge);
          }
        } else {
          const nameItem = shopState.items.find(entry => entry.id === data.itemId && entry.type === 'name');
          name.classList.remove('cosmetic-name', ...Array.from(name.classList).filter(className => className.startsWith('cosmetic-name-')));
          if (nameItem) name.classList.add('cosmetic-name', 'cosmetic-name-' + nameItem.id);
        }
      });
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
    window.clearInterval(presenceTimer);
    if (socket !== chatSocket) return;
    chatAuthenticated = false;
    setChatConnection('offline', 'Nicht verbunden');
  });
  socket.addEventListener('error', () => {
    if (socket !== chatSocket) return;
    setChatConnection('offline', 'Verbindungsfehler');
  });
}

async function loadShop() {
  const data = await api('/api/shop', null, 'GET');
  shopState = data;
  chatUser.coins = data.coins;
  showAccount();
  document.getElementById('shopBalance').textContent = '🪙 ' + data.coins + ' Coins';
  const container = document.getElementById('shopItems');
  container.replaceChildren();
  data.items.forEach(item => {
    if (item.ownerOnly && chatUser?.role !== 'owner') return;
    const card = document.createElement('article'); card.className = 'shop-item';
    const icon = document.createElement('div'); icon.className = 'shop-item-icon'; icon.textContent = item.icon;
    const title = document.createElement('h3'); title.textContent = item.name;
    if (item.type === 'name') title.classList.add('cosmetic-name', 'cosmetic-name-' + item.id, 'shop-cosmetic-preview');
    const description = document.createElement('p'); description.textContent = item.description;
    const price = document.createElement('strong'); price.className = 'shop-price'; price.textContent = '🪙 ' + item.price;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'chat-primary shop-action';
    const owned = data.owned.includes(item.id);
    const equipped = item.type === 'badge' ? data.equippedBadge === item.id : data.equippedItem === item.id;
    button.textContent = !owned ? 'Kaufen' : (equipped ? 'Ablegen' : 'Anlegen');
    button.classList.toggle('shop-action-unequip', owned && equipped);
    button.classList.toggle('shop-action-equip', owned && !equipped && item.type !== 'name');
    button.disabled = false;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        if (!owned) {
          await api('/api/shop/buy', { itemId: item.id });
          document.getElementById('shopFeedback').textContent = item.name + ' gekauft!';
        } else {
          await api('/api/shop/equip', { itemId: equipped ? '' : item.id, itemType: item.type });
          document.getElementById('shopFeedback').textContent = equipped ? 'Cosmetic abgelegt.' : 'Cosmetic angelegt!';
        }
        await loadShop();
      } catch (error) {
        document.getElementById('shopFeedback').textContent = error.message;
        button.disabled = false;
      }
    });
    card.append(icon, title, description, price, button);
    container.append(card);
  });
}
document.getElementById('openShop').addEventListener('click', async () => {
  chatRoom.hidden = true; adminPanel.hidden = true; shopPanel.hidden = false;
  document.getElementById('shopFeedback').textContent = '';
  try { await loadShop(); } catch (error) { document.getElementById('shopFeedback').textContent = error.message; }
});
document.getElementById('shopBack').addEventListener('click', () => { shopPanel.hidden = true; chatRoom.hidden = false; });
document.getElementById('shopRefresh').addEventListener('click', () => loadShop().catch(error => { document.getElementById('shopFeedback').textContent = error.message; }));

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
    meta.textContent = new Date(user.createdAt).toLocaleDateString('de-DE') + (user.banned ? ' · Gesperrt' : '') + ' · 🪙 ' + Number(user.coins || 0) + ' Coins';
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
    const coinControls = document.createElement('div');
    coinControls.className = 'coin-admin-controls';
    const coinAmount = document.createElement('input');
    coinAmount.type = 'number'; coinAmount.min = '1'; coinAmount.max = '100000'; coinAmount.step = '1'; coinAmount.value = '100';
    coinAmount.setAttribute('aria-label', 'Coins für ' + user.name);
    const giveCoins = document.createElement('button');
    giveCoins.type = 'button'; giveCoins.textContent = '🪙 Coins geben';
    giveCoins.addEventListener('click', async () => {
      const amount = Number(coinAmount.value);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
        document.getElementById('adminFeedback').textContent = 'Bitte gib eine ganze Zahl zwischen 1 und 100.000 ein.';
        return;
      }
      giveCoins.disabled = true;
      try {
        const result = await api('/api/admin/coins', {userId:user.id, amount});
        document.getElementById('adminFeedback').textContent = user.name + ' wurden ' + amount + ' Coins gegeben. Neues Guthaben: ' + result.coins + '.';
        if (chatUser?.id === user.id) { chatUser.coins = result.coins; showAccount(); }
        await loadAdminUsers();
      } catch (error) { document.getElementById('adminFeedback').textContent = error.message; }
      finally { giveCoins.disabled = false; }
    });
    coinControls.append(coinAmount, giveCoins);
    actions.append(role, save, ban, remove);
    card.append(coinControls);
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
      localStorage.setItem('tyqora_session', authToken);
      chatUser = result.user;
      showAccount();
      window.dispatchEvent(new Event('tyqora:authenticated'));
      await loadShop().catch(() => {});
      connectChat();
    }
  } catch (error) {
    showChatLogin(error.message);
  } finally {
    chatLoginButton.disabled = false;
  }
});
const chatSuggestBox=document.createElement('div');
chatSuggestBox.className='chat-suggestions';
chatSuggestBox.hidden=true;
chatMessageForm.append(chatSuggestBox);
let mentionMembers=[],suggestionItems=[],suggestionIndex=0;
const commandCatalog=[
  {name:'help',usage:'/help',description:'Öffnet die vollständige Befehlsübersicht.'},
  {name:'me',usage:'/me <aktion>',description:'Teilt eine Aktion mit deinem Benutzernamen.'},
  {name:'roll',usage:'/roll',description:'Würfelt eine zufällige Zahl von 1 bis 100.'},
  {name:'shrug',usage:'/shrug <text>',description:'Hängt das Schulterzucken an deinen Text.'},
  {name:'time',usage:'/time',description:'Zeigt die aktuelle Uhrzeit in Deutschland.'},
  {name:'about',usage:'/about',description:'Zeigt das Bot-Profil und seine Funktionen.'}
];
function runChatCommand(raw){
  if(!chatSocket||chatSocket.readyState!==WebSocket.OPEN)return;
  chatSocket.send(JSON.stringify({type:'command',text:raw}));
}
function hideSuggestions(){chatSuggestBox.hidden=true;chatSuggestBox.replaceChildren();suggestionItems=[];suggestionIndex=0;}
function showSuggestions(items,kind){
  suggestionItems=items;suggestionIndex=0;chatSuggestBox.replaceChildren();
  if(!items.length){hideSuggestions();return;}
  items.forEach((item,index)=>{
    const button=document.createElement('button');button.type='button';button.className='chat-suggestion'+(index===0?' active':'');
    const title=document.createElement('strong');title.textContent=kind==='command'?item.usage:'@'+item.name;
    const detail=document.createElement('span');detail.textContent=kind==='command'?item.description:(item.role||'Mitglied');
    button.append(title,detail);
    button.addEventListener('mousedown',event=>event.preventDefault());
    button.addEventListener('click',()=>chooseSuggestion(item,kind));
    chatSuggestBox.append(button);
  });
  chatSuggestBox.hidden=false;
}
function chooseSuggestion(item,kind){
  const value=chatMessageInput.value;
  if(kind==='command'){chatMessageInput.value=item.usage+' ';chatMessageInput.focus();}
  else{
    const match=value.match(/@([\p{L}\p{N}_-]*)$/u);if(!match)return;
    chatMessageInput.value=value.slice(0,match.index)+'@'+item.name+' ';
    chatMessageInput.focus();
  }
  hideSuggestions();
}
async function loadMentionMembers(){
  const session=authToken||localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  if(!session)return;
  try{const response=await fetch('/api/community/members',{headers:{Authorization:'Bearer '+session}});const data=await response.json();mentionMembers=data.users||[];}catch{}
}
function updateSuggestions(){
  const value=chatMessageInput.value;
  const mention=value.match(/@([\p{L}\p{N}_-]*)$/u);
  if(mention){
    const query=mention[1].toLocaleLowerCase();
    const matches=mentionMembers.filter(user=>user.name.toLocaleLowerCase().startsWith(query)).slice(0,8);
    showSuggestions(matches,'mention');return;
  }
  const command=value.match(/^\/([a-z]*)$/i);
  if(command){
    const query=command[1].toLowerCase();
    showSuggestions(commandCatalog.filter(item=>item.name.startsWith(query)),'command');return;
  }
  hideSuggestions();
}
chatMessageInput.addEventListener('input',updateSuggestions);
chatCommandsButton?.addEventListener('click',()=>{chatMessageInput.value='/';chatMessageInput.focus();updateSuggestions();});
chatMessageInput.addEventListener('keydown',event=>{
  if(chatSuggestBox.hidden)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();suggestionIndex=(suggestionIndex+(event.key==='ArrowDown'?1:-1)+suggestionItems.length)%suggestionItems.length;
    [...chatSuggestBox.children].forEach((node,index)=>node.classList.toggle('active',index===suggestionIndex));
  }else if(event.key==='Enter'&&suggestionItems.length){
    event.preventDefault();const value=suggestionItems[suggestionIndex];chooseSuggestion(value,chatMessageInput.value.startsWith('/')?'command':'mention');
  }else if(event.key==='Escape')hideSuggestions();
});
loadMentionMembers();
window.addEventListener('tyqora:authenticated',loadMentionMembers);
const previousChannelButtons=channelButtons;
previousChannelButtons.forEach(button=>button.addEventListener('click',()=>hideSuggestions()));
chatMessageForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = chatMessageInput.value.trim();
  if (!text || !chatAuthenticated || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;
  if(text.startsWith('/')){runChatCommand(text);chatMessageInput.value='';hideSuggestions();chatMessageInput.focus();return;}
  chatSocket.send(JSON.stringify({type:'message', text}));
  chatMessageInput.value = '';
  hideSuggestions();
  chatMessageInput.focus();
});
channelButtons.forEach(button => button.addEventListener('click', () => {
  shopPanel.hidden = true;
  adminPanel.hidden = true;
  chatRoom.hidden = false;
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
  shopPanel.hidden = true;
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
    localStorage.removeItem('tyqora_session');
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
  localStorage.removeItem('tyqora_session');
    sessionStorage.removeItem('tyqora_session');
  chatAccount.hidden = true; showChatLogin('Du wurdest abgemeldet.'); setChatConnection('offline', 'Nicht verbunden');
});
async function restoreSession() {
  if (!authToken) return;
  try {
    const result = await api('/api/me', null, 'GET');
    chatUser = result.user;
    showAccount();
    window.dispatchEvent(new Event('tyqora:authenticated'));
    await loadShop().catch(() => {});
    connectChat();
  } catch {
    authToken = '';
    localStorage.removeItem('tyqora_session');
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
    localStorage.removeItem('tyqora_session');
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


// Live-Suche für die Guide-Karten
const guideSearchInput=document.getElementById('guideSearch');
guideSearchInput?.addEventListener('input',()=>{
 const query=guideSearchInput.value.trim().toLocaleLowerCase('de');
 document.querySelectorAll('#guideGrid [data-guide]').forEach(card=>{
   const haystack=(card.innerText+' '+card.dataset.guide).toLocaleLowerCase('de');
   card.hidden=!haystack.includes(query);
 });
});
