const WORDS_PER_PAGE = 250;
const DAILY_GOAL_PAGES = 10;

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  
  const pagesCountEl = document.getElementById('pages-count');
  const wordsCountEl = document.getElementById('words-count');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressFillEl = document.getElementById('progress-fill');

  // Load state from local storage
  chrome.storage.local.get(['theme', 'totalWords'], (result) => {
    // Theme setup
    const currentTheme = result.theme || 'dark';
    setTheme(currentTheme);
    
    // Stats setup
    const totalWords = result.totalWords || 0;
    updateStats(totalWords);
  });

  // Theme Toggle Logic
  themeToggleBtn.addEventListener('click', () => {
    const isDark = body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    setTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
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

  function updateStats(words) {
    const pages = Math.floor(words / WORDS_PER_PAGE);
    
    pagesCountEl.textContent = pages;
    wordsCountEl.textContent = words.toLocaleString();

    // Progress bar math
    let percent = (pages / DAILY_GOAL_PAGES) * 100;
    if (percent > 100) percent = 100;
    
    // Slight delay to allow CSS transition to animate when popup opens
    setTimeout(() => {
      progressFillEl.style.width = `${percent}%`;
      progressPercentEl.textContent = `${Math.floor(percent)}%`;
    }, 50);
  }

  // Listen for real-time updates while popup is open
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.totalWords) {
      updateStats(changes.totalWords.newValue);
    }
  });
});
