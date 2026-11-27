(() => {
  const modal=document.getElementById('profileModal'), view=document.getElementById('profileView');
  if(!modal||!view)return;
  const token=()=>localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  async function api(path,method='GET',body=null){
    const response=await fetch('/api/community/'+path,{method,headers:{Authorization:'Bearer '+token(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');return data;
  }
  const avatarSource=value=>'/api/avatar-proxy?url='+encodeURIComponent(value);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  async function openProfile(userId=''){
    view.replaceChildren(el('p','','Profil wird geladen …'));modal.hidden=false;
    try{
      const data=await api('profile'+(userId?'?id='+encodeURIComponent(userId):'')),p=data.profile;
      view.replaceChildren();
      const equipped = p.equippedCosmetics || {};
      const frameId = equipped.profile_frame || '';
      const backgroundId = equipped.profile_background || '';
      view.classList.remove('profile-view-background-space','profile-view-background-minecraft');
      if(backgroundId.startsWith('background_')) view.classList.add('profile-view-background-' + backgroundId.slice(11));
      if(p.bannerUrl||p.bannerEffect&&p.bannerEffect!=='none'){const banner=el('div','profile-banner profile-banner-effect-'+(p.bannerEffect||'none'));if(p.bannerUrl)banner.style.backgroundImage='url("'+avatarSource(p.bannerUrl)+'")';banner.setAttribute('aria-label','Profilbanner');view.append(banner);}
      if(p.backgroundUrl){view.style.backgroundImage='linear-gradient(rgba(7,14,24,.82),rgba(7,14,24,.94)),url("'+avatarSource(p.backgroundUrl)+'")';view.style.backgroundSize='cover';view.style.backgroundPosition='center';}else view.style.backgroundImage='';
      const head=el('div','profile-head'),avatar=el('div','profile-avatar');
      if(p.avatarUrl){const img=document.createElement('img');img.referrerPolicy='no-referrer';img.src=avatarSource(p.avatarUrl);img.alt='Profilbild';img.loading='eager';img.decoding='async';img.onerror=()=>{img.remove();avatar.textContent=p.name.slice(0,1).toUpperCase();avatar.title='Das Profilbild konnte nicht geladen werden. Verwende einen direkten HTTPS-Bildlink.';};avatar.append(img);}
      else avatar.textContent=p.name.slice(0,1).toUpperCase();
      if(frameId.startsWith('frame_')) avatar.classList.add('frame-' + frameId.slice(6));
      const title=el('div','profile-title');title.append(el('h2','',p.name),el('p','profile-role',String(p.role||'member').toUpperCase()));
      const statusMap={status_star:'⭐',status_lightning:'⚡'};
      if(statusMap[equipped.status_icon]) title.append(el('span','cosmetic-status-icon',statusMap[equipped.status_icon]));
      const profileTitleMap={title_builder:'Weltenbauer',title_explorer:'Entdecker'};
      if(p.title) title.append(el('span','profile-profile-title',p.title));
      else if(profileTitleMap[equipped.profile_title]) title.append(el('span','profile-profile-title',profileTitleMap[equipped.profile_title]));
      const collectibleMap={collectible_pixel:'🟪',collectible_mythic:'🔮'};
      if(collectibleMap[equipped.collectible]) title.append(el('span','cosmetic-status-icon',collectibleMap[equipped.collectible]));
      head.append(avatar,title);view.append(head,el('div','profile-bio',p.bio||'Noch keine Profilbeschreibung.'));
      const level=Number(p.level||1),xp=Number(p.xp||0),progress=xp%100;
      const isLegend=p.role==='owner'||level>=10;const rank=isLegend?'Legende':level>=5?'Stammgast':level>=2?'Aktiv':'Neuling';
      title.append(el('p','profile-status','Status: '+rank));
      const stats=el('div','profile-progress');stats.append(el('strong','','Level '+level),el('div','','XP: '+xp+' · Noch '+(100-progress)+' XP bis Level '+(level+1)),el('div','profile-message-total','💬 '+Number(p.messageCount||0)+' Nachrichten insgesamt'));
      const track=el('div','profile-progress-track'),fill=el('span','');fill.style.width=progress+'%';track.append(fill);stats.append(track);
      const achievements=el('div','profile-stats');
      achievements.append(el('span','',level>=2?'🏅 Aktiv dabei':'🔒 Aktiv-Level'),el('span','',level>=5?'🌟 Stammgast':'🔒 Stammgast'),el('span','',isLegend?'👑 Legende':'🔒 Legende'));
      view.append(stats,achievements);
      if(p.musicUrl){
        const musicBox=el('div','profile-music-player');musicBox.append(el('strong','','🎵 Profil-Musik'));
        const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=p.musicUrl;audio.setAttribute('aria-label','Profil-Musik abspielen');
        musicBox.append(audio);view.append(musicBox);
      }
      if(Array.isArray(p.achievements)){
        const achievementBox=el('div','profile-achievements');
        achievementBox.append(el('h3','','Erfolge'));
        p.achievements.forEach(item=>{const badge=el('span','achievement-chip'+(item.unlocked?' unlocked':' locked'),(item.unlocked?item.icon:'🔒')+' '+item.name);achievementBox.append(badge);});
        view.append(achievementBox);
      }
      try {
        const trophyData=await api('trophies?id='+encodeURIComponent(p.id));
        const showcase=el('div','profile-trophy-showcase');showcase.append(el('h3','','🏆 Trophäen-Vitrine'));
        const labels={first_message:'Erste Nachricht',xp_100:'100 XP',level_5:'Level 5',level_10:'Level 10'};
        const selected=trophyData.selected||[];
        if(selected.length) selected.forEach(t=>showcase.append(el('span','achievement-chip unlocked','🏆 '+(labels[t.id]||t.id))));
        else showcase.append(el('p','','Noch keine Trophäen ausgewählt.'));
        if(data.own){
          const edit=el('div','profile-trophy-edit');edit.append(el('strong','','Vitrine bearbeiten (max. 3)'));
          const chosen=new Set(selected.map(t=>t.id));
          (trophyData.unlocked||[]).forEach(id=>{const label=el('label','profile-trophy-option');const check=document.createElement('input');check.type='checkbox';check.value=id;check.checked=chosen.has(id);label.append(check,document.createTextNode(' '+(labels[id]||id)));edit.append(label);});
          const saveTrophies=el('button','chat-primary','Vitrine speichern');saveTrophies.type='button';
          saveTrophies.addEventListener('click',async()=>{const ids=[...edit.querySelectorAll('input:checked')].map(x=>x.value);if(ids.length>3){feedbackTrophy.textContent='Maximal 3 Trophäen auswählen.';return;}try{await api('trophies','POST',{ids});await openProfile();}catch(err){feedbackTrophy.textContent=err.message;}});
          const feedbackTrophy=el('p','chat-feedback','');edit.append(saveTrophies,feedbackTrophy);showcase.append(edit);
        }
        view.append(showcase);
      } catch {}
      if(data.own){
        const form=el('form','profile-edit'),bioLabel=el('label','','Über mich (max. 240 Zeichen)'),bio=document.createElement('textarea');
        bio.maxLength=240;bio.value=p.bio||'';
        const titleLabel=el('label','','Profil-Titel (optional)'),profileTitle=document.createElement('input');
        profileTitle.type='text';profileTitle.maxLength=40;profileTitle.placeholder='Zum Beispiel: Baumeister';profileTitle.value=p.title||'';
        const urlLabel=el('label','','Profilbild-URL (HTTPS, optional)'),url=document.createElement('input');
        url.type='url';url.maxLength=500;url.placeholder='https://…';url.value=p.avatarUrl||'';url.autocomplete='url';
        const bannerLabel=el('label','','Profilbanner-URL (HTTPS, optional)'),bannerUrl=document.createElement('input');
        bannerUrl.type='url';bannerUrl.maxLength=500;bannerUrl.placeholder='https://…';bannerUrl.value=p.bannerUrl||'';
        const backgroundLabel=el('label','','Profilhintergrund-URL (HTTPS, optional)'),backgroundUrl=document.createElement('input');
        backgroundUrl.type='url';backgroundUrl.maxLength=500;backgroundUrl.placeholder='https://…';backgroundUrl.value=p.backgroundUrl||'';
        const effectLabel=el('label','','Banner-Animation'),bannerEffect=document.createElement('select');[['none','Keine'],['shimmer','Schimmer'],['float','Sanft bewegen'],['stars','Sternenfunkeln']].forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;bannerEffect.append(o);});bannerEffect.value=p.bannerEffect||'none';const preview=el('div','profile-avatar profile-avatar-preview');const previewFallback=el('span','','Vorschau');preview.append(previewFallback);const previewStatus=el('small','profile-avatar-hint','Direkter HTTPS-Bildlink (JPG, PNG oder WebP).');url.addEventListener('input',()=>{preview.replaceChildren();const value=url.value.trim();if(!value){preview.append(el('span','','Vorschau'));previewStatus.textContent='Direkter HTTPS-Bildlink (JPG, PNG oder WebP).';return;}let parsed;try{parsed=new URL(value);}catch{preview.append(el('span','','?'));previewStatus.textContent='Bitte eine gültige Bild-URL eingeben.';return;}if(parsed.protocol!=='https:'){preview.append(el('span','','!'));previewStatus.textContent='Nur HTTPS-Bildlinks werden unterstützt.';return;}const image=document.createElement('img');image.referrerPolicy='no-referrer';image.alt='Profilbild-Vorschau';image.onload=()=>{previewStatus.textContent='Bildvorschau erfolgreich geladen.';};image.onerror=()=>{preview.replaceChildren(el('span','','!'));previewStatus.textContent='Bild nicht erreichbar. Verwende einen direkten Link zur Bilddatei, nicht zur Webseite.';};image.src=avatarSource(value);preview.append(image);});if(url.value)url.dispatchEvent(new Event('input'));const musicLabel=el('label','','Profil-Musik-URL (HTTPS, optional)'),musicUrl=document.createElement('input');
        musicUrl.type='url';musicUrl.maxLength=500;musicUrl.placeholder='https://…';musicUrl.value=p.musicUrl||'';
        const musicHint=el('small','','Direkter Audio-Dateilink. Wiedergabe startet erst nach einem Klick.');
        if(!p.musicUnlocked){musicUrl.disabled=true;musicUrl.placeholder='Im Shop freischalten';musicHint.textContent='Profil-Musik ist noch nicht freigeschaltet. Kaufe zuerst „Profil-Musik“ im Shop.';}
        const save=el('button','chat-primary profile-save','Profil speichern');save.type='submit';
        const feedback=el('p','chat-feedback','');
        form.append(bioLabel,bio,titleLabel,profileTitle,urlLabel,url,preview,previewStatus,bannerLabel,bannerUrl,effectLabel,bannerEffect,backgroundLabel,backgroundUrl);
        if(p.musicUnlocked) form.append(musicLabel,musicUrl,musicHint);
        form.append(save,feedback);
        form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{if(url.value.trim()&&!preview.querySelector('img'))throw new Error('Das Profilbild ist nicht erreichbar. Bitte einen direkten HTTPS-Bildlink verwenden.');await api('profile','POST',{bio:bio.value,title:profileTitle.value,avatarUrl:url.value,bannerUrl:bannerUrl.value,bannerEffect:bannerEffect.value,backgroundUrl:backgroundUrl.value,musicUrl:p.musicUnlocked?musicUrl.value:''});feedback.textContent='Profil gespeichert.';await openProfile();}catch(err){feedback.textContent=err.message;save.disabled=false;}});
        view.append(form);
      }
    }catch(error){view.replaceChildren(el('p','chat-feedback',error.message));}
  }
  document.getElementById('openProfile')?.addEventListener('click',()=>openProfile());
  document.getElementById('closeProfile')?.addEventListener('click',()=>modal.hidden=true);
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  document.addEventListener('click',e=>{const name=e.target.closest('.chat-message-meta strong'),row=name?.closest('.chat-message');if(row?.dataset.userId)openProfile(row.dataset.userId);});
  const list=document.getElementById('chatMessages');
  if(list){const observer=new MutationObserver(()=>list.querySelectorAll('.chat-message-meta strong').forEach(n=>{n.title='Profil ansehen';n.style.cursor='pointer';}));observer.observe(list,{childList:true,subtree:true});}
  document.getElementById('chatLogout')?.addEventListener('click',()=>modal.hidden=true);
})();