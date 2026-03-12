/* ============================================
   DAYFLOW PLANNER — app.js
   Interactive Logic, State & PDF Export
   ============================================ */

'use strict';

// ─── STATE ───────────────────────────────────
const state = {
  weather: 'sunny',
  weatherTemp: '',
  mood: 'happy',
  moodNote: '',
  todos: [],
  achievements: [],
  waterCups: 0, // out of 12 cups (250ml each = 3L)
  quote: null,
  journalText: '',
  journalPrompt: '',
};

// ─── DATA ────────────────────────────────────
const weatherLabels = {
  sunny: 'Sunny & Bright ☀️',
  cloudy: 'Partly Cloudy ⛅',
  rainy: 'Rainy Day 🌧️',
  stormy: 'Stormy Outside ⛈️',
  snowy: 'Cold & Snowy ❄️',
  windy: 'Breezy & Windy 🌬️',
};

const moodLabels = {
  amazing: 'Feeling Amazing 🤩',
  happy: 'Feeling Happy 😊',
  calm: 'Calm & Peaceful 😌',
  tired: 'Feeling Tired 😴',
  anxious: 'Feeling Anxious 😟',
  sad: 'Feeling Sad 😢',
};

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Small steps in the right direction can turn out to be the biggest step of your life.", author: "Naeem Callaway" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "You are never too old to set another goal or dream a new dream.", author: "C.S. Lewis" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
];

let usedQuoteIdx = -1;

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initWeather();
  initMood();
  initTodos();
  initAchievements();
  initWater();
  initMotivation();
  initJournal();
  initPDF();
  loadState();
});

// ─── DATE & DAY ───────────────────────────────
function initDate() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  
  const dayName = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();

  // Week number
  const start = new Date(year, 0, 1);
  const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);

  document.getElementById('dayName').textContent = dayName;
  document.getElementById('dateFull').textContent = `${month} ${date}, ${year}`;
  document.getElementById('weekNum').textContent = `Week ${weekNum} of 52`;
  document.getElementById('dateBig').textContent = String(date).padStart(2, '0');
  document.getElementById('footerDate').textContent = `${dayName}, ${month} ${date} ${year}`;
}

// ─── WEATHER ──────────────────────────────────
function initWeather() {
  const opts = document.querySelectorAll('.weather-opt');
  
  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      opts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.weather = btn.dataset.weather;
      document.getElementById('weatherLabel').textContent = weatherLabels[state.weather];
      saveState();
    });
  });

  document.getElementById('tempInput').addEventListener('input', (e) => {
    state.weatherTemp = e.target.value;
    saveState();
  });

  // Set initial label
  document.getElementById('weatherLabel').textContent = weatherLabels[state.weather];
}

// ─── MOOD ─────────────────────────────────────
function initMood() {
  const opts = document.querySelectorAll('.mood-opt');
  
  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      opts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mood = btn.dataset.mood;
      document.getElementById('moodLabel').textContent = moodLabels[state.mood];
      saveState();
    });
  });

  document.getElementById('moodNote').addEventListener('input', (e) => {
    state.moodNote = e.target.value;
    saveState();
  });

  document.getElementById('moodLabel').textContent = moodLabels[state.mood];
}

// ─── TODOS ────────────────────────────────────
function initTodos() {
  document.getElementById('addTodoBtn').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  renderTodos();
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const priority = document.getElementById('todoPriority').value;
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.style.borderColor = 'rgba(224,90,106,0.5)';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  state.todos.push({ id: Date.now(), text, priority, done: false });
  input.value = '';
  renderTodos();
  saveState();
}

function toggleTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    renderTodos();
    saveState();
  }
}

function deleteTodo(id) {
  const el = document.querySelector(`[data-todo-id="${id}"]`);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = '0.2s ease';
    setTimeout(() => {
      state.todos = state.todos.filter(t => t.id !== id);
      renderTodos();
      saveState();
    }, 200);
    return;
  }
  state.todos = state.todos.filter(t => t.id !== id);
  renderTodos();
  saveState();
}

