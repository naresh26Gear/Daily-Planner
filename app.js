/* ════════════════════════════════════════
   DAILY PLANNER — app.js
   • localStorage persistence (per-day key)
   • Auto-clear on new day
   • Rich-text editors (bold, italic, underline)
   • Water tracker (200ml cups, animated)
   • Habits (add/delete, modal)
   • Tasks (add/delete/filter/progress)
════════════════════════════════════════ */

'use strict';

/* ─── CONSTANTS ─── */
const STORAGE_PREFIX  = 'dp_';
const EMOJIS          = ['🎯','🧘','🏃','💪','📚','🌱','🔥','⭐','💎','🎵','✍️','🧠','🏋️','🚴','🧘','🎨','🍎','💧','🛌','🧹'];
const DEFAULT_HABITS  = [
  { id:'h1', icon:'🧘', name:'Yoga',          done:false },
  { id:'h2', icon:'🏃', name:'Running',        done:false },
  { id:'h3', icon:'💪', name:'Exercise',       done:false },
  { id:'h4', icon:'⚡', name:'Energy Drink',   done:false },
  { id:'h5', icon:'📚', name:'Self-Help Book', done:false },
];
const DEFAULT_TASKS   = [
  { id:'t1', name:'Math',    time:'morning', priority:'high',   done:false },
  { id:'t2', name:'English', time:'noon',    priority:'medium', done:false },
  { id:'t3', name:'CA',      time:'evening', priority:'low',    done:false },
];
const QUOTES = [
  "The secret of getting ahead is getting started.",
  "One day or day one. You decide.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you — you have to go out and get it.",
  "The harder you work, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today your future self will thank you for.",
  "Discipline is doing what needs to be done even when you don't want to.",
  "Small daily improvements lead to stunning results over time.",
];

/* ─── STATE ─── */
let state = {
  date:        '',
  place:       '',
  day:         0,
  habits:      [],
  tasks:       [],
  waterGoal:   3,
  waterFilled: 0,
  thoughts:    '',
  quote:       '',
  summary:     '',
};
let filterMode   = 'all';
let selectedEmoji = '🎯';
let saveTimer    = null;

/* ─── STORAGE KEY ─── */
function todayKey() {
  return STORAGE_PREFIX + getTodayStr();
}
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ─── SAVE ─── */
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}
function saveState() {
  try {
    // Read rich editors into state before saving
    state.thoughts = document.getElementById('thoughtsEditor').innerHTML;
    state.quote    = document.getElementById('quoteEditor').innerHTML;
    state.summary  = document.getElementById('summaryEditor').innerHTML;
    state.place    = document.getElementById('planPlace').value;
    localStorage.setItem(todayKey(), JSON.stringify(state));
  } catch(e) { console.warn('Save failed', e); }
}

/* ─── LOAD ─── */
function loadState() {
  try {
    const raw = localStorage.getItem(todayKey());
    if (raw) {
      const saved = JSON.parse(raw);
      state = Object.assign({}, state, saved);
      return true;
    }
  } catch(e) { console.warn('Load failed', e); }
  return false;
}

