const rouletteNumbers=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const redSet=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const canvas=document.getElementById('wheel');
const ctx=canvas.getContext('2d');
const betGrid=document.getElementById('betGrid');
const balanceEl=document.getElementById('balance');
const messageEl=document.getElementById('message');
const historyEl=document.getElementById('history');
const redRateEl=document.getElementById('redRate');
const blackRateEl=document.getElementById('blackRate');
const totalSpinsEl=document.getElementById('totalSpins');
const totalBetEl=document.getElementById('totalBet');
const resultBadge=document.getElementById('resultBadge');
const customBet=document.getElementById('customBet');
const hungerFill=document.getElementById('hungerFill');
const stressFill=document.getElementById('stressFill');
const hungerValue=document.getElementById('hungerValue');
const stressValue=document.getElementById('stressValue');
const debtRemainingEl=document.getElementById('debtRemaining');
const survivalDayEl=document.getElementById('survivalDay');
const menuButton=document.querySelector('.menu-button');
const gameWrap=document.querySelector('.game-wrap');
const menuOverlay=document.querySelector('.menu-overlay');
const sideMenu=document.querySelector('.side-menu');
const rulesBtn=document.getElementById('rulesBtn');
const menuCloseBtn=document.getElementById('menuCloseBtn');
const rulesPanel=document.querySelector('.rules-panel');
const rulesCloseBtn=document.getElementById('rulesCloseBtn');
const bgmVolumeInput=document.getElementById('bgmVolume');
const sfxVolumeInput=document.getElementById('sfxVolume');
const bgmVolumeValue=document.getElementById('bgmVolumeValue');
const sfxVolumeValue=document.getElementById('sfxVolumeValue');
const HOME_STORAGE_KEY='small_house_game_state';
const AUDIO_STORAGE_KEY='small_house_audio_settings';
const HOME_DEFAULT_STATE={coins:1000,debt:100000000,remainingDebt:100000000,hunger:100,stress:20,days:1};
const AUDIO_DEFAULT_STATE={bgmVolume:50,sfxVolume:50};
const bgmTracks=[
  'bgm/Moonlit Roulette Cat.mp3',
  'bgm/Moonlit Roulette Cat (1).mp3',
  'bgm/Moonlit Black Cat Roulette.mp3',
  'bgm/Moonlit Black Cat Roulette (1).mp3'
];
const bgmSound=new Audio();
const spinSound=new Audio('the-sound-of-a-roulette-wheel-spinning.mp3');
bgmSound.preload='auto';
bgmSound.loop=false;
spinSound.preload='auto';
spinSound.loop=true;
let homeState=loadHomeState();
let audioSettings=loadAudioSettings();
let audioInteracted=false;
let bgmQueue=[],currentBgmTrack='';
let balance=safeNumber(homeState.coins,HOME_DEFAULT_STATE.coins), chip=100, rotation=0, spinning=false, bets={}, lastBets=[], history=[], total=0, redHits=0, blackHits=0;
function money(n){return n.toLocaleString('ja-JP')}
function compactMoney(n){return n>=10000?Math.round(n/1000)+'K':money(n)}
function colorOf(n){return n===0?'green':redSet.has(n)?'red':'black'}
function safeNumber(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback}
function percent(value,fallback){return Math.max(0,Math.min(100,safeNumber(value,fallback)))}
function loadAudioSettings(){
  try{
    const saved=localStorage.getItem(AUDIO_STORAGE_KEY);
    if(!saved)return {...AUDIO_DEFAULT_STATE};
    const parsed=JSON.parse(saved);
    return {
      bgmVolume:percent(parsed.bgmVolume,AUDIO_DEFAULT_STATE.bgmVolume),
      sfxVolume:percent(parsed.sfxVolume,AUDIO_DEFAULT_STATE.sfxVolume)
    };
  }catch(e){
    return {...AUDIO_DEFAULT_STATE};
  }
}
function saveAudioSettings(){
  try{localStorage.setItem(AUDIO_STORAGE_KEY,JSON.stringify(audioSettings));}catch(e){}
}
function updateAudioRange(input,value){
  if(!input)return;
  input.value=Math.round(value);
  input.style.setProperty('--volume-fill',Math.round(value)+'%');
}
function updateAudioControls(){
  const bgm=percent(audioSettings.bgmVolume,AUDIO_DEFAULT_STATE.bgmVolume);
  const sfx=percent(audioSettings.sfxVolume,AUDIO_DEFAULT_STATE.sfxVolume);
  audioSettings={bgmVolume:bgm,sfxVolume:sfx};
  updateAudioRange(bgmVolumeInput,bgm);
  updateAudioRange(sfxVolumeInput,sfx);
  if(bgmVolumeValue)bgmVolumeValue.textContent=Math.round(bgm)+'%';
  if(sfxVolumeValue)sfxVolumeValue.textContent=Math.round(sfx)+'%';
  bgmSound.volume=bgm/100;
  spinSound.volume=sfx/100;
  if(bgm<=0)bgmSound.pause();
  else if(audioInteracted)playBgm();
}
function setAudioSetting(key,value){
  audioSettings={...audioSettings,[key]:percent(value,AUDIO_DEFAULT_STATE[key])};
  updateAudioControls();
  saveAudioSettings();
}
function shuffleTracks(tracks){
  const shuffled=[...tracks];
  for(let i=shuffled.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
  }
  return shuffled;
}
function refillBgmQueue(){
  bgmQueue=shuffleTracks(bgmTracks);
  if(bgmQueue.length>1&&bgmQueue[0]===currentBgmTrack){
    const swapIndex=bgmQueue.findIndex(track=>track!==currentBgmTrack);
    [bgmQueue[0],bgmQueue[swapIndex]]=[bgmQueue[swapIndex],bgmQueue[0]];
  }
}
function loadNextBgmTrack(){
  if(bgmQueue.length===0)refillBgmQueue();
  currentBgmTrack=bgmQueue.shift()||bgmTracks[0];
  bgmSound.src=encodeURI(currentBgmTrack);
  bgmSound.currentTime=0;
}
function playBgm(){
  if(audioSettings.bgmVolume<=0)return;
  try{
    if(!bgmSound.src)loadNextBgmTrack();
    const playPromise=bgmSound.play();
    if(playPromise)playPromise.catch(()=>{});
  }catch(e){}
}
function playNextBgm(){
  loadNextBgmTrack();
  if(audioInteracted)playBgm();
}
function unlockAudio(){
  audioInteracted=true;
  playBgm();
}
function playSpinSound(){
  updateAudioControls();
  if(audioSettings.sfxVolume<=0)return;
  try{
    spinSound.pause();
    spinSound.currentTime=0;
    const playPromise=spinSound.play();
    if(playPromise)playPromise.catch(()=>{});
  }catch(e){}
}
function stopSpinSound(){
  try{
    spinSound.pause();
    spinSound.currentTime=0;
  }catch(e){}
}
function loadHomeState(){
  try{
    const saved=localStorage.getItem(HOME_STORAGE_KEY);
    if(!saved)return {...HOME_DEFAULT_STATE};
    return {...HOME_DEFAULT_STATE,...JSON.parse(saved)};
  }catch(e){
    return {...HOME_DEFAULT_STATE};
  }
}
function saveHomeCoins(){
  homeState={...HOME_DEFAULT_STATE,...homeState,coins:balance};
  try{localStorage.setItem(HOME_STORAGE_KEY,JSON.stringify(homeState));}catch(e){}
}
function updateHomeHud(){
  const hunger=percent(homeState.hunger,HOME_DEFAULT_STATE.hunger);
  const stress=percent(homeState.stress,HOME_DEFAULT_STATE.stress);
  if(hungerFill)hungerFill.style.width=hunger+'%';
  if(stressFill)stressFill.style.width=stress+'%';
  if(hungerValue)hungerValue.textContent=Math.round(hunger)+'%';
  if(stressValue)stressValue.textContent=Math.round(stress)+'%';
  if(debtRemainingEl)debtRemainingEl.textContent=money(safeNumber(homeState.remainingDebt,HOME_DEFAULT_STATE.remainingDebt));
  if(survivalDayEl)survivalDayEl.textContent='DAY '+Math.max(1,Math.round(safeNumber(homeState.days,HOME_DEFAULT_STATE.days)));
}
function drawWheel(){
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=w*.46,inner=w*.18,step=Math.PI*2/rouletteNumbers.length;
  ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);
  rouletteNumbers.forEach((num,i)=>{
    const center=-Math.PI/2+i*step,start=center-step/2,end=center+step/2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,start,end);ctx.closePath();
    ctx.fillStyle=colorOf(num)==='red'?'#9e3658':colorOf(num)==='black'?'#171522':'#476f67';
    ctx.fill();ctx.strokeStyle='#d8b8d5';ctx.lineWidth=2;ctx.stroke();
    ctx.save();
    const textRadius=r*.79;
    ctx.translate(Math.cos(center)*textRadius,Math.sin(center)*textRadius);
    let textAngle=center+Math.PI/2;
    const normalized=((textAngle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    if(normalized>Math.PI/2&&normalized<Math.PI*1.5)textAngle+=Math.PI;
    ctx.rotate(textAngle);
    ctx.font='900 24px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
    ctx.lineWidth=4;ctx.strokeStyle='#120915';ctx.strokeText(num,0,0);
    ctx.fillStyle='#fffaf4';
    ctx.fillText(num,0,0);
    ctx.restore();
  });
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.strokeStyle='#caa2c9';ctx.lineWidth=18;ctx.stroke();ctx.beginPath();ctx.arc(0,0,inner,0,Math.PI*2);ctx.fillStyle='#44315c';ctx.fill();ctx.strokeStyle='#d6b6d7';ctx.lineWidth=6;ctx.stroke();ctx.restore();
}
function makeBtn(label,type,value,cls='',style='') {const b=document.createElement('button');b.className='bet '+cls;b.textContent=label;b.dataset.label=label;b.dataset.type=type;b.dataset.value=value;b.style.cssText=style;b.onclick=()=>placeBet(type,value,b);return b;}
function buildGrid(){
  betGrid.appendChild(makeBtn('0','number','0','green zero'));
  const rows=[[3,6,9,12,15,18,21,24,27,30,33,36],[2,5,8,11,14,17,20,23,26,29,32,35],[1,4,7,10,13,16,19,22,25,28,31,34]];
  rows.forEach((row,ri)=>row.forEach((n,ci)=>betGrid.appendChild(makeBtn(n,'number',n,colorOf(n),`grid-row:${ri+1};grid-column:${ci+2}`))));
  for(let r=1;r<=3;r++)betGrid.appendChild(makeBtn('2 to 1','column',4-r,'colbet',`grid-row:${r};grid-column:14`));
  [['1st 12',1],['2nd 12',2],['3rd 12',3]].forEach(([l,v],i)=>betGrid.appendChild(makeBtn(l,'dozen',v,'dozen',`grid-row:4;grid-column:${2+i*4}/span 4`)));
  [['1-18','low','low'],['EVEN','even','even'],['RED','color','red'],['BLACK','color','black'],['ODD','odd','odd'],['19-36','high','high']].forEach(([l,t,v],i)=>betGrid.appendChild(makeBtn(l,t,v,'outside '+(v==='red'?'red':v==='black'?'black':''),`grid-row:5;grid-column:${2+i*2}/span 2`)));
}
function betAmount(){return Math.max(1,Number(customBet.value)||chip)}
function placeBet(type,value,el){if(spinning)return;const amt=betAmount();if(balance<amt){msg('コインが足りません','lose');return}const label=el.dataset.label||el.textContent.trim();balance-=amt;const key=type+':'+value;bets[key]=(bets[key]||0)+amt;lastBets.push({key,amt});updateBalance();renderBetAmounts();updateTotalBet();msg(`${label} に ${money(amt)} ベットしました`)}
function renderBetAmounts(){document.querySelectorAll('.bet').forEach(b=>{b.classList.remove('active');b.querySelector('.amount')?.remove();const key=b.dataset.type+':'+b.dataset.value;if(bets[key]){b.classList.add('active');const s=document.createElement('span');s.className='amount';s.textContent=compactMoney(bets[key]);b.appendChild(s)}})}
function updateBalance(){balanceEl.textContent=money(balance);saveHomeCoins()}
function totalBet(){return Object.values(bets).reduce((a,b)=>a+b,0)}
function updateTotalBet(){totalBetEl.textContent=money(totalBet())}
function setLocked(on){document.querySelectorAll('button,input').forEach(el=>{el.disabled=on});}
function animateBalance(from,to){const t0=performance.now(),duration=650;function step(t){const p=Math.min(1,(t-t0)/duration);const v=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));balanceEl.textContent=money(v);if(p<1)requestAnimationFrame(step);else updateBalance()}requestAnimationFrame(step)}
function showResult(text,cls){resultBadge.textContent=text;resultBadge.className='result-badge '+cls;setTimeout(()=>resultBadge.classList.add('hidden'),2200)}
function msg(t,cls='',html=false){if(html)messageEl.innerHTML=t;else messageEl.textContent=t;messageEl.parentElement.className='message panel '+cls}
function payout(num){let win=0;Object.entries(bets).forEach(([key,amt])=>{const [type,val]=key.split(':');const n=Number(num);if(type==='number'&&Number(val)===n)win+=amt*36;if(type==='color'&&colorOf(n)===val)win+=amt*2;if(type==='even'&&n!==0&&n%2===0)win+=amt*2;if(type==='odd'&&n%2===1)win+=amt*2;if(type==='low'&&n>=1&&n<=18)win+=amt*2;if(type==='high'&&n>=19&&n<=36)win+=amt*2;if(type==='dozen'&&Math.ceil(n/12)===Number(val))win+=amt*3;if(type==='column'&&n!==0&&((n-1)%3)+1===Number(val))win+=amt*3;});return win}
function spin(){if(spinning)return;if(Object.keys(bets).length===0){msg('先にベットしてください','lose');return}spinning=true;setLocked(true);resultBadge.classList.add('hidden');msg('ルーレット回転中...') ;playSpinSound();const result=rouletteNumbers[Math.floor(Math.random()*rouletteNumbers.length)];const idx=rouletteNumbers.indexOf(result);const step=Math.PI*2/rouletteNumbers.length;const target=-(idx*step);const start=rotation;const end=target+Math.PI*2*(6+Math.floor(Math.random()*3));const duration=3600;const t0=performance.now();function anim(t){const p=Math.min(1,(t-t0)/duration);const ease=1-Math.pow(1-p,4);rotation=start+(end-start)*ease;drawWheel();if(p<1)requestAnimationFrame(anim);else finish(result)}requestAnimationFrame(anim)}
function finish(result){stopSpinSound();rotation=((rotation%(Math.PI*2))+Math.PI*2)%(Math.PI*2);const win=payout(result);const before=balance;balance+=win;saveHomeCoins();total++;if(colorOf(result)==='red')redHits++;if(colorOf(result)==='black')blackHits++;history.unshift(result);history=history.slice(0,5);bets={};lastBets=[];spinning=false;setLocked(false);animateBalance(before,balance);renderBetAmounts();updateTotalBet();renderHistory();renderStats();showResult(win?`当選 ${result} / +${money(win)} COINS`:`当選 ${result} / 次こそ`,win?'win':'lose');msg(win?`当選番号 <span class="message-number">${result}</span> / ${money(win)} コイン獲得！`:`当選番号 <span class="message-number">${result}</span> / 次こそ当てましょう`,win?'win':'lose',true)}
function renderHistory(){historyEl.innerHTML='';history.forEach(n=>{const s=document.createElement('span');s.className=colorOf(n);s.textContent=n;historyEl.appendChild(s)})}
function renderStats(){totalSpinsEl.textContent=total;redRateEl.textContent=total?Math.round(redHits/total*100)+'%':'0%';blackRateEl.textContent=total?Math.round(blackHits/total*100)+'%':'0%'}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');chip=Number(b.dataset.chip)});
document.getElementById('clearBtn').onclick=()=>{const refund=Object.values(bets).reduce((a,b)=>a+b,0);balance+=refund;bets={};lastBets=[];updateBalance();renderBetAmounts();updateTotalBet();msg('ベットをクリアしました')};
document.getElementById('spinBtn').onclick=spin;
bgmVolumeInput?.addEventListener('input',e=>setAudioSetting('bgmVolume',e.target.value));
sfxVolumeInput?.addEventListener('input',e=>setAudioSetting('sfxVolume',e.target.value));
bgmSound.addEventListener('ended',playNextBgm);
document.addEventListener('pointerdown',unlockAudio);
document.addEventListener('keydown',unlockAudio);
function openMenu(){gameWrap?.classList.add('menu-open');gameWrap?.classList.remove('rules-open');menuButton?.setAttribute('aria-expanded','true');sideMenu?.setAttribute('aria-hidden','false');rulesPanel?.setAttribute('aria-hidden','true');}
function closeMenu(){gameWrap?.classList.remove('menu-open');menuButton?.setAttribute('aria-expanded','false');sideMenu?.setAttribute('aria-hidden','true');}
function closeRules(){gameWrap?.classList.remove('rules-open');rulesPanel?.setAttribute('aria-hidden','true');}
function openRules(){closeMenu();gameWrap?.classList.add('rules-open');rulesPanel?.setAttribute('aria-hidden','false');}
function closeAllMenus(){closeMenu();closeRules();}
function toggleMenu(){gameWrap?.classList.contains('menu-open')?closeMenu():openMenu()}
menuButton?.addEventListener('click',toggleMenu);
menuOverlay?.addEventListener('click',closeAllMenus);
menuCloseBtn?.addEventListener('click',closeAllMenus);
rulesCloseBtn?.addEventListener('click',closeRules);
rulesBtn?.addEventListener('click',openRules);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllMenus();});
loadNextBgmTrack();buildGrid();drawWheel();updateHomeHud();updateAudioControls();updateBalance();updateTotalBet();renderStats();
