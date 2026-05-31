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

  // 1. Detectar salto a otro chat (cambio de URL)
  if (window.location.pathname !== lastKnownPath) {
    lastKnownPath = window.location.pathname;
    
    // Bloqueamos el conteo durante 5 segundos para que cargue el historial del nuevo chat
    ignoreUntil = Date.now() + 5000;
  }

  // 2. Detectar si la pantalla se limpió (ej. borraron mensajes o skeleton loading)
  if (currentTotalWords < lastTotalWords) {
    lastTotalWords = currentTotalWords;
    
    // Si las palabras cayeron a casi cero, se está recargando algo pesado, ignoramos por 3 segs
    if (currentTotalWords < 50) {
      ignoreUntil = Date.now() + 3000;
    }
    return; // No hay incremento que sumar
  } 
  
  // 3. Procesar incrementos reales
  if (currentTotalWords > lastTotalWords) {
    const delta = currentTotalWords - lastTotalWords;
    lastTotalWords = currentTotalWords;
    
    // Si estamos dentro de la ventana de bloqueo, ignoramos este incremento (es el historial cargando)
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
