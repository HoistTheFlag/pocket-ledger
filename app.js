(() => {
  'use strict';

  const KEY = 'pocket-ledger-data-v1';
  const COLORS = ['#2f9e78','#f28c52','#6485e5','#9575cd','#d49b34','#de7d98','#4eacbc','#da6c6c','#81909f','#253a53','#36c4ac','#b48c6a'];
  const ICONS = ['🛒','🍽️','🚙','🏠','⚡','🛍️','🎮','💊','📁','✈️','🎓','🐾','☕','🎁','📚','💵','🚲','🎟️','❤️','📱'];
  const starters = [
    ['groceries','Groceries','🛒','#2f9e78'],['food','Food & Drink','🍽️','#f28c52'],
    ['transport','Transport','🚙','#6485e5'],['housing','Housing','🏠','#9575cd'],
    ['bills','Bills','⚡','#d49b34'],['shopping','Shopping','🛍️','#de7d98'],
    ['entertainment','Entertainment','🎮','#4eacbc'],['health','Health','💊','#da6c6c'],
    ['other','Other','📁','#81909f']
  ];
  const SYMBOL_TO_ICON = {
    'basket.fill':'🛒','fork.knife':'🍽️','car.fill':'🚙','house.fill':'🏠',
    'bolt.fill':'⚡','bag.fill':'🛍️','gamecontroller.fill':'🎮','cross.case.fill':'💊',
    'square.grid.2x2.fill':'📁','airplane':'✈️','graduationcap.fill':'🎓',
    'pawprint.fill':'🐾','cup.and.saucer.fill':'☕','gift.fill':'🎁',
    'book.fill':'📚','dollarsign.circle.fill':'💵','bicycle':'🚲',
    'ticket.fill':'🎟️','heart.fill':'❤️','iphone.gen3':'📱'
  };
  const $ = selector => document.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const defaultData = () => ({ version:1, categories:starters.map(([id,name,icon,color]) => ({id,name,icon,color})), purchases:[] });
  const amountFormat = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'});
  const money = cents => amountFormat.format(cents / 100);
  const localDate = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const today = () => localDate(new Date());
  const currentMonth = () => today().slice(0,7);
  const monthMove = (month, delta) => { const [y,m] = month.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const titleMonth = month => { const [y,m] = month.split('-').map(Number); return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)); };
  const dateShort = day => { const [y,m,d] = day.split('-').map(Number); return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(y,m-1,d)); };
  const monthName = month => { const [y,m] = month.split('-').map(Number); return new Intl.DateTimeFormat('en-US',{month:'short'}).format(new Date(y,m-1,1)); };
  const validDate = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [y,m,d] = value.split('-').map(Number); const dt = new Date(y,m-1,d); return dt.getFullYear() === y && dt.getMonth() === m-1 && dt.getDate() === d; };
  const parseCents = raw => {
    const clean = String(raw ?? '').trim();
    if (!/^(?:\d{1,12})(?:\.\d{1,2})?$/.test(clean)) return null;
    const [whole,fraction=''] = clean.split('.');
    const result = Number(whole) * 100 + Number((fraction+'00').slice(0,2));
    return Number.isSafeInteger(result) && result > 0 && result <= 999999999999 ? result : null;
  };
  const readableStorageError = 'Saved data could not be read or written. Editing is disabled to avoid overwriting existing information. You may restore a valid JSON backup from Settings.';
  let state;
  let blocked = false;
  let toastHandle;
  const ui = { tab:'home', month:currentMonth(), compareMonth:currentMonth(), period:'1', selected:new Set(starters.map(row => row[0])), modal:null };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) { const fresh = defaultData(); localStorage.setItem(KEY,JSON.stringify(fresh)); return fresh; }
      return normalizeData(JSON.parse(raw));
    } catch (err) { console.error('Pocket Ledger storage:',err); blocked = true; return defaultData(); }
  }
  function normalizeData(raw) {
    if (!raw || !Array.isArray(raw.categories) || !Array.isArray(raw.purchases)) throw new Error('Invalid backup structure');
    if (raw.categories.length < 1 || raw.categories.length > 500 || raw.purchases.length > 200000) throw new Error('Unexpected data size');
    const categories = raw.categories.map(c => {
      const color = typeof c.color === 'string' ? c.color : '#'+String(c.colorHex ?? '81909f').replace(/^#/, '');
      const icon = ICONS.includes(c.icon) ? c.icon : SYMBOL_TO_ICON[c.symbol] || '📁';
      if (typeof c.id !== 'string' || !c.id || c.id.length > 100 || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 60 || !/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error('Invalid category');
      return {id:c.id,name:c.name.trim(),icon,color:color.toLowerCase()};
    });
    if (new Set(categories.map(c => c.id)).size !== categories.length || new Set(categories.map(c => c.name.toLowerCase())).size !== categories.length) throw new Error('Duplicate categories');
    const ids = new Set(categories.map(c => c.id));
    const seen = new Set();
    const purchases = raw.purchases.map(p => {
      // A native Swift JSONEncoder date is seconds since Jan 1, 2001.
      let day = p.date;
      if (typeof day === 'number' && Number.isFinite(day)) day = new Date((day + 978307200) * 1000).toISOString().slice(0,10);
      const categoryId = p.categoryId ?? p.categoryID;
      if (typeof p.id !== 'string' || !p.id || p.id.length > 100 || seen.has(p.id) || !Number.isSafeInteger(p.amountCents) || p.amountCents < 1 || p.amountCents > 999999999999 || !ids.has(categoryId) || !validDate(day) || typeof p.note !== 'string' || p.note.length > 500) throw new Error('Invalid purchase');
      seen.add(p.id);
      return {id:p.id,amountCents:p.amountCents,categoryId,date:day,note:p.note};
    });
    return {version:1,categories,purchases};
  }
  function save(next, allowRecovery=false) {
    if (blocked && !allowRecovery) { alert(readableStorageError); return false; }
    try {
      next = normalizeData(next);
      localStorage.setItem(KEY,JSON.stringify(next));
      state = next;
      blocked = false;
      render();
      return true;
    } catch (err) { console.error(err); alert('Unable to save: ' + err.message + '. Existing data was not changed.'); return false; }
  }
  function notify(message) {
    const t = $('#toast'); t.textContent = message; t.classList.add('show');
    clearTimeout(toastHandle); toastHandle = setTimeout(() => t.classList.remove('show'),2700);
  }
  function categoryById(id) { return state.categories.find(c => c.id === id); }
  function monthPurchases(month) { return state.purchases.filter(p => p.date.slice(0,7) === month).sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)); }
  function sum(list) { return list.reduce((n,p) => n+p.amountCents,0); }
  function sumsByCategory(list) { const totals = new Map(); for (const p of list) totals.set(p.categoryId,(totals.get(p.categoryId)||0)+p.amountCents); return totals; }
  function empty(message, subtitle, cta=false) { return `<div class="empty-state"><div class="empty-icon">🧾</div><strong>${escapeHTML(message)}</strong><p>${escapeHTML(subtitle)}</p>${cta ? '<button type="button" class="solid-button" data-action="add">Add first purchase</button>':''}</div>`; }
  function monthPicker(which, month) {
    return `<div class="month-picker"><button type="button" data-month-which="${which}" data-month-step="-1" aria-label="Previous month">‹</button><strong>${escapeHTML(titleMonth(month))}</strong><button type="button" data-month-which="${which}" data-month-step="1" aria-label="Next month" ${month >= currentMonth()?'disabled':''}>›</button></div>`;
  }
  function purchaseRows(list, clickable=true) {
    return `<div class="purchase-list">${list.map(p => { const c=categoryById(p.categoryId); return `<button type="button" class="purchase-row" ${clickable?`data-action="edit-purchase" data-id="${escapeHTML(p.id)}"`:''}>
      <span class="purchase-icon" style="background:${c ? c.color+'18' : '#ecf1f3'}">${escapeHTML(c?.icon || '📁')}</span>
      <span class="purchase-main"><div class="purchase-title">${escapeHTML(p.note || c?.name || 'Unknown category')}</div><div class="purchase-sub">${escapeHTML(c?.name || 'Unknown')} · ${escapeHTML(dateShort(p.date))}</div></span>
      <span class="purchase-amount">${money(p.amountCents)}</span></button>`;}).join('')}</div>`;
  }
  function renderHome() {
    const list = monthPurchases(ui.month), total = sum(list), byCat = sumsByCategory(list);
    const breakdown = state.categories.map(c => ({...c,total:byCat.get(c.id)||0})).filter(c => c.total>0).sort((a,b)=>b.total-a.total);
    return `<div class="page-intro"><div class="eyebrow">FINANCIAL OVERVIEW</div><h1>Your spending</h1><p>Know where every dollar goes.</p></div>
      ${monthPicker('month',ui.month)}
      <section class="summary-hero"><div class="summary-label">Total spent this month</div><div class="hero-money">${money(total)}</div>
      <div class="hero-foot">${escapeHTML(titleMonth(ui.month))} · ${list.length} ${list.length===1?'purchase':'purchases'}</div><div class="hero-badge"><span class="circle"></span> Tracked privately on your device</div></section>
      <div class="section-heading"><h2>Spending by category</h2><button type="button" class="text-button" data-action="go-compare">Compare →</button></div>
      <section class="panel">${breakdown.length ? `<div class="category-bars">${breakdown.map(c => `<div class="bar-item"><div class="bar-top"><div class="bar-name"><span class="mini-dot" style="background:${c.color}"></span>${escapeHTML(c.name)}</div><span class="bar-value">${money(c.total)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${(c.total / total*100).toFixed(2)}%;background:${c.color}"></div></div></div>`).join('')}</div>` : empty('Nothing recorded yet','Add a purchase to see your category breakdown.',true)}</section>
      <div class="section-heading"><h2>Recent purchases</h2><button type="button" class="text-button" data-action="go-purchases">View all →</button></div>
      <section class="panel">${list.length ? purchaseRows(list.slice(0,5)) : empty('No purchases yet','Your latest purchases will show here.')}</section>`;
  }
  function renderPurchases() {
    const list=monthPurchases(ui.month);
    return `<div class="page-intro"><div class="eyebrow">TRANSACTION HISTORY</div><h1>Purchases</h1><p>Tap a purchase to edit or delete it.</p></div>${monthPicker('month',ui.month)}
      <div class="count-row"><span>${list.length} ${list.length===1?'purchase':'purchases'}</span><strong>${money(sum(list))}</strong></div>
      <section class="panel">${list.length?purchaseRows(list):empty('No purchases this month','Use the arrows for previous months, or add a new purchase.',true)}</section>`;
  }
  function comparisonPurchases() {
    if (ui.period==='all') return [...state.purchases];
    const first=monthMove(ui.compareMonth,1-Number(ui.period));
    return state.purchases.filter(p => p.date.slice(0,7)>=first && p.date.slice(0,7)<=ui.compareMonth);
  }
  function renderCompare() {
    const purchases=comparisonPurchases(), selected=purchases.filter(p=>ui.selected.has(p.categoryId));
    const totals=sumsByCategory(selected), sumSelected=sum(selected);
    const chosen=state.categories.filter(c=>ui.selected.has(c.id)).map(c=>({...c,total:totals.get(c.id)||0})).sort((a,b)=>b.total-a.total);
    const months=ui.period==='all'?[]:Array.from({length:Number(ui.period)},(_,i)=>monthMove(ui.compareMonth,i+1-Number(ui.period)));
    const chart=months.length>1?`<div class="section-heading"><h2>Monthly trend</h2></div><div class="panel"><div class="period-chart">${months.map(m=>{const v=sum(selected.filter(p=>p.date.slice(0,7)===m));const scale=Math.max(1,...months.map(mm=>sum(selected.filter(p=>p.date.slice(0,7)===mm))));return `<div class="period-col" title="${escapeHTML(titleMonth(m))}: ${money(v)}"><div class="period-fill" style="height:${Math.max(2,v/scale*115).toFixed(1)}px"></div><span>${escapeHTML(monthName(m))}</span></div>`;}).join('')}</div></div>`:'';
    return `<div class="page-intro"><div class="eyebrow">SPENDING ANALYSIS</div><h1>Compare</h1><p>Combine categories and see the total.</p></div>
      <div class="eyebrow" style="margin:18px 2px 9px">ENDING MONTH</div>${monthPicker('compareMonth',ui.compareMonth)}
      <div class="eyebrow" style="margin:23px 2px 10px">TIME RANGE</div>
      <div class="pill-row">${[['1','1 month'],['3','3 months'],['12','12 months'],['all','All time']].map(([v,label])=>`<button type="button" class="pill" data-period="${v}" aria-pressed="${ui.period===v}">${label}</button>`).join('')}</div>
      <div class="section-heading"><h2>Categories</h2><div class="inline-controls"><button class="text-button" data-action="select-all" type="button">Select all</button><button class="text-button" data-action="clear-selection" type="button">Clear</button></div></div>
      <div class="selection-list">${state.categories.map(c=>`<button type="button" class="select-card" data-select-category="${escapeHTML(c.id)}" aria-pressed="${ui.selected.has(c.id)}"><span class="select-icon" style="background:${c.color}18">${escapeHTML(c.icon)}</span><span class="select-label">${escapeHTML(c.name)}</span><span class="select-check">${ui.selected.has(c.id)?'✓':'+'}</span></button>`).join('')}</div>
      <section class="selected-hero"><div class="eyebrow">COMBINED SPENDING</div><div class="total">${money(sumSelected)}</div><div class="small">${chosen.length} selected ${chosen.length===1?'category':'categories'} · ${selected.length} purchases</div></section>
      ${chart}<div class="section-heading"><h2>Selected breakdown</h2></div><section class="panel">${chosen.length?`<div class="category-bars">${chosen.map(c=>`<div><div class="bar-top"><div class="bar-name"><span class="mini-dot" style="background:${c.color}"></span>${escapeHTML(c.name)}</div><span class="bar-value">${money(c.total)}</span></div><div class="bar-track"><div class="bar-fill" style="background:${c.color};width:${sumSelected?c.total/sumSelected*100:0}%"></div></div></div>`).join('')}</div>`:empty('No categories selected','Select one or more categories to calculate combined spending.')}</section>`;
  }
  function actionSvg(name){return name==='download'?'<svg viewBox="0 0 24 24"><path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>':name==='upload'?'<svg viewBox="0 0 24 24"><path d="M12 20V7m-5 5 5-5 5 5M4 7V3h16v4"/></svg>':'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h6"/></svg>'}
  function settingAction(action, icon, title, detail){return `<button type="button" class="settings-action" data-action="${action}">${actionSvg(icon)}<span><span>${title}</span><div class="action-detail">${detail}</div></span><span class="arrow">›</span></button>`;}
  function renderSettings() {
    return `<div class="page-intro"><div class="eyebrow">PREFERENCES &amp; BACKUP</div><h1>Settings</h1><p>Make Pocket Ledger your own.</p></div>
      <div class="section-heading"><h2>Categories</h2><button type="button" class="text-button" data-action="add-category">+ New category</button></div>
      <section class="panel"><div class="category-settings">${state.categories.map(c=>`<div class="category-setting"><span class="purchase-icon" style="background:${c.color}18">${escapeHTML(c.icon)}</span><span class="cat-label">${escapeHTML(c.name)}</span><span class="cat-actions"><button type="button" class="small-button" data-action="edit-category" data-id="${escapeHTML(c.id)}" aria-label="Edit ${escapeHTML(c.name)}">Edit</button><button type="button" class="small-button danger" data-action="delete-category" data-id="${escapeHTML(c.id)}" aria-label="Delete ${escapeHTML(c.name)}">Delete</button></span></div>`).join('')}</div><p class="helper">Categories with purchases cannot be deleted. Edit them instead, or reassign their purchases first.</p></section>
      <div class="section-heading"><h2>Your data</h2><span class="helper"><span class="storage-count">${state.purchases.length}</span> saved purchases</span></div>
      ${settingAction('export-json','download','Back up everything (JSON)','Recommended: saves purchases and categories')}
      ${settingAction('restore-json','upload','Restore from JSON backup','Replaces all current purchases and categories')}
      ${settingAction('export-csv','download','Export purchases (CSV)','Open in Numbers or Excel')}
      ${settingAction('import-csv','upload','Import purchases (CSV)','Add purchases from a CSV, including the native iPhone app')}
      <input id="restore-file" class="hidden-file" type="file" accept=".json,application/json" aria-label="Select JSON backup">
      <input id="csv-file" class="hidden-file" type="file" accept=".csv,text/csv" aria-label="Select CSV purchases">
      <div class="warning-note"><strong>Back up your data regularly.</strong> Purchases are saved on this device, not in GitHub or iCloud. Removing the Home Screen app, clearing its website data, or a browser storage cleanup can erase them. A JSON backup can restore everything.</div>
      <div class="app-footnote">Pocket Ledger · Version 1.0 · No account, no tracking</div>`;
  }
  function renderModal() {
    const root=$('#modal-root');
    if(!ui.modal){root.innerHTML='';document.body.style.overflow='';return;}
    document.body.style.overflow='hidden';
    const {type,id}=ui.modal;
    if(type==='purchase') {
      const p=id?state.purchases.find(row=>row.id===id):null;
      if(id&&!p){ui.modal=null;renderModal();return;}
      const date=p?.date||today();
      root.innerHTML=`<div class="modal-backdrop" data-action="close-backdrop"><div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-grab"></div><div class="modal-head"><h2 id="modal-title">${p?'Edit purchase':'Add purchase'}</h2><button class="x-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
        <form id="purchase-form"><div class="field"><label for="purchase-amount">Amount</label><div class="amount-entry"><span class="dollar">$</span><input id="purchase-amount" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" required value="${p?(p.amountCents/100).toFixed(2):''}"/></div></div>
        <div class="field"><label for="purchase-category">Category</label><select id="purchase-category" name="category" required>${state.categories.map(c=>`<option value="${escapeHTML(c.id)}" ${c.id===(p?.categoryId||state.categories[0]?.id)?'selected':''}>${escapeHTML(c.icon+' '+c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="purchase-date">Date</label><input id="purchase-date" name="date" type="date" max="${today()}" required value="${escapeHTML(date)}"></div>
        <div class="field"><label for="purchase-note">Description (optional)</label><input id="purchase-note" name="note" maxlength="200" placeholder="e.g. Coffee, gas, groceries" value="${escapeHTML(p?.note||'')}"></div>
        <div class="modal-actions">${p?'<button class="danger-button" type="button" data-action="delete-purchase" data-id="'+escapeHTML(p.id)+'">Delete</button>':''}<button type="submit" class="solid-button" ${blocked?'disabled':''}>${p?'Save changes':'Add purchase'}</button></div></form></div></div>`;
      $('#purchase-amount')?.focus({preventScroll:true});
    } else if(type==='category') {
      const c=id?categoryById(id):null;
      if(id&&!c){ui.modal=null;renderModal();return;}
      const icon=ui.modal.icon||c?.icon||ICONS[0],color=ui.modal.color||c?.color||COLORS[0];
      const name=ui.modal.name ?? c?.name ?? '';
      root.innerHTML=`<div class="modal-backdrop" data-action="close-backdrop"><div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-grab"></div><div class="modal-head"><h2 id="modal-title">${c?'Edit category':'New category'}</h2><button type="button" class="x-button" data-action="close-modal" aria-label="Close">×</button></div>
        <form id="category-form"><div class="field"><label for="category-name">Category name</label><input id="category-name" required maxlength="60" placeholder="e.g. Subscriptions" value="${escapeHTML(name)}"></div>
        <div class="field"><label>Icon</label><div class="icon-options">${ICONS.map(i=>`<button type="button" class="icon-choice" data-icon="${i}" aria-pressed="${icon===i}" aria-label="${escapeHTML(i)}">${i}</button>`).join('')}</div></div>
        <div class="field"><label>Color</label><div class="color-options">${COLORS.map(co=>`<button type="button" class="color-choice" style="background:${co}" data-color="${co}" aria-pressed="${color===co}" aria-label="Color ${co}"></button>`).join('')}</div></div>
        <div class="modal-actions"><button class="solid-button" type="submit" ${blocked?'disabled':''}>${c?'Save category':'Create category'}</button></div></form></div></div>`;
    }
  }
  function render() {
    if(!state) return;
    const errors=blocked?`<div class="error-note"><strong>Storage problem.</strong> ${escapeHTML(readableStorageError)}</div>`:'';
    $('#main-content').innerHTML=errors+({home:renderHome,purchases:renderPurchases,compare:renderCompare,settings:renderSettings}[ui.tab]||renderHome)();
    document.querySelectorAll('.nav-tab').forEach(button=>{const on=button.dataset.tab===ui.tab;button.classList.toggle('is-active',on);if(on)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    $('#quick-add').classList.toggle('hide',ui.tab==='settings');
    $('#quick-add').disabled=blocked;
    renderModal();
  }
  function switchTab(tab) {ui.tab=tab;ui.modal=null;render();window.scrollTo({top:0,behavior:'instant'});}
  function closeModal(){ui.modal=null;renderModal();}
  function editPurchase(id=''){ui.modal={type:'purchase',id};renderModal();}
  function editCategory(id=''){ui.modal={type:'category',id};renderModal();}
  function removePurchase(id){
    const p=state.purchases.find(row=>row.id===id); if(!p)return;
    if(!confirm(`Delete the ${money(p.amountCents)} purchase? This can't be undone.`))return;
    if(save({...state,purchases:state.purchases.filter(row=>row.id!==id)})){closeModal();notify('Purchase deleted');}
  }
  function removeCategory(id){
    const c=categoryById(id);if(!c)return;
    if(state.categories.length<=1){alert('At least one category must remain.');return;}
    if(state.purchases.some(p=>p.categoryId===id)){alert('This category has purchases. Edit their categories before deleting it.');return;}
    if(!confirm(`Delete category “${c.name}”?`))return;
    if(save({...state,categories:state.categories.filter(row=>row.id!==id)})){ui.selected.delete(id);notify('Category deleted');}
  }
  function downloadFile(name,text,type) {
    const blob=new Blob([text],{type});
    function browserDownload() {
      const url=URL.createObjectURL(blob);const a=document.createElement('a');
      a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
    }
    // iOS Home Screen apps can save the backup through the native Share sheet.
    if(typeof File==='function' && navigator.canShare && navigator.share) {
      const file=new File([blob],name,{type});
      if(navigator.canShare({files:[file]})) {
        navigator.share({files:[file],title:name}).catch(err=>{
          if(err?.name!=='AbortError')browserDownload();
        });
        return;
      }
    }
    browserDownload();
  }
  function exportJSON(){downloadFile(`PocketLedger-Backup-${today()}.json`,JSON.stringify({format:'pocket-ledger-backup',version:1,exportedAt:new Date().toISOString(),categories:state.categories,purchases:state.purchases},null,2),'application/json');notify('JSON backup prepared');}
  function quoteCSV(x){return '"'+String(x??'').replace(/"/g,'""')+'"';}
  function exportCSV(){
    const header=['Date','Amount','Category','Note'];
    const rows=state.purchases.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(p=>[p.date,(p.amountCents/100).toFixed(2),categoryById(p.categoryId)?.name||'Unknown',p.note]);
    downloadFile(`PocketLedger-Purchases-${today()}.csv`,'\ufeff'+[header,...rows].map(r=>r.map(quoteCSV).join(',')).join('\r\n')+'\r\n','text/csv;charset=utf-8');notify('CSV export prepared');
  }
  function parseCSV(text){
    const lines=[],row=[];let field='',quoted=false;
    for(let i=0;i<text.length;i++) {
      const ch=text[i];
      if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"'){quoted=false;}else{field+=ch;}}
      else if(ch==='"'){if(field!=='')throw new Error('Malformed CSV quoting');quoted=true;}
      else if(ch===','){row.push(field);field='';}
      else if(ch==='\r'||ch==='\n'){row.push(field);field='';if(row.some(x=>x!==''))lines.push(row.slice());row.length=0;if(ch==='\r'&&text[i+1]==='\n')i++;}
      else field+=ch;
    }
    if(quoted)throw new Error('Unclosed CSV quote');row.push(field);if(row.some(x=>x!==''))lines.push(row);
    return lines;
  }
  function importCSV(text){
    const rows=parseCSV(text.replace(/^\ufeff/,''));
    if(rows.length<2)throw new Error('CSV must contain a header and at least one purchase');
    const headers=rows[0].map(x=>x.trim().toLowerCase());
    const idx=key=>headers.indexOf(key);
    if(['date','amount','category'].some(k=>idx(k)<0))throw new Error('CSV needs Date, Amount, Category, and optional Note columns');
    const next={...state,categories:state.categories.slice(),purchases:state.purchases.slice()};
    const imported=[];
    for(let n=1;n<rows.length;n++){
      const r=rows[n];const date=(r[idx('date')]||'').trim(),amount=parseCents(r[idx('amount')]);
      const categoryName=(r[idx('category')]||'').trim(),note=(idx('note')<0?'':r[idx('note')]||'').trim();
      if(!validDate(date)||amount===null||!categoryName||categoryName.length>60||note.length>500)throw new Error(`Invalid values in CSV row ${n+1}`);
      let category=next.categories.find(c=>c.name.toLowerCase()===categoryName.toLowerCase());
      if(!category){category={id:uid(),name:categoryName,icon:'📁',color:COLORS[next.categories.length%COLORS.length]};next.categories.push(category);}
      imported.push({id:uid(),amountCents:amount,categoryId:category.id,date,note});
    }
    next.purchases.push(...imported);
    if(!confirm(`Import ${imported.length} purchases? Existing purchases will be kept. Importing the same CSV twice will create duplicates.`))return;
    if(save(next)){ui.selected=new Set(state.categories.map(c=>c.id));notify(`${imported.length} purchases imported`);}
  }
  async function importFile(input,kind){
    const file=input.files?.[0];input.value='';if(!file)return;
    if(file.size>12*1024*1024){alert('Please choose a file smaller than 12 MB.');return;}
    try {
      const content=await file.text();
      if(kind==='json'){
        const candidate=normalizeData(JSON.parse(content));
        if(!confirm(`Restore backup with ${candidate.purchases.length} purchases and ${candidate.categories.length} categories? This REPLACES all current data. Export a backup first if needed.`))return;
        if(save(candidate,true)){ui.selected=new Set(state.categories.map(c=>c.id));ui.month=currentMonth();notify('Backup restored');}
      } else {
        if(blocked){alert('Restore a JSON backup first; importing a CSV while storage is inaccessible is not supported.');return;}
        importCSV(content);
      }
    } catch(err){console.error(err);alert(`Unable to import file: ${err.message}`);}
  }
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]');if(tab){switchTab(tab.dataset.tab);return;}
    const month=e.target.closest('[data-month-step]');if(month){const which=month.dataset.monthWhich;ui[which]=monthMove(ui[which],Number(month.dataset.monthStep));render();return;}
    const period=e.target.closest('[data-period]');if(period){ui.period=period.dataset.period;render();return;}
    const selection=e.target.closest('[data-select-category]');if(selection){const id=selection.dataset.selectCategory;if(ui.selected.has(id))ui.selected.delete(id);else ui.selected.add(id);render();return;}
    const icon=e.target.closest('[data-icon]');if(icon&&ui.modal?.type==='category'){ui.modal.name=$('#category-name')?.value||'';ui.modal.icon=icon.dataset.icon;renderModal();return;}
    const color=e.target.closest('[data-color]');if(color&&ui.modal?.type==='category'){ui.modal.name=$('#category-name')?.value||'';ui.modal.color=color.dataset.color;renderModal();return;}
    const button=e.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action,id=button.dataset.id;
    if(action==='close-backdrop'&&e.target===button){closeModal();return;}
    if(action==='close-modal'){closeModal();return;}
    if(action==='add'){if(!blocked)editPurchase();}
    if(action==='edit-purchase'){editPurchase(id);}
    if(action==='delete-purchase'){removePurchase(id);}
    if(action==='go-purchases')switchTab('purchases');
    if(action==='go-compare')switchTab('compare');
    if(action==='select-all'){ui.selected=new Set(state.categories.map(c=>c.id));render();}
    if(action==='clear-selection'){ui.selected.clear();render();}
    if(action==='add-category')editCategory();
    if(action==='edit-category')editCategory(id);
    if(action==='delete-category')removeCategory(id);
    if(action==='export-json')exportJSON();
    if(action==='export-csv')exportCSV();
    if(action==='restore-json')$('#restore-file')?.click();
    if(action==='import-csv')$('#csv-file')?.click();
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='purchase-form'){
      e.preventDefault();
      const amount=parseCents($('#purchase-amount').value),categoryId=$('#purchase-category').value,date=$('#purchase-date').value,note=$('#purchase-note').value.trim();
      if(amount===null){alert('Enter an amount greater than zero, with up to two decimal places.');return;}
      if(!state.categories.some(c=>c.id===categoryId)||!validDate(date)||date>today()){alert('Choose a valid category and a date that is not in the future.');return;}
      const editing=Boolean(ui.modal?.id);const id=ui.modal?.id||uid();const item={id,amountCents:amount,categoryId,date,note};
      const purchases=ui.modal?.id?state.purchases.map(p=>p.id===id?item:p):[...state.purchases,item];
      if(save({...state,purchases})){ui.month=date.slice(0,7);ui.modal=null;render();notify(editing?'Purchase updated':'Purchase saved');}
    }
    if(e.target.id==='category-form'){
      e.preventDefault();const id=ui.modal?.id;const name=$('#category-name').value.trim(),icon=ui.modal?.icon||categoryById(id)?.icon||ICONS[0],color=ui.modal?.color||categoryById(id)?.color||COLORS[0];
      if(!name||name.length>60){alert('Enter a category name (maximum 60 characters).');return;}
      if(state.categories.some(c=>c.id!==id&&c.name.toLowerCase()===name.toLowerCase())){alert('A category already has that name.');return;}
      const category={id:id||uid(),name,icon,color};
      const categories=id?state.categories.map(c=>c.id===id?category:c):[...state.categories,category];
      if(save({...state,categories})){ui.selected.add(category.id);ui.modal=null;render();notify(id?'Category updated':'Category created');}
    }
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='restore-file')importFile(e.target,'json');
    if(e.target.id==='csv-file')importFile(e.target,'csv');
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.modal)closeModal();});
  $('#quick-add').addEventListener('click',()=>{if(!blocked)editPurchase();});
  state=load();render();
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('Offline setup unavailable:',err)));
  }
})();
