/* ═════════════════════════════════════════════════════════════════════
   শিখন ভল্ট · কণ্ঠ পাঠক
   আপনার লেখা, নোট ও নোটবুক বাংলা বা ইংরেজিতে, আবেগ ও সুরসহ পড়ে শোনায়।

   কীভাবে কাজ করে
   1. লেখাকে বাক্যে ভাগ করে (বাংলা "।" সহ), প্রতিটি বাক্যের ভাষা (বাংলা/ইংরেজি) চেনে।
   2. বাক্যের ভাব (আনন্দ, দুঃখ, রাগ, ভয়, বিস্ময়, মায়া), যতিচিহ্ন (? ! …), সংলাপ,
      শিরোনাম ও মোটা লেখা দেখে প্রতিটি অংশের গতি, সুর ও বিরতি ঠিক করে।
   3. প্রশ্ন ও বিস্ময়ের বাক্যে শেষ শব্দে সুর তুলে বাঙালির স্বাভাবিক টান আনে।
   4. অ্যান্ড্রয়েড অ্যাপে ফোনের নিজস্ব TTS (Capacitor TextToSpeech), ব্রাউজারে Web Speech ব্যবহার করে।
   ═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var SK=window.__sk;if(!SK)return;
var $=function(i){return document.getElementById(i)};
var esc=SK.esc,bn=SK.bn,toast=SK.toast;

/* ───────── ইঞ্জিন নির্ধারণ ───────── */
var CAP=window.Capacitor,NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform()),TN=null;
try{if(NATIVE)TN=(CAP.Plugins&&CAP.Plugins.TextToSpeech)||(CAP.registerPlugin&&CAP.registerPlugin('TextToSpeech'))||null}catch(e){TN=null}
var WS=('speechSynthesis' in window&&'SpeechSynthesisUtterance' in window)?window.speechSynthesis:null,useNative=!!TN;
if(!TN&&!WS){document.documentElement.classList.add('rd-none');return}