function renderTodos() {
  const list = document.getElementById('todoList');
  const total = state.todos.length;
  const done = state.todos.filter(t => t.done).length;
  
  document.getElementById('todoStats').textContent = `${done} / ${total} done`;
  document.getElementById('todoProgress').style.width = total > 0 ? `${(done/total)*100}%` : '0%';

  if (total === 0) {
    list.innerHTML = `<div class="empty-state">No tasks yet — add something to accomplish today ✨</div>`;
    return;
  }

  // Sort: undone first, then by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...state.todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  list.innerHTML = sorted.map(todo => `
    <div class="todo-item ${todo.done ? 'done' : ''}" data-todo-id="${todo.id}">
      <button class="todo-check" onclick="toggleTodo(${todo.id})" title="${todo.done ? 'Mark undone' : 'Mark done'}">
        ${todo.done ? '✓' : ''}
      </button>
      <div class="priority-dot ${todo.priority}"></div>
      <span class="todo-text">${escapeHTML(todo.text)}</span>
      <button class="todo-delete" onclick="deleteTodo(${todo.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

// ─── ACHIEVEMENTS ─────────────────────────────
function initAchievements() {
  document.getElementById('addAchievementBtn').addEventListener('click', addAchievement);
  document.getElementById('achievementInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addAchievement();
  });
  renderAchievements();
}

function addAchievement() {
  const input = document.getElementById('achievementInput');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.style.borderColor = 'rgba(224,90,106,0.5)';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  state.achievements.push({ id: Date.now(), text });
  input.value = '';
  renderAchievements();
  saveState();
}

function deleteAchievement(id) {
  state.achievements = state.achievements.filter(a => a.id !== id);
  renderAchievements();
  saveState();
}

