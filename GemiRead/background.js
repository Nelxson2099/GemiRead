chrome.runtime.onInstalled.addListener(() => {
  // Inicializar almacenamiento
  chrome.storage.local.get(["totalWords", "lastResetDate", "theme"], (result) => {
    const today = new Date().toLocaleDateString();
    let updates = {};
    
    if (result.totalWords === undefined) updates.totalWords = 0;
    if (result.theme === undefined) updates.theme = 'dark'; // Tema cyber dark por defecto
    
    // Reset si es un nuevo día
    if (result.lastResetDate !== today) {
      updates.totalWords = 0;
      updates.lastResetDate = today;
    }
    
    chrome.storage.local.set(updates);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ADD_WORDS") {
    chrome.storage.local.get(["totalWords", "lastResetDate"], (result) => {
      const today = new Date().toLocaleDateString();
      let currentWords = result.totalWords || 0;
      
      // Reset diario
      if (result.lastResetDate !== today) {
        currentWords = 0;
      }
      
      const newTotal = currentWords + message.wordCount;
      chrome.storage.local.set({ 
        totalWords: newTotal,
        lastResetDate: today 
      });
      
      sendResponse({ success: true, total: newTotal });
    });
    return true; 
  }
});