/* ───────── সেটিংস ───────── */
var KEY='shikhon-reader-v2',DEF={style:'auto',rate:.95,pitch:1,emo:0,pause:60,lang:'auto',hl:true,scroll:true,vbn:'',ven:'',sleep:0,ckey:'',cvid:''},S={};
function loadS(){var o={};try{o=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}for(var k in DEF)S[k]=(k in o&&typeof o[k]===typeof DEF[k])?o[k]:DEF[k]}
function saveS(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
loadS();

/* ───────── পড়ার ঢং ───────── */
var STY={
 auto:{n:'স্বাভাবিক',d:'আবেগ নিজে থেকে ধরে',e:'🗣️',rate:1,pitch:1,emo:1,pause:1},
 story:{n:'গল্প বলা',d:'নাটকীয় ওঠানামা',e:'📖',rate:.94,pitch:1,emo:1.5,pause:1.25},
 news:{n:'খবর পাঠ',d:'স্পষ্ট ও স্থির',e:'📰',rate:1.04,pitch:.97,emo:.3,pause:.8},
 calm:{n:'শান্ত',d:'ধীর, ঘুমপাড়ানি',e:'🌙',rate:.84,pitch:.93,emo:.5,pause:1.55},
 pep:{n:'উদ্দীপনা',d:'জোরালো বক্তৃতা',e:'🔥',rate:1.1,pitch:1.05,emo:1.6,pause:.8},
 poem:{n:'কবিতা',d:'ছন্দ ধরে ধীরে',e:'🪶',rate:.88,pitch:1,emo:1.1,pause:1.4}
};
/* ভাব চেনার শব্দভান্ডার (বাংলা ও ইংরেজি) */
var MOOD={
 sad:/দুঃখ|দুখ|কষ্ট|কান্না|কাঁদ|কেঁদ|হারিয়ে|হারাল|বিদায়|একা|ব্যথা|মৃত্যু|মারা গ|ক্ষতি|ব্যর্থ|হতাশ|অশ্রু|চোখের জল|বিষণ্ণ|নিঃসঙ্গ|আফসোস|শোক|বেদনা|\b(sad|sorry|lost|cry|crying|tears|pain|alone|death|died|grief|failed|miss you|heartbroken)\b/i,
 fear:/ভয়|আতঙ্ক|ভুতুড়ে|ভূত|অন্ধকার|রহস্য|হঠাৎ|নিস্তব্ধ|শিউরে|ছমছম|\b(fear|afraid|dark|suddenly|mystery|scary|silent|terrified)\b/i,
 anger:/রাগ|ক্ষোভ|ঘৃণা|অন্যায়|অত্যাচার|ধিক্কার|প্রতিবাদ|সাবধান|সতর্ক|বিপদ|জরুরি|কখনো না|কক্ষনো|\b(angry|danger|warning|urgent|never|stop|must|hate|furious)\b/i,
 joy:/আনন্দ|খুশি|খুশী|দারুণ|চমৎকার|অসাধারণ|সুন্দর|সফল|জয়|বিজয়|অভিনন্দন|শুভ|হাসি|হাসত|উৎসব|ধন্যবাদ|মজা|দুর্দান্ত|বাহ|\b(wow|great|amazing|awesome|congrat\w*|happy|wonderful|excellent|fantastic|thank\w*|joy|win|won|success\w*)\b/i,
 wonder:/আশ্চর্য|বিস্ময়|অবিশ্বাস্য|অবাক|অদ্ভুত|\b(incredible|unbelievable|surprising|astonish\w*|amazing)\b/i,
 love:/ভালোবাসি|ভালবাসি|ভালোবাসা|ভালবাসা|প্রিয়|আদর|স্বপ্ন|মনে পড়ে|মায়া|হৃদয়|(^|[\s,।!?“"‘'])(মা|বাবা|আম্মু|আব্বু)(?=[\s,।!?”"’']|$)|\b(dear|darling|beloved|heart|dream|mother|father|miss)\b/i
};
var MORDER=['sad','fear','anger','joy','wonder','love'];
var MFX={sad:{p:-.09,r:-.13,v:.82},fear:{p:-.05,r:-.09,v:.88},anger:{p:.04,r:.06,v:1},joy:{p:.10,r:.07,v:1},wonder:{p:.12,r:-.04,v:1},love:{p:.02,r:-.07,v:.92}};
var IJ=/^(আহা+|ইস+|উফ+|বাহ্?|হায়|ওহ|ছি|ধুর|আরে|আরেব্বাস|ওরে বাবা|ওমা|ও মা|মাগো|মা গো|ওহে|wow|oh|ah+|oops|alas|yay|hooray|hey)(?=[\s,!.…?।]|$)/i;

/* ───────── ছোট সহায়ক ───────── */
function clamp(v,a,b){return v<a?a:v>b?b:v}
var EMO_RE;try{EMO_RE=new RegExp('[\\p{Extended_Pictographic}\\u200d\\ufe0f]','gu')}catch(e){EMO_RE=/[☀-➿\uD83C-􏰀-\uDFFF‍️]/g}
var BN=/[ঀ-৿]/,LAT=/[A-Za-z]/,HASL=/[ঀ-৿A-Za-z0-9]/;
var EM_ON='\u0001',EM_OFF='\u0002';

/* ───────── বাক্য ভাগ ───────── */
var ABBR=/(^|[\s(])(Dr|Mr|Mrs|Ms|Prof|St|vs|etc|No|ড|মো|মোঃ|অধ্যাপক)$/i;
function splitSent(t){
  var out=[],n=t.length,st=0,i=0;
  function push(a,b){while(a<b&&/\s/.test(t.charAt(a)))a++;while(b>a&&/\s/.test(t.charAt(b-1)))b--;if(b>a&&HASL.test(t.slice(a,b)))out.push({a:a,e:b})}
  while(i<n){var c=t.charAt(i);
    if(c==='\n'){push(st,i);st=i+1;i++;continue}
    if(c==='।'||c==='॥'||c==='!'||c==='?'||c==='…'||c==='.'){
      var j=i+1;while(j<n&&(/[।॥!?…\.]/.test(t.charAt(j))))j++;
      while(j<n&&/["”’'»)\]]/.test(t.charAt(j)))j++;
      if(c==='.'&&j===i+1){
        if(j<n&&!/\s/.test(t.charAt(j))){i=j;continue}          /* ৩.৫ বা a.b */
        if(ABBR.test(t.slice(Math.max(0,i-12),i))){i=j;continue}  /* Dr. Mr. */
      }
      push(st,j);st=j;i=j;continue}
    i++}
  push(st,n);return out}
function chunkLong(t,max){
  var out=[];t=t.trim();
  while(t.length>max){var cut=-1,m,re=/[,;:،]\s/g;
    while((m=re.exec(t))&&m.index<max)cut=m.index+1;
    if(cut<40){cut=t.lastIndexOf(' ',max);if(cut<20)cut=max}
    out.push(t.slice(0,cut).trim());t=t.slice(cut).trim()}
  if(t)out.push(t);return out}

/* ───────── ভাষা চেনা (বাংলা / ইংরেজি) ───────── */
function wordLang(w){return BN.test(w)?'bn':(LAT.test(w)?'en':null)}
function langRuns(t){
  if(S.lang==='bn')return[{t:t,lang:'bn'}];if(S.lang==='en')return[{t:t,lang:'en'}];
  var tk=t.split(/(\s+)/),runs=[],cur=null;
  tk.forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){if(cur)cur.t+=w;return}
    var l=wordLang(w);
    if(!cur){cur={t:w,lang:l,n:l?1:0};return}
    if(!l||l===cur.lang||!cur.lang){cur.t+=w;if(!cur.lang&&l)cur.lang=l;if(l)cur.n++;return}
    runs.push(cur);cur={t:w,lang:l,n:1}});
  if(cur)runs.push(cur);
  /* এক শব্দের ছোট রান পাশের রানের সঙ্গে মিশিয়ে দিই (যেমন বাংলার ভেতরে PDF, Ads) */
  var changed=true;
  while(changed&&runs.length>1){changed=false;
    for(var i=0;i<runs.length;i++){var r=runs[i];
      if(r.n<2&&(runs.length>1)){var tgt=i>0?runs[i-1]:runs[i+1];
        if(i>0){tgt.t+=r.t}else{tgt.t=r.t+tgt.t}tgt.n+=r.n;runs.splice(i,1);changed=true;break}}
    /* পাশাপাশি একই ভাষার রান জোড়া লাগাই */
    for(var k=1;k<runs.length;k++){if(runs[k].lang===runs[k-1].lang){runs[k-1].t+=runs[k].t;runs[k-1].n+=runs[k].n;runs.splice(k,1);changed=true;break}}}
  return runs.map(function(r){return{t:r.t,lang:r.lang||'bn'}})}

/* ───────── বলার উপযোগী লেখা ───────── */
function cleanBase(t){
  return t.replace(/https?:\/\/\S+|www\.\S+/gi,function(){return '\u0003'})
    .replace(EMO_RE,' ').replace(/[*_`~#>|]+/g,' ').replace(/[•▪◦●■▶►→]/g,', ')
    .replace(/\s*[—–]\s*/g,', ').replace(/[(){}\[\]]/g,', ').replace(/[ \t]+/g,' ').trim()}

/* ───────── সংখ্যা → বিশুদ্ধ বাংলা শব্দ (উচ্চারণ স্পষ্ট করতে) ───────── */
var BN_W='শূন্য,এক,দুই,তিন,চার,পাঁচ,ছয়,সাত,আট,নয়,দশ,এগারো,বারো,তেরো,চৌদ্দ,পনেরো,ষোল,সতেরো,আঠারো,উনিশ,বিশ,একুশ,বাইশ,তেইশ,চব্বিশ,পঁচিশ,ছাব্বিশ,সাতাশ,আটাশ,ঊনত্রিশ,ত্রিশ,একত্রিশ,বত্রিশ,তেত্রিশ,চৌত্রিশ,পঁয়ত্রিশ,ছত্রিশ,সাঁইত্রিশ,আটত্রিশ,ঊনচল্লিশ,চল্লিশ,একচল্লিশ,বিয়াল্লিশ,তেতাল্লিশ,চুয়াল্লিশ,পঁয়তাল্লিশ,ছেচল্লিশ,সাতচল্লিশ,আটচল্লিশ,ঊনপঞ্চাশ,পঞ্চাশ,একান্ন,বাহান্ন,তিপ্পান্ন,চুয়ান্ন,পঞ্চান্ন,ছাপ্পান্ন,সাতান্ন,আটান্ন,ঊনষাট,ষাট,একষট্টি,বাষট্টি,তেষট্টি,চৌষট্টি,পঁয়ষট্টি,ছেষট্টি,সাতষট্টি,আটষট্টি,ঊনসত্তর,সত্তর,একাত্তর,বাহাত্তর,তিয়াত্তর,চুয়াত্তর,পঁচাত্তর,ছিয়াত্তর,সাতাত্তর,আটাত্তর,ঊনআশি,আশি,একাশি,বিরাশি,তিরাশি,চুরাশি,পঁচাশি,ছিয়াশি,সাতাশি,অষ্টাশি,ঊননব্বই,নব্বই,একানব্বই,বিরানব্বই,তিরানব্বই,চুরানব্বই,পঁচানব্বই,ছিয়ানব্বই,সাতানব্বই,আটানব্বই,নিরানব্বই'.split(',');
function bnWords(n){
  if(n<100)return BN_W[n];
  var u=[[10000000,'কোটি'],[100000,'লাখ'],[1000,'হাজার']],i,out=[];
  for(i=0;i<u.length;i++){if(n>=u[i][0]){var q=Math.floor(n/u[i][0]);out.push(bnWords(q)+' '+u[i][1]);n%=u[i][0]}}
  if(n>=100){var h=Math.floor(n/100);out.push(BN_W[h]+'শো');n%=100}
  if(n>0)out.push(BN_W[n]);
  return out.join(' ')}
function bnDigitsToWords(t){
  t=t.replace(/[০-৯]/g,function(d){return '০১২৩৪৫৬৭৮৯'.indexOf(d)});
  t=t.replace(/(\d),(?=\d{2,3}(?!\d))/g,'$1');
  return t.replace(/\d+(?:\.\d+)?/g,function(m){
    var p=m.split('.'),ip=p[0];
    if(ip.length>9||(ip.length>=8&&!p[1]))return m.replace(/\d/g,function(d){return BN_W[+d]+' '}).replace(/\s+$/,'');
    var r=ip.length>1&&ip.charAt(0)==='0'?ip.split('').map(function(d){return BN_W[+d]}).join(' '):bnWords(parseInt(ip,10));
    if(p[1])r+=' দশমিক '+p[1].split('').map(function(d){return BN_W[+d]}).join(' ');
    return r})}
function normLang(t,lang){
  t=t.replace(/\u0003/g,lang==='en'?' link ':' লিংক ');
  if(lang==='en')t=t.replace(/(\d)\s*%/g,'$1 percent').replace(/৳\s*(\d[\d,.]*)/g,'$1 taka').replace(/&/g,' and ');
  else t=t.replace(/([\d০-৯])\s*%/g,'$1 শতাংশ').replace(/৳\s*([\d০-৯][\d০-৯,.]*)/g,'$1 টাকা').replace(/৳/g,'টাকা').replace(/&/g,' এবং ');
  if(lang!=='en')t=bnDigitsToWords(t);
  return t.replace(/(,\s*){2,}/g,', ').replace(/^[,\s]+|[,\s]+$/g,'').replace(/\s+/g,' ').trim()}

/* ───────── ভাব ও সুর ───────── */
function moodOf(t){var best='',bc=0;MORDER.forEach(function(m){var re=MOOD[m],c=0,g=new RegExp(re.source,re.flags.replace('g','')+'g'),x;while((x=g.exec(t))){c++;if(!x[0])g.lastIndex++}if(c>bc){bc=c;best=m}});return best}
function endOf(t){var s=t.replace(/["”’'»)\]\s]+$/,'');
  if(/…$|\.{3,}$/.test(s))return '…';
  if(/[?？]$/.test(s)||/[?？][!"”’']*$/.test(s))return '?';
  if(/!$/.test(s)||/!+$/.test(s))return '!';
  return '.'}

/* ═════ বাক্যের তালিকা বানানো ═════ */
function collect(el){
  var text='',nodes=[],em=[];
  (function walk(n){
    for(var c=n.firstChild;c;c=c.nextSibling){
      if(c.nodeType===3){var v=c.nodeValue;nodes.push({n:c,s:text.length,e:text.length+v.length});text+=v}
      else if(c.nodeType===1){var tg=c.tagName;
        if(tg==='BR'){text+='\n';continue}
        if(tg==='SCRIPT'||tg==='STYLE'||tg==='svg'||tg==='SVG'||tg==='BUTTON')continue;
        var s0=text.length;walk(c);if((tg==='STRONG'||tg==='B')&&text.length>s0)em.push([s0,text.length])}}
  })(el);
  return{text:text,nodes:nodes,em:em}}
var BSEL='h1,h2,h3,h4,h5,h6,p,li,blockquote,.dli>div';
function blocksOf(root){
  var els=[].slice.call(root.querySelectorAll(BSEL)).filter(function(el){return!el.querySelector(BSEL)});
  return els.map(function(el){var c=collect(el),tg=el.tagName;
    c.el=el;c.kind=/^H[1-6]$/.test(tg)?'h':(tg==='LI'||(el.parentNode&&el.parentNode.classList&&el.parentNode.classList.contains('dli'))?'li':(tg==='BLOCKQUOTE'?'q':'p'));return c})}
function marked(b,a,e){var t=b.text,out='',pos=a;
  b.em.filter(function(r){return r[1]>a&&r[0]<e}).forEach(function(r){var s=Math.max(r[0],a),x=Math.min(r[1],e);if(s<pos)return;out+=t.slice(pos,s)+EM_ON+t.slice(s,x)+EM_OFF;pos=x});
  return out+t.slice(pos,e)}
function buildSegs(blocks,live){
  var segs=[],qIn=false;
  blocks.forEach(function(b,bi){
    var ss=splitSent(b.text),prevMood='',made=[];
    ss.forEach(function(s,si){
      var plain=b.text.slice(s.a,s.e),endc=endOf(plain),mood=moodOf(plain);
      if(!mood&&prevMood&&(prevMood==='sad'||prevMood==='fear'||prevMood==='love'))mood=prevMood;
      prevMood=mood;
      var dlg=qIn||/^["“‘«]/.test(plain);
      for(var q=0;q<plain.length;q++){var ch=plain.charAt(q);if(ch==='“'||ch==='‘'||ch==='«')qIn=true;else if(ch==='”'||ch==='’'||ch==='»')qIn=false;else if(ch==='"')qIn=!qIn}
      var seg={idx:segs.length,bi:bi,a:s.a,e:s.e,kind:b.kind,raw:marked(b,s.a,s.e),disp:plain.replace(/\s+/g,' ').trim(),endc:endc,mood:mood,dlg:dlg,
        lastInBlock:si===ss.length-1,els:[],parts:[]};
      segs.push(seg);made.push(seg)});
    b.segs=made});
  segs.forEach(function(s){s.parts=mkParts(s)});
  /* ফাঁকা (শুধু চিহ্নওয়ালা) বাক্য বাদ দিয়ে নতুন করে নম্বর দিই */
  segs=segs.filter(function(s){return s.parts.length});segs.forEach(function(s,i){s.idx=i});
  return segs}

/* ═════ একটি বাক্যকে "অংশে" ভেঙে প্রতিটির গতি/সুর/বিরতি ঠিক করা ═════ */
function mkParts(seg){
  var st=STY[S.style]||STY.auto,E=Math.max(0,S.emo/100)*st.emo,
      rate=S.rate*st.rate,pitch=S.pitch*st.pitch,vol=1,rX=0,pX=0,tailP=0;
  if(seg.kind==='h'){rate*=.93;pitch*=1.03+(S.style==='news'?0:.02*E)}
  else if(seg.kind==='q'){rate*=.95;pitch*=.98}
  if(seg.endc==='?'){tailP=.17*E;rX-=.02*E}
  else if(seg.endc==='!'){pX+=.06*E;rX+=.05*E;tailP=.09*E}
  else if(seg.endc==='…'){rX-=.1*E;pX-=.04*E;vol*=1-.08*E}
  var fx=MFX[seg.mood];if(fx){pX+=fx.p*E;rX+=fx.r*E;vol*=1-(1-fx.v)*Math.min(E,1.4)}
  if(seg.dlg){pX+=.06*E;rX+=.02*E}
  rate=clamp(rate*(1+rX),.5,2);pitch=clamp(pitch*(1+pX),.6,1.6);vol=clamp(vol,.55,1);

  /* মোটা লেখার অংশ আলাদা করি */
  var pieces=[],buf='',em=false,i,ch;
  for(i=0;i<seg.raw.length;i++){ch=seg.raw.charAt(i);
    if(ch===EM_ON){if(buf)pieces.push({t:buf,em:false});buf='';em=true}
    else if(ch===EM_OFF){if(buf)pieces.push({t:buf,em:em&&buf.length<=70});buf='';em=false}
    else buf+=ch}
  if(buf)pieces.push({t:buf,em:false});

  var ps=[];
  pieces.forEach(function(pc,pi){
    var t=cleanBase(pc.t);if(!t||!HASL.test(t.replace(/\u0003/g,'ক')))return;
    var base={rate:rate,pitch:pitch,vol:vol,gap:0,em:pc.em};
    if(pc.em){base.pitch=clamp(pitch*(1+.05*Math.max(E,.4)),.6,1.6);base.rate=clamp(rate*.93,.5,2)}
    /* আহা, ইস, বাহ… এ ধরনের ধ্বনিকে আলাদা আবেগে */
    if(ps.length===0&&!pc.em&&E>0.25){var m=IJ.exec(t);
      if(m&&t.length>m[0].length+2){
        var rest=t.slice(m[0].length).replace(/^[\s,!.…?।]+/,'');
        ps.push({t:m[0],lang:BN.test(m[0])?'bn':'en',rate:clamp(rate*.82,.5,2),pitch:clamp(pitch*(1+.12*E),.6,1.6),vol:1,gap:Math.round(190*st.pause),em:false});
        t=rest}}
    if(!t)return;
    langRuns(t).forEach(function(r,ri){
      var tx=normLang(r.t,r.lang);if(!tx||!HASL.test(tx))return;
      chunkLong(tx,r.lang==='bn'?220:260).forEach(function(c){
        ps.push({t:c,lang:r.lang,rate:base.rate,pitch:base.pitch,vol:base.vol,gap:0,em:base.em})})})});
  if(!ps.length)return[];

  /* প্রশ্ন/বিস্ময়ে শেষ শব্দে সুর তোলা — বাঙালির স্বাভাবিক টান */
  if(tailP>0.01){var last=ps[ps.length-1];
    if(!last.em){var w=last.t.split(' ');
      if(w.length>=4){var k=w.length>=8?2:1;
        last.t=w.slice(0,-k).join(' ');
        ps.push({t:w.slice(-k).join(' '),lang:last.lang,rate:clamp(last.rate*.93,.5,2),pitch:clamp(last.pitch*(1+tailP),.6,1.7),vol:last.vol,gap:0,em:false})}}}

  /* বিরতি */
  var base=({'?':420,'!':380,'…':650,'.':360})[seg.endc]||360;
  if(seg.lastInBlock){base=Math.max(base,({h:720,li:300,q:560,p:600})[seg.kind]||600);if(seg.kind==='li')base=300;if(S.style==='poem')base=Math.max(base,520)}
  var scale=st.pause*(S.pause/100);
  ps[ps.length-1].gap=Math.round(base*scale);
  for(var x=0;x<ps.length-1;x++){if(ps[x].gap===0&&ps[x].lang!==ps[x+1].lang)ps[x].gap=40}
  return ps}

function rebuildParts(){R.segs.forEach(function(s){s.parts=mkParts(s)})}

/* ═════ কণ্ঠ (ভয়েস) তালিকা ═════ */
var VL=[],LANGS=[],bnOK=null;
function normTag(l){return String(l||'').replace('_','-')}
function voiceKey(v){return v.n+'|'+v.l}
function rank(v,kind){var s=0,n=v.n.toLowerCase(),l=v.l.toLowerCase();
  if(/natural|neural|online|enhanced|premium|wavenet/.test(n))s+=3;
  if(kind==='bn'){if(l==='bn-bd')s+=2;else if(l==='bn-in')s+=1}
  else{if(l==='en-in')s+=4;else if(l==='en-gb')s+=2;else if(l==='en-us')s+=1}
  if(/google/.test(n))s+=.5;return s}
function listFor(kind){return VL.filter(function(v){return v.l.toLowerCase().indexOf(kind)===0})}
function voiceFor(kind){
  var list=listFor(kind),saved=kind==='bn'?S.vbn:S.ven,v=null;
  if(saved)v=list.filter(function(x){return voiceKey(x)===saved})[0]||null;
  if(!v&&list.length)v=list.slice().sort(function(a,b){return rank(b,kind)-rank(a,kind)})[0];
  var bcp;
  if(v)bcp=v.l;
  else if(useNative&&LANGS.length){
    var pref=kind==='bn'?['bn-BD','bn-IN','bn']:['en-IN','en-GB','en-US','en'];
    bcp=pref.filter(function(p){return LANGS.indexOf(p)>-1})[0]||LANGS.filter(function(l){return l.toLowerCase().indexOf(kind)===0})[0]||(kind==='bn'?'bn-BD':'en-IN')}
  else bcp=kind==='bn'?'bn-BD':'en-IN';
  return{v:v,bcp:bcp}}
function refreshVoices(cb){
  function done(){
    var b=listFor('bn').length>0||(useNative&&LANGS.some(function(l){return l.toLowerCase().indexOf('bn')===0}));
    bnOK=b;if(cb)cb();paintVoices()}
  if(useNative){
    Promise.all([
      TN.getSupportedVoices?TN.getSupportedVoices().then(function(r){return r&&r.voices||[]}).catch(function(){return[]}):Promise.resolve([]),
      TN.getSupportedLanguages?TN.getSupportedLanguages().then(function(r){return r&&r.languages||[]}).catch(function(){return[]}):Promise.resolve([])
    ]).then(function(a){
      VL=a[0].map(function(v,i){return{n:v.name||v.voiceURI||('voice '+i),l:normTag(v.lang),i:i,loc:v.localService!==false}});
      LANGS=a[1].map(normTag);done()});
    return}
  var vs=WS.getVoices()||[];
  VL=vs.map(function(v,i){return{n:v.name,l:normTag(v.lang),i:i,loc:v.localService,o:v}});done()}
if(WS){try{WS.onvoiceschanged=function(){if(!useNative)refreshVoices()}}catch(e){}}

/* ═════ প্লেব্যাক ইঞ্জিন ═════ */
var R={segs:[],i:0,p:0,st:'idle',gen:0,tm:0,wd:0,src:'',root:null,label:'',quiet:false,u:null,err:0,sl:0};
function isBenign(e){return /interrupted|canceled|cancelled|aborted/i.test(String(e&&(e.error||e.message)||e||''))}

/* ═════ অনলাইন নিউরাল বাংলা কণ্ঠ (Cartesia) ═════
   কী ও ভয়েস আইডি দিলে বাংলা/ইংরেজি এই কণ্ঠে পড়া হয়; না দিলে বা ব্যর্থ হলে ফোনের কণ্ঠ চলে। */
var CAPI='https://api.cartesia.ai/tts/bytes',CMODEL='sonic-3.6',CBASE=1.37,CVOL=1.7,CC={},CCN=[];
function cloudConf(){return !!(S.ckey&&S.ckey.trim()&&S.cvid&&S.cvid.trim())}
function cloudOn(){return cloudConf()&&!R.cloudOff}
function cspeed(){return clamp(Math.round(S.rate*CBASE*100)/100,.6,1.5)}
function cloudFetch(part){
  var lang=part.lang==='en'?'en':'bn',key=lang+'|'+cspeed()+'|'+S.cvid+'|'+part.t;
  if(CC[key])return CC[key];
  var headers={'Authorization':'Bearer '+S.ckey.trim(),'Cartesia-Version':'2026-03-01','Content-Type':'application/json'};
  var body={model_id:CMODEL,transcript:part.t,voice:{mode:'id',id:S.cvid.trim()},language:lang,
    output_format:{container:'mp3',sample_rate:44100,bit_rate:128000},generation_config:{speed:cspeed(),volume:CVOL}};
  var H=NATIVE&&CAP&&CAP.Plugins&&CAP.Plugins.CapacitorHttp,p;
  if(H&&H.request){
    p=H.request({url:CAPI,method:'POST',headers:headers,data:body,responseType:'blob'}).then(function(r){
      if(!r||r.status>=400)throw new Error('HTTP '+(r&&r.status));
      return 'data:audio/mpeg;base64,'+r.data})}
  else{
    p=fetch(CAPI,{method:'POST',headers:headers,body:JSON.stringify(body)}).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);return r.blob()}).then(function(b){return URL.createObjectURL(b)})}
  CC[key]=p;CCN.push(key);
  if(CCN.length>10){var old=CCN.shift();delete CC[old]}
  p.catch(function(){delete CC[key]});
  return p}
function prefetch(){
  if(!cloudOn())return;
  var i=R.i,p=R.p+1,n=0;
  while(n<2&&i<R.segs.length){var sg=R.segs[i];
    if(p>=sg.parts.length){i++;p=0;continue}
    cloudFetch(sg.parts[p]).catch(function(){});p++;n++}}
function playCloud(part,end,fallback,g){
  cloudFetch(part).then(function(url){
    if(g!==R.gen)return;
    R.cErr=0;
    var a=new Audio(url);R.au=a;
    a.onended=function(){end()};
    a.onerror=function(){end('err')};
    var pr=a.play();if(pr&&pr.catch)pr.catch(function(){end('err')})
  },function(e){
    if(g!==R.gen)return;
    R.cErr=(R.cErr||0)+1;
    var m=String(e&&e.message||e);
    if(!R.cWarn){R.cWarn=true;toast(/401|403/.test(m)?'অনলাইন কণ্ঠের কী ঠিক নয়, ফোনের কণ্ঠে পড়ছি':'অনলাইন কণ্ঠ পাওয়া যায়নি, ফোনের কণ্ঠে পড়ছি')}
    if(R.cErr>=2)R.cloudOff=true;
    fallback()})}

function engCancel(){
  try{if(R.au){R.au.onended=null;R.au.onerror=null;R.au.pause();R.au=null}}catch(e){}
  try{if(useNative&&TN&&TN.stop){var p=TN.stop();if(p&&p.catch)p.catch(function(){})}}catch(e){}
  try{if(WS)WS.cancel()}catch(e){}}
function engSpeak(part,done){
  var g=R.gen,fin=false,v=voiceFor(part.lang);
  var wd=0;
  function end(err){if(fin)return;fin=true;clearTimeout(wd);if(g!==R.gen)return;done(err)}
  var est=Math.max(3000,(part.t.length/(10*part.rate))*1000+4000)+(cloudOn()?15000:0);
  wd=R.wd=setTimeout(function(){if(g!==R.gen)return;engCancel();end('timeout')},est);
  function web(){
    try{var u=new SpeechSynthesisUtterance(part.t);R.u=u;u.lang=v.bcp;if(v.v&&v.v.o)u.voice=v.v.o;
      u.rate=part.rate;u.pitch=part.pitch;u.volume=part.vol;
      u.onend=function(){end()};u.onerror=function(e){end(isBenign(e)?'':(e&&e.error)||'err')};
      if(WS.paused)WS.resume();WS.speak(u)}catch(e){end('err')}}
  function device(){
  if(useNative){
    var o={text:part.t,lang:v.bcp,rate:part.rate,pitch:part.pitch,volume:part.vol,category:'playback'};
    if(v.v&&v.v.i!=null&&((part.lang==='bn'?S.vbn:S.ven)))o.voice=v.v.i;
    try{TN.speak(o).then(function(){end()},function(e){
      var m=String(e&&(e.message||e.code)||e||'');
      if(/unimplemented|not implemented/i.test(m)&&WS){useNative=false;if(g===R.gen&&!fin)web();return}
      end(isBenign(e)?'':m||'err')})}catch(e){end('err')}
  }else web()}
  if(cloudOn()){playCloud(part,end,device,g);prefetch()}else device()}

function step(){
  if(R.st!=='playing')return;
  while(R.i<R.segs.length&&!R.segs[R.i].parts.length){R.i++;R.p=0}
  if(R.i>=R.segs.length){finish();return}
  var seg=R.segs[R.i];
  if(R.p===0)focusSeg(seg);
  var part=seg.parts[R.p];if(!part){R.i++;R.p=0;step();return}
  engSpeak(part,function(err){
    if(err&&err!=='timeout'){R.err++;if(R.err>=2){fail();return}}else R.err=0;
    R.p++;var gap=part.gap||0;
    if(R.p>=seg.parts.length){R.i++;R.p=0}
    R.tm=setTimeout(step,gap)})}
function fail(){
  var q=R.quiet;rdStop();
  toast('কণ্ঠ চালু করা গেল না। সেটিংসে গিয়ে ফোনের বাংলা ভয়েস ডেটা ইনস্টল আছে কিনা দেখুন');
  if(!q)openSheet()}
function finish(){
  R.st='done';R.i=0;R.p=0;clearTimeout(R.tm);clearTimeout(R.wd);keep(false);unwrap();
  if(R.quiet){R.st='idle';R.quiet=false;paintSheetPlay();return}
  paintPlayer('পড়া শেষ ✓','আবার শুনতে ▶ চাপুন');syncBtns()}
function halt(){R.gen++;clearTimeout(R.tm);clearTimeout(R.wd);engCancel()}
function go(){clearTimeout(R.tm);R.tm=setTimeout(step,useNative?30:90)}
function play(idx){halt();R.st='playing';R.err=0;R.i=idx==null?R.i:idx;R.p=0;paintState();keep(true);armSleep();go()}
function pause(){if(R.st!=='playing')return;halt();R.st='paused';paintState();keep(false)}
function resume(){if(R.st!=='paused')return;halt();R.st='playing';R.err=0;paintState();keep(true);go()}
function seek(i){i=clamp(i,0,R.segs.length-1);var was=R.st;if(was==='idle')return;halt();R.st='playing';R.i=i;R.p=0;R.err=0;paintState();keep(true);go()}
function restartCurrent(){if(R.st!=='playing')return;halt();R.p=0;go()}
function rdStop(){
  halt();clearTimeout(R.sl);R.sl=0;R.st='idle';R.segs=[];R.src='';R.quiet=false;keep(false);unwrap();R.root=null;
  var p=$('rdr');if(p)p.hidden=true;document.body.classList.remove('rd-on');paintSheetPlay();syncBtns();layout()}

/* অ্যান্ড্রয়েডে স্ক্রিন বন্ধ হলেও যেন সার্ভিস জেগে থাকে (মূল অ্যাপের KeepAlive এটি দেখে) */
function keep(on){var k=$('rdKeep');if(on&&!k){k=document.createElement('i');k.id='rdKeep';k.hidden=true;document.body.appendChild(k)}else if(!on&&k)k.remove()}
function armSleep(){clearTimeout(R.sl);R.sl=0;if(S.sleep>0&&!R.quiet)R.sl=setTimeout(function(){if(R.st==='playing'||R.st==='paused'){rdStop();toast('😴 ঘুমের টাইমার: পড়া বন্ধ করা হলো')}},S.sleep*60000)}

/* ═════ লেখার মধ্যে হাইলাইট ═════ */
function wrapLive(blocks,segs){
  blocks.forEach(function(b){
    var rs=(b.segs||[]).filter(function(s){return segs.indexOf(s)>-1}).sort(function(x,y){return x.a-y.a});if(!rs.length)return;
    b.nodes.forEach(function(nd){
      var pcs=[];rs.forEach(function(r){var a=Math.max(r.a,nd.s),e=Math.min(r.e,nd.e);if(a<e)pcs.push({a:a,e:e,seg:r})});
      if(!pcs.length||!nd.n.parentNode)return;
      var v=nd.n.nodeValue,frag=document.createDocumentFragment(),p=nd.s;
      pcs.forEach(function(pc){
        if(pc.a>p)frag.appendChild(document.createTextNode(v.slice(p-nd.s,pc.a-nd.s)));
        var sp=document.createElement('span');sp.className='rs';sp.setAttribute('data-rs',pc.seg.idx);sp.textContent=v.slice(pc.a-nd.s,pc.e-nd.s);
        frag.appendChild(sp);pc.seg.els.push(sp);p=pc.e});
      if(p<nd.e)frag.appendChild(document.createTextNode(v.slice(p-nd.s)));
      nd.n.parentNode.replaceChild(frag,nd.n)})})}
function unwrap(){
  var r=R.root;if(!r||!document.documentElement.contains(r))return;
  [].forEach.call(r.querySelectorAll('.rs'),function(s){s.parentNode.replaceChild(document.createTextNode(s.textContent),s)});
  try{r.normalize()}catch(e){}R.root=null}
var curEls=[];
function focusSeg(seg){
  curEls.forEach(function(e){e.classList.remove('on')});curEls=seg.els||[];
  curEls.forEach(function(e){e.classList.add('on')});
  if(curEls[0]&&S.scroll){try{var el=curEls[0],sc=$('vb'),r=el.getBoundingClientRect(),h=window.innerHeight;
    if(r.top<110||r.bottom>h-190)el.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}}
  paintPlayer(null,seg.disp)}

/* ═════ উৎস থেকে লেখা বের করা ═════ */
function detached(title,body){
  var d=document.createElement('div');d.className='dpg art';
  d.innerHTML=(title?'<h1 class="atl">'+esc(title)+'</h1>':'')+SK.mdHtml(String(body||'').slice(0,60000));return d}
function sourceOf(spec){
  var vs=SK.vs(),m=/^(\w+):?(.*)$/.exec(spec)||[],k=m[1],id=m[2],it=id?SK.find(id):null,r;
  if(k==='view'){
    if(!vs)return null;
    if(vs.art&&vs.edit){var t=$('aTitle'),b=$('aBody');return{root:detached(t?t.value.trim():'',b?b.value:''),live:false,label:(t&&t.value.trim())||'আপনার লেখা'}}
    if(!vs.wrap){toast('লেখা খোলা হচ্ছে, একটু পরে আবার চাপুন');return null}
    if(vs.wrap.tagName==='PRE')return{root:detached('',vs.wrap.textContent),live:false,label:(vs.item&&vs.item.file&&vs.item.file.name)||'টেক্সট ফাইল'};
    return{root:vs.wrap,live:true,label:SK.ttl(vs.item)||'লেখা'}}
  if(k==='abody'){var tt=SK.srcMode()==='note'?$('ttl').value.trim():'';return{root:detached(tt,$('abody').value),live:false,label:tt||'আপনার লেখা (খসড়া)'}}
  if(k==='note')return{root:detached('',$('note').value),live:false,label:'আপনার নোট'};
  if(!it)return null;
  if(k==='art')return{root:detached(it.title||'',it.body),live:false,label:SK.ttl(it)};
  if(k==='inote')return{root:detached('',it.note),live:false,label:SK.ttl(it)+' · নোট'};
  if(k==='memo')return{root:detached('',it.memo),live:false,label:SK.ttl(it)+' · নোটবুক'};
  return null}

function startFrom(spec){
  /* একই উৎস চলছে বা থেমে আছে হলে বোতাম টগল করে */
  if(R.src===spec&&!R.quiet){
    if(R.st==='playing'){pause();return}
    if(R.st==='paused'){resume();return}
    if(R.st==='done'){play(0);return}}
  var src=sourceOf(spec);if(!src)return;
  rdStop();
  var blocks=blocksOf(src.root),segs=buildSegs(blocks,src.live);
  if(!segs.length){toast('পড়ার মতো লেখা নেই। আগে কিছু লিখুন');return}
  R.src=spec;R.label=src.label;R.segs=segs;R.root=src.live?src.root:null;R.quiet=false;
  if(src.live&&S.hl)wrapLive(blocks,segs);
  document.body.classList.add('rd-on');document.body.classList.toggle('rd-hl',!!S.hl);
  buildPlayer();$('rdr').hidden=false;
  var sk=$('rdSeek');sk.max=Math.max(0,segs.length-1);sk.value=0;fillRange(sk);
  layout();syncBtns();
  /* ভয়েস তালিকা প্রস্তুত না থাকলে একবার চেষ্টা করে নিই */
  var begin=function(){if(R.src===spec&&R.st==='idle')play(0)};
  if(!VL.length&&bnOK===null)refreshVoices(begin);else begin()}

/* ═════ নমুনা শোনা ═════ */
var SAMPLE={bn:'স্বাগতম! আজ আমরা একসঙ্গে নতুন কিছু শিখব। আপনি কি প্রস্তুত? আহা, শেখার আনন্দই আলাদা…',
            en:'Welcome! Today we will learn something new together. Are you ready? Oh, the joy of learning is wonderful…'};
function sample(lang){
  if(R.quiet&&R.sampleLang===lang&&R.st==='playing'){rdStop();return}
  var keepOpen=R.src&&!R.quiet;if(keepOpen)rdStop();else rdStop();
  var d=detached('',SAMPLE[lang]),blocks=blocksOf(d),segs=buildSegs(blocks,false);
  R.segs=segs;R.quiet=true;R.sampleLang=lang;R.src='sample';R.label='নমুনা';R.root=null;
  play(0);paintSheetPlay()}

/* ═════ UI: প্লেয়ার ═════ */
var IC={
 head:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.8"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.8"/></svg>',
 play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 001.2.7l11-6.8a.8.8 0 000-1.4l-11-6.8A.8.8 0 008 5.2z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>',
 redo:'<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"><path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
 prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14"/><path d="M19 5.5v13a.5.5 0 01-.8.4L9.5 12.4a.5.5 0 010-.8l8.7-6.5a.5.5 0 01.8.4z"/></svg>',
 next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14"/><path d="M5 5.5v13a.5.5 0 00.8.4l8.7-6.5a.5.5 0 000-.8L5.8 5.1a.5.5 0 00-.8.4z"/></svg>',
 tune:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>'};
function eq(){return '<span class="rdeq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'}
function buildPlayer(){
  if($('rdr'))return;
  var d=document.createElement('div');d.id='rdr';d.className='rdr';d.hidden=true;d.setAttribute('role','region');d.setAttribute('aria-label','পড়ে শোনানো');
  d.innerHTML='<div class="rdt"><button class="rdplay" id="rdPlay" type="button" aria-label="চালান">'+IC.play+'</button>'
    +'<div class="rdtx"><div class="rdlbl"><span id="rdLb">এখন শুনছেন</span></div><p class="rdcap" id="rdCap"></p></div>'+eq()
    +'<button class="rdx" id="rdX" type="button" aria-label="বন্ধ করুন">✕</button></div>'
    +'<div class="rdc"><button class="rdib" id="rdPrev" type="button" aria-label="আগের বাক্য">'+IC.prev+'</button>'
    +'<div class="rdsk"><input id="rdSeek" type="range" min="0" max="0" value="0" step="1" aria-label="কতটুকু পড়া হলো"><b id="rdCnt">০/০</b></div>'
    +'<button class="rdib" id="rdNext" type="button" aria-label="পরের বাক্য">'+IC.next+'</button>'
    +'<button class="rdib spd" id="rdSpd" type="button" aria-label="গতি বদলান">১×</button>'
    +'<button class="rdib" id="rdSet" type="button" aria-label="কণ্ঠ ও সেটিংস">'+IC.tune+'</button></div>';
  document.body.appendChild(d);
  $('rdPlay').addEventListener('click',function(){
    if(R.st==='playing')pause();else if(R.st==='paused')resume();else if(R.st==='done'||R.st==='idle')play(0)});
  $('rdX').addEventListener('click',rdStop);
  $('rdPrev').addEventListener('click',function(){if(R.st==='done'){play(Math.max(0,R.segs.length-1));return}seek(R.p>0||R.i===0?R.i:R.i-1)});
  $('rdNext').addEventListener('click',function(){if(R.st==='done')return;seek(R.i+1>=R.segs.length?R.i:R.i+1)});
  $('rdSpd').addEventListener('click',function(){var L=[.8,.9,1,1.15,1.3,1.5],k=0,d=1e9;L.forEach(function(x,i){var q=Math.abs(x-S.rate);if(q<d){d=q;k=i}});S.rate=L[(k+1)%L.length];saveS();onTune();toast('গতি '+bn(S.rate)+'×')});
  $('rdSet').addEventListener('click',openSheet);
  var sk=$('rdSeek');
  sk.addEventListener('input',function(){fillRange(sk);$('rdCnt').textContent=bn(+sk.value+1)+'/'+bn(R.segs.length)});
  sk.addEventListener('change',function(){if(R.st==='done'){R.st='playing'}seek(+sk.value)});
  paintSpd()}
function fillRange(el){var mn=+el.min||0,mx=+el.max||0,v=+el.value;el.style.setProperty('--v',mx>mn?((v-mn)*100/(mx-mn))+'%':'0%')}
function paintSpd(){var b=$('rdSpd');if(b)b.textContent=bn(S.rate)+'×'}
function paintState(){
  var d=$('rdr');if(!d)return;
  d.classList.toggle('speaking',R.st==='playing');
  var b=$('rdPlay');b.innerHTML=R.st==='playing'?IC.pause:(R.st==='done'?IC.redo:IC.play);
  b.setAttribute('aria-label',R.st==='playing'?'থামান':(R.st==='done'?'আবার শুনুন':'চালান'));
  $('rdLb').textContent=(R.st==='paused'?'বিরতি · ':'এখন শুনছেন · ')+R.label;
  syncBtns();paintSheetPlay()}
function paintPlayer(lb,cap){
  if(!$('rdr'))return;
  if(lb)$('rdLb').textContent=lb;else $('rdLb').textContent=(R.st==='paused'?'বিরতি · ':'এখন শুনছেন · ')+R.label;
  $('rdCap').textContent=cap||'';
  var sk=$('rdSeek');sk.max=Math.max(0,R.segs.length-1);if(R.st!=='done')sk.value=R.i;fillRange(sk);
  $('rdCnt').textContent=bn(Math.min(R.i+1,R.segs.length))+'/'+bn(R.segs.length);
  paintSpd()}
function syncBtns(){
  [].forEach.call(document.querySelectorAll('[data-rd],#vl'),function(b){
    var sp=b.id==='vl'?'view':b.getAttribute('data-rd'),on=!R.quiet&&R.src===sp&&R.st==='playing';
    b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');
    var t=b.querySelector('.rdtx2');if(t)t.textContent=on?'থামান':'শুনুন'})}
function layout(){
  var d=$('rdr');if(!d)return;
  var V=$('viewer'),extra=0;
  if(V&&!V.hidden&&!V.classList.contains('imm')){var bb=!$('vbar').hidden?$('vbar'):(!$('xbar').hidden?$('xbar'):null);if(bb)extra=bb.offsetHeight}
  d.style.setProperty('--rdb',(12+extra)+'px')}

/* ═════ UI: সেটিংস শিট ═════ */
function buildSheet(){
  if($('rds'))return;
  var d=document.createElement('div');d.id='rds';d.className='rds';d.hidden=true;
  var sty=Object.keys(STY).map(function(k){var s=STY[k];return '<button type="button" class="rdst" data-rst="'+k+'"><span class="em">'+s.e+'</span><b>'+s.n+'</b><small>'+s.d+'</small></button>'}).join('');
  function sl(id,t,mn,mx,stp,l,r){return '<div class="rdsl"><div class="h"><span>'+t+'</span><em id="'+id+'V"></em></div><input type="range" id="'+id+'" min="'+mn+'" max="'+mx+'" step="'+stp+'"><div class="e"><span>'+l+'</span><span>'+r+'</span></div></div>'}
  d.innerHTML='<div class="rdsh" role="dialog" aria-modal="true" aria-label="কণ্ঠ ও পড়ার সেটিংস"><div class="rdgrab"></div><button class="rdsx" id="rdsX" type="button" aria-label="বন্ধ করুন">✕</button>'
   +'<div class="rdhero" id="rdHero"><div class="ic">'+IC.head.replace('<svg','<svg')+'</div><h2>কণ্ঠ পাঠক</h2><p>আপনার লেখা বাংলা বা ইংরেজিতে, বাঙালির আবেগ ও সুর দিয়ে পড়ে শোনায়।</p>'
   +'<div class="rdtry"><button type="button" id="rdTbn">'+IC.play.replace('<svg','<svg style="width:15px;height:15px"')+'<span>বাংলা নমুনা</span></button><button type="button" id="rdTen">'+IC.play.replace('<svg','<svg style="width:15px;height:15px"')+'<span>English sample</span></button>'+eq()+'</div></div>'
   +'<div class="rdwarn" id="rdWarn" hidden><b>⚠ ফোনে বাংলা কণ্ঠ পাওয়া যায়নি</b><span>বাংলা শুনতে ফোনের "Google Text-to-speech" ইঞ্জিনে বাংলা ভয়েস ডেটা লাগে।</span>'
   +'<ol><li>ফোনের <b>সেটিংস → ভাষা → টেক্সট-টু-স্পিচ</b> খুলুন</li><li>ইঞ্জিন হিসেবে <b>Google</b> বাছুন, তারপর <b>ভয়েস ডেটা ইনস্টল</b> চাপুন</li><li>তালিকা থেকে <b>বাংলা (বাংলাদেশ)</b> নামিয়ে নিন</li></ol><button type="button" id="rdInst">ভয়েস ডেটা ইনস্টল করুন</button></div>'
   +'<div class="rdsec">অনলাইন বাংলা কণ্ঠ (Cartesia)</div><div class="rdvc"><label for="rdCk">API কী (sk_car_...)</label><input id="rdCk" class="rdin" type="password" autocomplete="off" spellcheck="false" placeholder="sk_car_..."></div><div class="rdvc"><label for="rdCv">ভয়েস আইডি</label><input id="rdCv" class="rdin" type="text" autocomplete="off" spellcheck="false" placeholder="ভয়েস আইডি বসান"></div><p class="rdcn" id="rdCs"></p>'
   +'<div class="rdsec">পড়ার ঢং</div><div class="rdsty">'+sty+'</div>'
   +'<div class="rdsec">সুর ও গতি</div>'
   +sl('rdR','গতি',.6,1.6,.05,'ধীরে','দ্রুত')+sl('rdP','সুরের উচ্চতা',.8,1.2,.05,'ভারী','চড়া')+sl('rdE','আবেগের মাত্রা',0,100,5,'সমতল','খুব আবেগী')+sl('rdB','বিরতি',50,200,10,'ছোট','লম্বা')
   +'<div class="rdsec">ভাষা</div><div class="rdseg" id="rdLang"><button type="button" data-l="auto">স্বয়ংক্রিয়</button><button type="button" data-l="bn">বাংলা</button><button type="button" data-l="en">English</button></div>'
   +'<div class="rdsec">কণ্ঠ বাছাই</div><div class="rdvc"><label for="rdVb">বাংলা কণ্ঠ</label><select id="rdVb"></select></div><div class="rdvc"><label for="rdVe">ইংরেজি কণ্ঠ</label><select id="rdVe"></select></div>'
   +'<div class="rdsec">পড়ার সময়</div>'
   +'<label class="rdtg"><div><b>বাক্য হাইলাইট</b><small>যে বাক্য পড়া হচ্ছে সেটি লেখায় আলাদা করে দেখায়</small></div><input type="checkbox" id="rdHl"><span class="sw"></span></label>'
   +'<label class="rdtg"><div><b>নিজে নিজে স্ক্রল</b><small>পড়ার সঙ্গে সঙ্গে লেখা নিচে নামে</small></div><input type="checkbox" id="rdSc"><span class="sw"></span></label>'
   +'<div class="rdvc"><label>😴 ঘুমের টাইমার</label><div class="rdseg" id="rdSlp"><button type="button" data-s="0">বন্ধ</button><button type="button" data-s="15">১৫ মি.</button><button type="button" data-s="30">৩০ মি.</button><button type="button" data-s="60">১ ঘণ্টা</button></div></div>'
   +'<div class="rdfoot"><button type="button" id="rdRst">ডিফল্টে ফিরিয়ে নিন</button><p>বাঙালির আবেগ আসে প্রশ্ন, বিস্ময়, দুঃখ-আনন্দের শব্দ, সংলাপ ও যতিচিহ্ন দেখে। কণ্ঠের মান নির্ভর করে আপনার ফোনের ভয়েস ইঞ্জিনের ওপর।</p></div></div>';
  document.body.appendChild(d);
  d.addEventListener('click',function(e){if(e.target===d)closeSheet()});
  $('rdsX').addEventListener('click',closeSheet);
  d.addEventListener('click',function(e){
    var b=e.target.closest('[data-rst]');if(b){S.style=b.getAttribute('data-rst');saveS();onTune();paintSheet();return}
    b=e.target.closest('#rdLang [data-l]');if(b){S.lang=b.getAttribute('data-l');saveS();onTune();paintSheet();return}
    b=e.target.closest('#rdSlp [data-s]');if(b){S.sleep=+b.getAttribute('data-s');saveS();paintSheet();if(R.st==='playing')armSleep();return}
  });
  [['rdR','rate'],['rdP','pitch'],['rdE','emo'],['rdB','pause']].forEach(function(p){
    var el=$(p[0]);el.addEventListener('input',function(){S[p[1]]=+el.value;fillRange(el);paintSheetVals()});
    el.addEventListener('change',function(){saveS();onTune()})});
  $('rdHl').addEventListener('change',function(){S.hl=this.checked;saveS();document.body.classList.toggle('rd-hl',S.hl)});
  $('rdSc').addEventListener('change',function(){S.scroll=this.checked;saveS()});
  $('rdVb').addEventListener('change',function(){S.vbn=this.value;saveS();onTune()});
  $('rdVe').addEventListener('change',function(){S.ven=this.value;saveS();onTune()});
  ['rdCk','rdCv'].forEach(function(id){$(id).addEventListener('change',function(){S[id==='rdCk'?'ckey':'cvid']=this.value.trim();R.cloudOff=false;R.cErr=0;R.cWarn=false;saveS();paintVoices()})});
  $('rdTbn').addEventListener('click',function(){sample('bn')});
  $('rdTen').addEventListener('click',function(){sample('en')});
  $('rdInst').addEventListener('click',function(){try{if(TN&&TN.openInstall){TN.openInstall().catch(function(){toast('ফোনের সেটিংস থেকে টেক্সট-টু-স্পিচে যান')});return}}catch(e){}toast('ফোনের সেটিংস → টেক্সট-টু-স্পিচ থেকে বাংলা ভয়েস নামিয়ে নিন')});
  $('rdRst').addEventListener('click',function(){var vb=S.vbn,ve=S.ven,ck=S.ckey,cv=S.cvid;for(var k in DEF)S[k]=DEF[k];S.vbn=vb;S.ven=ve;S.ckey=ck;S.cvid=cv;saveS();paintSheet();onTune();paintSpd();toast('✓ ডিফল্ট সেটিংস ফিরেছে')})}
function paintSheetVals(){
  $('rdRV').textContent=bn(S.rate)+'×';$('rdPV').textContent=bn(S.pitch);$('rdEV').textContent=bn(S.emo)+'%';$('rdBV').textContent=bn(S.pause)+'%'}
function paintSheet(){
  if(!$('rds'))return;
  [].forEach.call(document.querySelectorAll('.rdst'),function(b){b.classList.toggle('on',b.getAttribute('data-rst')===S.style)});
  [].forEach.call(document.querySelectorAll('#rdLang [data-l]'),function(b){b.classList.toggle('on',b.getAttribute('data-l')===S.lang)});
  [].forEach.call(document.querySelectorAll('#rdSlp [data-s]'),function(b){b.classList.toggle('on',+b.getAttribute('data-s')===S.sleep)});
  [['rdR','rate'],['rdP','pitch'],['rdE','emo'],['rdB','pause']].forEach(function(p){var el=$(p[0]);el.value=S[p[1]];fillRange(el)});
  $('rdHl').checked=!!S.hl;$('rdSc').checked=!!S.scroll;paintSheetVals();paintVoices()}
function paintVoices(){
  if(!$('rds'))return;
  function fill(id,kind,saved){var el=$(id),list=listFor(kind).sort(function(a,b){return rank(b,kind)-rank(a,kind)});
    var h='<option value="">স্বয়ংক্রিয় (সেরাটি বাছাই)</option>'+list.map(function(v){return '<option value="'+esc(voiceKey(v))+'"'+(voiceKey(v)===saved?' selected':'')+'>'+esc(v.n)+' · '+esc(v.l)+'</option>'}).join('');
    el.innerHTML=h;el.disabled=!list.length;if(!list.length)el.innerHTML='<option value="">'+(kind==='bn'?'কোনো বাংলা কণ্ঠ তালিকায় নেই (ভাষা ধরে চলবে)':'কোনো ইংরেজি কণ্ঠ তালিকায় নেই')+'</option>'}
  fill('rdVb','bn',S.vbn);fill('rdVe','en',S.ven);
  $('rdWarn').hidden=bnOK!==false||cloudConf();
  if($('rdCk')){$('rdCk').value=S.ckey||'';$('rdCv').value=S.cvid||'';$('rdCs').textContent=cloudConf()?'✓ চালু: বাংলা ও ইংরেজি এই কণ্ঠে পড়া হবে। "বাংলা নমুনা" চেপে শুনে দেখুন।':'কী ও ভয়েস আইডি দিলে অনলাইন কণ্ঠে পড়া হবে। না দিলে ফোনের কণ্ঠ চলবে। (কী শুধু এই ফোনেই থাকে)'}}
function paintSheetPlay(){
  var h=$('rdHero');if(!h)return;var sp=R.quiet&&R.st==='playing';h.classList.toggle('speaking',sp);
  $('rdTbn').classList.toggle('on',sp&&R.sampleLang==='bn');$('rdTen').classList.toggle('on',sp&&R.sampleLang==='en')}
var swallow=0;
function openSheet(){buildSheet();paintSheet();$('rds').hidden=false;refreshVoices();try{history.pushState({rds:1},'')}catch(e){}}
function closeSheet(pop){var s=$('rds');if(!s||s.hidden)return;s.hidden=true;if(R.quiet)rdStop();
  if(!pop&&history.state&&history.state.rds){swallow=1;try{history.back()}catch(e){swallow=0}}}
/* শিট খোলা থাকলে "পেছনে" বোতাম/Esc শুধু শিট বন্ধ করবে, নিচের ভিউয়ার নয় (মূল অ্যাপ এই দুটি ফাংশন ডাকে) */
function backPress(){var s=$('rds');
  if(swallow){swallow=0;return true}
  if(s&&!s.hidden){closeSheet(true);return true}
  return false}
function escPress(){var s=$('rds');if(s&&!s.hidden){closeSheet();return true}return false}

/* সুর/গতি/ঢং বদলালে বাকি অংশ নতুন সেটিংসে পড়া হবে */
var tuneT=0;
function onTune(){paintSpd();if(!R.segs.length)return;clearTimeout(tuneT);tuneT=setTimeout(function(){rebuildParts();if(R.st==='playing')restartCurrent()},250)}

/* ═════ ঘটনা: বোতাম ও হুক ═════ */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-rd],#vl,#rdOpen');if(!b)return;
  e.preventDefault();e.stopPropagation();
  if(b.id==='rdOpen'){openSheet();return}
  startFrom(b.id==='vl'?'view':b.getAttribute('data-rd'))},true);
/* পড়ার সময় কোনো বাক্যে ট্যাপ করলে সেখান থেকে শুরু */
document.addEventListener('click',function(e){
  if(R.st==='idle'||R.quiet)return;var s=e.target.closest&&e.target.closest('.rs');if(!s)return;
  var i=+s.getAttribute('data-rs');if(isNaN(i))return;
  if(R.st==='done')R.st='playing';seek(i)});

function viewShow(){var vs=SK.vs(),b=$('vl');if(!b)return;
  var ok=!!(vs&&(vs.art||(vs.item&&vs.item.file&&{text:1,docx:1}[SK.viewKind(vs.item)])));b.hidden=!ok}
window.ShikhonReader={
  layout:layout,
  hook:function(k){
    if(k==='close'){var b=$('vl');if(b)b.hidden=true;if(R.src==='view')rdStop();return}
    if(R.src==='view'&&R.st!=='idle')rdStop();
    viewShow();layout()},
  stop:rdStop,open:openSheet,back:backPress,esc:escPress};

/* ═════ শুরুতে ═════ */
refreshVoices();
setTimeout(function(){if(!VL.length&&!useNative)refreshVoices()},1200);
document.addEventListener('visibilitychange',function(){if(!document.hidden&&WS&&R.st==='playing'&&!useNative&&!WS.speaking&&!WS.pending){/* ব্রাউজার চুপ হয়ে গেলে বর্তমান বাক্য আবার */restartCurrent()}});
})();
