const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='history-goddess-v2';
const defaults={route:'home',chapter:0,scroll:{},readChapters:{},bookmarks:[],fontSize:18,lineHeight:1.95,theme:'light',readerWidth:760,layout:'auto',reviewEra:'全部',quizHistory:[],wrong:{},answers:{},sessionStart:Date.now(),readingSeconds:0};
let legacy={};try{legacy=JSON.parse(localStorage.getItem('history-goddess-v1')||'{}')}catch(e){}
let current={};try{current=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
let state=Object.assign({},defaults,legacy,current);let quiz=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function resolvedLayout(){if(state.layout==='mobile'||state.layout==='desktop')return state.layout;return matchMedia('(max-width:780px)').matches?'mobile':'desktop'}
function setTheme(){
  const root=document.documentElement;
  root.classList.remove('theme-dark','theme-sepia','layout-mobile','layout-desktop');
  if(state.theme!=='light')root.classList.add('theme-'+state.theme);
  root.classList.add('layout-'+resolvedLayout());
  root.style.setProperty('--reader-size',state.fontSize+'px');
  root.style.setProperty('--reader-line',state.lineHeight);
  root.style.setProperty('--reader-width',state.readerWidth+'px');
  const lb=$('#layoutBtn');if(lb){lb.textContent=resolvedLayout()==='mobile'?'▯':'▣';lb.title=`版面：${state.layout==='auto'?'自動・':''}${resolvedLayout()==='mobile'?'手機版':'電腦版'}`}
}
function nav(route){state.route=route;save();window.scrollTo(0,0);render();}
function progressPct(){const done=Object.keys(state.readChapters||{}).filter(k=>state.readChapters[k]).length;return Math.round(done/BOOK_CHAPTERS.length*100)}
function accuracy(){let c=0,t=0;for(const h of state.quizHistory||[]){c+=h.correct;t+=h.total}return t?Math.round(c/t*100):0}
function wrongCount(){return Object.values(state.wrong||{}).filter(x=>x.count>0).length}
function isBookmarked(ch=state.chapter){return (state.bookmarks||[]).some(x=>x.chapter===ch)}
function updateTopbar(){
  const reader=state.route==='reader';
  const bm=$('#bookmarkTopBtn');if(bm){bm.classList.toggle('hidden',!reader);bm.textContent=reader&&isBookmarked()?'★':'☆';bm.title=reader?(isBookmarked()?'更新本章書籤':'加入本章書籤'):'加入書籤'}
  const menu=$('#menuBtn');if(menu)menu.title=reader?'目錄與書籤':'章節導覽';
}
function render(){
  setTheme();updateTopbar();
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));
  const v=$('#view');
  if(state.route==='home')v.innerHTML=homeView();
  else if(state.route==='reader')readerView(v);
  else if(state.route==='review')v.innerHTML=reviewView();
  else if(state.route==='quiz')v.innerHTML=quizHome();
  else if(state.route==='wrong')v.innerHTML=wrongView();
  else if(state.route==='stats')v.innerHTML=statsView();
  bind();updateTopbar();
}
function homeView(){
  const ch=BOOK_CHAPTERS[state.chapter];
  return `<div class="container">
  <section class="hero"><img class="cover" src="cover.png" alt="封面"><div class="hero-panel"><div class="eyebrow">ONLY FOR THIS BOOK · READ × REVIEW × QUIZ</div><h1>${BOOK_META.title}</h1><div class="subtitle">${BOOK_META.subtitle}<br><br>先把故事讀進腦中，再用「重點整理」看課本圖，最後用段考型題目檢查自己。</div><div class="actions"><button class="btn btn-primary" data-action="continue">繼續閱讀</button><button class="btn btn-secondary" data-route="review">重點整理</button><button class="btn btn-secondary" data-route="quiz">直接做題</button></div></div></section>
  <div class="stats-grid"><div class="stat"><b>${progressPct()}%</b><small>閱讀進度</small></div><div class="stat"><b>${accuracy()}%</b><small>總答對率</small></div><div class="stat"><b>${wrongCount()}</b><small>錯題待複習</small></div><div class="stat"><b>${Math.round((state.readingSeconds||0)/60)}</b><small>閱讀分鐘</small></div></div>
  <div class="section-title"><div><h2>繼續上次進度</h2><p>${esc(ch.title)}</p></div></div><div class="card continue-card"><div><div class="progress"><i style="width:${progressPct()}%"></i></div><p style="color:var(--muted);margin-bottom:0">目前第 ${state.chapter+1}/${BOOK_CHAPTERS.length} 篇 · 自動記錄閱讀位置</p></div><button class="btn btn-primary" data-action="continue">打開</button></div>
  <div class="section-title"><div><h2>章節</h2><p>共 ${BOOK_CHAPTERS.length} 篇</p></div></div><div class="chapter-grid">${BOOK_CHAPTERS.map((c,i)=>`<button class="chapter-card" data-ch="${i}" style="text-align:left"><small>${state.readChapters[i]?'✓ 已讀':'CH '+String(i+1).padStart(2,'0')}</small><h3>${esc(c.title)}</h3><span style="color:var(--muted);font-size:13px">約 ${Math.max(1,Math.round(c.chars/800))} 分鐘</span></button>`).join('')}</div>
  </div>`;
}
function readerView(v){
  const c=BOOK_CHAPTERS[state.chapter];
  v.innerHTML=`<div class="reading-progress-fixed"><i id="readProgress" style="width:0"></i></div><div class="reader-shell"><article id="readerArticle"><header class="reader-head"><div class="kicker">${String(state.chapter+1).padStart(2,'0')} / ${BOOK_CHAPTERS.length}</div><h1>${esc(c.title)}</h1><div class="reader-meta"><span>☰ 目錄在上方選單</span><span>☆ 書籤在右上角</span><span>自動記錄閱讀位置</span></div></header><div class="reader-body">${c.html}</div></article><div class="reader-nav"><button class="btn btn-secondary" data-prev ${state.chapter===0?'disabled':''}>← 上一篇</button><button class="btn btn-primary" data-next ${state.chapter===BOOK_CHAPTERS.length-1?'disabled':''}>下一篇 →</button></div></div>`;
  setTimeout(()=>{window.scrollTo(0,(state.scroll||{})[state.chapter]||0);updateReadProgress()},0);
}
function reviewVisual(items){return `<div class="review-visual">${items.map(x=>`<div class="review-visual-step">${esc(x)}</div>`).join('')}</div>`}
function reviewMedia(t){
  if(t.images?.length)return `<div class="review-media"><div class="review-gallery">${t.images.map(src=>`<img src="${src}" alt="${esc(t.title)}課本圖">`).join('')}</div><div class="caption">${esc(t.source||'')}</div></div>`;
  if(t.image)return `<div class="review-media"><img src="${t.image}" alt="${esc(t.title)}課本圖"><div class="caption">${esc(t.source||'')}</div></div>`;
  return `<div class="review-media">${reviewVisual(t.visual||[])}</div>`;
}
function reviewView(){
  const eras=['全部',...new Set(REVIEW_TOPICS.map(x=>x.era))];
  const selected=state.reviewEra||'全部';
  const list=selected==='全部'?REVIEW_TOPICS:REVIEW_TOPICS.filter(x=>x.era===selected);
  const map={
    'near-east':1,'hellenistic':2,'rome':3,'hebrews':4,'middle-ages':5,'renaissance':7,'reformation':9,'westphalia':10,'science':11,'enlightenment':12
  };
  return `<div class="container"><section class="review-hero"><div><div class="eyebrow">EXAM REVIEW · TEXTBOOK VISUALS</div><h1>重點整理</h1><p>用課本原圖搭配一句話脈絡、必背因果與「看到這張圖要先判斷什麼」。適合讀完小說後複習，也適合考前直接掃一次。</p></div><div class="review-count"><b>${REVIEW_TOPICS.length}</b><small>主題卡</small></div></section>
  <div class="review-filter">${eras.map(e=>`<button class="chip ${selected===e?'active':''}" data-review-era="${esc(e)}">${esc(e)}</button>`).join('')}</div>
  <div class="review-grid">${list.map(t=>`<section class="review-card"><div class="review-main">${reviewMedia(t)}<div class="review-content"><span class="tag">${esc(t.era)}</span><h2>${esc(t.title)}</h2><p class="review-summary">${esc(t.summary)}</p><ul class="review-bullets">${t.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="review-exam"><b>段考看圖提示：</b> ${esc(t.exam)}</div><div class="review-actions"><button class="btn btn-secondary" data-review-ch="${map[t.id]??0}">回小說對應章</button><button class="btn btn-primary" data-review-topic="${esc(t.id)}">刷相關題</button></div></div></div></section>`).join('')}</div></div>`;
}
function quizHome(){
  const topics=[...new Set(QUESTION_BANK.map(q=>q.topic))];
  const groupCount=(window.QUESTION_GROUPS||[]).length;
  const groupQuestionCount=(window.QUESTION_GROUPS||[]).reduce((n,g)=>n+g.questions.length,0);
  return `<div class="container"><div class="section-title"><div><h2>段考練習</h2><p>${QUESTION_BANK.length} 題單題＋${groupCount} 組／${groupQuestionCount} 題題組 · 題型參考公開高中段考常見的史料、圖表、因果與跨章整合題，題幹重新改寫</p></div><button class="btn btn-secondary" data-route="wrong">錯題本 ${wrongCount()?`(${wrongCount()})`:''}</button></div>
  <div class="quiz-hero"><div class="mode-card"><span class="tag">快速</span><h3>10 題快刷</h3><p>單題立即回饋答案與解析，適合讀完一段馬上練。</p><button class="btn btn-primary" data-quiz="practice10">開始</button></div><div class="mode-card"><span class="tag">題組</span><h3>6 組題組特訓</h3><p>同一段史料或課本圖連續考 3 題，練人物、背景、因果與影響。</p><button class="btn btn-primary" data-quiz="groups6">開始</button></div><div class="mode-card"><span class="tag">模擬</span><h3>25 題段考模式</h3><p>混入 4 組題組＋13 題單題；作答中不顯示解析，交卷後一次看成績。</p><button class="btn btn-primary" data-quiz="mock25">開始</button></div></div>
  <div class="section-title"><div><h2>依單元練習</h2><p>選一個主題，題目會集中出現</p></div></div><div class="chips">${topics.map(t=>`<button class="chip" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function sample(arr,n){return shuffle(arr).slice(0,n)}
function randomizeQuestion(q,target){
  const copy={...q,options:[...q.options]};
  const correct=copy.options[copy.answer];
  const others=copy.options.filter((_,i)=>i!==copy.answer);
  const opts=[...others];
  opts.splice(target,0,correct);
  copy.options=opts;copy.answer=target;
  return copy;
}
function prepareSingles(qs){
  const targets=shuffle(qs.map((_,i)=>i%4));
  return qs.map((q,i)=>randomizeQuestion(q,targets[i]));
}
function prepareGroup(g){
  const targets=shuffle([0,1,2,3]);
  return {...g,questions:g.questions.map((q,i)=>randomizeQuestion(q,targets[i%4]))};
}
function questionCatalog(){return [...QUESTION_BANK,...((window.QUESTION_GROUPS||[]).flatMap(g=>g.questions))]}
function itemQuestionCount(item){return item.type==='group'?item.group.questions.length:1}
function quizAllQuestions(){return (quiz?.items||[]).flatMap(item=>item.type==='group'?item.group.questions:[item.question])}
function quizAnsweredCount(){return Object.keys(quiz?.answers||{}).length}
function startQuiz(mode,topic=null){
  let pool=topic?QUESTION_BANK.filter(q=>q.topic===topic):QUESTION_BANK;
  let items=[];
  if(mode==='mock'){
    const rawGs=sample(window.QUESTION_GROUPS||[],Math.min(4,(window.QUESTION_GROUPS||[]).length));
    const gs=rawGs.map(prepareGroup);
    const singles=prepareSingles(sample(pool,Math.max(0,25-gs.reduce((n,g)=>n+g.questions.length,0))));
    items=shuffle([...gs.map(g=>({type:'group',group:g})),...singles.map(q=>({type:'single',question:q}))]);
  }else if(mode==='groups'){
    const gs=sample(window.QUESTION_GROUPS||[],Math.min(6,(window.QUESTION_GROUPS||[]).length)).map(prepareGroup);
    items=gs.map(g=>({type:'group',group:g}));
  }else{
    items=prepareSingles(sample(pool,Math.min(10,pool.length))).map(q=>({type:'single',question:q}));
  }
  quiz={mode,items,itemIndex:0,correct:0,answers:{},draft:{},started:Date.now(),topic,total:items.reduce((n,x)=>n+itemQuestionCount(x),0)};
  state.route='quiz';renderQuizQuestion();
}
function startQuizForReview(id){
  const map={
    'near-east':['兩河與埃及'],'hellenistic':['希臘'],'rome':['羅馬'],'hebrews':['希伯來與基督教','基督教'],'middle-ages':['中古','中古歐洲'],'renaissance':['文藝復興'],'reformation':['宗教改革'],'westphalia':['宗教改革'],'science':['科學革命'],'enlightenment':['啟蒙']
  };
  const keys=map[id]||[];let pool=QUESTION_BANK.filter(q=>keys.some(k=>q.topic.includes(k)||k.includes(q.topic)));
  if(!pool.length)pool=QUESTION_BANK;
  const picked=prepareSingles(sample(pool,Math.min(10,pool.length)));
  quiz={mode:'practice',items:picked.map(q=>({type:'single',question:q})),itemIndex:0,correct:0,answers:{},draft:{},started:Date.now(),topic:'重點整理：'+id,total:picked.length};state.route='quiz';renderQuizQuestion();
}
function gradeQuestion(q,choice){
  const ok=choice===q.answer;
  quiz.answers[q.id]={qid:q.id,choice,correct:ok};
  if(ok)quiz.correct++;
  if(!ok){state.wrong[q.id]={count:(state.wrong[q.id]?.count||0)+1,last:Date.now()}}
  else if(state.wrong[q.id]){state.wrong[q.id].count=Math.max(0,state.wrong[q.id].count-1)}
  return ok;
}
function renderQuizQuestion(){
  const v=$('#view'),item=quiz.items[quiz.itemIndex];
  if(item.type==='group')return renderGroupItem(v,item.group);
  const q=item.question,answered=quiz.answers[q.id];
  const now=Math.min(quiz.total,quizAnsweredCount()+ (answered?0:1));
  v.innerHTML=`<div class="question-card"><div class="q-top"><span>${quiz.mode==='mock'?'模擬段考':'練習模式'} · ${esc(q.topic)} · ${esc(q.difficulty)}</span><span>${now}/${quiz.total}</span></div><div class="progress" style="margin:14px 0 24px"><i style="width:${quizAnsweredCount()/quiz.total*100}%"></i></div><h2>${esc(q.stem)}</h2>${q.image?`<img class="q-image" src="${q.image}" alt="題目附圖">`:''}<div class="options">${q.options.map((o,i)=>`<button class="option ${answered? (i===q.answer?'correct':(i===answered.choice&&i!==q.answer?'wrong':'')) : ''}" data-opt="${i}" ${answered?'disabled':''}><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}</button>`).join('')}</div>${answered&&quiz.mode!=='mock'?`<div class="explain"><b>${answered.correct?'答對了':'這題要再看一次'}</b><br>${esc(q.explanation)}</div>`:''}<div class="actions" style="justify-content:flex-end">${answered?`<button class="btn btn-primary" id="nextQ">${quiz.itemIndex===quiz.items.length-1?'看結果':'下一題'}</button>`:''}</div></div>`;bind();updateTopbar();
}
function renderGroupItem(v,g){
  const submitted=g.questions.every(q=>quiz.answers[q.id]);
  const allPicked=g.questions.every(q=>Object.prototype.hasOwnProperty.call(quiz.draft,q.id));
  const startNo=quizAnsweredCount()+1;
  const endNo=Math.min(quiz.total,startNo+g.questions.length-1);
  const media=g.images?.length?`<div class="group-images">${g.images.map(src=>`<img class="q-image" src="${src}" alt="${esc(g.title)}附圖">`).join('')}</div>`:(g.image?`<img class="q-image" src="${g.image}" alt="${esc(g.title)}附圖">`:'');
  v.innerHTML=`<div class="question-card group-card"><div class="q-top"><span>${quiz.mode==='mock'?'模擬段考｜題組':'題組特訓'} · ${esc(g.topic)}</span><span>${startNo}–${endNo}/${quiz.total}</span></div><div class="progress" style="margin:14px 0 24px"><i style="width:${quizAnsweredCount()/quiz.total*100}%"></i></div><section class="group-stimulus"><div class="eyebrow">SOURCE SET</div><h2>${esc(g.title)}</h2><p>${esc(g.stimulus)}</p>${media}</section><div class="group-questions">${g.questions.map((q,qi)=>{const ans=quiz.answers[q.id],draft=quiz.draft[q.id];return `<section class="group-question"><div class="group-qno">第 ${qi+1} 題 · ${esc(q.difficulty)}</div><h3>${esc(q.stem)}</h3><div class="options">${q.options.map((o,i)=>{let cls='';if(submitted&&quiz.mode!=='mock'){cls=i===q.answer?'correct':(i===ans?.choice&&i!==q.answer?'wrong':'')}else if(!submitted&&draft===i)cls='selected';return `<button class="option ${cls}" data-gqid="${esc(q.id)}" data-gopt="${i}" ${submitted?'disabled':''}><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}</button>`}).join('')}</div>${submitted&&quiz.mode!=='mock'?`<div class="explain"><b>${ans?.correct?'答對':'答案：'+String.fromCharCode(65+q.answer)}</b><br>${esc(q.explanation)}</div>`:''}</section>`}).join('')}</div><div class="actions" style="justify-content:flex-end">${submitted?`<button class="btn btn-primary" id="nextQ">${quiz.itemIndex===quiz.items.length-1?'看結果':'下一題組'}</button>`:`<button class="btn btn-primary" id="submitGroup" ${allPicked?'':'disabled'}>送出這一題組</button>`}</div></div>`;bind();updateTopbar();
}
function choose(i){
  const item=quiz.items[quiz.itemIndex];if(item.type!=='single')return;
  const q=item.question;if(quiz.answers[q.id])return;
  gradeQuestion(q,i);save();
  if(quiz.mode==='mock'){advanceQuizItem()}else renderQuizQuestion();
}
function chooseGroup(qid,i){if(quiz.answers[qid])return;quiz.draft[qid]=i;renderQuizQuestion()}
function submitGroup(){
  const item=quiz.items[quiz.itemIndex];if(item.type!=='group')return;
  const g=item.group;if(!g.questions.every(q=>Object.prototype.hasOwnProperty.call(quiz.draft,q.id)))return;
  g.questions.forEach(q=>gradeQuestion(q,quiz.draft[q.id]));save();
  if(quiz.mode==='mock'){advanceQuizItem()}else renderQuizQuestion();
}
function nextQ(){advanceQuizItem()}
function advanceQuizItem(){quiz.itemIndex++;quiz.draft={};if(quiz.itemIndex>=quiz.items.length)finishQuiz();else renderQuizQuestion()}
function finishQuiz(){
  const qs=quizAllQuestions(),total=quiz.total;
  const rec={date:Date.now(),correct:quiz.correct,total,mode:quiz.mode,topic:quiz.topic||(quiz.mode==='groups'?'題組特訓':'全範圍'),ids:qs.map(q=>q.id)};
  (state.quizHistory||(state.quizHistory=[])).unshift(rec);state.quizHistory=state.quizHistory.slice(0,30);save();
  const by={};qs.forEach(q=>{by[q.topic]??={c:0,t:0};by[q.topic].t++;if(quiz.answers[q.id]?.correct)by[q.topic].c++});
  $('#view').innerHTML=`<div class="container" style="max-width:760px"><div class="card" style="text-align:center"><div class="eyebrow">RESULT</div><div class="result-score">${Math.round(quiz.correct/total*100)}</div><h2>${quiz.correct} / ${total}</h2><p style="color:var(--muted)">${quiz.correct/total>=.8?'很穩，接下來刷錯題就好。':quiz.correct/total>=.6?'有基礎，建議針對弱單元再練。':'先回小說或重點整理補脈絡，再刷錯題會更有效。'}</p></div><div class="section-title"><h2>單元表現</h2></div><div class="card">${Object.entries(by).map(([t,x])=>`<div class="topic-row"><span>${esc(t)}</span><div class="progress"><i style="width:${x.c/x.t*100}%"></i></div><b>${x.c}/${x.t}</b></div>`).join('')}</div><div class="actions"><button class="btn btn-primary" data-route="wrong">練錯題</button><button class="btn btn-secondary" data-route="review">重點整理</button><button class="btn btn-secondary" data-route="quiz">再選一組</button></div></div>`;quiz=null;bind();
}
function wrongView(){const ids=Object.entries(state.wrong||{}).filter(([,v])=>v.count>0).sort((a,b)=>b[1].count-a[1].count).map(([id])=>id);const catalog=questionCatalog();const qs=ids.map(id=>catalog.find(q=>q.id===id)).filter(Boolean);return `<div class="container"><div class="section-title"><div><h2>錯題本</h2><p>答對會逐步降低錯題權重</p></div>${qs.length?`<button class="btn btn-primary" id="redoWrong">重練錯題</button>`:''}</div>${qs.length?`<div class="wrong-list">${qs.map(q=>`<div class="wrong-item"><span class="tag">${esc(q.topic)}</span><h4>${esc(q.stem)}</h4><small style="color:var(--muted)">錯誤權重 ${state.wrong[q.id].count}</small></div>`).join('')}</div>`:`<div class="empty">目前沒有錯題。去做一組題目吧 ✦</div>`}</div>`}
function statsView(){const hist=state.quizHistory||[];const topicMap={};questionCatalog().forEach(q=>topicMap[q.topic]??={wrong:0});Object.entries(state.wrong||{}).forEach(([id,v])=>{const q=questionCatalog().find(x=>x.id===id);if(q&&v.count>0)topicMap[q.topic].wrong+=v.count});return `<div class="container"><div class="section-title"><div><h2>學習紀錄</h2><p>只存於這台裝置的瀏覽器</p></div><button class="btn btn-secondary" data-route="wrong">錯題本 ${wrongCount()?`(${wrongCount()})`:''}</button></div><div class="stats-grid"><div class="stat"><b>${progressPct()}%</b><small>閱讀進度</small></div><div class="stat"><b>${accuracy()}%</b><small>總答對率</small></div><div class="stat"><b>${hist.length}</b><small>測驗次數</small></div><div class="stat"><b>${wrongCount()}</b><small>錯題數</small></div></div><div class="section-title"><h2>弱點雷達（錯題權重）</h2></div><div class="card">${Object.entries(topicMap).map(([t,x])=>`<div class="topic-row"><span>${esc(t)}</span><div class="progress"><i style="width:${Math.max(5,100-Math.min(100,x.wrong*15))}%"></i></div><b>${x.wrong}</b></div>`).join('')}</div><div class="section-title"><h2>最近測驗</h2></div><div class="history-list">${hist.length?hist.slice(0,8).map(h=>`<div class="card"><b>${esc(h.topic)} · ${h.mode==='mock'?'段考模式':'練習'}</b><span style="float:right;font-weight:900;color:var(--primary)">${h.correct}/${h.total}</span><div style="clear:both;color:var(--muted);font-size:13px;margin-top:6px">${new Date(h.date).toLocaleString()}</div></div>`).join(''):`<div class="empty">還沒有測驗紀錄。</div>`}</div></div>`}
function buildDrawer(tab='chapters'){
  const list=$('#chapterList'),marks=$('#bookmarkList');if(!list||!marks)return;
  list.innerHTML=BOOK_CHAPTERS.map((c,i)=>`<button class="drawer-item ${i===state.chapter?'active':''}" data-drawer-ch="${i}">${esc(c.title)}</button>`).join('');
  const bms=[...(state.bookmarks||[])].sort((a,b)=>b.date-a.date);
  marks.innerHTML=bms.length?bms.map((b,i)=>`<div class="bookmark-row"><button class="bookmark-item" data-bookmark-jump="${i}"><b>${esc(BOOK_CHAPTERS[b.chapter]?.title||'章節')}</b><small>約 ${Math.round(b.pct||0)}% · ${new Date(b.date).toLocaleString()}</small></button><button class="bookmark-delete" data-bookmark-delete="${i}" title="刪除書籤">×</button></div>`).join(''):`<div class="empty" style="padding:35px 10px">還沒有書籤。閱讀時按右上角 ☆ 就能記下位置。</div>`;
  $$('.drawer-tab').forEach(b=>b.classList.toggle('active',b.dataset.drawerTab===tab));
  list.classList.toggle('hidden',tab!=='chapters');marks.classList.toggle('hidden',tab!=='bookmarks');
}
function openDrawer(tab='chapters'){buildDrawer(tab);$('#drawer').classList.add('open');$('#shade').classList.add('show')}
function closeDrawer(){$('#drawer').classList.remove('open');$('#shade').classList.remove('show')}
function saveBookmark(){if(state.route!=='reader')return;const doc=document.documentElement,max=Math.max(1,doc.scrollHeight-innerHeight),pct=Math.min(100,scrollY/max*100);const item={chapter:state.chapter,pos:scrollY,pct,date:Date.now()};state.bookmarks=(state.bookmarks||[]).filter(x=>x.chapter!==state.chapter);state.bookmarks.push(item);save();updateTopbar();}
function openModal(html){$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden')}
function layoutModal(){openModal(`<h2>版面模式</h2><p style="color:var(--muted);line-height:1.6">可手動切成手機版或電腦版；「自動」會依目前螢幕寬度切換。</p><div class="chips" style="margin-top:14px"><button class="chip ${state.layout==='auto'?'active':''}" data-layout="auto">自動</button><button class="chip ${state.layout==='mobile'?'active':''}" data-layout="mobile">📱 手機版</button><button class="chip ${state.layout==='desktop'?'active':''}" data-layout="desktop">🖥 電腦版</button></div>`)}
function settings(){openModal(`<h2>閱讀設定</h2><div class="setting-row"><span>字體大小</span><div><button class="btn btn-secondary" data-font="-1">A−</button> <b>${state.fontSize}px</b> <button class="btn btn-secondary" data-font="1">A＋</button></div></div><div class="setting-row"><span>行距</span><select id="lineSel"><option value="1.7">緊湊</option><option value="1.95">舒適</option><option value="2.2">寬鬆</option></select></div><div class="setting-row"><span>背景</span><div class="chips"><button class="chip" data-theme="light">白</button><button class="chip" data-theme="sepia">米</button><button class="chip" data-theme="dark">黑</button></div></div><div class="setting-row"><span>版心寬度</span><select id="widthSel"><option value="680">窄</option><option value="760">標準</option><option value="860">寬</option></select></div><div class="setting-row"><span>版面模式</span><button class="btn btn-secondary" id="layoutFromSettings">${resolvedLayout()==='mobile'?'📱 手機版':'🖥 電腦版'}</button></div>`);setTimeout(()=>{$('#lineSel').value=String(state.lineHeight);$('#widthSel').value=String(state.readerWidth);const b=$('#layoutFromSettings');if(b)b.onclick=layoutModal},0)}
function searchModal(){openModal(`<h2>全文搜尋</h2><input id="searchInput" class="search-input" placeholder="例如：宗教改革、洛克、羅馬法"><div id="searchResults"></div>`);setTimeout(()=>$('#searchInput').focus(),0)}
function doSearch(s){const box=$('#searchResults');if(!s.trim()){box.innerHTML='';return}const term=s.trim().toLowerCase();const rs=BOOK_CHAPTERS.map((c,i)=>{const p=c.plain.toLowerCase().indexOf(term);if(p<0)return null;return {i,c,snip:c.plain.slice(Math.max(0,p-45),p+term.length+90)}}).filter(Boolean);box.innerHTML=rs.length?rs.map(r=>`<button class="search-result" data-search-ch="${r.i}" style="width:100%;text-align:left;border:0;background:transparent"><b>${esc(r.c.title)}</b><span style="color:var(--muted)">${esc(r.snip)}…</span></button>`).join(''):'<div class="empty">找不到相關內容</div>'}
function updateReadProgress(){if(state.route!=='reader')return;const doc=document.documentElement;const max=Math.max(1,doc.scrollHeight-innerHeight);const pct=Math.min(100,scrollY/max*100);const el=$('#readProgress');if(el)el.style.width=pct+'%';state.scroll[state.chapter]=scrollY;if(pct>88)state.readChapters[state.chapter]=true;save();}
function bind(){
  $$('[data-route]').forEach(b=>b.onclick=()=>nav(b.dataset.route));
  $$('[data-action="continue"]').forEach(b=>b.onclick=()=>{state.route='reader';save();render()});
  $$('[data-ch]').forEach(b=>b.onclick=()=>{state.chapter=+b.dataset.ch;state.route='reader';save();render()});
  $$('[data-prev]').forEach(b=>b.onclick=()=>{if(state.chapter>0){state.chapter--;state.scroll[state.chapter]=0;save();render()}});
  $$('[data-next]').forEach(b=>b.onclick=()=>{state.readChapters[state.chapter]=true;if(state.chapter<BOOK_CHAPTERS.length-1){state.chapter++;state.scroll[state.chapter]=0;save();render()}});
  $$('[data-quiz]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.quiz==='mock25'?'mock':(b.dataset.quiz==='groups6'?'groups':'practice')));
  $$('[data-topic]').forEach(b=>b.onclick=()=>startQuiz('practice',b.dataset.topic));
  $$('[data-opt]').forEach(b=>b.onclick=()=>choose(+b.dataset.opt));
  $$('[data-gqid]').forEach(b=>b.onclick=()=>chooseGroup(b.dataset.gqid,+b.dataset.gopt));
  $$('[data-review-era]').forEach(b=>b.onclick=()=>{state.reviewEra=b.dataset.reviewEra;save();render()});
  $$('[data-review-ch]').forEach(b=>b.onclick=()=>{state.chapter=+b.dataset.reviewCh;state.route='reader';save();render()});
  $$('[data-review-topic]').forEach(b=>b.onclick=()=>startQuizForReview(b.dataset.reviewTopic));
  const nq=$('#nextQ');if(nq)nq.onclick=nextQ;
  const sg=$('#submitGroup');if(sg)sg.onclick=submitGroup;
  const rw=$('#redoWrong');if(rw)rw.onclick=()=>{const pool=questionCatalog().filter(q=>state.wrong[q.id]?.count>0);const picked=prepareSingles(sample(pool,Math.min(20,pool.length)));quiz={mode:'practice',items:picked.map(q=>({type:'single',question:q})),itemIndex:0,correct:0,answers:{},draft:{},started:Date.now(),topic:'錯題重練',total:picked.length};state.route='quiz';renderQuizQuestion()};
}
$('#menuBtn').onclick=()=>openDrawer('chapters');
$('#bookmarkTopBtn').onclick=saveBookmark;
$('#layoutBtn').onclick=layoutModal;
$('#drawerClose').onclick=closeDrawer;$('#shade').onclick=closeDrawer;$('#searchBtn').onclick=searchModal;$('#settingsBtn').onclick=settings;$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-drawer-tab]');if(tab){buildDrawer(tab.dataset.drawerTab)}
  const dc=e.target.closest('[data-drawer-ch]');if(dc){state.chapter=+dc.dataset.drawerCh;state.route='reader';save();closeDrawer();render()}
  const bj=e.target.closest('[data-bookmark-jump]');if(bj){const b=[...(state.bookmarks||[])].sort((a,b)=>b.date-a.date)[+bj.dataset.bookmarkJump];if(b){state.chapter=b.chapter;state.route='reader';state.scroll[b.chapter]=b.pos;save();closeDrawer();render()}}
  const bd=e.target.closest('[data-bookmark-delete]');if(bd){const sorted=[...(state.bookmarks||[])].sort((a,b)=>b.date-a.date);const target=sorted[+bd.dataset.bookmarkDelete];if(target){state.bookmarks=(state.bookmarks||[]).filter(x=>!(x.chapter===target.chapter&&x.date===target.date));save();buildDrawer('bookmarks');updateTopbar()}}
  const sc=e.target.closest('[data-search-ch]');if(sc){state.chapter=+sc.dataset.searchCh;state.route='reader';save();closeModal();render()}
  const f=e.target.closest('[data-font]');if(f){state.fontSize=Math.min(28,Math.max(14,state.fontSize+ +f.dataset.font));save();settings();setTheme()}
  const th=e.target.closest('[data-theme]');if(th){state.theme=th.dataset.theme;save();setTheme()}
  const ly=e.target.closest('[data-layout]');if(ly){state.layout=ly.dataset.layout;save();setTheme();closeModal();render()}
});
document.addEventListener('input',e=>{if(e.target.id==='searchInput')doSearch(e.target.value);if(e.target.id==='lineSel'){state.lineHeight=+e.target.value;save();setTheme()}if(e.target.id==='widthSel'){state.readerWidth=+e.target.value;save();setTheme()}});
window.addEventListener('scroll',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateReadProgress,120)},{passive:true});
window.addEventListener('resize',()=>{if(state.layout==='auto')setTheme()});
setInterval(()=>{if(state.route==='reader'&&!document.hidden){state.readingSeconds=(state.readingSeconds||0)+15;save()}},15000);
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js?v=6.0.0',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
render();