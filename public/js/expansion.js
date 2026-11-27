(() => {
  const token=()=>localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  const api=async(path,method='GET',body=null)=>{const r=await fetch('/api/community/'+path,{method,headers:{Authorization:'Bearer '+token(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Anfrage fehlgeschlagen.');return d;};
  let modal,body,active='polls';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,attrs='')=>'<button type="button" data-action="'+action+'" '+attrs+'>'+label+'</button>';
  function ensure(){
    if(modal)return;
    const b=document.createElement('button');b.type='button';b.id='openTyqoraFeatures';b.className='chat-refresh';b.textContent='✨ Extras';document.querySelector('.chat-top-actions')?.insertBefore(b,document.getElementById('chatRefresh'));
    modal=document.createElement('div');modal.className='community-modal tyqora-expansion-modal';modal.id='tyqoraExpansion';modal.hidden=true;
    modal.innerHTML='<section class="community-dialog tyqora-expansion-dialog"><button class="close community-close" data-action="close" type="button">✕</button><h2>TYQORA Community</h2><nav class="tyqora-expansion-tabs"><button data-tab="polls">Umfragen</button><button data-tab="daily">Tagesmission</button><button data-tab="stats">Statistiken</button><button data-tab="events">Events</button><button data-tab="settings">Benachrichtigungen</button><button data-tab="roles" class="owner-only-tab">Eigene Rollen</button></nav><div class="tyqora-expansion-body" id="tyqoraExpansionBody"></div></section>';
    document.body.append(modal);body=modal.querySelector('#tyqoraExpansionBody');
    b.addEventListener('click',()=>{modal.hidden=false;load(active);});document.getElementById('openChatPolls')?.addEventListener('click',()=>{modal.hidden=false;load('polls');});
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-action="close"]'))modal.hidden=true;});
    modal.querySelectorAll('[data-tab]').forEach(x=>x.addEventListener('click',()=>load(x.dataset.tab)));
    modal.addEventListener('submit',submit);
    modal.addEventListener('click',act);
  }
  async function load(tab=active){
    active=tab;modal.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
    body.innerHTML='<p>Lade …</p>';
    try{
      if(tab==='polls'){
        const {polls}=await api('polls');
        body.innerHTML='<h3>Umfragen im Chat</h3><form data-form="poll" class="exp-form"><label>Frage<input name="question" maxlength="120" required placeholder="Worüber sollen wir abstimmen?"></label><label>Antworten (je eine pro Zeile)<textarea name="options" required rows="3" placeholder="Option 1&#10;Option 2"></textarea></label><button class="chat-primary">Umfrage erstellen</button></form><div class="exp-list">'+(polls.map(p=>'<article class="exp-card"><strong>'+esc(p.question)+'</strong><small>Von '+esc(p.creator)+' · #'+esc(p.channel)+'</small>'+p.options.map((o,i)=>{const count=p.counts.find(x=>x.optionIndex===i)?.count||0;return '<button class="exp-vote '+(p.myVote===i?'selected':'')+'" data-action="vote" data-id="'+p.id+'" data-index="'+i+'">'+esc(o)+' <span>'+count+'</span></button>';}).join('')+'<small>Du kannst deine Stimme ändern. Ende: '+new Date(p.endsAt).toLocaleDateString('de-DE')+'</small></article>').join('')||'<p>Noch keine Umfragen. Erstelle die erste!</p>')+'</div>';
      }else if(tab==='daily'){
        const [d,s]=await Promise.all([api('daily'),api('stats')]);const m=d.mission;
        body.innerHTML='<h3>Tägliche Mission</h3><article class="exp-card"><strong>🎯 '+esc(m.title)+'</strong><p>'+esc(m.description)+'</p><div class="exp-progress"><span style="width:'+Math.min(100,m.progress/m.target*100)+'%"></span></div><p>'+m.progress+' / '+m.target+' Nachrichten · Belohnung: 🪙 '+m.reward+' Coins</p>'+(m.claimed?'<p>✅ Bereits abgeholt</p>':button('Belohnung abholen','claim',m.progress<m.target?'disabled':''))+'</article><p>Die Mission wird jeden Tag um Mitternacht (deutsche Zeit) zurückgesetzt.</p>';
      }else if(tab==='stats'){
        const {stats:s}=await api('stats');body.innerHTML='<h3>Deine Profil-Statistiken</h3><div class="exp-stats"><div><strong>'+s.messageCount+'</strong><span>Nachrichten</span></div><div><strong>'+s.xp+'</strong><span>XP</span></div><div><strong>'+s.level+'</strong><span>Level</span></div><div><strong>'+s.achievementCount+'</strong><span>Erfolge</span></div></div><p>Mitglied seit: '+(s.joinedAt?new Date(s.joinedAt).toLocaleDateString('de-DE'):'—')+'</p>';
      }else if(tab==='events'){
        const {events}=await api('events');const canCreate=['owner','admin','moderator'].includes(window.tyqoraRole||'');
        body.innerHTML='<h3>Community-Events</h3>'+(canCreate?'<form data-form="event" class="exp-form"><label>Event-Titel<input name="title" maxlength="70" required></label><label>Beschreibung<textarea name="description" maxlength="300" rows="2"></textarea></label><label>Beginn<input name="starts" type="datetime-local" required></label><label>Ende<input name="ends" type="datetime-local" required></label><button class="chat-primary">Event erstellen</button></form>':'')+'<div class="exp-list">'+(events.map(e=>'<article class="exp-card"><strong>📅 '+esc(e.title)+'</strong><p>'+esc(e.description)+'</p><small>'+new Date(e.startsAt).toLocaleString('de-DE')+' · '+e.participants+' Teilnehmende</small>'+(e.joined?'<p>✅ Du bist dabei</p>':button('Teilnehmen','join','data-id="'+e.id+'"'))+'</article>').join('')||'<p>Keine kommenden Events.</p>')+'</div>';
      }else if(tab==='settings'){
        const {settings:s}=await api('notification-settings');body.innerHTML='<h3>Benachrichtigungen verwalten</h3><form data-form="settings" class="exp-form">'+[['mentions','Erwähnungen'],['dms','Private Nachrichten'],['friends','Freundschaftsanfragen'],['events','Events']].map(([k,n])=>'<label class="exp-check"><input type="checkbox" name="'+k+'" '+(s[k]?'checked':'')+'> '+n+'</label>').join('')+'<button class="chat-primary">Einstellungen speichern</button></form>';
      }else if(tab==='roles'){
        if(!window.tyqoraIsOwner){body.innerHTML='<p>Nur der Owner darf eigene Rollen verwalten.</p>';return;}
        const {roles,users}=await api('custom-roles');body.innerHTML='<h3>Eigene Rollen (Owner)</h3><form data-form="role" class="exp-form"><label>Rollenname<input name="name" maxlength="24" required></label><label>Farbe<input name="color" type="color" value="#8bdc72"></label><button class="chat-primary">Rolle erstellen</button></form><h4>Rollen zuweisen</h4><div class="exp-list">'+users.map(u=>'<article class="exp-card"><strong>'+esc(u.name)+'</strong><small>Systemrolle: '+esc(u.role)+'</small><label>Eigene Rolle<select data-assign-user="'+esc(u.id)+'"><option value="">Keine eigene Rolle</option>'+roles.map(r=>'<option value="'+esc(r.id)+'" '+(u.customRoleId===r.id?'selected':'')+'>'+esc(r.name)+'</option>').join('')+'</select></label><button data-action="assign-role" data-user="'+esc(u.id)+'">Zuweisung speichern</button></article>').join('')+'</div><h4>Rollen verwalten</h4><div class="exp-list">'+roles.map(r=>'<article class="exp-card"><strong style="color:'+esc(r.color)+'">'+esc(r.name)+'</strong>'+button('Löschen','delete-role','data-id="'+r.id+'"')+'</article>').join('')+'</div><p>Eigene Rollen sind zusätzliche Bezeichnungen/Farben und geben keine Systemrechte.</p>';
      }
    }catch(e){body.innerHTML='<p class="chat-feedback">'+esc(e.message)+'</p>';}
  }
  async function submit(e){
    const form=e.target.closest('form[data-form]');if(!form)return;e.preventDefault();const f=new FormData(form);
    try{
      if(form.dataset.form==='poll'){const options=String(f.get('options')||'').split('\n').map(x=>x.trim()).filter(Boolean);await api('polls','POST',{question:f.get('question'),options,channel:document.getElementById('activeChannel')?.textContent.replace('#','').trim()||'welcome'});}
      if(form.dataset.form==='event'){const starts=new Date(f.get('starts')).getTime(),ends=new Date(f.get('ends')).getTime();await api('events','POST',{title:f.get('title'),description:f.get('description'),startsAt:starts,endsAt:ends});}
      if(form.dataset.form==='settings'){await api('notification-settings','POST',Object.fromEntries(['mentions','dms','friends','events'].map(k=>[k,form.elements[k].checked])));}
      if(form.dataset.form==='role'){await api('custom-roles','POST',{name:f.get('name'),color:f.get('color')});}
      await load(active);
    }catch(err){const p=document.createElement('p');p.className='chat-feedback';p.textContent=err.message;body.prepend(p);}
  }
  async function act(e){
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
    try{
      if(a==='vote')await api('poll-vote','POST',{pollId:b.dataset.id,optionIndex:Number(b.dataset.index)});
      if(a==='claim'){const result=await api('daily/claim','POST',{});if(typeof chatUser!=='undefined'&&chatUser)chatUser.coins=result.coins;}
      if(a==='join')await api('event-join','POST',{eventId:b.dataset.id});
      if(a==='delete-role'){if(!confirm('Diese eigene Rolle löschen?'))return;await api('custom-roles?id='+encodeURIComponent(b.dataset.id),'DELETE');}
      if(a==='assign-role'){const select=[...modal.querySelectorAll('[data-assign-user]')].find(x=>x.dataset.assignUser===b.dataset.user);await api('custom-role-assign','POST',{targetUserId:b.dataset.user,roleId:select?.value||''});}
      await load(active);
    }catch(err){const p=document.createElement('p');p.className='chat-feedback';p.textContent=err.message;body.prepend(p);}
  }
  function auth(){window.tyqoraIsOwner=typeof chatUser!=='undefined'&&chatUser?.role==='owner';window.tyqoraRole=typeof chatUser!=='undefined'?(chatUser?.role||''):'';ensure();}
  window.addEventListener('tyqora:authenticated',auth);if(token())auth();
})();