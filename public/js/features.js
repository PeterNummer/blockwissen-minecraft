(() => {
  const account=document.getElementById('chatAccount');
  if(!account)return;
  const token=()=>localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  async function api(path,method='GET',body=null){
    const r=await fetch('/api/community/'+path,{method,headers:{Authorization:'Bearer '+token(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Anfrage fehlgeschlagen.');return d;
  }
  const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
  const friendsButton=make('button','','👥 Freunde');friendsButton.type='button';
  const themeButton=make('button','','🎨 Chat-Design');themeButton.type='button';
  account.insertBefore(friendsButton,document.getElementById('chatLogout'));
  account.insertBefore(themeButton,document.getElementById('chatLogout'));
  const modal=make('div','community-modal');modal.hidden=true;
  const panel=make('section','community-dialog');const close=make('button','close community-close','✕');close.type='button';close.addEventListener('click',()=>modal.hidden=true);
  const title=make('h2','','Freunde');const body=make('div','tyqora-feature-body');panel.append(close,title,body);modal.append(panel);document.body.append(modal);
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  function feedback(msg){body.append(make('p','chat-feedback',msg));}
  async function showFriends(){
    title.textContent='Freunde';body.replaceChildren(make('p','','Lade Freunde …'));modal.hidden=false;
    try{
      const [data,members]=await Promise.all([api('friends'),api('members')]);body.replaceChildren();
      const requestHead=make('h3','','Anfragen');body.append(requestHead);
      if(!data.requests.length)body.append(make('p','','Keine offenen Anfragen.'));
      data.requests.forEach(req=>{const row=make('div','community-entry');row.append(make('strong','',req.name+' möchte dich hinzufügen '));const yes=make('button','','Annehmen'),no=make('button','','Ablehnen');yes.type=no.type='button';yes.addEventListener('click',async()=>{await api('friend-respond','POST',{requestId:req.id,accept:true});showFriends();});no.addEventListener('click',async()=>{await api('friend-respond','POST',{requestId:req.id,accept:false});showFriends();});row.append(yes,no);body.append(row);});
      body.append(make('h3','','Deine Freunde'));
      if(!data.friends.length)body.append(make('p','','Du hast noch keine Freunde hinzugefügt.'));
      data.friends.forEach(friend=>{const row=make('div','community-entry');row.append(make('span','', (friend.isOnline?'🟢 ':'⚫ ')+friend.name));const remove=make('button','','Entfernen');remove.type='button';remove.addEventListener('click',async()=>{await api('friend-remove','POST',{targetId:friend.id});showFriends();});row.append(remove);body.append(row);});
      body.append(make('h3','','Mitglied hinzufügen'));
      const form=make('form','community-form'),select=document.createElement('select');select.append(new Option('Mitglied auswählen …',''));
      members.users.filter(u=>!data.friends.some(f=>f.id===u.id)).forEach(u=>select.append(new Option(u.name,u.id)));
      const send=make('button','','Anfrage senden');send.type='submit';form.append(select,send);
      form.addEventListener('submit',async e=>{e.preventDefault();if(!select.value)return;try{await api('friend-request','POST',{targetId:select.value});showFriends();}catch(err){feedback(err.message);}});
      body.append(form);
    }catch(err){body.replaceChildren(make('p','chat-feedback',err.message));}
  }
  friendsButton.addEventListener('click',showFriends);
  const themes=[['default','Standard'],['midnight','Mitternacht'],['forest','Wald'],['violet','Violett'],['ocean','Ozean']];
  function applyTheme(theme){document.documentElement.dataset.tyqoraTheme=theme;}
  async function showThemes(){
    title.textContent='Chat-Design';body.replaceChildren();modal.hidden=false;
    body.append(make('p','','Wähle ein Design. Es wird für deinen Account gespeichert.'));
    const current=await api('theme');applyTheme(current.theme);
    themes.forEach(([id,label])=>{const b=make('button','theme-choice',label);b.type='button';b.addEventListener('click',async()=>{try{const d=await api('theme','POST',{theme:id});applyTheme(d.theme);body.querySelectorAll('.theme-choice').forEach(x=>x.classList.toggle('selected',x===b));}catch(err){feedback(err.message);}});b.classList.toggle('selected',current.theme===id);body.append(b);});
  }
  themeButton.addEventListener('click',()=>showThemes().catch(err=>{modal.hidden=false;body.replaceChildren(make('p','chat-feedback',err.message));}));
  api('theme').then(d=>applyTheme(d.theme)).catch(()=>{});
})();