/* ─── INIT ─── */
function init() {
  const todayStr = getTodayStr();
  const loaded   = loadState();

  if (!loaded) {
    // Fresh day — default state
    state.date        = todayStr;
    state.day         = new Date().getDay();
    state.habits      = JSON.parse(JSON.stringify(DEFAULT_HABITS));
    state.tasks       = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    state.waterGoal   = 3;
    state.waterFilled = 0;
    state.quote       = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // Ensure date field reflects today
  const planDateEl = document.getElementById('planDate');
  planDateEl.value = state.date || todayStr;

  // Update display
  updateDateDisplay();
  setActiveDayBtn(state.day);
  document.getElementById('planPlace').value = state.place || '';

  // Rich editors
  document.getElementById('thoughtsEditor').innerHTML = state.thoughts || '';
  document.getElementById('quoteEditor').innerHTML    = state.quote
    ? (state.quote.startsWith('<') ? state.quote : escapeHtml(state.quote))
    : '';
  document.getElementById('summaryEditor').innerHTML  = state.summary || '';

  // Water
  document.getElementById('waterGoalInput').value = state.waterGoal;

  // Render components
  renderHabits();
  renderTasks();
  renderWater();

  // Theme
  const theme = localStorage.getItem('dp_theme') || 'light';
  applyTheme(theme);

  // Bind events
  bindEvents();
}

/* ─── EVENTS ─── */
function bindEvents() {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('change', function() {
    applyTheme(this.checked ? 'dark' : 'light');
  });

  // Date change
  document.getElementById('planDate').addEventListener('change', function() {
    state.date = this.value;
    updateDateDisplay();
    scheduleSave();
  });

  // Place change
  document.getElementById('planPlace').addEventListener('input', scheduleSave);

  // Day buttons
  document.getElementById('daySelector').addEventListener('click', function(e) {
    const btn = e.target.closest('.day-btn');
    if (!btn) return;
    state.day = parseInt(btn.dataset.day);
    setActiveDayBtn(state.day);
    scheduleSave();
  });

  // Add habit button
  document.getElementById('btnAddHabit').addEventListener('click', handleAddHabit);
  document.getElementById('habitInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleAddHabit();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterMode = this.dataset.filter;
      renderTasks();
    });
  });

  // Add task
  document.getElementById('btnAddTask').addEventListener('click', () => addTask());

  // Water goal
  document.getElementById('waterGoalInput').addEventListener('change', function() {
    state.waterGoal   = Math.max(1, Math.min(6, parseInt(this.value) || 3));
    state.waterFilled = Math.min(state.waterFilled, state.waterGoal * 5);
    this.value = state.waterGoal;
    renderWater();
    scheduleSave();
  });

  // Rich editor toolbars
  document.querySelectorAll('.fmt-toolbar').forEach(toolbar => {
    toolbar.addEventListener('mousedown', function(e) {
      const btn = e.target.closest('.fmt-btn');
      if (!btn) return;
      e.preventDefault(); // prevent blur
      document.execCommand(btn.dataset.cmd, false, null);
      scheduleSave();
    });
  });

  // Rich editors autosave
  ['thoughtsEditor','quoteEditor','summaryEditor'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', scheduleSave);
    el.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); document.execCommand('bold',      false, null); }
        if (e.key === 'i') { e.preventDefault(); document.execCommand('italic',    false, null); }
        if (e.key === 'u') { e.preventDefault(); document.execCommand('underline', false, null); }
      }
      scheduleSave();
    });
  });

  // Random quote button
  document.getElementById('btnGenQuote').addEventListener('click', function() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const el = document.getElementById('quoteEditor');
    el.innerHTML = escapeHtml(q);
    el.style.animation = 'none';
    requestAnimationFrame(() => { el.style.animation = 'fadeUp 0.4s ease'; });
    scheduleSave();
  });

  // Modal confirm
  document.getElementById('btnConfirmHabit').addEventListener('click', confirmAddHabit);
  document.getElementById('modalHabitName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') confirmAddHabit();
  });

  // Nav links
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', function() {
      document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ─── THEME ─── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').checked = (theme === 'dark');
  localStorage.setItem('dp_theme', theme);
}

/* ─── DATE DISPLAY ─── */
function updateDateDisplay() {
  const d = state.date ? new Date(state.date + 'T00:00:00') : new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('dateDisplay').textContent = d.toLocaleDateString(undefined, opts);
}

/* ─── DAY BUTTON ─── */
function setActiveDayBtn(day) {
  document.querySelectorAll('.day-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.day) === day);
  });
}

/* ════════════════════════════════════════
   HABITS
════════════════════════════════════════ */
function renderHabits() {
  const grid = document.getElementById('habitsGrid');
  grid.innerHTML = '';
  state.habits.forEach(h => {
    const chip = createHabitChip(h);
    grid.appendChild(chip);
  });
}

function createHabitChip(h) {
  const chip = document.createElement('div');
  chip.className = 'habit-chip' + (h.done ? ' done' : '');
  chip.dataset.id = h.id;
  chip.innerHTML = `
    <span class="chip-icon">${h.icon}</span>
    <span class="chip-text">${escapeHtml(h.name)}</span>
    <button class="chip-delete" title="Remove habit">✕</button>
  `;
  chip.querySelector('.chip-icon, .chip-text').addEventListener('click', () => toggleHabit(h.id));
  chip.addEventListener('click', function(e) {
    if (e.target.closest('.chip-delete')) { deleteHabit(h.id); return; }
    if (e.target.closest('.chip-text') || e.target.closest('.chip-icon') || e.target === chip) {
      toggleHabit(h.id);
    }
  });
  return chip;
}

function toggleHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  h.done = !h.done;

  const chip = document.querySelector(`.habit-chip[data-id="${id}"]`);
  if (chip) {
    chip.classList.toggle('done', h.done);
    chip.classList.remove('pop');
    requestAnimationFrame(() => chip.classList.add('pop'));
    setTimeout(() => chip.classList.remove('pop'), 300);
  }
  scheduleSave();
}

function deleteHabit(id) {
  const chip = document.querySelector(`.habit-chip[data-id="${id}"]`);
  if (chip) {
    chip.style.opacity = '0';
    chip.style.transform = 'scale(0.85)';
    chip.style.transition = 'all 0.22s';
    setTimeout(() => {
      state.habits = state.habits.filter(h => h.id !== id);
      renderHabits();
      scheduleSave();
    }, 220);
  } else {
    state.habits = state.habits.filter(h => h.id !== id);
    renderHabits();
    scheduleSave();
  }
}

/* Inline add (no modal needed, simpler & more reliable) */
function handleAddHabit() {
  const nameEl  = document.getElementById('habitInput');
  const emojiEl = document.getElementById('habitEmoji');
  const name    = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }

  const newHabit = {
    id:   'h_' + Date.now(),
    icon: emojiEl.value,
    name: name,
    done: false,
  };
  state.habits.push(newHabit);

  const chip = createHabitChip(newHabit);
  chip.style.opacity   = '0';
  chip.style.transform = 'scale(0.8)';
  document.getElementById('habitsGrid').appendChild(chip);
  requestAnimationFrame(() => {
    chip.style.transition = 'opacity 0.3s ease, transform 0.3s var(--spring)';
    chip.style.opacity    = '1';
    chip.style.transform  = 'scale(1)';
  });

  nameEl.value = '';
  nameEl.focus();
  scheduleSave();
  showToast('✓ Habit added!');
}

/* ─── Modal (kept for future, currently unused by inline flow) ─── */
function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeHabitModal();
}
function closeHabitModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.style.animation = 'fadeIn 0.2s reverse both';
  setTimeout(() => { overlay.style.display = 'none'; }, 200);
}
function confirmAddHabit() { closeHabitModal(); }

/* ════════════════════════════════════════
   TASKS
════════════════════════════════════════ */
function addTask(name='', time='morning', priority='high', done=false) {
  const task = { id: 't_'+Date.now()+Math.random(), name, time, priority, done };
  state.tasks.push(task);
  renderTasks();
  // Focus new input
  const inputs = document.querySelectorAll('.task-name');
  if (inputs.length) inputs[inputs.length-1].focus();
  scheduleSave();
}

function renderTasks() {
  const list = document.getElementById('tasksList');
  list.innerHTML = '';

  const toShow = filterMode === 'all'
    ? state.tasks
    : state.tasks.filter(t => t.priority === filterMode);

  toShow.forEach((task, i) => {
    const el = buildTaskEl(task, i);
    list.appendChild(el);
  });

  updateProgress();
}

