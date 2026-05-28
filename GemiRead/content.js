// content.js
// Enfoque robusto para interfaces de chat LLM:
// Calculamos el total de palabras periódicamente y enviamos la diferencia (delta) al background.

let lastTotalWords = 0;
let lastKnownPath = window.location.pathname;

function countWords(text) {
  if (!text) return 0;
  // Cuenta palabras reales, ignorando espacios múltiples
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function getChatTotalWords() {
  // Extraemos el texto principal de Gemini. 
  // Clonamos para no afectar el DOM real.
  const mainContent = document.querySelector('main') || document.body;
  const clone = mainContent.cloneNode(true);
  
  // Eliminamos elementos que no son lectura útil (scripts, menús ocultos, svgs)
  const hiddenElements = clone.querySelectorAll('script, style, nav, header, [aria-hidden="true"], svg');
  hiddenElements.forEach(el => el.remove());

  return countWords(clone.innerText || clone.textContent);
}

function checkWordDelta() {
  // Si cambia la URL (ej. nuevo chat), reiniciamos el contador local
  if (window.location.pathname !== lastKnownPath) {
    lastTotalWords = 0;
    lastKnownPath = window.location.pathname;
  }

  const currentTotalWords = getChatTotalWords();
  
  // Si hay nuevas palabras generadas (por ti o por Gemini)
  if (currentTotalWords > lastTotalWords) {
    const delta = currentTotalWords - lastTotalWords;
    lastTotalWords = currentTotalWords;
    
    // Enviamos solo el incremento al cerebro (background.js)
    chrome.runtime.sendMessage({ type: "ADD_WORDS", wordCount: delta });
  } else if (currentTotalWords < lastTotalWords) {
    // Si borramos el chat o fuimos a uno más corto, ajustamos la referencia
    lastTotalWords = currentTotalWords;
  }
}

// Revisar la interfaz cada 3 segundos mientras estamos en la pestaña
setInterval(checkWordDelta, 3000);
