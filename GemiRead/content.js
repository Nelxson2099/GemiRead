// content.js
// Enfoque robusto para interfaces de chat LLM:
// Calculamos el total de palabras periódicamente y enviamos la diferencia (delta) al background.

let lastTotalWords = 0;
let lastKnownPath = window.location.pathname;

// Ventana de tiempo durante la cual ignoramos los incrementos de palabras
// Esto sirve para omitir la carga del historial al abrir un chat viejo.
let ignoreUntil = Date.now() + 3500;

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
  const currentTotalWords = getChatTotalWords();

  // Si cambia la URL, verificamos si es un chat nuevo o una continuación
  if (window.location.pathname !== lastKnownPath) {
    lastKnownPath = window.location.pathname;
    
    // Si la cantidad de palabras cayó drásticamente, asumimos que el chat se limpió (ej. navegamos a otro chat)
    if (currentTotalWords < lastTotalWords * 0.5 || currentTotalWords < 50) {
      ignoreUntil = Date.now() + 3500;
    }
  }

  // Si el DOM tiene muy pocas palabras (chat vacío o cargando), extendemos la ventana de ignorar
  if (currentTotalWords < 50) {
    ignoreUntil = Date.now() + 3500;
  }

  // Si borramos el chat o la página se limpió sin cambiar de URL
  if (currentTotalWords < lastTotalWords) {
    lastTotalWords = currentTotalWords;
    if (currentTotalWords < 50) {
      ignoreUntil = Date.now() + 3500;
    }
  } else if (currentTotalWords > lastTotalWords) {
    const delta = currentTotalWords - lastTotalWords;
    lastTotalWords = currentTotalWords;
    
    // Si estamos dentro de la ventana de ignorar, no enviamos el delta
    // Esto previene que se sume todo el historial de un chat viejo
    if (Date.now() < ignoreUntil) {
      return;
    }
    
    // Enviamos solo el incremento al cerebro (background.js)
    chrome.runtime.sendMessage({ type: "ADD_WORDS", wordCount: delta });
  }
}

// Revisar la interfaz cada 3 segundos mientras estamos en la pestaña
setInterval(checkWordDelta, 3000);

// --- SEGUIMIENTO DE PALABRAS DEL USUARIO (PROMPTS) ---
let lastTypedWords = 0;

// Escuchar todo lo que se escribe en textareas o elementos editables
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el && (el.tagName === 'TEXTAREA' || el.isContentEditable || el.tagName === 'INPUT')) {
    const text = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : (el.innerText || el.textContent);
    lastTypedWords = countWords(text);
  }
});

// Capturar cuando se envía con Enter
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (lastTypedWords > 0) {
      chrome.runtime.sendMessage({ type: "ADD_USER_WORDS", wordCount: lastTypedWords });
      lastTypedWords = 0;
    }
  }
});

// Capturar cuando se hace clic en un botón de enviar
document.addEventListener('click', (e) => {
  const el = e.target;
  // Si hacemos clic en un botón (o SVG dentro de un botón) y teníamos texto escrito
  if (el.closest('button') || el.closest('[role="button"]')) {
    if (lastTypedWords > 0) {
      // Usamos un pequeño timeout para asegurarnos de que el texto no se borró antes de que el evento input se disparara de nuevo
      chrome.runtime.sendMessage({ type: "ADD_USER_WORDS", wordCount: lastTypedWords });
      lastTypedWords = 0;
    }
  }
});
