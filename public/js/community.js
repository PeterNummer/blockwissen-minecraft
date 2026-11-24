(() => {
  const hub=document.getElementById('communityHub'), hubBody=document.getElementById('communityHubBody');
  if(!hub||!hubBody)return;
  const token=()=>localStorage.getItem('tyqora_session')||sessionStorage.getItem('tyqora_session')||'';
  let activeTab='notifications', selectedDm='', members=[], currentUserId='', dmPollTimer=null, dmSidebarExpanded=true;
  fetch('/api/me',{headers:{Authorization:'Bearer '+token()}}).then(r=>r.json()).then(d=>{currentUserId=d.user?.id||'';}).catch(()=>{});
  async function api(path,method='GET',body=null){
    const response=await fetch('/api/community/'+path,{method,headers:{Authorization:'Bearer '+token(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');
    return data;
  }
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function openHub(tab){activeTab=tab;hub.hidden=false;document.querySelectorAll('[data-hub-tab]').forEach(b=>b.classList.toggle('active',b.dataset.hubTab===tab));renderHub().catch(showError);}
  function showError(error){hubBody.replaceChildren(el('p','chat-feedback',error.message));}
  async function renderSidebarDMs(){
    const section=document.getElementById('dmSidebarSection');
    const list=document.getElementById('dmSidebarList');
    if(!section||!list)return;
    if(!token()){section.hidden=true;list.replaceChildren();return;}
    try{
      const [memberData,threadList]=await Promise.all([api('members'),api('dm')]);
      const onlineUsers=memberData.users||[];
      const conversations=threadList.users||[];
      section.hidden=false;
      list.replaceChildren();
      if(!conversations.length){
        list.append(el('div','dm-sidebar-empty','Noch keine Chats'));
        return;
      }
      conversations.forEach(user=>{
        const member=onlineUsers.find(item=>item.id===user.id);
        const button=el('button','dm-sidebar-user'+(selectedDm===user.id?' active':''),'');
        button.type='button';
        button.append(el('span','dm-sidebar-status'+(member?.isOnline?' online':''),member?.isOnline?'●':'○'),el('span','dm-sidebar-name',member?.name||user.name||'Mitglied'));
        button.title='Privaten Chat mit '+(member?.name||user.name||'Mitglied')+' öffnen';
        button.addEventListener('click',()=>{selectedDm=user.id;openHub('dms');});
        list.append(button);
      });
    }catch{
      section.hidden=!token();
    }
  }
  async function refreshDmThread(){
    if(hub.hidden||activeTab!=='dms'||!selectedDm)return;
    try{
      const data=await api('dm?with='+encodeURIComponent(selectedDm)),list=document.getElementById('dmThread');
      if(!list)return;
      const atBottom=list.scrollHeight-list.scrollTop-list.clientHeight<45;
      list.replaceChildren();
      data.messages.forEach(m=>{const bubble=el('div','dm-bubble'+(m.senderId===currentUserId?' mine':''),m.text);bubble.append(el('small','',new Date(m.createdAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})));list.append(bubble);});
      if(atBottom)list.scrollTop=list.scrollHeight;
    }catch{}
  }
  async function renderHub(){
    hubBody.replaceChildren(el('p','','Lade …'));
    if(activeTab==='notifications'){
      const data=await api('notifications');
      hubBody.replaceChildren(el('h3','','Benachrichtigungen'));
      if(!data.notifications.length)hubBody.append(el('p','','Du hast noch keine Benachrichtigungen.'));
      const list=el('div','community-list');
      data.notifications.forEach(item=>{
        const entry=el('article','community-entry'+(!item.readAt?' unread':''));
        entry.append(el('strong','',item.kind==='mention'?'Erwähnung':item.kind==='dm'?'Private Nachricht':item.kind==='level'?'Neues Level':'Hinweis'),el('div','',item.text),el('small','',new Date(item.createdAt).toLocaleString('de-DE')));
        list.append(entry);
      });
      hubBody.append(list);
      if(data.unread){await api('notifications/read','POST',{});document.getElementById('notificationCount').textContent='0';}
    }else{
      if(!currentUserId){try{const me=await fetch('/api/me',{headers:{Authorization:'Bearer '+token()}}).then(r=>r.json());currentUserId=me.user?.id||'';}catch{}}
      const [memberData,threadList]=await Promise.all([api('members'),api('dm')]);
      members=memberData.users||[];
      hubBody.replaceChildren(el('h3','','Private Nachrichten'));
      const picker=el('form','community-form');
      const select=el('select');select.setAttribute('aria-label','Mitglied auswählen');
      select.append(new Option('Mitglied auswählen …',''));
      members.forEach(user=>select.append(new Option((user.isOnline?'🟢 ':'⚫ ')+user.name,user.id)));
      if(selectedDm)select.value=selectedDm;
      const open=el('button','','Öffnen');open.type='submit';picker.append(select,open);
      picker.addEventListener('submit',e=>{e.preventDefault();selectedDm=select.value;renderHub().catch(showError);});
      hubBody.append(picker);
      if(threadList.users?.length){
        const quick=el('div','community-list');
        threadList.users.forEach(user=>{const member=members.find(m=>m.id===user.id);const b=el('button','community-entry',(member?.isOnline?'🟢 ':'⚫ ')+user.name);b.type='button';b.addEventListener('click',()=>{selectedDm=user.id;renderHub().catch(showError);});quick.append(b);});
        hubBody.append(quick);
      }
      if(selectedDm){
        const user=members.find(u=>u.id===selectedDm);
        const thread=await api('dm?with='+encodeURIComponent(selectedDm));
        hubBody.append(el('h4','',user?.name||thread.other.name));
        const messages=el('div','dm-thread');messages.id='dmThread';
        thread.messages.forEach(m=>{const bubble=el('div','dm-bubble'+(m.senderId===currentUserId?' mine':''),m.text);bubble.append(el('small','',new Date(m.createdAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})));messages.append(bubble);});
        hubBody.append(messages);
        const form=el('form','community-form');const input=el('input');input.placeholder='Private Nachricht …';input.maxLength=1000;input.required=true;
        const send=el('button','','Senden');send.type='submit';form.append(input,send);
        form.addEventListener('submit',async e=>{e.preventDefault();send.disabled=true;try{await api('dm','POST',{recipientId:selectedDm,text:input.value});input.value='';await renderHub();renderSidebarDMs();}catch(err){showError(err);}finally{send.disabled=false;}});
        hubBody.append(form);
      }
    }
    if(dmPollTimer)window.clearInterval(dmPollTimer);
    if(activeTab==='dms'&&selectedDm)dmPollTimer=window.setInterval(refreshDmThread,4000);
  }
  document.getElementById('openNotifications')?.addEventListener('click',()=>openHub('notifications'));
  document.getElementById('openDMs')?.addEventListener('click',()=>openHub('dms'));
  document.getElementById('dmSidebarNew')?.addEventListener('click',()=>{selectedDm='';openHub('dms');});
  const dmSidebarToggle=document.getElementById('dmSidebarToggle');
  const dmSidebarContent=document.getElementById('dmSidebarContent');
  dmSidebarToggle?.addEventListener('click',()=>{
    dmSidebarExpanded=!dmSidebarExpanded;
    if(dmSidebarContent)dmSidebarContent.hidden=!dmSidebarExpanded;
    dmSidebarToggle.setAttribute('aria-expanded',String(dmSidebarExpanded));
    const chevron=dmSidebarToggle.querySelector('.dm-sidebar-chevron');
    if(chevron)chevron.textContent=dmSidebarExpanded?'▾':'▸';
  });
  document.getElementById('closeCommunity')?.addEventListener('click',()=>{hub.hidden=true;if(dmPollTimer)window.clearInterval(dmPollTimer);});
  hub.addEventListener('click',e=>{if(e.target===hub){hub.hidden=true;if(dmPollTimer)window.clearInterval(dmPollTimer);}});
  document.querySelectorAll('[data-hub-tab]').forEach(b=>b.addEventListener('click',()=>openHub(b.dataset.hubTab)));
  async function refreshNotificationCount(){
    if(!token())return;
    try{const data=await api('notifications');document.getElementById('notificationCount').textContent=String(data.unread||0);}catch{}
  }
  refreshNotificationCount();window.setInterval(refreshNotificationCount,30000);
  renderSidebarDMs();window.setInterval(renderSidebarDMs,20000);
  window.addEventListener('tyqora:authenticated',renderSidebarDMs);
  function paintReactions(container,reactions){
    container.replaceChildren();
    (reactions||[]).forEach(item=>{const b=el('button','',item.emoji+' '+item.count);b.type='button';b.title='Reaktion hinzufügen oder entfernen';b.addEventListener('click',async()=>{try{const r=await api('react','POST',{messageId:container.dataset.messageId,emoji:item.emoji});paintReactions(container,r.reactions);}catch{}});container.append(b);});
    ['❤️','😂','⭐','🔥','👍','😮'].forEach(emoji=>{if((reactions||[]).some(r=>r.emoji===emoji))return;const b=el('button','',emoji);b.type='button';b.addEventListener('click',async()=>{try{const r=await api('react','POST',{messageId:container.dataset.messageId,emoji});paintReactions(container,r.reactions);}catch{}});container.append(b);});
  }
  async function attachReaction(row){
    if(row.querySelector('.message-reactions')||!row.dataset.messageId)return;
    const bar=el('div','message-reactions');bar.dataset.messageId=row.dataset.messageId;row.append(bar);
    try{const data=await api('reactions?messageId='+encodeURIComponent(row.dataset.messageId));paintReactions(bar,data.reactions);}catch{}
  }
  const messageList=document.getElementById('chatMessages');
  if(messageList){
    const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      if(node.matches?.('.chat-message'))attachReaction(node);
      node.querySelectorAll?.('.chat-message').forEach(attachReaction);
    })));
    observer.observe(messageList,{childList:true,subtree:true});
    messageList.querySelectorAll('.chat-message').forEach(attachReaction);
  }
  document.getElementById('chatLogout')?.addEventListener('click',()=>{hub.hidden=true;});
})();