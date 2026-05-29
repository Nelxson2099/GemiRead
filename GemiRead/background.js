chrome.runtime.onInstalled.addListener(() => {
  // Inicializar almacenamiento
  chrome.storage.sync.get(["totalWords", "userWords", "lastResetDate", "theme", "dailyGoalPages", "weeklyHistory"], (result) => {
    const today = new Date().toLocaleDateString();
    let updates = {};
    
    if (result.totalWords === undefined) updates.totalWords = 0;
    if (result.userWords === undefined) updates.userWords = 0;
    if (result.theme === undefined) updates.theme = 'dark';
    if (result.dailyGoalPages === undefined) updates.dailyGoalPages = 10;
    if (result.weeklyHistory === undefined) updates.weeklyHistory = {};
    
    // Reset si es un nuevo día
    if (result.lastResetDate !== today) {
      // Guardar el progreso del día anterior en el historial
      if (result.lastResetDate && (result.totalWords > 0 || result.userWords > 0)) {
        const history = result.weeklyHistory || {};
        history[result.lastResetDate] = {
          totalWords: result.totalWords || 0,
          userWords: result.userWords || 0
        };
        
        // Mantener solo los últimos 7 días
        const dates = Object.keys(history).sort((a, b) => new Date(a) - new Date(b));
        while (dates.length > 7) {
          const oldestDate = dates.shift();
          delete history[oldestDate];
        }
        updates.weeklyHistory = history;
      }

      updates.totalWords = 0;
      updates.userWords = 0;
      updates.lastResetDate = today;
    }
    
    chrome.storage.sync.set(updates);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ADD_WORDS" || message.type === "ADD_USER_WORDS") {
    chrome.storage.sync.get(["totalWords", "userWords", "lastResetDate", "weeklyHistory"], (result) => {
      const today = new Date().toLocaleDateString();
      let currentTotalWords = result.totalWords || 0;
      let currentUserWords = result.userWords || 0;
      let history = result.weeklyHistory || {};
      
      // Reset diario si cambió el día mientras la extensión estaba corriendo
      if (result.lastResetDate !== today) {
        if (result.lastResetDate && (currentTotalWords > 0 || currentUserWords > 0)) {
          history[result.lastResetDate] = {
            totalWords: currentTotalWords,
            userWords: currentUserWords
          };
          
          const dates = Object.keys(history).sort((a, b) => new Date(a) - new Date(b));
          while (dates.length > 7) {
            delete history[dates.shift()];
          }
        }
        currentTotalWords = 0;
        currentUserWords = 0;
      }
      
      let newTotal = currentTotalWords;
      let newUser = currentUserWords;

      if (message.type === "ADD_WORDS") {
        newTotal += message.wordCount;
      } else if (message.type === "ADD_USER_WORDS") {
        newUser += message.wordCount;
        // The user words also contribute to the total words count, BUT
        // the content script already counts the DOM changes (including the user's prompt).
        // If we add it here, we will double count.
        // Wait, content.js counts ALL words.
        // So ADD_WORDS will be triggered for the user's prompt too.
        // We just need to track the user portion here.
      }

      chrome.storage.sync.set({ 
        totalWords: newTotal,
        userWords: newUser,
        lastResetDate: today,
        weeklyHistory: history
      });
      
      sendResponse({ success: true, total: newTotal, user: newUser });
    });
    return true; 
  }
});
