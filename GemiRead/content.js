// content.js
// Enfoque robusto para interfaces de chat LLM:
// Calculamos el total de palabras periódicamente y enviamos la diferencia (delta) al background.

let lastTotalWords = -1; // -1 indica que es la primera ejecución
let lastKnownPath = window.location.pathname;

let lastActivityTime = 0; // Guardaremos la hora exacta de la última actividad válida (prompt del usuario o streaming de IA)

function countWords(text) {
  if (!text) return 0;
  // Cuenta palabras reales, ignorando espacios múltiples
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function getChatTotalWords() {
  // 1. Intentar buscar los contenedores de mensajes específicos de las IAs
  const messageSelectors = [
    'model-response',       // Gemini
    'user-query',           // Gemini
    '.message-content',     // Gemini
    '.markdown',            // ChatGPT
    '.font-claude-message', // Claude
    '.prose'                // Perplexity, Qwen, etc.
  ].join(', ');
  
  const messages = document.querySelectorAll(messageSelectors);
  let text = '';
  
  if (messages.length > 0) {
    // Si encontramos mensajes, sumamos el texto de cada uno
    messages.forEach(m => {
      const clone = m.cloneNode(true);
      const hiddenElements = clone.querySelectorAll('script, style, [aria-hidden="true"], svg, button');
      hiddenElements.forEach(el => el.remove());
      // Usamos textContent como respaldo seguro del cloneNode
      text += (clone.innerText || clone.textContent) + ' ';
    });
  } else {
    // 2. Fallback: Si no detecta los mensajes, agarra el <main> entero
    const mainContent = document.querySelector('main') || document.body;
    const clone = mainContent.cloneNode(true);
    
    // Eliminamos elementos que no son lectura útil
    const hiddenElements = clone.querySelectorAll('script, style, nav, header, aside, footer, [aria-hidden="true"], svg, button, .visually-hidden');
    hiddenElements.forEach(el => el.remove());
    text = (clone.innerText || clone.textContent);
  }

  return countWords(text);
}

function checkWordDelta() {
  const currentTotalWords = getChatTotalWords();

  // 0. Inicialización en la primera carga de la página
  if (lastTotalWords === -1) {
    lastTotalWords = currentTotalWords;
    return;
  }

  // 1. Detectar salto a otro chat (cambio de URL)
  if (window.location.pathname !== lastKnownPath) {
    lastKnownPath = window.location.pathname;
    
    // Si la navegación ocurre sin que el usuario haya escrito un prompt recientemente (< 15s),
    // es un salto a un chat del historial. Reseteamos la actividad para ignorar el historial.
    if (Date.now() - lastActivityTime > 15000) {
      lastActivityTime = 0; 
    }
    
    lastTotalWords = currentTotalWords;
    return;
  }

  // 2. Detectar si la pantalla se limpió (ej. borraron mensajes o skeleton loading)
  if (currentTotalWords < lastTotalWords) {
    lastTotalWords = currentTotalWords;
    
    // Si las palabras cayeron a casi cero, es probable que se limpió la pantalla para cargar historial
    if (currentTotalWords < 50) {
      if (Date.now() - lastActivityTime > 15000) {
        lastActivityTime = 0;
      }
    }
    return; // No hay incremento que sumar
  } 
  
  // 3. Procesar incrementos reales
  if (currentTotalWords > lastTotalWords) {
    const delta = currentTotalWords - lastTotalWords;
    lastTotalWords = currentTotalWords;
    
    if (lastActivityTime === 0) {
      // No hay un prompt reciente que justifique generación de palabras. Es historial cargándose.
      return;
    }
    
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    
    // Si ha pasado demasiado tiempo desde la última actividad (ej. 5 minutos - 300000ms),
    // asumimos que la generación ya debió haber terminado y cualquier incremento es anómalo
    // (ej. recargando la página entera con F5 sin cambiar la URL).
    // Eliminamos el límite de cantidad de palabras porque modelos ultra rápidos 
    // (como Gemini Flash) pueden generar miles de palabras casi de golpe.
    if (timeSinceLastActivity > 300000) {
      return; 
    }
    
    // Es un incremento válido de streaming. Actualizamos la actividad para encadenar
    lastActivityTime = Date.now();
    
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
      lastActivityTime = Date.now(); // <-- MARCAMOS LA HORA DEL PROMPT
      lastTypedWords = 0;
    }
  }
});

// Capturar cuando se hace clic en un botón (enviar, regenerar o chip)
document.addEventListener('click', (e) => {
  const el = e.target;
  const btn = el.closest('button') || el.closest('[role="button"]');
  
  if (btn) {
    if (lastTypedWords > 0) {
      // Envío normal con texto tipeado
      chrome.runtime.sendMessage({ type: "ADD_USER_WORDS", wordCount: lastTypedWords });
      lastActivityTime = Date.now(); // <-- MARCAMOS LA HORA DEL PROMPT
      lastTypedWords = 0;
    } else {
      // Intento de capturar clics en "Regenerar" o "Chips de sugerencias" (sin texto previo)
      const text = (btn.innerText || btn.textContent || '').toLowerCase().trim();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase().trim();
      
      // 1. Detectar si es un botón de regenerar (en inglés o español)
      const isRegenerate = ['regenerate', 'retry', 'regenerar', 'reintentar'].some(k => text.includes(k) || ariaLabel.includes(k));
      
      // 2. Detectar si es un chip de sugerencia (suelen ser botones con frases de > 2 palabras)
      const isSuggestionChip = text.split(' ').length > 2 && text.length > 15;
      
      // 3. Asegurarnos de que no es un clic en el historial de la barra lateral 
      // (para no confundirlo con cambiar de chat). Los historiales suelen estar en <nav>, <aside> o dentro de enlaces <a>
      const isInSidebar = btn.closest('nav') || btn.closest('aside') || btn.closest('a');
      
      if (!isInSidebar && (isRegenerate || isSuggestionChip)) {
        lastActivityTime = Date.now(); // Activamos el contador para atrapar la nueva respuesta!
      }
    }
  }
});
