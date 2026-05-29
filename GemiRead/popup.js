const WORDS_PER_PAGE = 250;
let dailyGoalPages = 10;
let totalWordsGlobal = 0;
let userWordsGlobal = 0;

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const settingsToggleBtn = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const dailyGoalInput = document.getElementById('daily-goal-input');
  const progressGoalText = document.getElementById('progress-goal-text');
  const toggleDetailsBtn = document.getElementById('toggle-details-btn');
  const detailsPanel = document.getElementById('details-panel');
  const historyList = document.getElementById('history-list');

  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  
  const pagesCountEl = document.getElementById('pages-count');
  const wordsCountEl = document.getElementById('words-count');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressFillEl = document.getElementById('progress-fill');
  
  const userWordsCountEl = document.getElementById('user-words-count');
  const aiWordsCountEl = document.getElementById('ai-words-count');

  // Load state from sync storage
  chrome.storage.sync.get(['theme', 'totalWords', 'userWords', 'dailyGoalPages', 'weeklyHistory'], (result) => {
    // Theme
    const currentTheme = result.theme || 'dark';
    setTheme(currentTheme);
    
    // Settings
    dailyGoalPages = result.dailyGoalPages || 10;
    dailyGoalInput.value = dailyGoalPages;
    progressGoalText.textContent = `Meta diaria: ${dailyGoalPages} págs`;
    
    // Stats
    totalWordsGlobal = result.totalWords || 0;
    userWordsGlobal = result.userWords || 0;
    updateStats(totalWordsGlobal, userWordsGlobal);
    
    // History
    renderHistory(result.weeklyHistory || {});
  });

  // UI Event Listeners
  themeToggleBtn.addEventListener('click', () => {
    const isDark = body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    chrome.storage.sync.set({ theme: newTheme });
  });

  settingsToggleBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettingsBtn.addEventListener('click', () => {
    const newGoal = parseInt(dailyGoalInput.value, 10);
    if (newGoal > 0) {
      dailyGoalPages = newGoal;
      chrome.storage.sync.set({ dailyGoalPages: newGoal });
      progressGoalText.textContent = `Meta diaria: ${dailyGoalPages} págs`;
      settingsPanel.classList.add('hidden');
      updateStats(totalWordsGlobal, userWordsGlobal);
    }
  });

  toggleDetailsBtn.addEventListener('click', () => {
    detailsPanel.classList.toggle('hidden');
    if (detailsPanel.classList.contains('hidden')) {
      toggleDetailsBtn.textContent = 'Ver Detalles 👇';
    } else {
      toggleDetailsBtn.textContent = 'Ocultar Detalles ☝️';
    }
  });

  function setTheme(theme) {
    if (theme === 'dark') {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    } else {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    }
  }

  function updateStats(totalWords, userWords) {
    totalWordsGlobal = totalWords;
    userWordsGlobal = userWords;
    
    const aiWords = Math.max(0, totalWords - userWords);
    const pages = Math.floor(totalWords / WORDS_PER_PAGE);
    
    pagesCountEl.textContent = pages;
    wordsCountEl.textContent = totalWords.toLocaleString();
    
    userWordsCountEl.textContent = userWords.toLocaleString();
    aiWordsCountEl.textContent = aiWords.toLocaleString();

    let percent = (pages / dailyGoalPages) * 100;
    if (percent > 100) percent = 100;
    
    setTimeout(() => {
      progressFillEl.style.width = `${percent}%`;
      progressPercentEl.textContent = `${Math.floor(percent)}%`;
    }, 50);
  }

  function renderHistory(historyObj) {
    historyList.innerHTML = '';
    const dates = Object.keys(historyObj).sort((a, b) => new Date(b) - new Date(a)); // Descending
    
    if (dates.length === 0) {
      historyList.innerHTML = '<div class="history-empty">Aún no hay datos.</div>';
      return;
    }
    
    dates.forEach(date => {
      const data = historyObj[date];
      const pages = Math.floor(data.totalWords / WORDS_PER_PAGE);
      
      const el = document.createElement('div');
      el.className = 'history-item';
      
      // Formatear fecha ej: "28/5/2026" a "28 may"
      const parts = date.split('/');
      let dateStr = date;
      if (parts.length === 3) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(d)) {
           dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }
      }
      
      el.innerHTML = `
        <span class="history-item-date">${dateStr}</span>
        <span class="history-item-stats">${pages} págs (${data.totalWords.toLocaleString()} pal.)</span>
      `;
      historyList.appendChild(el);
    });
  }

  // Listen for real-time updates while popup is open
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.totalWords || changes.userWords) {
        const newTotal = changes.totalWords ? changes.totalWords.newValue : totalWordsGlobal;
        const newUser = changes.userWords ? changes.userWords.newValue : userWordsGlobal;
        updateStats(newTotal, newUser);
      }
      if (changes.weeklyHistory) {
        renderHistory(changes.weeklyHistory.newValue);
      }
    }
  });
});
