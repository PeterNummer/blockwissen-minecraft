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
      if(p.bannerUrl){const banner=el('div','profile-banner');banner.style.backgroundImage='url("'+avatarSource(p.bannerUrl)+'")';banner.setAttribute('aria-label','Profilbanner');view.append(banner);}
      if(p.backgroundUrl){view.style.backgroundImage='linear-gradient(rgba(7,14,24,.82),rgba(7,14,24,.94)),url("'+avatarSource(p.backgroundUrl)+'")';view.style.backgroundSize='cover';view.style.backgroundPosition='center';}else view.style.backgroundImage='';
      const head=el('div','profile-head'),avatar=el('div','profile-avatar');
      if(p.avatarUrl){const img=document.createElement('img');img.referrerPolicy='no-referrer';img.src=avatarSource(p.avatarUrl);img.alt='Profilbild';img.loading='eager';img.decoding='async';img.onerror=()=>{img.remove();avatar.textContent=p.name.slice(0,1).toUpperCase();avatar.title='Das Profilbild konnte nicht geladen werden. Verwende einen direkten HTTPS-Bildlink.';};avatar.append(img);}
      else avatar.textContent=p.name.slice(0,1).toUpperCase();
      const title=el('div','profile-title');title.append(el('h2','',p.name),el('p','profile-role',String(p.role||'member').toUpperCase()));
      head.append(avatar,title);view.append(head,el('div','profile-bio',p.bio||'Noch keine Profilbeschreibung.'));
      const level=Number(p.level||1),xp=Number(p.xp||0),progress=xp%100;
      const isLegend=p.role==='owner'||level>=10;const rank=isLegend?'Legende':level>=5?'Stammgast':level>=2?'Aktiv':'Neuling';
      title.append(el('p','profile-status','Status: '+rank));
      const stats=el('div','profile-progress');stats.append(el('strong','','Level '+level),el('div','','XP: '+xp+' · Noch '+(100-progress)+' XP bis Level '+(level+1)));
      const track=el('div','profile-progress-track'),fill=el('span','');fill.style.width=progress+'%';track.append(fill);stats.append(track);
      const achievements=el('div','profile-stats');
      achievements.append(el('span','',level>=2?'🏅 Aktiv dabei':'🔒 Aktiv-Level'),el('span','',level>=5?'🌟 Stammgast':'🔒 Stammgast'),el('span','',isLegend?'👑 Legende':'🔒 Legende'));
      view.append(stats,achievements);
      if(Array.isArray(p.achievements)){
        const achievementBox=el('div','profile-achievements');
        achievementBox.append(el('h3','','Erfolge'));
        p.achievements.forEach(item=>{const badge=el('span','achievement-chip'+(item.unlocked?' unlocked':' locked'),(item.unlocked?item.icon:'🔒')+' '+item.name);achievementBox.append(badge);});
        view.append(achievementBox);
      }
      if(data.own){
        const form=el('form','profile-edit'),bioLabel=el('label','','Über mich (max. 240 Zeichen)'),bio=document.createElement('textarea');
        bio.maxLength=240;bio.value=p.bio||'';
        const urlLabel=el('label','','Profilbild-URL (HTTPS, optional)'),url=document.createElement('input');
        url.type='url';url.maxLength=500;url.placeholder='https://…';url.value=p.avatarUrl||'';url.autocomplete='url';
        const bannerLabel=el('label','','Profilbanner-URL (HTTPS, optional)'),bannerUrl=document.createElement('input');
        bannerUrl.type='url';bannerUrl.maxLength=500;bannerUrl.placeholder='https://…';bannerUrl.value=p.bannerUrl||'';
        const backgroundLabel=el('label','','Profilhintergrund-URL (HTTPS, optional)'),backgroundUrl=document.createElement('input');
        backgroundUrl.type='url';backgroundUrl.maxLength=500;backgroundUrl.placeholder='https://…';backgroundUrl.value=p.backgroundUrl||'';
        const preview=el('div','profile-avatar profile-avatar-preview');const previewFallback=el('span','','Vorschau');preview.append(previewFallback);const previewStatus=el('small','profile-avatar-hint','Direkter HTTPS-Bildlink (JPG, PNG oder WebP).');url.addEventListener('input',()=>{preview.replaceChildren();const value=url.value.trim();if(!value){preview.append(el('span','','Vorschau'));previewStatus.textContent='Direkter HTTPS-Bildlink (JPG, PNG oder WebP).';return;}let parsed;try{parsed=new URL(value);}catch{preview.append(el('span','','?'));previewStatus.textContent='Bitte eine gültige Bild-URL eingeben.';return;}if(parsed.protocol!=='https:'){preview.append(el('span','','!'));previewStatus.textContent='Nur HTTPS-Bildlinks werden unterstützt.';return;}const image=document.createElement('img');image.referrerPolicy='no-referrer';image.alt='Profilbild-Vorschau';image.onload=()=>{previewStatus.textContent='Bildvorschau erfolgreich geladen.';};image.onerror=()=>{preview.replaceChildren(el('span','','!'));previewStatus.textContent='Bild nicht erreichbar. Verwende einen direkten Link zur Bilddatei, nicht zur Webseite.';};image.src=avatarSource(value);preview.append(image);});if(url.value)url.dispatchEvent(new Event('input'));const save=el('button','chat-primary profile-save','Profil speichern');save.type='submit';
        const feedback=el('p','chat-feedback','');
        form.append(bioLabel,bio,urlLabel,url,preview,previewStatus,bannerLabel,bannerUrl,backgroundLabel,backgroundUrl,save,feedback);
        form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{if(url.value.trim()&&!preview.querySelector('img'))throw new Error('Das Profilbild ist nicht erreichbar. Bitte einen direkten HTTPS-Bildlink verwenden.');await api('profile','POST',{bio:bio.value,avatarUrl:url.value,bannerUrl:bannerUrl.value,backgroundUrl:backgroundUrl.value});feedback.textContent='Profil gespeichert.';await openProfile();}catch(err){feedback.textContent=err.message;save.disabled=false;}});
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