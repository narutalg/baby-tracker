const { useState, useRef, useEffect, useCallback } = React;

// ── helpers ──────────────────────────────────────────────────────────
function getDateString(d){return d.toISOString().slice(0,10);}
function pad(n){return String(n).padStart(2,"0");}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function firstDay(y,m){return new Date(y,m,1).getDay();}
const HE_MONTHS=["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HE_DAYS=["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
const HE_DAYS_F=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
function fmtDateHe(s){if(!s)return"";const[y,m,d]=s.split("-");return`יום ${HE_DAYS_F[new Date(+y,+m-1,+d).getDay()]}, ${+d} ${HE_MONTHS[+m-1]}`;}
function fmtShort(s){if(!s)return"";const[,m,d]=s.split("-");return`${+d} ${HE_MONTHS[+m-1]}`;}

// ── iOS Wheel ────────────────────────────────────────────────────────
const ITEM_H=44;
function WheelCol({items,value,onChange,width=68}){
  const listRef=useRef(null);
  const drag=useRef(false);
  const sY=useRef(0),sIdx=useRef(0),vel=useRef(0),lY=useRef(0),lT=useRef(0),raf=useRef(null);
  const idx=items.indexOf(value);
  const scrollTo=useCallback((i,smooth=false)=>{
    if(listRef.current)listRef.current.scrollTo({top:i*ITEM_H,behavior:smooth?"smooth":"instant"});
  },[]);
  useEffect(()=>{scrollTo(idx);},[idx,scrollTo]);
  function commit(){
    if(!listRef.current)return;
    const i=Math.max(0,Math.min(Math.round(listRef.current.scrollTop/ITEM_H),items.length-1));
    onChange(items[i]);scrollTo(i,true);
  }
  function momentum(){
    let v=vel.current*15;
    function step(){if(!listRef.current)return;listRef.current.scrollTop+=v;v*=0.92;if(Math.abs(v)>0.5)raf.current=requestAnimationFrame(step);else commit();}
    raf.current=requestAnimationFrame(step);
  }
  function onTS(e){cancelAnimationFrame(raf.current);sY.current=lY.current=e.touches[0].clientY;lT.current=Date.now();sIdx.current=Math.round((listRef.current?.scrollTop||0)/ITEM_H);vel.current=0;}
  function onTM(e){const y=e.touches[0].clientY,now=Date.now();vel.current=(lY.current-y)/Math.max(1,now-lT.current);lY.current=y;lT.current=now;if(listRef.current)listRef.current.scrollTop=sIdx.current*ITEM_H+(sY.current-y);}
  function onTE(){momentum();}
  function onMD(e){cancelAnimationFrame(raf.current);drag.current=true;sY.current=lY.current=e.clientY;lT.current=Date.now();sIdx.current=Math.round((listRef.current?.scrollTop||0)/ITEM_H);vel.current=0;e.preventDefault();}
  function onMM(e){if(!drag.current)return;const y=e.clientY,now=Date.now();vel.current=(lY.current-y)/Math.max(1,now-lT.current);lY.current=y;lT.current=now;if(listRef.current)listRef.current.scrollTop=sIdx.current*ITEM_H+(sY.current-y);}
  function onMU(){if(!drag.current)return;drag.current=false;momentum();}
  const onMMRef=useRef(null);
  const onMURef=useRef(null);
  onMMRef.current=onMM;
  onMURef.current=onMU;
  useEffect(()=>{
    const mm=(e)=>onMMRef.current(e);
    const mu=(e)=>onMURef.current(e);
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",mu);
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
  },[]);
  return(
    <div style={{position:"relative",width,height:ITEM_H*3,overflow:"hidden",userSelect:"none",cursor:"grab",flexShrink:0}}
      onMouseDown={onMD} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:ITEM_H,background:"linear-gradient(to bottom,rgba(255,255,255,0.95),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:ITEM_H,left:6,right:6,height:1,background:"rgba(0,0,0,0.1)",zIndex:3,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:ITEM_H*2-1,left:6,right:6,height:1,background:"rgba(0,0,0,0.1)",zIndex:3,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:ITEM_H,background:"linear-gradient(to top,rgba(255,255,255,0.95),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div ref={listRef} style={{overflowY:"scroll",height:"100%",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingTop:ITEM_H,paddingBottom:ITEM_H}}>
        {items.map((item,i)=>(
          <div key={i} style={{height:ITEM_H,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:item===value?700:400,color:item===value?"#1a0a04":"#bbb",transition:"color .12s"}}>
            {pad(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
const HOURS=Array.from({length:24},(_,i)=>i);
const MINS=Array.from({length:60},(_,i)=>i);
function TimeWheel({hour,setHour,min,setMin}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",background:"#f8f5f2",borderRadius:14,border:"1px solid rgba(0,0,0,0.08)",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
      <WheelCol items={MINS} value={min} onChange={setMin} width={68}/>
      <div style={{fontSize:22,fontWeight:800,color:"#bbb",padding:"0 2px",marginBottom:4,flexShrink:0}}>:</div>
      <WheelCol items={HOURS} value={hour} onChange={setHour} width={68}/>
    </div>
  );
}

// ── Themes ───────────────────────────────────────────────────────────
const THEMES=[
  {name:"אפרסק",key:"peach",  h1:"#b83e14",h2:"#d96030",h3:"#ed8050",bg1:"#fdf6f0",bg2:"#fce8da",bg3:"#f5d0bb",accent:"#e06838",accentDark:"#c04418",text:"#a04820",textDark:"#7a2208",border:"rgba(255,195,160,0.35)",shadow:"rgba(210,110,60,0.07)",stat:"rgba(255,228,205,0.9)",statB:"rgba(255,210,180,0.85)",statText:"#a02808",statSub:"#b85020",tag1:"#d06030",tag2:"#2e7a52"},
  {name:"סגול", key:"purple", h1:"#4a1880",h2:"#7030b0",h3:"#9860d0",bg1:"#f8f4ff",bg2:"#ede0ff",bg3:"#dcc8f8",accent:"#7030b0",accentDark:"#4a1880",text:"#6020a0",textDark:"#3a1060",border:"rgba(160,100,220,0.3)",shadow:"rgba(100,40,180,0.07)",stat:"rgba(220,200,255,0.9)",statB:"rgba(200,175,248,0.85)",statText:"#5018a0",statSub:"#7030b0",tag1:"#7030b0",tag2:"#2e7a52"},
  {name:"ירוק",  key:"green",  h1:"#1a5c30",h2:"#2e8048",h3:"#48a862",bg1:"#f2fbf4",bg2:"#d8f2e0",bg3:"#bce8c8",accent:"#2e8048",accentDark:"#1a5c30",text:"#1e6838",textDark:"#144828",border:"rgba(80,180,110,0.3)",shadow:"rgba(30,104,56,0.07)",stat:"rgba(195,238,210,0.9)",statB:"rgba(170,225,190,0.85)",statText:"#1a5030",statSub:"#2e7848",tag1:"#2e8048",tag2:"#b85020"},
  {name:"כחול",  key:"blue",   h1:"#0f3a78",h2:"#1a5fb8",h3:"#4888d8",bg1:"#f0f6ff",bg2:"#d8e8ff",bg3:"#bcd4f8",accent:"#1a5fb8",accentDark:"#0f3a78",text:"#1040a0",textDark:"#0a2860",border:"rgba(80,140,220,0.3)",shadow:"rgba(20,60,180,0.07)",stat:"rgba(195,218,255,0.9)",statB:"rgba(170,205,250,0.85)",statText:"#0f3880",statSub:"#1a50a8",tag1:"#1a5fb8",tag2:"#2e8048"},
  {name:"ורוד",  key:"pink",   h1:"#901050",h2:"#c02878",h3:"#e060a0",bg1:"#fff4f8",bg2:"#ffe0ee",bg3:"#f8c8de",accent:"#c02878",accentDark:"#901050",text:"#a01860",textDark:"#700840",border:"rgba(220,100,160,0.3)",shadow:"rgba(180,30,100,0.07)",stat:"rgba(255,210,235,0.9)",statB:"rgba(248,185,218,0.85)",statText:"#8a1048",statSub:"#b02068",tag1:"#c02878",tag2:"#2e7a52"},
];
const BABY_PHOTOS=[
  {id:"b1",emoji:"👶",label:"תינוק"},{id:"b2",emoji:"🌸",label:"פרח"},{id:"b3",emoji:"⭐",label:"כוכב"},
  {id:"b4",emoji:"🌙",label:"ירח"},{id:"b5",emoji:"🦋",label:"פרפר"},{id:"b6",emoji:"🌈",label:"קשת"},
  {id:"b7",emoji:"🐣",label:"אפרוח"},{id:"b8",emoji:"🍀",label:"תלתן"},{id:"b9",emoji:"🐰",label:"ארנב"},
  {id:"b10",emoji:"🌻",label:"חמנייה"},{id:"b11",emoji:"🦄",label:"חד קרן"},{id:"b12",emoji:"🐬",label:"דולפין"},
];

// ── DaySummary (top-level component) ────────────────────────────────
function DaySummary({date,feedings,diapers,mlPerMin,t,onEdit,onDelete}){
  const df=feedings.filter(f=>f.date===date);
  const dd=diapers.filter(d=>d.date===date);
  const tm=df.reduce((s,f)=>s+(f.minutes||0),0);
  const tp=df.reduce((s,f)=>s+(f.ml||0),0);
  const tfm=mlPerMin&&tm?tm*parseFloat(mlPerMin):0;
  const gt=tfm+tp;
  const pee=dd.filter(d=>d.type==="pee"||d.type==="both").length;
  const poo=dd.filter(d=>d.type==="poo"||d.type==="both").length;
  const all=[...df.map(f=>({...f,kind:"feed"})),...dd.map(d=>({...d,kind:"diaper"}))].sort((a,b)=>a.time.localeCompare(b.time));
  return(
    <div className="card" style={{padding:"14px 15px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:800,color:t.textDark}}>{fmtDateHe(date)}</div>
        <div style={{fontSize:12,color:t.statSub,fontWeight:600}}>{df.length} האכלות · {dd.length} חיתולים</div>
      </div>
      {(gt>0||tm>0||pee>0||poo>0)&&(
        <div style={{display:"flex",gap:7,marginBottom:10}}>
          {gt>0&&<div className="stat-box" style={{flex:1}}><div className="stat-val">{gt.toFixed(0)}</div><div className="stat-lbl">מ״ל</div></div>}
          {tm>0&&<div className="stat-box" style={{flex:1}}><div className="stat-val">{tm}</div><div className="stat-lbl">דקות</div></div>}
          {pee>0&&<div className="stat-box" style={{flex:1}}><div className="stat-val">💧{pee}</div><div className="stat-lbl">פיפי</div></div>}
          {poo>0&&<div className="stat-box" style={{flex:1}}><div className="stat-val">💩{poo}</div><div className="stat-lbl">קקי</div></div>}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {all.map(item=>item.kind==="feed"?(
          <div key={item.id} className="feed-row">
            <div style={{background:item.mode==="ml"?t.tag1:t.tag2,color:"white",borderRadius:7,padding:"2px 7px",fontSize:10,fontWeight:800,flexShrink:0}}>{item.mode==="ml"?"שאוב":"יניקה"}</div>
            <div style={{fontSize:12,color:t.textDark,fontWeight:600,flexShrink:0}}>{item.time}</div>
            <div style={{fontSize:13,fontWeight:700,color:t.textDark,flex:1}}>{item.mode==="minutes"?`${item.minutes} דק׳${mlPerMin?` ≈ ${(item.minutes*parseFloat(mlPerMin)).toFixed(1)} מ״ל`:""}`:`${item.ml} מ״ל`}{item.side?` · ${item.side==="right"?"ימין":item.side==="left"?"שמאל":"שניהם"}`:""}</div>
            <button className="icon-btn" onClick={()=>onEdit(item,"feed")}>✏️</button>
            <button className="icon-btn" onClick={()=>onDelete("feed",item.id)}>🗑️</button>
          </div>
        ):(
          <div key={item.id} className="feed-row">
            <div style={{background:item.type==="pee"?"#4a90d9":item.type==="poo"?"#8B5E3C":"#6a4ec0",color:"white",borderRadius:7,padding:"2px 7px",fontSize:10,fontWeight:800,flexShrink:0}}>{item.type==="pee"?"💧 פיפי":item.type==="poo"?"💩 קקי":"💧💩"}</div>
            <div style={{fontSize:12,color:t.textDark,fontWeight:600,flexShrink:0}}>{item.time}</div>
            <div style={{fontSize:13,fontWeight:700,color:t.textDark,flex:1}}>חיתול</div>
            <button className="icon-btn" onClick={()=>onEdit(item,"diaper")}>✏️</button>
            <button className="icon-btn" onClick={()=>onDelete("diaper",item.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
function BabyFeedingTracker(){
  const today=new Date();

  function load(key, fallback){
    try { const v=localStorage.getItem(key); return v!==null?JSON.parse(v):fallback; }
    catch(e){ return fallback; }
  }
  function save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

  const [themeKey,setThemeKey]=useState(()=>load("themeKey","blue"));
  const [showThemes,setShowThemes]=useState(false);
  const [babyGender,setBabyGender]=useState(()=>load("babyGender",""));
  const [babyName,setBabyName]=useState(()=>load("babyName",""));
  const [babyPhoto,setBabyPhoto]=useState(()=>load("babyPhoto",null));
  const [showPhotoPicker,setShowPhotoPicker]=useState(false);
  const [showDatePicker,setShowDatePicker]=useState(false);
  const [pickerYear,setPickerYear]=useState(today.getFullYear());
  const [pickerMonth,setPickerMonth]=useState(today.getMonth());
  const [weight,setWeight]=useState(()=>load("weight",""));
  const [mlPerMin,setMlPerMin]=useState(()=>load("mlPerMin",""));
  const [selectedDate,setSelectedDate]=useState(getDateString(today));
  const [settingsOpen,setSettingsOpen]=useState(()=>load("babyName","")===null||load("babyName","")==="");
  const [view,setView]=useState("today");

  const [feedMode,setFeedMode]=useState("time");
  const [feedSide,setFeedSide]=useState("");
  const [swRunning,setSwRunning]=useState(false);
  const [swElapsed,setSwElapsed]=useState(0); // seconds
  const [swStartedAt,setSwStartedAt]=useState(null); // Date.now() when started
  const swRef=useRef(null); // "right" | "left" | "both" | ""
  const [startHour,setStartHour]=useState(today.getHours());
  const [startMin,setStartMin]=useState(today.getMinutes());
  const [endHour,setEndHour]=useState(today.getHours());
  const [endMin,setEndMin]=useState(today.getMinutes());
  const [manualMins,setManualMins]=useState("");
  const [pumpedMl,setPumpedMl]=useState("");
  const [timeError,setTimeError]=useState("");

  const [diaperType,setDiaperType]=useState("");
  const [diaperHour,setDiaperHour]=useState(today.getHours());
  const [diaperMin,setDiaperMin]=useState(today.getMinutes());

  const [feedings,setFeedings]=useState(()=>load("feedings",[]));
  const [diapers,setDiapers]=useState(()=>load("diapers",[]));
  const [animateNew,setAnimateNew]=useState(false);

  // Edit modal
  const [editItem,setEditItem]=useState(null);
  const [editHour,setEditHour]=useState(0);
  const [editMin2,setEditMin2]=useState(0);
  const [editMinutes,setEditMinutes]=useState("");
  const [editMl,setEditMl]=useState("");
  const [editDType,setEditDType]=useState("");

  const fileRef=useRef();
  const t=THEMES.find(x=>x.key===themeKey)||THEMES[0];

  // Persist to localStorage on every change
  useEffect(()=>save("themeKey",themeKey),[themeKey]);
  useEffect(()=>save("babyGender",babyGender),[babyGender]);
  useEffect(()=>save("babyName",babyName),[babyName]);
  useEffect(()=>save("babyPhoto",babyPhoto),[babyPhoto]);
  useEffect(()=>save("weight",weight),[weight]);
  useEffect(()=>save("mlPerMin",mlPerMin),[mlPerMin]);
  useEffect(()=>save("feedings",feedings),[feedings]);
  useEffect(()=>save("diapers",diapers),[diapers]);

  // (settings close on Enter key only - see inputs below)
  const todayStr=getDateString(today);
  const allDates=[...new Set([...feedings.map(f=>f.date),...diapers.map(d=>d.date)])].sort((a,b)=>b.localeCompare(a));
  const dayF=feedings.filter(f=>f.date===selectedDate);
  const dayD=diapers.filter(d=>d.date===selectedDate);
  const totalMins=dayF.reduce((s,f)=>s+(f.minutes||0),0);
  const totalPml=dayF.reduce((s,f)=>s+(f.ml||0),0);
  const fromMins=mlPerMin&&totalMins?totalMins*parseFloat(mlPerMin):0;
  const grand=fromMins+totalPml;
  const target=weight?parseFloat(weight)*150:null;
  const pct=target?Math.min((grand/target)*100,100):0;
  const left=target?Math.max(target-grand,0):null;
  const summary=[weight&&`${weight} ק״ג`,target&&`יעד: ${target.toFixed(0)} מ״ל`,mlPerMin&&`${mlPerMin} מ״ל/דק׳`].filter(Boolean).join(" · ");

  function bump(){setAnimateNew(true);setTimeout(()=>setAnimateNew(false),600);}

  // Stopwatch tick
  useEffect(()=>{
    if(swRunning){
      swRef.current=setInterval(()=>{
        setSwElapsed(e=>e+1);
      },1000);
    } else {
      clearInterval(swRef.current);
    }
    return()=>clearInterval(swRef.current);
  },[swRunning]);

  function swStart(){
    if(!swRunning){
      setSwStartedAt(prev=>prev||Date.now()-swElapsed*1000);
      setSwRunning(true);
    }
  }
  function swPause(){ setSwRunning(false); }
  function swReset(){ setSwRunning(false); setSwElapsed(0); setSwStartedAt(null); }
  function swFinish(){
    // Convert elapsed seconds to minutes and save as feeding
    const mins=Math.round(swElapsed/60);
    if(mins<=0){swReset();return;}
    const now=new Date();
    const startedDate=new Date(Date.now()-swElapsed*1000);
    const timeStr=`${pad(startedDate.getHours())}:${pad(startedDate.getMinutes())}`;
    setFeedings(p=>[...p,{id:Date.now(),date:selectedDate,time:timeStr,minutes:mins,ml:0,mode:"minutes",side:feedSide}]);
    swReset(); setFeedSide(""); bump();
  }

  const swMins=Math.floor(swElapsed/60);
  const swSecs=swElapsed%60;

  function addFeeding(){
    setTimeError("");
    let minutes=0,ml=0,timeStr=`${pad(startHour)}:${pad(startMin)}`;
    if(feedMode==="time"){
      const s=startHour*60+startMin,e=endHour*60+endMin;
      if(e<=s){setTimeError("שעת הסיום חייבת להיות אחרי שעת ההתחלה");return;}
      minutes=e-s;
    } else if(feedMode==="manual"){
      minutes=parseFloat(manualMins);if(!manualMins||isNaN(minutes)||minutes<=0)return;
    } else {
      ml=parseFloat(pumpedMl);if(!pumpedMl||isNaN(ml)||ml<=0)return;
    }
    setFeedings(p=>[...p,{id:Date.now(),date:selectedDate,time:timeStr,minutes,ml,mode:feedMode==="ml"?"ml":"minutes",side:feedSide}]);
    setManualMins("");setPumpedMl("");setFeedSide("");bump();
  }

  function addDiaper(){
    if(!diaperType)return;
    setDiapers(p=>[...p,{id:Date.now(),date:selectedDate,time:`${pad(diaperHour)}:${pad(diaperMin)}`,type:diaperType}]);
    setDiaperType("");bump();
  }

  function openEdit(item,kind){
    setEditItem({...item,kind});
    setEditHour(parseInt(item.time.split(":")[0]));
    setEditMin2(parseInt(item.time.split(":")[1]));
    if(kind==="feed"){setEditMinutes(String(item.minutes||""));setEditMl(String(item.ml||""));}
    else setEditDType(item.type);
  }

  function saveEdit(){
    if(!editItem)return;
    const nt=`${pad(editHour)}:${pad(editMin2)}`;
    if(editItem.kind==="feed") setFeedings(p=>p.map(f=>f.id===editItem.id?{...f,time:nt,minutes:parseFloat(editMinutes)||0,ml:parseFloat(editMl)||0}:f));
    else setDiapers(p=>p.map(d=>d.id===editItem.id?{...d,time:nt,type:editDType}:d));
    setEditItem(null);
  }

  function deleteItem(kind,id){
    if(kind==="feed") setFeedings(p=>p.filter(f=>f.id!==id));
    else setDiapers(p=>p.filter(d=>d.id!==id));
    setEditItem(null);
  }

  function handleFile(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setBabyPhoto({type:"upload",value:ev.target.result});setShowPhotoPicker(false);};r.readAsDataURL(f);}
  function pickEmoji(p){setBabyPhoto({type:"emoji",value:p.emoji});setShowPhotoPicker(false);}
  function selectDay(y,m,d){setSelectedDate(`${y}-${pad(m+1)}-${pad(d)}`);setShowDatePicker(false);}
  function buildCal(){
    const first=firstDay(pickerYear,pickerMonth),total=daysInMonth(pickerYear,pickerMonth);
    const prev=daysInMonth(pickerYear,pickerMonth===0?11:pickerMonth-1);
    const c=[];for(let i=first-1;i>=0;i--)c.push({d:prev-i,cur:false});
    for(let d=1;d<=total;d++)c.push({d,cur:true});
    while(c.length%7!==0)c.push({d:c.length-total-first+1,cur:false});return c;
  }

  // Avatar inline (no hooks, safe as inline JSX)
  const avatarEl=babyPhoto
    ?babyPhoto.type==="emoji"
      ?<span style={{fontSize:40,lineHeight:1,cursor:"pointer"}} onClick={()=>setShowPhotoPicker(true)}>{babyPhoto.value}</span>
      :<img src={babyPhoto.value} alt="" onClick={()=>setShowPhotoPicker(true)} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2.5px solid rgba(255,255,255,0.7)",cursor:"pointer",flexShrink:0}}/>
    :<span style={{fontSize:34,lineHeight:1,marginTop:2,cursor:"pointer"}} onClick={()=>setShowPhotoPicker(true)}>🍼</span>;

  const sTotal=startHour*60+startMin,eTotal=endHour*60+endMin;
  const diffOk=eTotal>sTotal,diffVal=eTotal-sTotal;

  return(
    <div dir="rtl" style={{minHeight:"100vh",background:`linear-gradient(160deg,${t.bg1} 0%,${t.bg2} 60%,${t.bg3} 100%)`,fontFamily:"'Heebo','Assistant',sans-serif",padding:"0 0 60px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
        div::-webkit-scrollbar{display:none;}div{-ms-overflow-style:none;scrollbar-width:none;}
        .card{background:rgba(255,255,255,0.84);backdrop-filter:blur(14px);border-radius:18px;border:1px solid ${t.border};box-shadow:0 2px 18px ${t.shadow};}
        .lbl{font-size:12px;font-weight:700;color:${t.text};margin-bottom:6px;letter-spacing:0.4px;text-transform:uppercase;}
        .inp{width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid ${t.border};background:rgba(255,250,248,0.95);font-family:inherit;font-size:15px;color:#1a0a04;outline:none;transition:border .2s,box-shadow .2s;}
        .inp:focus{border-color:${t.accent};box-shadow:0 0 0 3px ${t.accent}22;}
        .btn-p{background:linear-gradient(135deg,${t.accent},${t.accentDark});color:white;border:none;border-radius:12px;padding:12px 20px;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px ${t.accentDark}55;width:100%;transition:transform .15s;}
        .btn-p:hover{transform:translateY(-1px);}
        .btn-p:active{transform:scale(0.98);}
        .mode-btn{flex:1;padding:9px 8px;border-radius:10px;border:1.5px solid ${t.border};background:transparent;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;color:${t.text};}
        .mode-btn.active{background:linear-gradient(135deg,${t.accent},${t.accentDark});color:white;border-color:transparent;box-shadow:0 2px 10px ${t.accentDark}44;}
        .feed-row{display:flex;align-items:center;gap:8px;padding:9px 11px;background:${t.stat};border-radius:11px;animation:fadeIn .28s ease;border:1px solid ${t.border};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
        .icon-btn{background:none;border:none;cursor:pointer;font-size:15px;padding:2px 4px;border-radius:6px;transition:background .15s;flex-shrink:0;}
        .icon-btn:hover{background:rgba(0,0,0,0.07);}
        .prog-bg{height:12px;background:${t.accent}28;border-radius:99px;overflow:hidden;margin-top:7px;}
        .prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,${t.h3},${t.accentDark});transition:width .5s cubic-bezier(.4,0,.2,1);}
        .stat-box{background:linear-gradient(135deg,${t.stat},${t.statB});border-radius:12px;padding:11px 10px;border:1px solid ${t.border};text-align:center;}
        .stat-val{font-size:22px;font-weight:800;color:${t.statText};line-height:1.1;}
        .stat-lbl{font-size:10px;font-weight:700;color:${t.statSub};margin-top:2px;text-transform:uppercase;}
        .sec-title{font-size:15px;font-weight:800;color:${t.textDark};margin-bottom:12px;display:flex;align-items:center;gap:7px;}
        .tog-btn{width:100%;background:none;border:none;cursor:pointer;font-family:inherit;text-align:right;padding:0;}
        .chev{display:inline-block;transition:transform .22s ease;}
        .chev.open{transform:rotate(180deg);}
        .s-body{overflow:hidden;transition:max-height .32s ease,opacity .25s ease;}
        .s-body.open{max-height:800px;opacity:1;}
        .s-body.closed{max-height:0;opacity:0;pointer-events:none;}
        .pulse{animation:pulse .45s ease;}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        .t-dot{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:transform .15s,border-color .15s;flex-shrink:0;}
        .t-dot:hover{transform:scale(1.15);}
        .t-dot.active{border-color:white;box-shadow:0 0 0 2px rgba(0,0,0,0.25);transform:scale(1.1);}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease;}
        .sheet{background:white;border-radius:22px 22px 0 0;padding:20px 16px 32px;width:100%;max-width:480px;animation:slideUp .28s ease;}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
        .p-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        .p-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:14px;cursor:pointer;border:2px solid transparent;transition:all .16s;background:${t.stat};}
        .p-item:hover{border-color:${t.accent};transform:scale(1.06);}
        .p-item.sel{border-color:${t.accent};background:${t.statB};}
        .up-btn{width:100%;padding:11px;border-radius:12px;border:2px dashed ${t.border};background:transparent;font-family:inherit;font-size:14px;font-weight:700;color:${t.text};cursor:pointer;}
        .cal-day{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;cursor:pointer;font-size:13px;font-weight:600;border:none;background:none;font-family:inherit;transition:background .12s;}
        .cal-day:hover{background:${t.accent}22;}
        .cal-day.sel{background:${t.accent};color:white;}
        .cal-day.tod{outline:2px solid ${t.accent};}
        .cal-day.other{opacity:0.28;pointer-events:none;}
        .date-disp{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;border:1.5px solid ${t.border};background:rgba(255,250,248,0.95);cursor:pointer;}
        .tab-btn{flex:1;padding:10px;border:none;background:none;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;border-bottom:2.5px solid transparent;color:${t.text};}
        .tab-btn.active{color:${t.accent};border-bottom-color:${t.accent};}
      `}</style>

      {/* Photo Picker */}
      {showPhotoPicker&&(
        <div className="overlay" onClick={()=>setShowPhotoPicker(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:17,fontWeight:900,color:t.textDark}}>בחירת תמונה</div>
              <button onClick={()=>setShowPhotoPicker(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#888"}}>✕</button>
            </div>
            <div className="p-grid">
              {BABY_PHOTOS.map(p=>(
                <div key={p.id} className={`p-item ${babyPhoto?.value===p.emoji?"sel":""}`} onClick={()=>pickEmoji(p)}>
                  <span style={{fontSize:32}}>{p.emoji}</span>
                  <span style={{fontSize:10,fontWeight:700,color:t.text}}>{p.label}</span>
                </div>
              ))}
            </div>
            <button className="up-btn" onClick={()=>fileRef.current?.click()}>📁 העלאת תמונה מהמכשיר</button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
            {babyPhoto&&<button onClick={()=>{setBabyPhoto(null);setShowPhotoPicker(false);}} style={{width:"100%",marginTop:8,padding:"9px",borderRadius:12,border:`1px solid ${t.border}`,background:"none",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"#888",cursor:"pointer"}}>הסרת תמונה</button>}
          </div>
        </div>
      )}

      {/* Date Picker */}
      {showDatePicker&&(
        <div className="overlay" onClick={()=>setShowDatePicker(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setShowDatePicker(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#aaa"}}>✕</button>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>{if(pickerMonth===0){setPickerMonth(11);setPickerYear(y=>y-1);}else setPickerMonth(m=>m-1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:t.accent,fontWeight:700,padding:"0 4px"}}>‹</button>
                <div style={{fontSize:16,fontWeight:800,color:t.textDark,minWidth:110,textAlign:"center"}}>{HE_MONTHS[pickerMonth]} {pickerYear}</div>
                <button onClick={()=>{if(pickerMonth===11){setPickerMonth(0);setPickerYear(y=>y+1);}else setPickerMonth(m=>m+1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:t.accent,fontWeight:700,padding:"0 4px"}}>›</button>
              </div>
              <div style={{width:28}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
              {HE_DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:t.statSub,padding:"4px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {buildCal().map((cell,i)=>{
                const cs=cell.cur?`${pickerYear}-${pad(pickerMonth+1)}-${pad(cell.d)}`:"";
                return<button key={i} className={`cal-day ${cell.cur&&cs===selectedDate?"sel":""} ${cell.cur&&cs===todayStr&&cs!==selectedDate?"tod":""} ${!cell.cur?"other":""}`} onClick={()=>cell.cur&&selectDay(pickerYear,pickerMonth,cell.d)}>{cell.d}</button>;
              })}
            </div>
            <button onClick={()=>{const n=new Date();setPickerYear(n.getFullYear());setPickerMonth(n.getMonth());selectDay(n.getFullYear(),n.getMonth(),n.getDate());}} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:12,border:`1.5px solid ${t.border}`,background:"none",fontFamily:"inherit",fontSize:14,fontWeight:700,color:t.accent,cursor:"pointer"}}>היום</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem&&(
        <div className="overlay" onClick={()=>setEditItem(null)}>
          <div style={{background:"white",borderRadius:"22px 22px 0 0",padding:"16px 16px 28px",width:"100%",maxWidth:480,animation:"slideUp .28s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:900,color:t.textDark}}>עריכת רשומה</div>
              <button onClick={()=>setEditItem(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#888"}}>✕</button>
            </div>
            <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:14}}>
              {/* Wheel on the right (RTL) */}
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {editItem.kind==="feed"&&<>
                  <div><div className="lbl">דקות</div><input type="number" className="inp" value={editMinutes} onChange={e=>setEditMinutes(e.target.value)} min="0"/></div>
                  <div><div className="lbl">מ״ל שאוב</div><input type="number" className="inp" value={editMl} onChange={e=>setEditMl(e.target.value)} min="0"/></div>
                </>}
                {editItem.kind==="diaper"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:6,height:132}}>
                    <div className="lbl">סוג</div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                      {["pee","poo","both"].map(tp=>(
                        <button key={tp} className={`mode-btn ${editDType===tp?"active":""}`} onClick={()=>setEditDType(tp)} style={{width:"100%",flex:1,height:0}}>
                          {tp==="pee"?"💧 פיפי":tp==="poo"?"💩 קקי":"💧💩 שניהם"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{flexShrink:0}}>
                <div className="lbl">שעה</div>
                <TimeWheel hour={editHour} setHour={setEditHour} min={editMin2} setMin={setEditMin2}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>deleteItem(editItem.kind,editItem.id)} style={{flex:1,padding:"10px",borderRadius:12,border:"1.5px solid #e05030",background:"none",fontFamily:"inherit",fontSize:14,fontWeight:700,color:"#e05030",cursor:"pointer"}}>🗑️ מחק</button>
              <button onClick={saveEdit} className="btn-p" style={{flex:2}}>שמור</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${t.h1} 0%,${t.h2} 55%,${t.h3} 100%)`,padding:"22px 18px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
            {avatarEl}
            {/* 🎨 button under avatar */}
            <button onClick={()=>setShowThemes(s=>!s)} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:8,padding:"3px 8px",cursor:"pointer",fontSize:16,lineHeight:1}}>🎨</button>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"white",fontSize:22,fontWeight:900,lineHeight:1.2,letterSpacing:"-0.3px",textShadow:"0 2px 8px rgba(0,0,0,0.18)"}}>
              {babyName?`מעקב האכלה — ${babyName}${babyGender==="boy"?" 👦":babyGender==="girl"?" 👧":""}` : "מעקב האכלה"}
            </div>
            <div style={{color:"rgba(255,255,255,0.82)",fontSize:13,fontWeight:500,marginTop:3}}>
              {fmtDateHe(selectedDate)}{target?` · יעד ${target.toFixed(0)} מ״ל`:""}
            </div>
          </div>
        </div>
        {showThemes&&(
          <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10,background:"rgba(0,0,0,0.15)",borderRadius:14,padding:"10px 14px"}}>
            <span style={{color:"rgba(255,255,255,0.8)",fontSize:12,fontWeight:700,flexShrink:0}}>צבע:</span>
            {THEMES.map(th=>(
              <div key={th.key} className={`t-dot ${themeKey===th.key?"active":""}`}
                style={{background:`linear-gradient(135deg,${th.h1},${th.h3})`}}
                onClick={()=>{setThemeKey(th.key);setShowThemes(false);}} title={th.name}/>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"rgba(255,255,255,0.7)",borderBottom:`1px solid ${t.border}`}}>
        <button className={`tab-btn ${view==="today"?"active":""}`} onClick={()=>setView("today")}>📅 היום</button>
        <button className={`tab-btn ${view==="history"?"active":""}`} onClick={()=>setView("history")}>📖 היסטוריה{allDates.length>0?` (${allDates.length})`:""}</button>
      </div>

      <div style={{padding:"12px 12px 0",display:"flex",flexDirection:"column",gap:10}}>

        {/* History tab */}
        {view==="history"&&(
          allDates.length===0
          ?<div style={{textAlign:"center",padding:"40px 20px",color:t.text}}><div style={{fontSize:40,marginBottom:8}}>📖</div><div style={{fontWeight:700,fontSize:14}}>אין היסטוריה עדיין</div></div>
          :allDates.map(d=><DaySummary key={d} date={d} feedings={feedings} diapers={diapers} mlPerMin={mlPerMin} t={t} onEdit={openEdit} onDelete={deleteItem}/>)
        )}

        {/* Today tab */}
        {view==="today"&&<>

        {/* Settings */}
        <div className="card" style={{overflow:"hidden"}}>
          <button className="tog-btn" onClick={()=>setSettingsOpen(o=>!o)}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 15px"}}>
              <span className={`chev ${settingsOpen?"open":""}`} style={{color:t.accent,fontSize:11}}>▼</span>
              <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0,justifyContent:"flex-end"}}>
                {!settingsOpen&&summary&&<span style={{fontSize:11,color:t.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{summary}</span>}
                <span style={{fontSize:13,fontWeight:800,color:t.textDark,flexShrink:0}}>הגדרות</span>
                <span style={{fontSize:14}}>⚙️</span>
              </div>
            </div>
          </button>
          <div style={{overflow:"hidden",maxHeight:settingsOpen?"800px":"0",opacity:settingsOpen?1:0,pointerEvents:settingsOpen?"auto":"none",transition:"max-height .32s ease,opacity .25s ease"}}>
            <div style={{padding:"0 15px 15px",display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <div className="lbl">מין ושם</div>
                <div style={{display:"flex",gap:8,alignItems:"stretch"}}>
                  <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1.5px solid ${t.border}`,flexShrink:0}}>
                    <button onClick={()=>setBabyGender(g=>g==="boy"?"":"boy")} style={{padding:"0 11px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:18,lineHeight:1,background:babyGender==="boy"?"linear-gradient(135deg,#3a8fd8,#1a60a8)":"rgba(255,250,248,0.95)"}}>👦</button>
                    <div style={{width:1,background:t.border}}/>
                    <button onClick={()=>setBabyGender(g=>g==="girl"?"":"girl")} style={{padding:"0 11px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:18,lineHeight:1,background:babyGender==="girl"?"linear-gradient(135deg,#e060a0,#b02870)":"rgba(255,250,248,0.95)"}}>👧</button>
                  </div>
                  <input type="text" className="inp" style={{flex:1}} placeholder={babyGender==="boy"?"שם הבן":babyGender==="girl"?"שם הבת":"שם"} value={babyName} onChange={e=>setBabyName(e.target.value)}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                <div style={{flex:1}}><div className="lbl">משקל (ק״ג)</div><input type="number" className="inp" placeholder="3.5" value={weight} onChange={e=>setWeight(e.target.value)} step="0.1" min="0"/></div>
                <div style={{flex:1}}><div className="lbl">תאריך</div>
                  <div className="date-disp" onClick={()=>setShowDatePicker(true)}>
                    <span style={{fontSize:14,fontWeight:600,color:selectedDate?"#1a0a04":"#bbb"}}>{selectedDate?fmtShort(selectedDate):"בחר"}</span>
                    <span style={{fontSize:13,opacity:0.5}}>📅</span>
                  </div>
                </div>
              </div>
              <div><div className="lbl">מ״ל לדקה</div><input type="number" className="inp" placeholder="למשל: 5" value={mlPerMin} onChange={e=>setMlPerMin(e.target.value)} step="0.5" min="0"/></div>
              <button onClick={()=>setSettingsOpen(false)} style={{width:"100%",padding:"10px",borderRadius:12,border:`1.5px solid ${t.accent}`,background:"none",fontFamily:"inherit",fontSize:14,fontWeight:700,color:t.accent,cursor:"pointer"}}>✓ סיום הגדרות</button>
            </div>
          </div>
        </div>

        {/* Target */}
        {target!==null&&(
          <div className={`card ${animateNew?"pulse":""}`} style={{padding:"14px 15px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:15,fontWeight:800,color:t.textDark}}>🎯 יעד יומי</div>
              <div style={{fontSize:11,color:t.statSub}}>{weight} ק״ג × 150</div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["יעד",target.toFixed(0),false],["נצרך",grand.toFixed(0),pct>=100],["נשאר",pct>=100?"✓":left?.toFixed(0),false]].map(([lbl,val,green])=>(
                <div key={lbl} style={{flex:1,background:green?"linear-gradient(135deg,#d4f5dc,#b8efc4)":`linear-gradient(135deg,${t.stat},${t.statB})`,borderRadius:12,padding:"11px 12px",border:`1px solid ${green?"#5cb87088":t.border}`,textAlign:"center"}}>
                  <div style={{fontSize:10,fontWeight:700,color:green?"#2a7a40":t.statSub,textTransform:"uppercase",marginBottom:3}}>{lbl}</div>
                  <div style={{fontSize:26,fontWeight:900,color:green?"#1a6830":t.statText,lineHeight:1}}>{val}</div>
                  <div style={{fontSize:11,color:green?"#2a7a40":t.statSub,marginTop:1}}>{lbl==="נשאר"&&pct>=100?"הושג!":"מ״ל"}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:t.textDark}}>{pct>=100?"✅ היעד הושג!":`${pct.toFixed(0)}% מהיעד`}</span>
              {!mlPerMin&&totalMins>0&&<span style={{fontSize:11,color:t.accent}}>⚠️ חסר מ״ל/דק׳</span>}
            </div>
            <div className="prog-bg"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
          </div>
        )}

        {/* Add Feeding */}
        <div className="card" style={{padding:"14px 15px"}}>
          <div className="sec-title">➕ הוספת האכלה</div>
          <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
            <button className={`mode-btn ${feedMode==="time"?"active":""}`} onClick={()=>setFeedMode("time")}>⏱ התחלה/סיום</button>
            <button className={`mode-btn ${feedMode==="manual"?"active":""}`} onClick={()=>setFeedMode("manual")}>✏️ דקות ידנית</button>
            <button className={`mode-btn ${feedMode==="sw"?"active":""}`} onClick={()=>setFeedMode("sw")}>⏱ שעון עצר</button>
            <button className={`mode-btn ${feedMode==="ml"?"active":""}`} onClick={()=>setFeedMode("ml")}>🧴 מ״ל שאוב</button>
          </div>

          {feedMode==="time"&&(
            <div style={{marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,justifyItems:"center"}}>
                <div style={{width:"100%"}}>
                  <div className="lbl">שעת התחלה</div>
                  <TimeWheel hour={startHour} setHour={setStartHour} min={startMin} setMin={setStartMin}/>
                </div>
                <div style={{width:"100%"}}>
                  <div className="lbl">שעת סיום</div>
                  <TimeWheel hour={endHour} setHour={setEndHour} min={endMin} setMin={setEndMin}/>
                </div>
              </div>
              {timeError&&<div style={{marginTop:8,padding:"7px 12px",background:"#fff0ee",borderRadius:10,textAlign:"center",fontSize:13,fontWeight:700,color:"#c03020"}}>⚠️ {timeError}</div>}
              {!timeError&&diffOk&&<div style={{marginTop:8,padding:"7px 12px",background:`linear-gradient(135deg,${t.stat},${t.statB})`,borderRadius:10,textAlign:"center",fontSize:14,fontWeight:700,color:t.accent}}>
                ⏱ {diffVal} דקות{mlPerMin?` ≈ ${(diffVal*parseFloat(mlPerMin)).toFixed(1)} מ״ל`:""}
              </div>}
            </div>
          )}

          {feedMode==="manual"&&(
            <div style={{marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
              <div><div className="lbl">שעת התחלה</div><TimeWheel hour={startHour} setHour={setStartHour} min={startMin} setMin={setStartMin}/></div>
              <div>
                <div className="lbl">מספר דקות</div>
                <input type="number" className="inp" placeholder="למשל: 12" value={manualMins} onChange={e=>setManualMins(e.target.value)} min="0"/>
                {mlPerMin&&manualMins&&!isNaN(+manualMins)&&<div style={{fontSize:12,color:t.text,marginTop:4}}>≈ {(+manualMins*+mlPerMin).toFixed(1)} מ״ל</div>}
              </div>
            </div>
          )}

          {feedMode==="ml"&&(
            <div style={{marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
              <div><div className="lbl">שעת האכלה</div><TimeWheel hour={startHour} setHour={setStartHour} min={startMin} setMin={setStartMin}/></div>
              <div><div className="lbl">כמות (מ״ל)</div><input type="number" className="inp" placeholder="למשל: 60" value={pumpedMl} onChange={e=>setPumpedMl(e.target.value)} min="0"/></div>
            </div>
          )}
          {feedMode==="sw"&&(
            <div style={{marginBottom:14}}>
              {/* Big timer display */}
              <div style={{textAlign:"center",padding:"20px 0 16px"}}>
                <div style={{fontSize:64,fontWeight:900,color:swRunning?t.accent:t.textDark,letterSpacing:2,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
                  {pad(swMins)}:{pad(swSecs)}
                </div>
                {swElapsed>0&&mlPerMin&&(
                  <div style={{fontSize:13,color:t.statSub,marginTop:6,fontWeight:600}}>
                    ≈ {(swMins*parseFloat(mlPerMin)).toFixed(1)} מ״ל
                  </div>
                )}
              </div>
              {/* Controls */}
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                {!swRunning&&swElapsed===0&&(
                  <button onClick={swStart} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${t.accent},${t.accentDark})`,color:"white",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer"}}>▶ התחל</button>
                )}
                {swRunning&&(
                  <button onClick={swPause} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f0a030,#d08010)",color:"white",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer"}}>⏸ השהה</button>
                )}
                {!swRunning&&swElapsed>0&&(
                  <>
                    <button onClick={swStart} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${t.accent},${t.accentDark})`,color:"white",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer"}}>▶ המשך</button>
                    <button onClick={swReset} style={{flex:1,padding:"14px",borderRadius:14,border:`1.5px solid ${t.border}`,background:"none",fontFamily:"inherit",fontSize:16,fontWeight:800,color:t.text,cursor:"pointer"}}>↺ אפס</button>
                  </>
                )}
              </div>
            </div>
          )}
          {feedMode!=="ml"&&(
            <div style={{marginBottom:12}}>
              <div className="lbl">צד ההנקה</div>
              <div style={{display:"flex",gap:8}}>
                <button className={`mode-btn ${feedSide==="right"?"active":""}`} onClick={()=>setFeedSide(s=>s==="right"?"":"right")}>◀️ ימין</button>
                <button className={`mode-btn ${feedSide==="left"?"active":""}`} onClick={()=>setFeedSide(s=>s==="left"?"":"left")}>▶️ שמאל</button>
                <button className={`mode-btn ${feedSide==="both"?"active":""}`} onClick={()=>setFeedSide(s=>s==="both"?"":"both")}>↔️ שניהם</button>
              </div>
            </div>
          )}
          <button className="btn-p" onClick={feedMode==="sw"?swFinish:addFeeding} style={{opacity:feedMode==="sw"&&swElapsed===0?0.4:1}}>
            {feedMode==="sw"?`✅ סיים ושמור (${pad(swMins)}:${pad(swSecs)})`:"הוסף האכלה"}
          </button>
        </div>

        {/* Add Diaper */}
        <div className="card" style={{padding:"14px 15px"}}>
          <div className="sec-title">🚼 חיתול</div>
          <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{flexShrink:0}}>
              <div className="lbl">שעה</div>
              <TimeWheel hour={diaperHour} setHour={setDiaperHour} min={diaperMin} setMin={setDiaperMin}/>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:0,height:132}}>
              <div className="lbl" style={{marginBottom:6}}>סוג</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
                <button className={`mode-btn ${diaperType==="pee"?"active":""}`} onClick={()=>setDiaperType(d=>d==="pee"?"":"pee")} style={{width:"100%",flex:1,height:0}}>💧 פיפי</button>
                <button className={`mode-btn ${diaperType==="poo"?"active":""}`} onClick={()=>setDiaperType(d=>d==="poo"?"":"poo")} style={{width:"100%",flex:1,height:0}}>💩 קקי</button>
                <button className={`mode-btn ${diaperType==="both"?"active":""}`} onClick={()=>setDiaperType(d=>d==="both"?"":"both")} style={{width:"100%",flex:1,height:0}}>💧💩 שניהם</button>
              </div>
            </div>
          </div>
          <div style={{marginTop:14}}>
            <button className="btn-p" onClick={addDiaper} style={{opacity:diaperType?1:0.5}}>הוסף חיתול</button>
          </div>
        </div>

        {/* Today's log */}
        {(dayF.length>0||dayD.length>0)
          ?<DaySummary date={selectedDate} feedings={feedings} diapers={diapers} mlPerMin={mlPerMin} t={t} onEdit={openEdit} onDelete={deleteItem}/>
          :<div style={{textAlign:"center",padding:"26px 20px",color:t.text}}>
            <div style={{fontSize:40,marginBottom:8,cursor:"pointer"}} onClick={()=>setShowPhotoPicker(true)}>
              {babyPhoto?.type==="emoji"?babyPhoto.value:"🍼"}
            </div>
            <div style={{fontWeight:700,fontSize:14}}>עוד לא הוכנסו נתונים להיום</div>
            <div style={{fontSize:12,marginTop:3,opacity:0.75}}>הוסף האכלה או חיתול למעלה</div>
          </div>
        }
        </>}
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BabyFeedingTracker));