function renderAchievements() {
  const list = document.getElementById('achievementList');
  if (state.achievements.length === 0) {
    list.innerHTML = `<div class="empty-state">No achievements recorded yet — celebrate your wins! 🏆</div>`;
    return;
  }
  list.innerHTML = state.achievements.map(a => `
    <div class="achievement-item" data-ach-id="${a.id}">
      <span class="achievement-star">★</span>
      <span class="achievement-text">${escapeHTML(a.text)}</span>
      <button class="achievement-delete" onclick="deleteAchievement(${a.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

// ─── WATER TRACKER ────────────────────────────
function initWater() {
  const container = document.getElementById('waterCups');
  container.innerHTML = '';
  
  for (let i = 0; i < 12; i++) {
    const cup = document.createElement('button');
    cup.className = 'water-cup';
    cup.title = `${(i + 1) * 250}ml`;
    cup.innerHTML = `<span class="cup-icon">💧</span>`;
    cup.addEventListener('click', () => toggleWaterCup(i));
    container.appendChild(cup);
  }
  
  renderWater();
}

function toggleWaterCup(index) {
  // If clicking the next unfilled cup, fill up to here
  // If clicking a filled cup at the end, unfill from here
  if (index < state.waterCups) {
    // Unfill this cup and all after it
    state.waterCups = index;
  } else {
    // Fill up to and including this cup
    state.waterCups = index + 1;
  }

  // Add ripple effect to clicked cup
  const cups = document.querySelectorAll('.water-cup');
  cups[index].classList.add('ripple');
  setTimeout(() => cups[index].classList.remove('ripple'), 400);

  renderWater();
  saveState();
}

function renderWater() {
  const cups = document.querySelectorAll('.water-cup');
  cups.forEach((cup, i) => {
    cup.classList.toggle('filled', i < state.waterCups);
  });

  const ml = state.waterCups * 250;
  document.getElementById('waterAmount').textContent = ml >= 1000 ? `${(ml/1000).toFixed(2).replace(/\.?0+$/,'')}L` : `${ml} ml`;
  document.getElementById('waterBar').style.width = `${(state.waterCups / 12) * 100}%`;
}

// ─── MOTIVATION ───────────────────────────────
function initMotivation() {
  setRandomQuote();
  document.getElementById('refreshQuote').addEventListener('click', () => {
    const quotEl = document.getElementById('motivationQuote');
    quotEl.style.opacity = '0';
    setTimeout(() => {
      setRandomQuote();
      quotEl.style.opacity = '1';
    }, 300);
  });
}

function setRandomQuote() {
  let idx;
  do {
    idx = Math.floor(Math.random() * quotes.length);
  } while (idx === usedQuoteIdx && quotes.length > 1);
  
  usedQuoteIdx = idx;
  const q = quotes[idx];
  document.getElementById('motivationQuote').textContent = q.text;
  document.getElementById('motivationAuthor').textContent = `— ${q.author}`;
  state.quote = q;
}

// ─── JOURNAL ──────────────────────────────────
function initJournal() {
  const textarea = document.getElementById('journalText');
  const chips = document.querySelectorAll('.prompt-chip');

  textarea.addEventListener('input', () => {
    state.journalText = textarea.value;
    updateWordCount();
    saveState();
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const prompt = chip.dataset.prompt;
      if (prompt && !textarea.value.startsWith(prompt)) {
        const cursorPos = textarea.selectionStart;
        const isAtStart = cursorPos === 0 || textarea.value === '';
        if (isAtStart) {
          textarea.value = prompt;
          textarea.setSelectionRange(prompt.length, prompt.length);
        }
      }
      textarea.focus();
    });
  });

  updateWordCount();
}

function updateWordCount() {
  const text = document.getElementById('journalText').value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = `${count} word${count !== 1 ? 's' : ''}`;
}

// ─── PDF EXPORT ───────────────────────────────
function initPDF() {
  document.getElementById('savePdfBtn').addEventListener('click', generatePDF);
}

async function generatePDF() {
  const btn = document.getElementById('savePdfBtn');
  const overlay = document.getElementById('pdfOverlay');
  const status = document.getElementById('pdfStatus');

  btn.classList.add('loading');
  overlay.classList.add('visible');

  try {
    status.textContent = 'Building your planner PDF...';
    await delay(200);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Page constants ──
    const PW = 210;           // A4 width mm
    const PH = 297;           // A4 height mm
    const ML = 18;            // margin left
    const MR = 18;            // margin right
    const CW = PW - ML - MR;  // content width
    const BOTTOM_SAFE = PH - 18; // bottom margin

    // ── Color palette ──
    const C = {
      gold:       [180, 140, 50],
      goldLight:  [210, 175, 90],
      dark:       [20,  22,  30],
      ink:        [35,  38,  50],
      body:       [65,  70,  90],
      muted:      [130, 135, 155],
      line:       [220, 222, 230],
      lineGold:   [220, 195, 130],
      bg:         [252, 251, 248],
      bgGold:     [255, 252, 242],
      bgBlue:     [245, 249, 255],
      bgGreen:    [245, 252, 248],
      white:      [255, 255, 255],
      high:       [210, 65,  80],
      medium:     [200, 155, 40],
      low:        [55,  160, 95],
      water:      [60,  130, 210],
      waterLight: [180, 215, 250],
      check:      [55,  160, 95],
      strikeClr:  [160, 165, 180],
    };

    // ── Helpers ──
    let y = 0; // current Y cursor

    const rgb = (c) => ({ r: c[0], g: c[1], b: c[2] });

    function setFill(c)   { pdf.setFillColor(c[0], c[1], c[2]); }
    function setDraw(c)   { pdf.setDrawColor(c[0], c[1], c[2]); }
    function setTxt(c)    { pdf.setTextColor(c[0], c[1], c[2]); }

    function rect(x, ry, w, h, fill, draw, r = 0) {
      if (fill) setFill(fill);
      if (draw) setDraw(draw);
      if (r > 0) {
        pdf.roundedRect(x, ry, w, h, r, r, fill && draw ? 'FD' : fill ? 'F' : 'D');
      } else {
        pdf.rect(x, ry, w, h, fill && draw ? 'FD' : fill ? 'F' : 'D');
      }
    }

    function hline(lx, rx, ly, color, lw = 0.25) {
      setDraw(color);
      pdf.setLineWidth(lw);
      pdf.line(lx, ly, rx, ly);
    }

    function needsPage(space = 20) {
      if (y + space > BOTTOM_SAFE) {
        pdf.addPage();
        y = 24;
        drawPageFooter();
      }
    }

    // ── Wrap text ──
    function wrapLines(text, maxWidth, fontSize) {
      pdf.setFontSize(fontSize);
      return pdf.splitTextToSize(text || '', maxWidth);
    }

    // ── Section header block ──
    function sectionHeader(title, icon, bgColor = C.bg, accentColor = C.gold) {
      needsPage(22);
      rect(ML, y, CW, 10, bgColor, null, 3);
      // left accent bar
      rect(ML, y, 3, 10, accentColor, null, 1.5);
      setTxt(accentColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(`${icon}  ${title.toUpperCase()}`, ML + 6, y + 6.5);
      y += 14;
    }

    // ── Small label ──
    function label(text, lx = ML, size = 7.5, color = C.muted) {
      setTxt(color);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      pdf.text(text, lx, y);
    }

    // ── Page footer ──
    function drawPageFooter() {
      const pageCount = pdf.internal.getNumberOfPages();
      const pg = pdf.internal.getCurrentPageInfo().pageNumber;
      hline(ML, PW - MR, PH - 12, C.lineGold, 0.4);
      setTxt(C.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('DayFlow Daily Planner', ML, PH - 8);
      pdf.text(`Page ${pg}`, PW - MR, PH - 8, { align: 'right' });
    }

    // ══════════════════════════════════════
    // PAGE 1 — COVER HEADER
    // ══════════════════════════════════════

    // Full-width golden header band
    rect(0, 0, PW, 52, C.dark, null);
    // Decorative golden stripe at bottom of header
    rect(0, 49, PW, 3, C.gold, null);

    // Brand name
    setTxt(C.white);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.text('DayFlow', ML, 22);

    setTxt(C.goldLight);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('D A I L Y  P L A N N E R', ML, 30);

    // Date block (right side)
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayName = days[now.getDay()];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    setTxt(C.gold);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(dayName, PW - MR, 20, { align: 'right' });

    setTxt(C.white);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(dateStr, PW - MR, 28, { align: 'right' });

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    setTxt(C.muted);
    pdf.setFontSize(7.5);
    pdf.text(`Week ${weekNum} of 52`, PW - MR, 35, { align: 'right' });

    y = 60;

    // ══════════════════════════════════════
    // SECTION 1 — WEATHER + MOOD (two columns)
    // ══════════════════════════════════════

    // Weather card (left half)
    const colW = (CW - 8) / 2;
    const colR = ML + colW + 8;

    // Weather box
    rect(ML, y, colW, 34, C.bgGold, C.lineGold, 3);
    rect(ML, y, colW, 8, C.goldLight, null, 3); // header fill
    rect(ML, y + 4, colW, 4, C.goldLight, null); // cover bottom radius of header
    setTxt(C.dark);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('WEATHER', ML + 4, y + 5.5);

    const weatherEmoji = { sunny:'Sunny & Bright', cloudy:'Partly Cloudy', rainy:'Rainy Day', stormy:'Stormy', snowy:'Snowy & Cold', windy:'Breezy & Windy' };
    const wIcon = { sunny:'☀', cloudy:'⛅', rainy:'🌧', stormy:'⛈', snowy:'❄', windy:'💨' };

    setTxt(C.ink);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(wIcon[state.weather] || '☀', ML + 6, y + 22);

    pdf.setFontSize(9);
    pdf.text(weatherEmoji[state.weather] || 'Sunny', ML + 20, y + 20);

    if (state.weatherTemp) {
      setTxt(C.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`${state.weatherTemp}°C`, ML + 20, y + 27);
    }

    // Mood box (right half)
    rect(colR, y, colW, 34, C.bgGold, C.lineGold, 3);
    rect(colR, y, colW, 8, C.goldLight, null, 3);
    rect(colR, y + 4, colW, 4, C.goldLight, null);
    setTxt(C.dark);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('MOOD', colR + 4, y + 5.5);

    const moodPlain = { amazing:'Amazing', happy:'Happy', calm:'Calm & Peaceful', tired:'Tired', anxious:'Anxious', sad:'Sad' };
    const moodIcon = { amazing:'★', happy:'☺', calm:'~', tired:'z', anxious:'!', sad:'…' };
    setTxt(C.ink);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(moodIcon[state.mood] || '☺', colR + 6, y + 22);

    pdf.setFontSize(9);
    pdf.text('Feeling ' + (moodPlain[state.mood] || 'Good'), colR + 20, y + 20);

    if (state.moodNote) {
      setTxt(C.body);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      const moodLines = wrapLines(state.moodNote, colW - 10, 7.5);
      pdf.text(moodLines.slice(0,2), colR + 6, y + 27);
    }

    y += 40;

    // ══════════════════════════════════════
    // SECTION 2 — TODOS
    // ══════════════════════════════════════
    status.textContent = 'Writing tasks...';
    await delay(50);

    sectionHeader('Tasks for Today', '✓', C.bg, C.gold);

    const total = state.todos.length;
    const done  = state.todos.filter(t => t.done).length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    // Progress bar
    needsPage(10);
    rect(ML, y, CW, 4, C.line, null, 2);
    if (pct > 0) rect(ML, y, CW * (pct / 100), 4, C.gold, null, 2);
    setTxt(C.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(`${done} of ${total} completed  (${pct}%)`, PW - MR, y + 3, { align: 'right' });
    y += 9;

    if (total === 0) {
      needsPage(10);
      setTxt(C.muted);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.text('No tasks added.', ML, y);
      y += 10;
    } else {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...state.todos].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      for (const todo of sorted) {
        const lines = wrapLines(todo.text, CW - 26, 9);
        const rowH = Math.max(10, lines.length * 5.5 + 5);
        needsPage(rowH + 3);

        // Row background
        const rowBg = todo.done ? [248, 248, 250] : C.white;
        rect(ML, y, CW, rowH, rowBg, C.line, 2.5);

        // Priority stripe (left edge)
        const pColor = todo.priority === 'high' ? C.high : todo.priority === 'medium' ? C.medium : C.low;
        rect(ML, y, 3, rowH, pColor, null, 1.5);

        // Checkbox
        const cbY = y + rowH / 2 - 3.5;
        rect(ML + 6, cbY, 7, 7, todo.done ? C.check : C.white, todo.done ? C.check : C.line, 1.5);
        if (todo.done) {
          setTxt(C.white);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.text('✓', ML + 7.5, cbY + 5.2);
        }

        // Task text
        setTxt(todo.done ? C.strikeClr : C.ink);
        pdf.setFont('helvetica', todo.done ? 'italic' : 'normal');
        pdf.setFontSize(9);
        const textY = y + rowH / 2 - ((lines.length - 1) * 2.5) + 1.5;
        for (let li = 0; li < lines.length; li++) {
          pdf.text(lines[li], ML + 17, textY + li * 5.2);
          // Strikethrough
          if (todo.done) {
            const tw = pdf.getTextWidth(lines[li]);
            hline(ML + 17, ML + 17 + tw, textY + li * 5.2 - 1.2, C.strikeClr, 0.5);
          }
        }

        // Priority label (right)
        const plabel = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
        setTxt(pColor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text(plabel, PW - MR - 1, y + rowH / 2 + 2, { align: 'right' });

        y += rowH + 2.5;
      }
    }
    y += 4;

    // ══════════════════════════════════════
    // SECTION 3 — ACHIEVEMENTS
    // ══════════════════════════════════════
    status.textContent = 'Writing achievements...';
    await delay(50);

    needsPage(30);
    sectionHeader("Today's Achievements", '★', C.bg, C.gold);

    if (state.achievements.length === 0) {
      setTxt(C.muted);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.text('No achievements recorded yet.', ML, y);
      y += 10;
    } else {
      for (const ach of state.achievements) {
        const lines = wrapLines(ach.text, CW - 20, 9);
        const rowH = Math.max(10, lines.length * 5.5 + 5);
        needsPage(rowH + 3);

        rect(ML, y, CW, rowH, C.bgGold, C.lineGold, 2.5);
        rect(ML, y, 3, rowH, C.gold, null, 1.5);

        // Star badge
        setTxt(C.gold);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('★', ML + 6, y + rowH / 2 + 2.5);

        setTxt(C.ink);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const textY = y + rowH / 2 - ((lines.length - 1) * 2.5) + 1.5;
        pdf.text(lines, ML + 16, textY);

        y += rowH + 2.5;
      }
    }
    y += 4;

    // ══════════════════════════════════════
    // SECTION 4 — WATER TRACKER
    // ══════════════════════════════════════
    status.textContent = 'Writing water & motivation...';
    await delay(50);

    needsPage(55);
    sectionHeader('Hydration Tracker — 3L Goal', '💧', C.bgBlue, C.water);

    const waterML = state.waterCups * 250;
    const waterPct = Math.round((state.waterCups / 12) * 100);

    // Big stat
    setTxt(C.water);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(26);
    const waterStatStr = waterML >= 1000 ? `${(waterML / 1000).toFixed(2).replace(/\.?0+$/, '')} L` : `${waterML} ml`;
    pdf.text(waterStatStr, ML, y + 10);

    setTxt(C.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('/ 3.0 L  goal', ML + pdf.getTextWidth(waterStatStr) + 3, y + 10);

    // Progress bar
    rect(ML, y + 14, CW, 5, C.line, null, 2.5);
    if (waterPct > 0) rect(ML, y + 14, CW * (waterPct / 100), 5, C.water, null, 2.5);
    setTxt(C.muted);
    pdf.setFontSize(7);
    pdf.text(`${waterPct}%`, PW - MR, y + 18, { align: 'right' });

    y += 22;

    // Cup grid — 12 cups in a row
    const cupW = 11;
    const cupH = 14;
    const cupGap = 3;
    for (let i = 0; i < 12; i++) {
      const cx = ML + i * (cupW + cupGap);
      const filled = i < state.waterCups;
      // Cup body
      rect(cx, y, cupW, cupH, filled ? C.waterLight : [240,244,250], filled ? C.water : C.line, 1.5);
      // Fill level
      if (filled) {
        rect(cx + 0.5, y + cupH * 0.35, cupW - 1, cupH * 0.6, C.water, null, 1);
      }
      // Label ml
      setTxt(filled ? C.water : C.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.text(`${(i+1)*250}`, cx + cupW / 2, y + cupH + 4, { align: 'center' });
    }
    y += cupH + 10;

    // ══════════════════════════════════════
    // SECTION 5 — MOTIVATION
    // ══════════════════════════════════════
    needsPage(40);
    sectionHeader('Motivation of the Day', '⚡', C.bgGold, C.gold);

    const quoteText = state.quote ? state.quote.text : document.getElementById('motivationQuote').textContent;
    const quoteAuthor = state.quote ? state.quote.author : '';

    // Decorative quote block
    rect(ML, y, CW, 0, null, null); // placeholder
    const qLines = wrapLines(quoteText, CW - 14, 10.5);
    const qBlockH = qLines.length * 6.5 + 16;
    needsPage(qBlockH);

    rect(ML, y, CW, qBlockH, C.bgGold, C.lineGold, 3);
    rect(ML, y, 4, qBlockH, C.gold, null, 2);

    // Large opening quote mark
    setTxt([220, 185, 100]);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(32);
    pdf.text('"', ML + 8, y + 13);

    setTxt(C.ink);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10.5);
    pdf.text(qLines, ML + 20, y + 11);

    if (quoteAuthor) {
      setTxt(C.gold);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(`— ${quoteAuthor}`, PW - MR - 4, y + qBlockH - 5, { align: 'right' });
    }

    y += qBlockH + 6;

    // ══════════════════════════════════════
    // SECTION 6 — DAILY JOURNAL
    // ══════════════════════════════════════
    status.textContent = 'Writing journal...';
    await delay(50);

    needsPage(40);
    sectionHeader('Daily Journal', '✎', C.bg, C.gold);

    const journalText = state.journalText || document.getElementById('journalText').value;

    if (!journalText.trim()) {
      // Draw lined blank journal area
      needsPage(60);
      for (let li = 0; li < 10; li++) {
        needsPage(8);
        hline(ML, PW - MR, y, C.line, 0.3);
        y += 7;
      }
    } else {
      const jLines = wrapLines(journalText, CW - 8, 9.5);
      const jBlockH = jLines.length * 6 + 14;
      needsPage(jBlockH);

      rect(ML, y, CW, jBlockH, [252, 252, 250], C.line, 3);
      rect(ML, y, 3, jBlockH, [160, 200, 220], null, 1.5);

      setTxt(C.ink);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);

      // Draw text line by line with subtle ruling lines
      let jy = y + 9;
      for (let li = 0; li < jLines.length; li++) {
        needsPage(7);
        hline(ML + 3, PW - MR - 2, jy + 1.5, [235, 237, 245], 0.2);
        pdf.text(jLines[li], ML + 6, jy);
        jy += 6;
        y = jy + 5;
      }
      y = jy + 5;
    }

    y += 6;

    // ══════════════════════════════════════
    // PAGE FOOTERS (all pages)
    // ══════════════════════════════════════
    const totalPages = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      drawPageFooter();
    }

    // ── Metadata ──
    pdf.setProperties({
      title: `DayFlow Planner — ${dateStr}`,
      subject: 'Daily Planner',
      author: 'DayFlow',
      creator: 'DayFlow Daily Planner',
    });

    status.textContent = 'Saving PDF...';
    await delay(150);

    const fileName = `DayFlow_Planner_${formatDateForFile(now)}.pdf`;
    pdf.save(fileName);

    status.textContent = '✓ Saved successfully!';
    await delay(1400);

  } catch (err) {
    console.error('PDF generation error:', err);
    status.textContent = `✕ Error: ${err.message || 'Please try again.'}`;
    await delay(2500);
  } finally {
    overlay.classList.remove('visible');
    btn.classList.remove('loading');
  }
}

function formatDateForFile(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── LOCAL STORAGE — DAY-AWARE PERSISTENCE ────
const TODAY_KEY   = 'dayflow_date';          // stores last-opened date string
const DATA_KEY    = 'dayflow_data';          // stores today's planner data
const SEEN_KEY    = 'dayflow_toast_seen';    // stores toast-seen date

function todayStr() {
  return formatDateForFile(new Date());
}

/**
 * On every page load:
 *  1. Check the stored "last opened" date.
 *  2. If it's a different day → clear all planner data, update the date.
 *     Show a "new day" toast once.
 *  3. If it's the same day → restore saved data.
 *  4. Purge any stale legacy keys from previous versions.
 */
function loadState() {
  try {
    const lastDate = localStorage.getItem(TODAY_KEY);
    const today    = todayStr();
    const isNewDay = lastDate && lastDate !== today;

    if (isNewDay) {
      // ── New day: wipe data, record today, show toast ──
      localStorage.removeItem(DATA_KEY);
      localStorage.setItem(TODAY_KEY, today);
      localStorage.removeItem(SEEN_KEY);
      // Show toast (will auto-dismiss)
      showNewDayToast(lastDate);
    } else {
      // ── Same session or first ever open ──
      if (!lastDate) localStorage.setItem(TODAY_KEY, today);
      restoreData();
    }

    // Purge any old-format keys left from previous app versions
    purgeLegacyKeys(today);

  } catch (e) { /* localStorage unavailable */ }
}

function restoreData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.weather) {
      state.weather = data.weather;
      document.querySelectorAll('.weather-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.weather === state.weather));
      document.getElementById('weatherLabel').textContent = weatherLabels[state.weather] || '';
    }
    if (data.weatherTemp !== undefined) {
      state.weatherTemp = data.weatherTemp;
      document.getElementById('tempInput').value = state.weatherTemp;
    }
    if (data.mood) {
      state.mood = data.mood;
      document.querySelectorAll('.mood-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.mood === state.mood));
      document.getElementById('moodLabel').textContent = moodLabels[state.mood] || '';
    }
    if (data.moodNote) {
      state.moodNote = data.moodNote;
      document.getElementById('moodNote').value = state.moodNote;
    }
    if (Array.isArray(data.todos)) {
      state.todos = data.todos;
      renderTodos();
    }
    if (Array.isArray(data.achievements)) {
      state.achievements = data.achievements;
      renderAchievements();
    }
    if (typeof data.waterCups === 'number') {
      state.waterCups = data.waterCups;
      renderWater();
    }
    if (data.journalText) {
      state.journalText = data.journalText;
      document.getElementById('journalText').value = state.journalText;
      updateWordCount();
    }
  } catch (e) { /* ignore restore errors */ }
}

function saveState() {
  try {
    localStorage.setItem(TODAY_KEY, todayStr());
    localStorage.setItem(DATA_KEY, JSON.stringify({
      weather:      state.weather,
      weatherTemp:  state.weatherTemp,
      mood:         state.mood,
      moodNote:     state.moodNote,
      todos:        state.todos,
      achievements: state.achievements,
      waterCups:    state.waterCups,
      journalText:  state.journalText,
      savedAt:      new Date().toISOString(),
    }));
  } catch (e) { /* unavailable */ }
}

/** Remove old-format per-date keys like "dayflow_planner_2025-01-01" */
function purgeLegacyKeys(today) {
  try {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('dayflow_planner_') && !k.includes(today)) {
        toDelete.push(k);
      }
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  } catch (e) { /* ignore */ }
}

// ─── NEW DAY TOAST ─────────────────────────────
function showNewDayToast(prevDateStr) {
  // Only show once per new day
  if (localStorage.getItem(SEEN_KEY) === todayStr()) return;

  const toast   = document.getElementById('newDayToast');
  const msgEl   = document.getElementById('toastMsg');
  const closeBtn = document.getElementById('toastClose');
  if (!toast) return;

  // Format the previous date for the message
  let prevFormatted = '';
  try {
    const [y, m, d] = prevDateStr.split('-').map(Number);
    const prev = new Date(y, m - 1, d);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    prevFormatted = `${months[prev.getMonth()]} ${prev.getDate()}`;
  } catch(e) { prevFormatted = 'yesterday'; }

  const greetings = getGreeting();
  msgEl.textContent = `${greetings} Your ${prevFormatted} planner has been cleared. Fresh start! 🌟`;

  toast.classList.add('show');
  localStorage.setItem(SEEN_KEY, todayStr());

  // Auto-dismiss after 6s
  let autoTimer = setTimeout(() => dismissToast(toast), 6000);

  closeBtn.addEventListener('click', () => {
    clearTimeout(autoTimer);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.classList.remove('show');
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning! ☀️';
  if (h < 17) return 'Good afternoon! 🌤️';
  return 'Good evening! 🌙';
}

// ─── UTILS ────────────────────────────────────
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── KEYBOARD SHORTCUTS ───────────────────────
document.addEventListener('keydown', (e) => {
  // Ctrl+S / Cmd+S = Save PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    generatePDF();
  }
  // Ctrl+Q = New quote
  if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
    e.preventDefault();
    document.getElementById('refreshQuote').click();
  }
});

// ─── EXPOSE GLOBALS (for onclick handlers) ────
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.deleteAchievement = deleteAchievement;
