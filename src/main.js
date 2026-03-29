// делаем левый столбец, разбираемся с датой и фиксим правый, нужно добавить адекватный счетчик времени для занятых дней
// и пофиксить текущие недочёты, разобраться с экспортом в таблицы а также интеграцией с тг ботом


const state = {
  date: new Date(), // current displayed month
  events: {}, // { 'YYYY-MM-DD': [ {id, title, time, type, notes} ] }
  editing: null // {date,id} when editing
};

// localStorage keys
const STORAGE_KEY = 'vsp_planner_events_v1';
const LAST_VISITED_TIME = 'last_visited_time_v1';
const USER_DATA= 'user_data_v1';


function saveUserData() {
  const name = document.getElementById("userName").value;
  const birthday = document.getElementById("userBirthday").value;

  if (!name || !birthday) return;

  localStorage.setItem(USER_DATA, JSON.stringify(
    { name: name,
      birthday: birthday }
  ));

  document.getElementById("userModal").style.display = "none";
  
}

// Показываем только первый раз
window.addEventListener("load", () => {
  const user = localStorage.getItem(USER_DATA) || null;
  if (!user) {
    document.getElementById("userModal").style.display = "flex";
  } else {
    document.getElementById("userModal").style.display = "none";
  }
});

document.getElementById("userContinueBtn").addEventListener("click", saveUserData);

// load events from localStorage
function loadEvents() {
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    state.events = raw ? JSON.parse(raw) : {};
  }catch(e){
    console.error('loadEvents', e);
    state.events = {};
  }
}

function setVisitedData() {
  const now = new Date();
  localStorage.setItem(LAST_VISITED_TIME, JSON.stringify({
        year: now.getFullYear(),
        month: now.getMonth(),
        date: now.getDate(),
        hours: now.getHours(),
        minutes: now.getMinutes(),
    }));
}


/* ---------------------------
  Show welcome modal function
----------------------------*/
(function () {
  const overlay = document.getElementById('welcomeOverlay');
  const modal   = document.getElementById('welcomeModal');
  const welcomeTitle = document.querySelector('.welcome-title');
  const welcomeText = document.querySelector('.welcome-text');
 
  const userData = localStorage.getItem(USER_DATA);
  const user = JSON.parse(userData) || null;
  const data = localStorage.getItem(LAST_VISITED_TIME);
  const lastVisitedTime = JSON.parse(data) || null;

  const now = new Date();
  const dayNames   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('wDate').textContent =
    dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate();
    
  const dayTime = now.getHours();
  if(userData){
    if (!lastVisitedTime){
    setTimeout(() => overlay.classList.add('visible'), 320);  
    setVisitedData();
  } 
  if(lastVisitedTime){
    if (lastVisitedTime.date < now.getDate() || lastVisitedTime.month < now.getMonth() || lastVisitedTime.year < now.getFullYear()) {
        setTimeout(() => overlay.classList.add('visible'), 320);
        
        switch (true) {
          case dayTime < 5:
            welcomeTitle.textContent = `Good night, ${user.name}! `;
            welcomeText.textContent = 'The world is quiet and calm. A perfect time to dream about your plans.';
            setVisitedData();
            break;
          case dayTime < 12:
            welcomeTitle.textContent = `Good morning, ${user.name} `;
            welcomeText.textContent = 'A new day full of opportunities awaits you. Let\'s see what\'s on your schedule.';
            setVisitedData();
            break;
          case dayTime < 18:
            welcomeTitle.textContent = `Good afternoon, ${user.name} `;
            welcomeText.textContent = 'Hope your day is going well. Here\'s a quick look at what\'s coming up.';
            setVisitedData();
            break;
          case dayTime < 24:
            welcomeTitle.textContent = `Good evening,${user.name} `;
            welcomeText.textContent = 'The day is winding down. Let\'s check what you have planned for the rest of the day and tomorrow.';
            setVisitedData();
            break;
          default:
            welcomeTitle.textContent = 'Welcome back!';
            welcomeText.textContent = `Here's a quick look at what awaits you today.`;
            setVisitedData();
            break;
        }
      }
  }
  }
  
  
 
  try {
    const raw    = localStorage.getItem('vsp_planner_events_v1') || '{}';
    const events = JSON.parse(raw);
    const todayStr   = now.toISOString().slice(0, 10);
    const todayCount = Array.isArray(events[todayStr]) ? events[todayStr].length : 0;
    document.getElementById('wToday').textContent = todayCount;

  } catch (_) {
    console.log('ошибка')
    document.getElementById('wToday').textContent = '0';
  }
 
  function closeModal() {
    modal.classList.add('leaving');
    setTimeout(() => { overlay.style.display = 'none'; }, 180);
  }
 
  document.getElementById('welcomeClose').addEventListener('click', closeModal);
  document.getElementById('welcomeStart').addEventListener('click', closeModal);
  // document.getElementById('welcomeSkip').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
     if (e.target === overlay) closeModal();
   });
})();

