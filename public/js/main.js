const overlay=document.getElementById('chatOverlay');
function openChat(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeChat(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.getElementById('closeChat').addEventListener('click',closeChat);
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='k'){e.preventDefault();overlay.classList.contains('open')?closeChat():openChat()}if(e.key==='Escape'&&overlay.classList.contains('open'))closeChat()});
