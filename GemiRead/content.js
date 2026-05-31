// content.js
// Enfoque robusto para interfaces de chat LLM:
// Calculamos el total de palabras periódicamente y enviamos la diferencia (delta) al background.

let lastTotalWords = 0;
let lastKnownPath = window.location.pathname;

let isAwaitingHistory = false;
let lastPromptSentTime = 0; // Guardaremos la hora exacta en la que el usuario envía un prompt

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
    // Marcamos que estamos esperando que cargue el historial del nuevo chat
    isAwaitingHistory = true;
  }

  // 2. Detectar si la pantalla se limpió (ej. borraron mensajes o skeleton loading)
  if (currentTotalWords < lastTotalWords) {
    lastTotalWords = currentTotalWords;
    
    // Si las palabras cayeron a casi cero, es probable que se limpió la pantalla para cargar historial
    if (currentTotalWords < 50) {
      isAwaitingHistory = true;
    }
    return; // No hay incremento que sumar
  } 
  
  // 3. Procesar incrementos reales
  if (currentTotalWords > lastTotalWords) {
    const delta = currentTotalWords - lastTotalWords;
    lastTotalWords = currentTotalWords;
    
    if (isAwaitingHistory) {
      isAwaitingHistory = false; // Ya atrapamos el primer salto
      
      // Heurística de Vibecoder: ¿Cómo sabemos si este salto de palabras es el historial viejo 
      // o es la IA respondiendo súper rápido en un chat nuevo?
      // Respuesta: Si el usuario acaba de mandar un prompt (hace menos de 60 segundos), 
      // es generación de IA. Si no mandó nada y saltó, es historial.
      const userJustPrompted = (Date.now() - lastPromptSentTime) < 60000;
      
      if (!userJustPrompted && delta > 50) {
        // No acaba de enviar un prompt y saltaron muchas palabras = es historial viejo. ¡Ignóralo!
        return; 
      }
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
      lastPromptSentTime = Date.now(); // <-- MARCAMOS LA HORA DEL PROMPT
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
      chrome.runtime.sendMessage({ type: "ADD_USER_WORDS", wordCount: lastTypedWords });
      lastPromptSentTime = Date.now(); // <-- MARCAMOS LA HORA DEL PROMPT
      lastTypedWords = 0;
    }
  }
});
