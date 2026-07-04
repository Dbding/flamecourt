(() => {
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=1024,H=576,G=494;
const keys={}; let frame=0,running=false,paused=true,level=0,ended=false;
const $=id=>document.getElementById(id);
const ui={title:$("missionTitle"),text:$("missionText"),objs:$("objectives"),reason:$("reasonTxt"),cred:$("credTxt"),witch:$("witchTxt"),boss:$("bossTxt"),rbar:$("reasonBar"),cbar:$("credBar"),wbar:$("witchBar"),bbar:$("bossBar"),log:$("log"),modal:$("modal")};
const levels=[
{name:"第一關：時間軸資料站",text:"建立事件先後順序，不被情緒留言帶走。",objs:["前進到右側發光資料盒。","用 Z 清除紅色留言砲火。","避開黃色獵巫陷阱。"],theme:"#63d7ff",type:0,label:"時間軸核心",words:["斷章取義！","他也是人！","酸民閉嘴！","你嫉妒吧？"]},
{name:"第二關：創作者尊重橋",text:"保護創作者 NPC，不要把真人勞動變成流量笑點。",objs:["跳上平台取得核心證據。","不要攻擊灰色或黃色 NPC。","用 X 抵擋高密度彈幕。"],theme:"#b993ff",type:2,label:"創作者尊重核心",words:["只是好玩！","太認真了吧","沒有惡意啦","大家投票看看"]},
{name:"第三關：商業透明地下城",text:"破解業配、合約、來源與金流迷霧。",objs:["找到透明度資料盒。","用 C 透明炸彈清場。","保持公信力上升。"],theme:"#ffd166",type:1,label:"商業透明核心",words:["問員工啦","公司也是受害者","這不是重點","不要扯商業"]},
{name:"第四關：粉絲軍團要塞",text:"擋下出征，但不能讓反制變成獵巫。",objs:["穿過洗版軍團。","碰到獵巫陷阱會扣正當性。","不要誤傷無辜 NPC。"],theme:"#ff5370",type:3,label:"粉絲動員核心",words:["兄弟們上！","截圖回報！","出征！","大量檢舉！"]},
{name:"第五關：平台規範高塔",text:"把輿論攻防轉為平台審查與法律程序。",objs:["取得最後一個核心。","理性值不可歸零。","集滿後進入炎上法庭。"],theme:"#6dffad",type:4,label:"平台規範核心",words:["流量無罪","平台不敢動","品牌會怕","演算法挺我"]},
{name:"最終關：炎上法庭",text:"使用五大核心證據擊敗流量魔王。",objs:["用 Z 持續打擊 Boss。","用 X 抵擋 Boss 彈幕。","用 C 危急清場。","維持低獵巫值。"],theme:"#fff",boss:true,words:["道歉重置！","政治標籤！","品牌綁架！","反告威嚇！"]}
];
const p={x:72,y:G-50,w:34,h:50,vx:0,vy:0,dir:1,on:false,reason:100,cred:0,witch:0,shield:0,beam:0,bomb:0};
let cores=[false,false,false,false,false],plats=[],items=[],enemies=[],shots=[],npcs=[],parts=[],boss={x:770,y:G-164,w:130,h:164,hp:100,phase:1,cd:46,flash:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function log(t,k=""){const d=document.createElement("div");d.className="logitem "+k;d.textContent=t;ui.log.prepend(d);while(ui.log.children.length>22)ui.log.removeChild(ui.log.lastChild)}
function load(i){level=i;frame=0;shots=[];enemies=[];items=[];parts=[];npcs=[];p.x=72;p.y=G-p.h;p.vx=p.vy=0;p.shield=0;plats=[{x:0,y:G,w:W,h:100},{x:180,y:402,w:150,h:16},{x:408,y:346,w:150,h:16},{x:656,y:398,w:170,h:16}];let l=levels[i];ui.title.textContent=l.name;ui.text.textContent=l.text;ui.objs.innerHTML=l.objs.map(o=>`<li>${o}</li>`).join("");if(!l.boss){items.push({x:760,y:350,w:30,h:30,type:l.type,label:l.label,t:0});npcs.push({x:520,y:G-42,w:28,h:42,label:"無辜路人",kind:"n"});if(i==1||i==3)npcs.push({x:345,y:G-42,w:28,h:42,label:"創作者",kind:"c"})}else{boss={x:770,y:G-164,w:130,h:164,hp:100,phase:1,cd:46,flash:0};items.push({x:220,y:358,w:26,h:26,type:"law",label:"法律封印",t:0})}log(l.name+"：載入完成。","warn");sync()}
function reset(){document.body.classList.remove("playingMobile");frame=0;running=false;paused=true;level=0;ended=false;Object.assign(p,{x:72,y:G-50,vx:0,vy:0,dir:1,on:false,reason:100,cred:0,witch:0,shield:0,beam:0,bomb:0});cores=[false,false,false,false,false];ui.log.innerHTML="";load(0);ui.modal.classList.remove("hidden")}
function start(){document.body.classList.add("playingMobile");ui.modal.classList.add("hidden");running=true;paused=false;log("任務開始：依照右側目前目標行動。","good")}
function spawnShot(){let l=levels[level],w=l.words[(Math.random()*l.words.length)|0];shots.push({x:W+20,y:rand(112,G-74),w:92,h:24,vx:rand(-5.7,-3.4),vy:rand(-.35,.35),word:w,kind:"s"})}
function spawnEnemy(){let l=levels[level],w=l.words[(Math.random()*l.words.length)|0];enemies.push({x:W+30,y:rand(250,G-40),w:44,h:34,vx:rand(-2.8,-1.6),hp:level>=3?2:1,word:w})}
function spawnTrap(){shots.push({x:W+20,y:G-30,w:104,h:24,vx:-3.9,vy:0,word:"獵巫陷阱",kind:"trap"})}
function burst(x,y,c,n){for(let i=0;i<n;i++)parts.push({x,y,vx:rand(-2.5,2.5),vy:rand(-2.5,2.5),life:rand(18,42),c})}
function beam(){if(p.beam>0)return;p.beam=22;let b={x:p.dir>0?p.x+p.w:p.x-560,y:p.y+18,w:560,h:18},ok=false;burst(p.x+17,p.y+22,"#63d7ff",10);for(const e of enemies)if(hit(b,e)){e.hp--;ok=true;burst(e.x+20,e.y+16,"#6dffad",18)}shots=shots.filter(s=>{if(s.kind!="trap"&&hit(b,s)){ok=true;burst(s.x+20,s.y+12,"#6dffad",12);return false}return true});if(levels[level].boss&&hit(b,boss)){boss.hp-=cores.filter(Boolean).length>=5?4.6:1.2;boss.flash=5;ok=true;burst(boss.x+55,boss.y+70,"#ffd166",18)}if(ok)p.cred=clamp(p.cred+2.1,0,100)}
function shield(){if(p.shield<=0){p.shield=54;log("事實盾牌展開：短時間抵擋情緒砲火。","good")}}
function bomb(){if(p.bomb>0)return;p.bomb=210;shots=[];enemies=[];p.cred=clamp(p.cred+9,0,100);burst(p.x+18,p.y+18,"#ffd166",38);if(levels[level].boss)boss.hp-=cores.filter(Boolean).length>=5?13:3;log("透明炸彈啟動：混亂資訊被清場。","good")}
function updatePlayer(){if(keys.ArrowLeft||keys.a){p.vx=-3.55;p.dir=-1}else if(keys.ArrowRight||keys.d){p.vx=3.55;p.dir=1}else p.vx*=.78;if((keys.ArrowUp||keys.w||keys[" "])&&p.on){p.vy=-11.2;p.on=false}if(keys.z)beam();if(keys.x)shield();if(keys.c)bomb();p.vy+=.52;p.x+=p.vx;p.y+=p.vy;p.x=clamp(p.x,0,W-p.w);p.on=false;for(const pl of plats)if(p.x+p.w>pl.x&&p.x<pl.x+pl.w&&p.y+p.h>pl.y&&p.y+p.h-p.vy<=pl.y){p.y=pl.y-p.h;p.vy=0;p.on=true}if(p.y>H)p.reason=0;if(p.shield>0)p.shield--;if(p.beam>0)p.beam--;if(p.bomb>0)p.bomb--}
function updateWorld(){let l=levels[level];if(!l.boss){if(frame%Math.max(38,74-level*5)==0)spawnShot();if(frame%Math.max(62,94-level*4)==0)spawnEnemy();if(frame%260==0)spawnTrap()}else{boss.cd--;if(boss.cd<=0){let c=boss.hp<35?5:boss.hp<65?4:3;for(let i=0;i<c;i++){let w=l.words[(Math.random()*l.words.length)|0];shots.push({x:boss.x-8,y:boss.y+rand(16,130),w:102,h:24,vx:rand(-6.2,-3.8),vy:rand(-.55,.55),word:w,kind:"s"})}if(Math.random()<.38)spawnTrap();boss.cd=boss.hp<35?30:44}boss.phase=boss.hp<34?3:boss.hp<67?2:1;if(boss.flash>0)boss.flash--}enemies.forEach(e=>e.x+=e.vx);shots.forEach(s=>{s.x+=s.vx;s.y+=s.vy});parts.forEach(a=>{a.x+=a.vx;a.y+=a.vy;a.life--});items.forEach(a=>a.t+=.06);for(const s of shots)if(hit(p,s)){if(s.kind=="trap"){p.witch=clamp(p.witch+18,0,100);log("碰到獵巫陷阱：正當性受損。","bad")}else if(p.shield>0){p.cred=clamp(p.cred+1.2,0,100);burst(p.x+16,p.y+18,"#63d7ff",10)}else{p.reason=clamp(p.reason-8.5,0,100);burst(p.x+16,p.y+18,"#ff5370",10)}s.x=-9999}for(const e of enemies)if(hit(p,e)){if(p.shield>0){e.hp=0;p.cred=clamp(p.cred+1.2,0,100)}else{p.reason=clamp(p.reason-11.5,0,100);e.x-=90;burst(p.x+16,p.y+18,"#ff5370",10)}}for(const n of npcs)if(hit(p,n)&&(keys.z||keys.c)){p.witch=clamp(p.witch+7,0,100);log("誤傷無辜對象：反制不能變成私刑。","bad")}items=items.filter(it=>{if(hit(p,it)){if(typeof it.type=="number"){cores[it.type]=true;p.cred=clamp(p.cred+18,0,100);log("取得「"+it.label+"」。","good");setTimeout(()=>load(level+1),520)}else{if(cores.filter(Boolean).length>=5){p.cred=clamp(p.cred+8,0,100);boss.hp-=9;log("法律封印生效：Boss 防禦下降。","good")}else log("法律封印失敗：五大核心尚未集齊。","warn")}return false}return true});enemies=enemies.filter(e=>e.x>-90&&e.hp>0);shots=shots.filter(s=>s.x>-170&&s.y>-80&&s.y<H+80);parts=parts.filter(a=>a.life>0);if(l.boss&&boss.hp<=0)finish(true);if(p.reason<=0)finish(false,"理性值歸零","你被情緒砲火擊倒。重點不是比對方更兇，而是比對方更穩。");if(p.witch>=100)finish(false,"獵巫失控","你誤傷太多無辜對象，Boss 獲得被迫害光環並復活。")}
function finish(win,title,msg){ended=true;running=false;paused=true;if(win){let perfect=p.cred>=70&&p.witch<45&&cores.filter(Boolean).length==5;title=perfect?"完美結局：依法關押":"普通結局：平台封禁";msg=perfect?"你完成五大證據鏈，且沒有讓監督變成獵巫。流量魔王被平台封禁、品牌切割，並進入法律程序。":"你擊敗 Boss，但公信力或比例原則不足。Boss 被平台封禁，仍可能在小平台復活。"}ui.modal.classList.remove("hidden");ui.modal.querySelector(".modalbox").innerHTML=`<div class="eyebrow">RESULT</div><h2>${title}</h2><p>${msg}</p><div class="guide"><div><b>結算</b><ol><li>理性值：${Math.round(p.reason)}</li><li>公信力：${Math.round(p.cred)}</li><li>獵巫值：${Math.round(p.witch)}</li><li>證據核心：${cores.filter(Boolean).length}/5</li></ol></div><div><b>遊戲精神</b><ol><li>道歉不是重置鍵。</li><li>流量不能抵銷責任。</li><li>監督必須避免誤傷無辜。</li><li>程序正義才是終局武器。</li></ol></div></div><div class="actions"><button class="primary" onclick="location.reload()">重新開始</button></div>`}
function sync(){ui.reason.textContent=Math.round(p.reason);ui.cred.textContent=Math.round(p.cred);ui.witch.textContent=Math.round(p.witch);ui.rbar.style.width=clamp(p.reason,0,100)+"%";ui.cbar.style.width=clamp(p.cred,0,100)+"%";ui.wbar.style.width=clamp(p.witch,0,100)+"%";if(levels[level]?.boss){ui.boss.textContent=Math.max(0,Math.round(boss.hp));ui.bbar.style.width=clamp(boss.hp,0,100)+"%"}else{ui.boss.textContent="-";ui.bbar.style.width="0%"}cores.forEach((v,i)=>$("core"+i).classList.toggle("on",v))}
function label(t,x,y,c,max=190){ctx.font='bold 13px sans-serif';let w=Math.min(max,ctx.measureText(t).width+18);ctx.fillStyle="rgba(5,8,15,.84)";ctx.strokeStyle=c;ctx.lineWidth=1;round(x,y,w,25,8,true,true);ctx.fillStyle=c;ctx.fillText(t,x+9,y+17)}
function round(x,y,w,h,r,f,s){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);if(f)ctx.fill();if(s)ctx.stroke()}
function draw(){let l=levels[level]||levels[0],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#10192b");g.addColorStop(.58,"#09101c");g.addColorStop(1,"#05070d");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle=l.theme;for(let x=(frame%54)-54;x<W;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+150,H);ctx.stroke()}for(let y=42;y<H;y+=58){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.restore();ctx.fillStyle="rgba(255,255,255,.045)";ctx.fillRect(0,0,W,76);ctx.fillStyle="#eef4ff";ctx.font='bold 24px sans-serif';ctx.fillText(l.name,24,34);ctx.font='14px sans-serif';ctx.fillStyle="#aebfe0";ctx.fillText(l.text,24,58);for(const pl of plats){ctx.fillStyle=pl.y==G?"#141d2f":"#202c47";ctx.fillRect(pl.x,pl.y,pl.w,pl.h);ctx.fillStyle=l.theme;ctx.globalAlpha=.42;ctx.fillRect(pl.x,pl.y,pl.w,4);ctx.globalAlpha=1}for(const n of npcs){ctx.fillStyle=n.kind=="c"?"#ffd166":"#9aaccc";ctx.fillRect(n.x,n.y,n.w,n.h);ctx.fillStyle="#060912";ctx.fillRect(n.x+7,n.y+12,4,4);ctx.fillRect(n.x+18,n.y+12,4,4);label(n.label,n.x-22,n.y-32,n.kind=="c"?"#ffd166":"#9aaccc",130)}for(const it of items){let yy=it.y+Math.sin(it.t)*8;ctx.save();ctx.translate(it.x+it.w/2,yy+it.h/2);ctx.rotate(frame*.026);ctx.fillStyle=typeof it.type=="number"?"#6dffad":"#fff";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=20;ctx.fillRect(-it.w/2,-it.h/2,it.w,it.h);ctx.restore();label(it.label,it.x-54,yy-36,"#6dffad",180)}for(const e of enemies){ctx.fillStyle="#ff5370";ctx.fillRect(e.x,e.y,e.w,e.h);ctx.fillStyle="#1a070d";ctx.fillRect(e.x+9,e.y+10,6,6);ctx.fillRect(e.x+29,e.y+10,6,6);label(e.word,e.x-24,e.y-32,"#ff8ca0",160)}for(const s of shots){ctx.fillStyle=s.kind=="trap"?"#ffd166":"#ff5370";round(s.x,s.y,s.w,s.h,11,true,false);ctx.fillStyle="#16070c";ctx.font='bold 12px sans-serif';ctx.fillText(s.word,s.x+8,s.y+16)}if(l.boss){ctx.save();let cs=["#ff5370","#b993ff","#ffd166"];ctx.fillStyle=boss.flash?"#fff":cs[boss.phase-1];ctx.shadowColor=cs[boss.phase-1];ctx.shadowBlur=24;ctx.fillRect(boss.x,boss.y,boss.w,boss.h);ctx.shadowBlur=0;ctx.fillStyle="#070912";ctx.fillRect(boss.x+26,boss.y+40,18,18);ctx.fillRect(boss.x+86,boss.y+40,18,18);ctx.fillRect(boss.x+32,boss.y+105,70,12);ctx.restore();label("流量魔王 Phase "+boss.phase,boss.x-30,boss.y-38,"#ffd166",200)}if(p.shield>0){ctx.save();ctx.strokeStyle="#63d7ff";ctx.lineWidth=4;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,42,0,Math.PI*2);ctx.stroke();ctx.restore()}ctx.fillStyle="#63d7ff";ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle="#06101b";ctx.fillRect(p.x+8,p.y+13,5,5);ctx.fillRect(p.x+22,p.y+13,5,5);ctx.fillStyle="#eef4ff";ctx.fillRect(p.x+(p.dir>0?28:-12),p.y+28,18,5);label("公民稽核員",p.x-28,p.y-34,"#63d7ff",130);for(const a of parts){ctx.globalAlpha=Math.max(0,a.life/42);ctx.fillStyle=a.c;ctx.fillRect(a.x,a.y,4,4);ctx.globalAlpha=1}ctx.fillStyle="#cfe0ff";ctx.font='12px sans-serif';ctx.fillText(`Z 冷靜光束：${p.beam?Math.ceil(p.beam/10):"OK"}`,24,H-18);ctx.fillText(`X 事實盾牌：${p.shield?"ON":"OK"}`,176,H-18);ctx.fillText(`C 透明炸彈：${p.bomb?Math.ceil(p.bomb/60)+"s":"OK"}`,318,H-18)}
function tick(){if(running&&!paused){frame++;updatePlayer();updateWorld();sync()}draw();requestAnimationFrame(tick)}
addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys[e.key.length==1?e.key.toLowerCase():e.key]=true;if(e.key.toLowerCase()=="r")reset()});
addEventListener("keyup",e=>keys[e.key.length==1?e.key.toLowerCase():e.key]=false);
$("startBtn").onclick=start;$("modalStart").onclick=start;$("resetBtn").onclick=reset;$("guideBtn").onclick=()=>ui.modal.classList.remove("hidden");$("modalClose").onclick=()=>ui.modal.classList.add("hidden");

function bindTouchControls(){
  const btns = document.querySelectorAll(".touchBtn[data-key]");
  const setKey = (btn, value) => {
    const key = btn.getAttribute("data-key");
    keys[key] = value;
    btn.classList.toggle("active", value);
  };
  btns.forEach(btn => {
    const down = ev => {
      ev.preventDefault();
      setKey(btn, true);
    };
    const up = ev => {
      ev.preventDefault();
      setKey(btn, false);
    };
    btn.addEventListener("touchstart", down, {passive:false});
    btn.addEventListener("touchend", up, {passive:false});
    btn.addEventListener("touchcancel", up, {passive:false});
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
  });
  window.addEventListener("blur", () => {
    btns.forEach(btn => setKey(btn, false));
  });
  document.addEventListener("touchmove", ev => {
    if (running) ev.preventDefault();
  }, {passive:false});
}
bindTouchControls();

reset();tick();
})();