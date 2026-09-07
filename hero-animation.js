// Card Captain illustrated hero transformation — decorative only, no league data touched.
(function(){
  function mount(){
    const hero=document.querySelector('.hero.comic-card');
    if(!hero||hero.querySelector('.captain-transform'))return;
    const b64=window.__CC_HERO_ART||'';
    if(!b64){console.warn('Card Captain hero art did not load.');return;}
    const image=`url("data:image/jpeg;base64,${b64}")`;
    const art=document.createElement('div');
    art.className='captain-transform illustrated-transform';
    art.setAttribute('aria-hidden','true');
    art.innerHTML=`
      <div class="illustrated-stage illustrated-normal"></div>
      <div class="illustrated-stage illustrated-mutation"></div>
      <div class="illustrated-stage illustrated-captain"></div>
      <div class="illustrated-energy"><i></i><i></i><i></i></div>
      <div class="illustrated-flash"></div>
      <div class="illustrated-sparks"><b>✦</b><b>✦</b><b>✦</b><b>✦</b></div>
      <div class="illustrated-caption"><span>PLAYER</span><strong>⚡</strong><span>CAPTAIN</span></div>`;
    art.querySelectorAll('.illustrated-stage').forEach(el=>el.style.backgroundImage=image);
    hero.appendChild(art);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
