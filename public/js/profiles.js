(() => {
  const modal=document.getElementById('profileModal'), view=document.getElementById('profileView');
  if(!modal||!view)return;
  const token=()=>localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  async function api(path,method='GET',body=null){
    const response=await fetch('/api/community/'+path,{method,headers:{Authorization:'Bearer '+token(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');return data;
  }
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  async function openProfile(userId=''){
    view.replaceChildren(el('p','','Profil wird geladen …'));modal.hidden=false;
    try{
      const data=await api('profile'+(userId?'?id='+encodeURIComponent(userId):'')),p=data.profile;
      view.replaceChildren();
      const head=el('div','profile-head'),avatar=el('div','profile-avatar');
      if(p.avatarUrl){const img=document.createElement('img');img.src=p.avatarUrl;img.alt='Profilbild';img.referrerPolicy='no-referrer';img.onerror=()=>{avatar.textContent=p.name.slice(0,1).toUpperCase();};avatar.append(img);}
      else avatar.textContent=p.name.slice(0,1).toUpperCase();
      const title=el('div','profile-title');title.append(el('h2','',p.name),el('p','',String(p.role||'member').toUpperCase()));
      head.append(avatar,title);view.append(head,el('div','profile-bio',p.bio||'Noch keine Profilbeschreibung.'));
      const level=Number(p.level||1),xp=Number(p.xp||0),progress=xp%100;
      const rank=level>=10?'Legende':level>=5?'Stammgast':level>=2?'Aktiv':'Neuling';
      const stats=el('div','profile-progress');stats.append(el('strong','','Level '+level+' · '+rank),el('div','','XP: '+xp+' · Noch '+(100-progress)+' XP bis Level '+(level+1)));
      const track=el('div','profile-progress-track'),fill=el('span','');fill.style.width=progress+'%';track.append(fill);stats.append(track);
      const achievements=el('div','profile-stats');
      achievements.append(el('span','',level>=2?'🏅 Aktiv dabei':'🔒 Aktiv-Level'),el('span','',level>=5?'🌟 Stammgast':'🔒 Stammgast'),el('span','',level>=10?'👑 Legende':'🔒 Legende'));
      view.append(stats,achievements);
      if(data.own){
        const form=el('form','profile-edit'),bioLabel=el('label','','Über mich (max. 240 Zeichen)'),bio=document.createElement('textarea');
        bio.maxLength=240;bio.value=p.bio||'';
        const urlLabel=el('label','','Profilbild-URL (HTTPS, optional)'),url=document.createElement('input');
        url.type='url';url.maxLength=500;url.placeholder='https://…';url.value=p.avatarUrl||'';
        const save=el('button','chat-primary profile-save','Profil speichern');save.type='submit';
        const feedback=el('p','chat-feedback','');
        form.append(bioLabel,bio,urlLabel,url,save,feedback);
        form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{await api('profile','POST',{bio:bio.value,avatarUrl:url.value});feedback.textContent='Profil gespeichert.';await openProfile();}catch(err){feedback.textContent=err.message;save.disabled=false;}});
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