function buildTaskEl(task, idx) {
  const item = document.createElement('div');
  item.className = 'task-item';
  item.dataset.id = task.id;
  item.style.animationDelay = (idx * 0.04) + 's';

  item.innerHTML = `
    <div class="task-check ${task.done ? 'checked' : ''}" title="Toggle done">
      ${task.done ? '✓' : ''}
    </div>
    <div class="task-body">
      <input class="task-name ${task.done ? 'striked' : ''}"
             value="${escapeAttr(task.name)}" placeholder="Task name…" />
      <div class="task-meta">
        <span class="pri-dot pri-${task.priority}"></span>
        <select class="task-sel time-sel">
          <option value="morning" ${task.time==='morning'?'selected':''}>🌅 Morning</option>
          <option value="noon"    ${task.time==='noon'   ?'selected':''}>☀️ Noon</option>
          <option value="evening" ${task.time==='evening'?'selected':''}>🌆 Evening</option>
        </select>
        <select class="task-sel pri-sel">
          <option value="high"   ${task.priority==='high'  ?'selected':''}>🔴 High</option>
          <option value="medium" ${task.priority==='medium'?'selected':''}>🟡 Medium</option>
          <option value="low"    ${task.priority==='low'   ?'selected':''}>🟢 Low</option>
        </select>
        <span class="time-badge time-${task.time}">${capitalize(task.time)}</span>
      </div>
    </div>
    <button class="task-delete" title="Delete task">✕</button>
  `;

  // Checkbox toggle
  item.querySelector('.task-check').addEventListener('click', function() {
    task.done = !task.done;
    this.classList.toggle('checked', task.done);
    this.textContent = task.done ? '✓' : '';
    const nameEl = item.querySelector('.task-name');
    nameEl.classList.toggle('striked', task.done);
    updateProgress();
    scheduleSave();
  });

  // Name input
  item.querySelector('.task-name').addEventListener('input', function() {
    task.name = this.value;
    scheduleSave();
  });

  // Time select
  item.querySelector('.time-sel').addEventListener('change', function() {
    task.time = this.value;
    const badge = item.querySelector('.time-badge');
    badge.className = `time-badge time-${task.time}`;
    badge.textContent = capitalize(task.time);
    scheduleSave();
  });

  // Priority select
  item.querySelector('.pri-sel').addEventListener('change', function() {
    task.priority = this.value;
    const dot = item.querySelector('.pri-dot');
    dot.className = `pri-dot pri-${task.priority}`;
    scheduleSave();
  });

  // Delete
  item.querySelector('.task-delete').addEventListener('click', function() {
    item.style.opacity   = '0';
    item.style.transform = 'translateX(20px)';
    item.style.transition = 'all 0.22s';
    setTimeout(() => {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      renderTasks();
      scheduleSave();
    }, 220);
  });

  return item;
}

function updateProgress() {
  const total  = state.tasks.length;
  const done   = state.tasks.filter(t => t.done).length;
  const pct    = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressText').textContent = `${done} / ${total} tasks`;
  document.getElementById('progressFill').style.width = pct + '%';
}

/* ════════════════════════════════════════
   WATER TRACKER (200ml / cup)
════════════════════════════════════════ */
function renderWater() {
  const cups    = document.getElementById('waterCups');
  const total   = state.waterGoal * 5; // 5 cups × 200ml = 1L per goal litre
  cups.innerHTML = '';

  for (let i = 0; i < total; i++) {
    const filled = i < state.waterFilled;
    const cup    = document.createElement('div');
    cup.className = 'water-cup' + (filled ? ' filled' : '');
    cup.innerHTML = `
      <div class="cup-fill"></div>
      <span class="cup-drop">💧</span>
      <span class="cup-label">200ml</span>
      <div class="cup-ripple"></div>
    `;

    cup.addEventListener('click', function() {
      const isFilled = this.classList.contains('filled');
      // If clicking on the last filled cup — unfill it; else fill up to i+1
      state.waterFilled = isFilled && i === state.waterFilled - 1
        ? state.waterFilled - 1
        : i + 1;
      renderWater();
      scheduleSave();

      // Ripple on fill
      if (!isFilled) {
        this.classList.add('rippling');
        setTimeout(() => this.classList.remove('rippling'), 600);
      }
    });

    cups.appendChild(cup);
  }

  updateWaterStats();
}

function updateWaterStats() {
  const consumed = state.waterFilled * 200;
  const goalMl   = state.waterGoal * 1000;
  const pct      = Math.min(100, Math.round((consumed / goalMl) * 100));

  document.getElementById('waterConsumed').textContent  = consumed >= 1000
    ? (consumed/1000).toFixed(1) + ' L'
    : consumed + ' ml';
  document.getElementById('waterGoalText').textContent  = `/ ${goalMl} ml goal`;
  document.getElementById('waterPct').textContent       = pct + '% hydrated';
  document.getElementById('waterProgressFill').style.width = pct + '%';
}

/* ════════════════════════════════════════
   PRINT / PDF ENGINE
   Opens a styled print-preview window with
   full professional journal layout.
════════════════════════════════════════ */

