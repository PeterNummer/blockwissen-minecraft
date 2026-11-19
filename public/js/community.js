(() => {
  const modal = document.getElementById('profileModal');
  const view = document.getElementById('profileView');
  if (!modal || !view) return;
  const token = () => localStorage.getItem('tyqora_session') || sessionStorage.getItem('tyqora_session') || '';
  async function api(path, method='GET', body=null) {
    const response = await fetch('/api/community/' + path, {
      method, headers: { Authorization: 'Bearer ' + token(), ...(body ? {'Content-Type':'application/json'} : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen.');
    return data;
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  async function openProfile(userId='') {
    view.replaceChildren(el('p','', 'Profil wird geladen …'));
    modal.hidden = false;
    try {
      const data = await api('profile' + (userId ? '?id=' + encodeURIComponent(userId) : ''));
      const p = data.profile;
      view.replaceChildren();
      const head = el('div','profile-head');
      const avatar = el('div','profile-avatar');
      if (p.avatarUrl) {
        const img = document.createElement('img'); img.src = p.avatarUrl; img.alt = 'Profilbild'; img.referrerPolicy = 'no-referrer';
        img.onerror = () => { avatar.textContent = p.name.slice(0,1).toUpperCase(); };
        avatar.append(img);
      } else avatar.textContent = p.name.slice(0,1).toUpperCase();
      const title = el('div','profile-title');
      title.append(el('h2','',p.name),el('p','',String(p.role || 'member').toUpperCase()));
      head.append(avatar,title);
      view.append(head,el('div','profile-bio',p.bio || 'Noch keine Profilbeschreibung.'));
      if (data.own) {
        const form = el('form','profile-edit');
        const bioLabel=el('label','', 'Über mich (max. 240 Zeichen)');
        const bio=document.createElement('textarea'); bio.maxLength=240; bio.value=p.bio || '';
        const urlLabel=el('label','', 'Profilbild-URL (HTTPS, optional)');
        const url=document.createElement('input'); url.type='url'; url.maxLength=500; url.placeholder='https://…'; url.value=p.avatarUrl || '';
        const save=el('button','chat-primary profile-save','Profil speichern'); save.type='submit';
        const feedback=el('p','chat-feedback','');
        form.append(bioLabel,bio,urlLabel,url,save,feedback);
        form.addEventListener('submit',async e=>{
          e.preventDefault(); save.disabled=true;
          try { await api('profile','POST',{bio:bio.value,avatarUrl:url.value}); feedback.textContent='Profil gespeichert.'; await openProfile(); }
          catch(err){ feedback.textContent=err.message; save.disabled=false; }
        });
        view.append(form);
      }
    } catch(error) { view.replaceChildren(el('p','chat-feedback',error.message)); }
  }
  document.getElementById('openProfile')?.addEventListener('click',()=>openProfile());
  document.getElementById('closeProfile')?.addEventListener('click',()=>modal.hidden=true);
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  document.addEventListener('click',e=>{
    const name=e.target.closest('.chat-message-meta strong');
    const row=name?.closest('.chat-message');
    if(row?.dataset.userId) openProfile(row.dataset.userId);
  });
  const observer=new MutationObserver(()=>document.querySelectorAll('.chat-message-meta strong').forEach(n=>{n.title='Profil ansehen';n.style.cursor='pointer';}));
  const messages=document.getElementById('chatMessages');
  if(messages) observer.observe(messages,{childList:true,subtree:true});
  document.getElementById('chatLogout')?.addEventListener('click',()=>{modal.hidden=true;});
})();