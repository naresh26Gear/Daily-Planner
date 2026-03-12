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
   PDF EXPORT
════════════════════════════════════════ */
window.exportPDF = async function() {
  saveState(); // flush
  const btn = document.getElementById('btnPdf');
  btn.disabled = true;
  btn.innerHTML = '⏳ Generating…';

  // Wait for libs
  await waitForLib(() => window.html2canvas && window.jspdf);

  try {
    const { jsPDF } = window.jspdf;
    const el = document.getElementById('plannerContent');

    const canvas = await html2canvas(el, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--bg').trim() || '#faf8f4',
      logging: false,
      removeContainer: true,
    });

    const pdf  = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });
    const pw   = pdf.internal.pageSize.getWidth();
    const ph   = pdf.internal.pageSize.getHeight();
    const iw   = pw;
    const ih   = (canvas.height * pw) / canvas.width;
    const imgD = canvas.toDataURL('image/jpeg', 0.90);

    let pos = 0, rem = ih;
    while (rem > 0) {
      pdf.addImage(imgD, 'JPEG', 0, -pos, iw, ih);
      rem -= ph;
      if (rem > 0) { pdf.addPage(); pos += ph; }
    }

    pdf.save(`DailyPlanner_${state.date || getTodayStr()}.pdf`);
    showToast('✓ PDF saved!');
  } catch(e) {
    console.error(e);
    showToast('⚠ PDF generation failed');
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Save PDF`;
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