window.exportPDF = function printPlanner() {
  saveState();

  /* ── helpers ── */
  const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const PRI_COLOR  = { high:'#c83030', medium:'#c09030', low:'#2e8b5a' };
  const TIME_LABEL = { morning:'🌅 Morning', noon:'☀️ Noon', evening:'🌆 Evening' };
  const consumed   = state.waterFilled * 200;
  const goalMl     = state.waterGoal * 1000;
  const waterPct   = Math.min(100, Math.round((consumed / goalMl) * 100));

  function fmtDate(d) {
    if (!d) return new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  function stripTags(html) {
    const t = document.createElement('div'); t.innerHTML = html || ''; return t.innerText || '';
  }
  function richToprint(html) {
    return (html || '').replace(/<b>/gi,'<strong>').replace(/<\/b>/gi,'</strong>')
      .replace(/<i>/gi,'<em>').replace(/<\/i>/gi,'</em>')
      .replace(/<br\s*\/?>/gi,'<br>')
      .replace(/<div>/gi,'<br>').replace(/<\/div>/gi,'')
      .replace(/<p>/gi,'').replace(/<\/p>/gi,'<br>');
  }

  /* ── task rows ── */
  const taskRows = (state.tasks.length ? state.tasks : []).map(t => `
    <tr class="task-row ${t.done ? 'task-done' : ''}">
      <td class="task-check-cell">
        <div class="print-check ${t.done ? 'checked' : ''}">${t.done ? '✓' : ''}</div>
      </td>
      <td class="task-name-cell">${escapeHtml(t.name || '—')}</td>
      <td class="task-time-cell">${TIME_LABEL[t.time] || t.time}</td>
      <td class="task-pri-cell">
        <span class="pri-tag" style="background:${PRI_COLOR[t.priority]}20;color:${PRI_COLOR[t.priority]};border:1px solid ${PRI_COLOR[t.priority]}60">
          ${(t.priority||'').toUpperCase()}
        </span>
      </td>
    </tr>`).join('');

  /* ── habit chips ── */
  const habitChips = (state.habits.length ? state.habits : []).map(h => `
    <span class="habit-print ${h.done ? 'habit-done' : ''}">
      ${h.icon} ${escapeHtml(h.name)}
      ${h.done ? '<span class="habit-tick">✓</span>' : ''}
    </span>`).join('');

  /* ── water cups ── */
  const totalCups   = state.waterGoal * 5;
  const waterCupHtml = Array.from({length: totalCups}, (_,i) => `
    <div class="p-cup ${i < state.waterFilled ? 'p-cup-filled' : ''}">
      ${i < state.waterFilled ? '💧' : ''}
    </div>`).join('');

  /* ── progress stats ── */
  const doneTasks  = state.tasks.filter(t => t.done).length;
  const totalTasks = state.tasks.length;
  const taskPct    = totalTasks ? Math.round((doneTasks/totalTasks)*100) : 0;
  const doneHabits = state.habits.filter(h => h.done).length;

  /* ── full HTML document ── */
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Daily Planner — ${fmtDate(state.date)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
/* ── RESET ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px}
body{
  font-family:'Roboto',sans-serif;
  background:#fff;
  color:#1c1814;
  padding:0;margin:0;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ── PAGE ── */
.page{
  width:210mm;min-height:297mm;
  margin:0 auto;padding:14mm 16mm 12mm;
  background:#fff;
  position:relative;
}

/* ── HEADER BAND ── */
.page-header{
  display:flex;align-items:flex-start;justify-content:space-between;
  border-bottom:3px solid #c8602a;
  padding-bottom:10px;margin-bottom:16px;
}
.header-left{}
.brand-row{
  display:flex;align-items:center;gap:8px;
  font-family:'Playfair Display',serif;
  font-size:1.05rem;color:#9a8e84;
  font-weight:600;margin-bottom:3px;
}
.brand-row .dot{color:#c8602a}
.page-title{
  font-family:'Playfair Display',serif;
  font-size:2.6rem;font-weight:700;
  color:#1c1814;line-height:1;letter-spacing:-0.02em;
}
.page-title em{color:#c8602a;font-style:italic}
.header-right{text-align:right}
.date-label{
  font-family:'Roboto',sans-serif;
  font-size:0.72rem;font-weight:700;
  text-transform:uppercase;letter-spacing:0.12em;
  color:#9a8e84;margin-bottom:3px;
}
.date-value{
  font-family:'Playfair Display',serif;
  font-size:1.1rem;font-weight:600;color:#1c1814;
}
.place-value{
  font-size:0.82rem;color:#5a4e44;margin-top:2px;
}
.day-pill{
  display:inline-block;margin-top:5px;
  padding:3px 12px;border-radius:999px;
  background:#c8602a;color:#fff;
  font-family:'Roboto',sans-serif;
  font-size:0.72rem;font-weight:700;
  letter-spacing:0.08em;text-transform:uppercase;
}

/* ── STAT STRIP ── */
.stat-strip{
  display:flex;gap:0;
  background:#faf8f4;
  border:1px solid #e8e0d4;border-radius:10px;
  overflow:hidden;margin-bottom:14px;
}
.stat-box{
  flex:1;padding:10px 14px;
  border-right:1px solid #e8e0d4;
  text-align:center;
}
.stat-box:last-child{border-right:none}
.stat-num{
  font-family:'Playfair Display',serif;
  font-size:1.6rem;font-weight:700;color:#c8602a;line-height:1;
}
.stat-sub{font-size:0.68rem;color:#9a8e84;font-weight:500;margin-top:3px;text-transform:uppercase;letter-spacing:0.08em}

/* ── SECTION BLOCK ── */
.block{margin-bottom:12px;page-break-inside:avoid}
.block-title{
  font-family:'Roboto',sans-serif;
  font-size:0.65rem;font-weight:700;
  text-transform:uppercase;letter-spacing:0.16em;
  color:#9a8e84;
  display:flex;align-items:center;gap:8px;
  margin-bottom:8px;
}
.block-title::after{content:'';flex:1;height:1px;background:#e8e0d4}
.block-body{
  background:#faf8f4;
  border:1px solid #e8e0d4;border-radius:8px;
  padding:10px 13px;
}

/* ── HABITS ── */
.habits-wrap{display:flex;flex-wrap:wrap;gap:7px;padding:8px 0}
.habit-print{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 13px;border-radius:999px;
  border:1.5px solid #d0c8c0;
  background:#fff;
  font-family:'Roboto',sans-serif;font-size:0.78rem;font-weight:500;
  color:#5a4e44;
}
.habit-done{
  background:#c8602a;border-color:#c8602a;color:#fff;
}
.habit-tick{font-size:0.7rem;margin-left:3px}

/* ── TASK TABLE ── */
.task-table{width:100%;border-collapse:collapse}
.task-table th{
  font-family:'Roboto',sans-serif;
  font-size:0.65rem;font-weight:700;
  text-transform:uppercase;letter-spacing:0.1em;
  color:#9a8e84;padding:5px 10px;
  border-bottom:1px solid #e8e0d4;text-align:left;
}
.task-row{border-bottom:1px solid #ece6de}
.task-row:last-child{border-bottom:none}
.task-row.task-done .task-name-cell{text-decoration:line-through;color:#9a8e84}
.task-row td{padding:7px 10px;vertical-align:middle}
.print-check{
  width:16px;height:16px;border-radius:4px;
  border:1.5px solid #c8602a;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;color:#fff;
}
.print-check.checked{background:#2e8b5a;border-color:#2e8b5a}
.task-check-cell{width:28px}
.task-name-cell{font-family:'Roboto',sans-serif;font-size:0.85rem;color:#1c1814;font-weight:500}
.task-time-cell{font-size:0.78rem;color:#5a4e44;white-space:nowrap}
.task-pri-cell{width:76px}
.pri-tag{
  font-family:'Roboto',sans-serif;
  font-size:0.65rem;font-weight:700;
  padding:2px 8px;border-radius:999px;
  letter-spacing:0.06em;
}
.empty-tasks{font-size:0.82rem;color:#9a8e84;font-style:italic;padding:6px 2px}

/* ── WATER ── */
.water-header-row{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:8px;
}
.water-big{
  font-family:'Playfair Display',serif;
  font-size:1.8rem;font-weight:700;color:#3498db;line-height:1;
}
.water-sub{font-size:0.72rem;color:#9a8e84;margin-top:2px}
.water-bar-wrap{height:10px;background:#e8f4ff;border-radius:999px;overflow:hidden;margin-bottom:8px}
.water-bar-fill{height:100%;background:linear-gradient(90deg,#3498db,#5dade2);border-radius:999px}
.water-cups-print{display:flex;flex-wrap:wrap;gap:5px}
.p-cup{
  width:32px;height:40px;
  border-radius:4px 4px 6px 6px;
  border:1.5px solid #3498db;
  display:flex;align-items:center;justify-content:center;
  font-size:0.7rem;color:#3498db;
  background:#fff;
}
.p-cup-filled{background:#3498db;color:#fff;border-color:#2980b9}

/* ── TEXT SECTIONS ── */
.text-content{
  font-family:'Roboto',sans-serif;
  font-size:0.86rem;line-height:1.75;
  color:#1c1814;min-height:60px;
  white-space:pre-wrap;word-break:break-word;
}
.text-content:empty::before{content:'—';color:#c0b8b0}

/* ── QUOTE ── */
.quote-block{
  background:linear-gradient(135deg,#c8602a 0%,#e8884a 100%);
  border-radius:8px;padding:14px 16px;position:relative;overflow:hidden;
}
.quote-bg{
  position:absolute;top:-16px;left:10px;
  font-family:'Playfair Display',serif;
  font-size:5rem;color:rgba(255,255,255,0.12);line-height:1;
}
.quote-text{
  font-family:'Roboto',sans-serif;
  font-size:0.95rem;font-weight:500;
  color:#fff;line-height:1.65;
  position:relative;z-index:1;
  font-style:italic;
}

/* ── TWO COL ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}

/* ── FOOTER ── */
.page-footer{
  margin-top:auto;padding-top:12px;
  border-top:1px solid #e8e0d4;
  display:flex;justify-content:space-between;align-items:center;
}
.footer-brand{
  font-family:'Playfair Display',serif;
  font-size:0.8rem;color:#c8602a;font-weight:600;
}
.footer-note{font-size:0.68rem;color:#c0b8b0;font-style:italic}
.page-num{font-family:'Roboto Mono',monospace;font-size:0.68rem;color:#9a8e84}

/* ── LINES (journal ruled) ── */
.ruled-area{
  min-height:70px;
  background-image:repeating-linear-gradient(
    transparent, transparent 23px, #ece6de 23px, #ece6de 24px
  );
  background-position:0 8px;
  font-family:'Roboto',sans-serif;font-size:0.86rem;line-height:24px;
  color:#1c1814;padding:8px 4px 0;
  border-radius:0 0 6px 6px;
  word-break:break-word;white-space:pre-wrap;
}

/* ── PRINT OVERRIDES ── */
@media print{
  @page{margin:0;size:A4 portrait}
  body{background:#fff}
  .page{padding:12mm 14mm 10mm;margin:0;width:100%;min-height:100vh}
  .no-print{display:none!important}
}

/* ── PREVIEW TOOLBAR (screen only) ── */
@media screen{
  body{background:#e8e0d4;padding:20px}
  .preview-bar{
    position:fixed;top:0;left:0;right:0;z-index:100;
    background:#1c1814;padding:12px 24px;
    display:flex;align-items:center;justify-content:space-between;
  }
  .preview-title{
    font-family:'Playfair Display',serif;
    color:#fff;font-size:1rem;
  }
  .preview-title em{color:#e8884a}
  .preview-actions{display:flex;gap:10px}
  .btn-print,.btn-close{
    padding:8px 20px;border-radius:999px;border:none;
    font-family:'Roboto',sans-serif;font-size:0.84rem;font-weight:700;
    cursor:pointer;letter-spacing:0.03em;
  }
  .btn-print{background:#c8602a;color:#fff}
  .btn-print:hover{background:#e07840}
  .btn-close{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)}
  .btn-close:hover{background:rgba(255,255,255,0.2)}
  .page{
    box-shadow:0 8px 40px rgba(0,0,0,0.25);
    border-radius:4px;margin:60px auto 40px;
  }
}
</style>
</head>
<body>

<!-- PREVIEW BAR (hidden on print) -->
<div class="preview-bar no-print">
  <div class="preview-title">📋 Daily<em>Planner</em> — Print Preview</div>
  <div class="preview-actions">
    <button class="btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>

<!-- MAIN PAGE -->
<div class="page">

  <!-- ── HEADER ── -->
  <div class="page-header">
    <div class="header-left">
      <div class="brand-row">📋 <span class="dot">Daily</span>Planner</div>
      <div class="page-title">Daily <em>Journal</em></div>
    </div>
    <div class="header-right">
      <div class="date-label">Date</div>
      <div class="date-value">${fmtDate(state.date)}</div>
      ${state.place ? `<div class="place-value">📍 ${escapeHtml(state.place)}</div>` : ''}
      <div class="day-pill">${DAY_NAMES[state.day] || DAY_NAMES[new Date().getDay()]}</div>
    </div>
  </div>

  <!-- ── STATS STRIP ── -->
  <div class="stat-strip">
    <div class="stat-box">
      <div class="stat-num">${doneTasks}/${totalTasks}</div>
      <div class="stat-sub">Tasks Done</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${taskPct}%</div>
      <div class="stat-sub">Completion</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${doneHabits}/${state.habits.length}</div>
      <div class="stat-sub">Habits Done</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${waterPct}%</div>
      <div class="stat-sub">Hydration</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${consumed >= 1000 ? (consumed/1000).toFixed(1)+'L' : consumed+'ml'}</div>
      <div class="stat-sub">Water Today</div>
    </div>
  </div>

  <!-- ── HABITS ── -->
  <div class="block">
    <div class="block-title">🌟 Daily Habits</div>
    <div class="habits-wrap">
      ${habitChips || '<span style="font-size:0.82rem;color:#9a8e84;font-style:italic">No habits added</span>'}
    </div>
  </div>

  <!-- ── TASKS ── -->
  <div class="block">
    <div class="block-title">🎯 Today's Goals &amp; Tasks</div>
    <div class="block-body" style="padding:0">
      ${state.tasks.length ? `
      <table class="task-table">
        <thead>
          <tr>
            <th></th>
            <th>Task</th>
            <th>Time Slot</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>${taskRows}</tbody>
      </table>` : '<div class="empty-tasks" style="padding:10px 14px">No tasks added for today.</div>'}
    </div>
  </div>

  <!-- ── TWO COL: WATER + QUOTE ── -->
  <div class="two-col">

    <!-- Water -->
    <div class="block" style="margin-bottom:0">
      <div class="block-title">💧 Water Tracker</div>
      <div class="block-body">
        <div class="water-header-row">
          <div>
            <div class="water-big">${consumed >= 1000 ? (consumed/1000).toFixed(1)+' L' : consumed+' ml'}</div>
            <div class="water-sub">of ${goalMl} ml · ${waterPct}% hydrated</div>
          </div>
        </div>
        <div class="water-bar-wrap">
          <div class="water-bar-fill" style="width:${waterPct}%"></div>
        </div>
        <div class="water-cups-print">${waterCupHtml}</div>
        <div style="font-size:0.65rem;color:#9a8e84;margin-top:6px">Each cup = 200 ml</div>
      </div>
    </div>

    <!-- Quote -->
    <div class="block" style="margin-bottom:0">
      <div class="block-title">✨ Motivational Quote</div>
      <div class="quote-block">
        <div class="quote-bg">"</div>
        <div class="quote-text">${richToprint(state.quote) || 'Write your motivational quote here.'}</div>
      </div>
    </div>

  </div>

  <!-- ── THOUGHTS ── -->
  <div class="block">
    <div class="block-title">💡 Thoughts &amp; Ideas</div>
    <div class="block-body">
      <div class="text-content ruled-area">${richToprint(state.thoughts) || ''}</div>
    </div>
  </div>

  <!-- ── JOURNAL SUMMARY ── -->
  <div class="block">
    <div class="block-title">📓 Daily Journal &amp; Summary</div>
    <div class="block-body">
      <div class="text-content ruled-area" style="min-height:90px">${richToprint(state.summary) || ''}</div>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div class="page-footer">
    <div class="footer-brand">📋 DailyPlanner</div>
    <div class="footer-note">Plan intentionally. Live fully.</div>
    <div class="page-num">${fmtDate(state.date)}</div>
  </div>

</div><!-- /page -->
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes');
  if (!w) { showToast('⚠ Allow pop-ups to open print preview'); return; }
  w.document.open();
  w.document.write(doc);
  w.document.close();
};

function waitForLib(check, ms=50, max=100) {
  return new Promise((res, rej) => {
    let tries = 0;
    const t = setInterval(() => {
      if (check()) { clearInterval(t); res(); }
      else if (++tries > max) { clearInterval(t); rej('timeout'); }
    }, ms);
  });
}

/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ════════════════════════════════════════
   UTILS
════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ─── CLEANUP: remove old days (keep 30 days) ─── */
function pruneOldData() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX) && k !== 'dp_theme');
    if (keys.length <= 30) return;
    keys.sort();
    keys.slice(0, keys.length - 30).forEach(k => localStorage.removeItem(k));
  } catch(e) {}
}

/* ─── KICK OFF ─── */
document.addEventListener('DOMContentLoaded', () => {
  pruneOldData();
  init();
});