/* ---------------------------
  Show cat function
----------------------------*/
function showCat() {
  const cat = document.querySelector(".cat-wrap");
  cat.classList.remove("hidden");

  setTimeout(() => {
    cat.classList.add("hidden");
  }, 3000);
}

function saveEvents(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
  }catch(e){
    console.error('saveEvents', e);
  }
}

function isoDate(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const day = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function uid(){
  return Math.random().toString(36).slice(2,9);
}

/* ---------------------------
  Calendar generation
----------------------------*/
const weekdayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const weekdayRowEl = document.getElementById('weekdayRow');
const calendarGridEl = document.getElementById('calendarGrid');
const monthTitleEl = document.getElementById('monthTitle');

function renderWeekdays(){
  weekdayRowEl.innerHTML = '';
  for(let wd of weekdayNames){
    const el = document.createElement('div');
    el.className = 'weekday';
    el.textContent = wd;
    weekdayRowEl.appendChild(el);
  }
}

function daysInMonth(y,m){
  return new Date(y,m+1,0).getDate();
}

// JS getDay: 0=Sun,1=Mon... We need Monday-first.
// convert: (jsDay + 6) % 7 => Monday=0 ... Sunday=6
function firstWeekdayIndex(year,month){
  const d = new Date(year,month,1).getDay();
  return (d + 6) % 7;
}

function renderCalendar(){
  const d = state.date;
  const year = d.getFullYear();
  const month = d.getMonth();
  const total = daysInMonth(year,month);
  const firstIndex = firstWeekdayIndex(year,month);

  monthTitleEl.textContent = d.toLocaleString('en-US',{month:'long', year:'numeric'});

  calendarGridEl.innerHTML = '';
  // Fill blanks before first day
  for(let i=0;i<firstIndex;i++){
    const empty = document.createElement('div');
    empty.className = 'day muted-day';
    empty.innerHTML = '<div class="date-top"><div class="date-num"></div></div>';
    calendarGridEl.appendChild(empty);
  }
  for(let day=1; day<=total; day++){
    const dateObj = new Date(year,month,day);
    const iso = isoDate(dateObj);
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.dataset.date = iso;

    // top row: date and small indicator
    const top = document.createElement('div');
    top.className = 'date-top';
    const num = document.createElement('div');
    num.className = 'date-num';
    num.textContent = day;
    const small = document.createElement('div');
    small.className = 'small';
    small.textContent = dateObj.toLocaleString('en-US',{weekday:'short'});
    top.appendChild(num);
    top.appendChild(small);
    dayEl.appendChild(top);

    // events list
    const evlist = document.createElement('div');
    evlist.className = 'events-list';
    const evs = (state.events[iso] || []).slice(0,3); // show up to 3
    for(let ev of evs){
      const chip = document.createElement('div');
      chip.className = 'event-chip ' + (ev.type==='work' ? 'type-work' : ev.type==='personal' ? 'type-personal' : 'type-date');
      chip.innerHTML = `<strong style="font-size:13px">${ev.time || ''}</strong><div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ev.title}</div>`;
      evlist.appendChild(chip);
    }
    if((state.events[iso]||[]).length > 3){
      const more = document.createElement('div');
      more.className = 'small muted';
      more.textContent = `+${(state.events[iso]||[]).length - 3} more`;
      evlist.appendChild(more);
    }
    dayEl.appendChild(evlist);

    // click to open modal
    dayEl.addEventListener('click', (e)=>{
      // avoid clicking inside event chip causing text selection; still open edit modal for that date
      openAddModal(iso);
    });

    calendarGridEl.appendChild(dayEl);
  }

  // Fill remaining blanks to keep complete rows (optional, aesthetic)
  const totalCells = calendarGridEl.children.length;
  const remainder = totalCells % 7;
  if(remainder !== 0){
    const toAdd = 7 - remainder;
    for(let i=0;i<toAdd;i++){
      const empty = document.createElement('div');
      empty.className = 'day muted-day';
      calendarGridEl.appendChild(empty);
    }
  }

  renderFreeDaysList();
}

/* ---------------------------
  Add rndom event btn
----------------------------*/

const rndmEvtBtn = document.getElementById("rndmEvtBtn");

rndmEvtBtn.addEventListener("click", () => {
  openAddModal();
});

/* ---------------------------
  Free days / free time slots
----------------------------*/
const freeListEl = document.getElementById('freeList');

function parseTimeToMinutes(t){
  if(!t) return null;
  const [hh,mm] = t.split(':').map(Number);
  return hh*60 + (mm||0);
}
function minutesToTime(m){
  const hh = String(Math.floor(m/60)).padStart(2,'0');
  const mm = String(m%60).padStart(2,'0');
  return `${hh}:${mm}`;
}

// For a given date, compute free slots between dayStart (00:00) and dayEnd (24:00).
function freeSlotsForDate(dateIso){
  const dayStart = 0*60;
  const dayEnd = 24*60;
  const evs = (state.events[dateIso] || []).map(ev=>{
    const start = parseTimeToMinutes(ev.time) || null;
    // assume 60min duration if time exists, otherwise no time => treat whole-day event
    return start ? [Math.max(dayStart, start), Math.min(dayEnd, start + 60)] : null;
  }).filter(Boolean).sort((a,b)=>a[0]-b[0]);

  const slots = [];
  let cursor = dayStart;
  for(const seg of evs){
    if(seg[0] > cursor){
      slots.push([cursor, seg[0]]);
    }
    cursor = Math.max(cursor, seg[1]);
  }
  if(cursor < dayEnd) slots.push([cursor, dayEnd]);
  return slots;
}

function renderFreeDaysList(){
  freeListEl.innerHTML = '';
  const d = state.date;
  const y = d.getFullYear(), m = d.getMonth();
  const total = daysInMonth(y,m);
  let anyFree = false;
  for(let day=1; day<=total; day++){
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const evs = state.events[iso] || [];
    if(evs.length === 0){
      anyFree = true;
      const item = document.createElement('div');
      item.className = 'free-item';
      item.innerHTML = `<div><strong>${new Date(y,m,day).toLocaleDateString('en-US',{month:'short', day:'numeric'})}</strong><div class="small muted">All day free</div></div>
                        <div><button class="action-btn" style="font-size:13px;padding:6px 8px" data-date="${iso}">Add</button></div>`;
      item.querySelector('button').addEventListener('click', (e)=>{
        openAddModal(iso);
      });
      freeListEl.appendChild(item);
    } else {
      // show partial free slots if any time slots exist
      const slots = freeSlotsForDate(iso);
      if(slots.length){
        anyFree = true;
        const slotText = slots.map(s => `${minutesToTime(s[0])}–${minutesToTime(s[1])}`).join(', ');
        const item = document.createElement('div');
        item.className = 'free-item';
        item.innerHTML = `<div><strong>${new Date(y,m,day).toLocaleDateString('en-US',{month:'short', day:'numeric'})}</strong><div class="small muted">${slotText} free</div></div>
                          <div><button class="action-btn" style="font-size:13px;padding:6px 8px" data-date="${iso}">Add</button></div>`;
        item.querySelector('button').addEventListener('click', (e)=>{
          openAddModal(iso);
        });
        freeListEl.appendChild(item);
      }
    }
  }
  if(!anyFree){
    const none = document.createElement('div');
    none.className = 'muted small center';
    none.textContent = 'No free days this month';
    freeListEl.appendChild(none);
  }
}

/* ---------------------------
  Modal logic (add/edit/delete/alert)
----------------------------*/
const modalBackdrop = document.getElementById('modalBackdrop');
const evtDate = document.getElementById('evtDate');
const evtTimeStart = document.getElementById('evtTimeStart');
const evtTimeEnd = document.getElementById('evtTimeEnd')
const evtTitle = document.getElementById('evtTitle');
const evtType = document.getElementById('evtType');
const evtNotes = document.getElementById('evtNotes');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnDelete = document.getElementById('btnDelete');
const confirmAlert = document.getElementById('confirmAlert');

function openAddModal(dateIso){
  state.editing = null;
  modalBackdrop.style.display = 'flex';
  document.getElementById('modalTitle').textContent = 'Add event';
  evtDate.value = dateIso;
  evtTimeStart.value = '';
  evtTimeEnd.value = '';
  evtTitle.value = '';
  evtType.value = 'personal';
  evtNotes.value = '';
  btnDelete.style.display = 'none';
  evtTitle.focus();

}

function openEditModal(dateIso, ev){
  state.editing = { date: dateIso, id: ev.id };
  modalBackdrop.style.display = 'flex';
  document.getElementById('modalTitle').textContent = 'Edit event';
  evtDate.value = dateIso;
  evtTimeStart.value = ev.timeStart || '';
  evtTimeEnd.value = ev.timeEnd
  evtTitle.value = ev.title || '';
  evtType.value = ev.type || 'personal';
  evtNotes.value = ev.notes || '';
  btnDelete.style.display = 'inline-block';
  evtTitle.focus();
}

btnCancel.addEventListener('click', ()=>{
  if (evtDate.value || evtTimeStart.value || evtTimeEnd.value || evtTitle.value || evtType.value) {
    showConfirmAlert('Discard changes?', 'You have unsaved changes. Are you sure you want to discard them?');
  } else {
    closeModal();
  }
});
modalBackdrop.addEventListener('click', (e)=>{
  if(e.target === modalBackdrop){
    if (evtDate.value || evtTimeStart.value || evtTimeEnd.value || evtTitle.value || evtType.value){
      showConfirmAlert('Discard changes?', 'You have unsaved changes. Are you sure you want to discard them?');
    } else {
      closeModal();
    }
  }
});

btnSave.addEventListener('click', ()=>{
  const date = evtDate.value;
  const timeStart = evtTimeStart.value || '';
  const timeEnd = evtTimeEnd.value || '';
  const title = evtTitle.value.trim() || '(no title)';
  const type = evtType.value;
  const notes = evtNotes.value || '';
  
  if(!date ) { 
    //
    return; 
  }

  if(state.editing) {
    // update
    const list = state.events[state.editing.date] || [];
    const idx = list.findIndex(x=>x.id===state.editing.id);
    if(idx >= 0){
      list[idx] = {...list[idx], title, timeStart, timeEnd, type, notes};
      state.events[state.editing.date] = list;
    }
  } else {
    // add
    const newEv = { id: uid(), title, timeStart, timeEnd, type, notes };
    state.events[date] = state.events[date] || [];
    state.events[date].push(newEv);
  }

  if (type.toLowerCase() == "date") {
    showCat();
  } else {
    showAlertModal('Saved', 'Your event has been saved successfully.');
  }

  saveEvents();
  closeModal();
  renderCalendar();
});

function deleteEvent() {
  if(!state.editing) return;
  const list = state.events[state.editing.date] || [];
  state.events[state.editing.date] = list.filter(x=>x.id !== state.editing.id);
  if(state.events[state.editing.date].length === 0) delete state.events[state.editing.date];
  showConfirmAlert();
  renderCalendar();
}

btnDelete.addEventListener("click", () => {
  deleteEvent();
})


function showConfirmAlert(title, text) {
  const modal = document.getElementById("confirmAlert");
  modal.style.display = "flex";
  const yesBtn = document.getElementById("alertYes");
  const noBtn = document.getElementById("alertNo");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmText = document.getElementById("confirmText");

  if (title || text) {
    confirmTitle.textContent = title || "Are you sure?";
    confirmText.textContent = text || "This action cannot be undone.";
  }

  yesBtn.addEventListener("click", () => {
    if(state.editing) {
      saveEvents();
      closeModal();
    } else if(!state.editing && (evtDate.value || evtTimeStart.value || evtTimeEnd.value || evtTitle.value || evtType.value)) {
      localStorage.removeItem(STORAGE_KEY)
      deleteEvent();
      closeModal();
    }
    modal.style.display = "none";
  });

  noBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

function showAlertModal(title, text) {
  const modal = document.getElementById("alertModal");
  modal.style.display = "flex";
  const okBtn = document.getElementById("alertOk");
  const alertTitle = document.getElementById("alertTitle");
  const alertText = document.getElementById("alertText");

  if (title || text) {
    alertTitle.textContent = title || "Success";
    alertText.textContent = text || "This action done.";
  }

  okBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}


function closeModal(){
  modalBackdrop.style.display = 'none';
  state.editing = null;
}

// function checkFields() {
//   const fieldsList = [];
//   const inputs = document.querySelector(".input-group");
//   if (!inputs) return fieldsList;

//   inputs.querySelectorAll("input, select, textarea").forEach(input => {
//     const val = (input.value || '').trim();
//     if (val === "") {
//       const label = input.previousElementSibling;
//       fieldsList.push(label ? label.textContent.trim() : '(unknown field)');
//     }
//   });

//   return fieldsList;
// }


// ...existing code...
function getInvalidRequiredFields(container = document) {
  const root = (container instanceof Element) ? container : document;
  const selector = 'input[required], select[required], textarea[required]';
  const nodes = Array.from(root.querySelectorAll(selector));
  const invalid = [];

  // helper to test radio group by name
  const isRadioGroupValid = (name) => {
    const radios = root.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
    return Array.from(radios).some(r => r.checked);
  };

  for (const el of nodes) {
    if (el.disabled) continue; // skip disabled
    const tag = el.tagName.toLowerCase();
    const type = el.type && el.type.toLowerCase();

    let ok = true;
    if (tag === 'select') {
      ok = (el.value || '').trim() !== '';
    } else if (type === 'checkbox') {
      ok = el.checked;
    } else if (type === 'radio') {
      // handle radio groups: only validate once per group (validate on first encountered)
      const name = el.name;
      if (!name) {
        ok = el.checked;
      } else {
        // if we've already processed a radio with this name, skip adding duplicates
        const alreadyHandled = invalid.some(x => x.dataset && x.dataset._radioGroup === name);
        if (alreadyHandled) continue;
        ok = isRadioGroupValid(name);
        if (!ok) {
          // mark a representative element to allow styling the group (use first radio in group)
          const representative = root.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]`);
          if (representative) {
            // attach marker so we don't add duplicate entries for the same group
            representative.dataset._radioGroup = name;
            invalid.push(representative);
          }
        }
        continue; // skip normal push below because we already handled group
      }
    } else {
      // inputs and textareas
      ok = ((el.value || '').trim() !== '');
    }

    if (!ok) invalid.push(el);
  }

  // clean any temporary dataset markers used for radio groups
  invalid.forEach(el => { if (el.dataset && el.dataset._radioGroup) delete el.dataset._radioGroup; });

  return invalid;
}
// ...existing code...


/* click on event to edit (delegation) */
calendarGridEl.addEventListener('click', (e)=>{
  // if clicked an event chip, attempt to detect event and open edit
  const chip = e.target.closest('.event-chip');
  if(!chip) return;
  // find date cell
  const dateCell = e.target.closest('.day');
  if(!dateCell) return;
  const dateIso = dateCell.dataset.date;
  // find matching event by title/time text (best-effort)
  const txt = chip.innerText.trim();
  const parts = txt.split('\n');
  // try to match by time and beginning of title
  const evlist = state.events[dateIso] || [];
  let found = evlist.find(ev => {
    const compare = `${ev.time || ''}${ev.title || ''}`.trim();
    return compare.startsWith(parts.join(' ').trim().slice(0,20));
  });
  if(!found) found = evlist[0];
  if(found) openEditModal(dateIso, found);
});

/* ---------------------------
  Month navigation
----------------------------*/
document.getElementById('prevBtn').addEventListener('click', ()=>{
  const d = new Date(state.date);
  d.setMonth(d.getMonth() - 1);
  state.date = d;
  renderCalendar();
});
document.getElementById('nextBtn').addEventListener('click', ()=>{
  const d = new Date(state.date);
  d.setMonth(d.getMonth() + 1);
  state.date = d;
  renderCalendar();
});

/* ---------------------------
  Side panel toggle / actions
----------------------------*/
const freeDaysList = document.getElementById('freeDaysList');
document.getElementById('freeToggle').addEventListener('click', ()=>{
  freeDaysList.scrollIntoView({behavior:'smooth'});
});

/* Export CSV & Clear */
document.getElementById('exportCsvBtn').addEventListener('click', ()=>{
  downloadCSVExport();
});
document.getElementById('clearAllBtn').addEventListener('click', ()=>{
  showConfirmAlert('Clear all events?', 'This will delete all your events for the current month. This action cannot be undone.', ()=>{
    state.events = {};
  });
  saveEvents();
  renderCalendar();
});

/* ---------------------------
  CSV export (for Google Sheets)
----------------------------*/
function buildCsvRows(){
  const rows = [['date','time','title','type','notes']];
  for(const date of Object.keys(state.events).sort()){
    for(const ev of state.events[date]){
      rows.push([date, ev.time||'', ev.title.replace(/"/g,'""'), ev.type, (ev.notes||'').replace(/"/g,'""')]);
    }
  }
  return rows;
}
function downloadCSVExport(){
  const rows = buildCsvRows();
  let text = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([text], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vsp_events_${state.date.getFullYear()}_${String(state.date.getMonth()+1).padStart(2,'0')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------
  Google Sheets sync UI
----------------------------*/
const gsBackdrop = document.getElementById('gsBackdrop');
const gsEndpointEl = document.getElementById('gsEndpoint');
const gsSyncBtn = document.getElementById('gsSyncBtn');
const gsCloseBtn = document.getElementById('gsCloseBtn');
const gsStatus = document.getElementById('gsStatus');
const gsDownloadBtn = document.getElementById('gsDownloadBtn');

// document.getElementById('gsConfigBtn').addEventListener('click', ()=>{
//   gsBackdrop.style.display = 'flex';
//   gsStatus.textContent = '';
// });

gsCloseBtn.addEventListener('click', ()=> gsBackdrop.style.display = 'none');
gsDownloadBtn.addEventListener('click', downloadCSVExport);

gsSyncBtn.addEventListener('click', async ()=>{
  const endpoint = gsEndpointEl.value.trim();
  const rows = buildCsvRows();
  const payload = { rows }; // minimal structure
  if(endpoint){
    gsStatus.textContent = 'Syncing...';
    try{
      const res = await fetch(endpoint, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      gsStatus.textContent = 'Sync response: ' + (res.ok ? 'OK' : 'Error') + ' — ' + text.slice(0,180);
    }catch(err){
      gsStatus.textContent = 'Sync failed: ' + err.message;
    }
  } else {
    gsStatus.textContent = 'No endpoint provided. Downloading CSV instead...';
    downloadCSVExport();
    setTimeout(()=> gsStatus.textContent = 'CSV downloaded', 800);
  }
});

/* ---------------------------
  Telegram config & test
----------------------------*/
const tgBackdrop = document.getElementById('tgBackdrop');
const tgTokenEl = document.getElementById('tgToken');
const tgChatEl = document.getElementById('tgChatId');
const tgTestBtn = document.getElementById('tgTestBtn');
const tgCloseBtn = document.getElementById('tgCloseBtn');
const tgStatus = document.getElementById('tgStatus');

// document.getElementById('tgConfigBtn').addEventListener('click', ()=>{
//   tgBackdrop.style.display = 'flex';
//   tgStatus.textContent = '';
// });

tgCloseBtn.addEventListener('click', ()=> tgBackdrop.style.display = 'none');

tgTestBtn.addEventListener('click', async ()=>{
  const token = tgTokenEl.value.trim();
  const chat = tgChatEl.value.trim();

  if(!token || !chat) {
     tgStatus.textContent = 'Please provide both token and chat id.';
     return;
     }

  tgStatus.textContent = 'Sending test...';
  const text = encodeURIComponent('Test message from Victoria\'s Secret Planner (local demo).');
  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${text}`;
 
  try{
    // Attempt to call the API — will work only if token/chat correct.
    const res = await fetch(url, { method:'GET' });
    const json = await res.json();
    if(json.ok){
      tgStatus.textContent = 'Test sent successfully!';
    } else {
      tgStatus.textContent = 'Telegram error: ' + (json.description || JSON.stringify(json));
    }
  }catch(err){
    tgStatus.textContent = 'Network/API error: ' + err.message;
  }
});

/* ---------------------------
  Helpers (initialize)
----------------------------*/
function init(){
  loadEvents();
  renderWeekdays();
  renderCalendar();
}

init();

/* Expose editing by double-click on event text within calendar: allow edit full list */
calendarGridEl.addEventListener('dblclick', (e)=>{
  const dayCell = e.target.closest('.day');
  if(!dayCell) return;
  const iso = dayCell.dataset.date;
  const evs = state.events[iso] || [];
  if(evs.length === 0){
    openAddModal(iso);
  } else {
    // if multiple, open edit modal for first; user can delete/edit after opening
    openEditModal(iso, evs[0]);
  }
});

/* Keyboard: ESC to close modals */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    // close any open modal/backdrop
    if(modalBackdrop.style.display === 'flex') closeModal();
    else if(tgBackdrop.style.display === 'flex') tgBackdrop.style.display = 'none';
    else if(gsBackdrop.style.display === 'flex') gsBackdrop.style.display = 'none';
  }
});