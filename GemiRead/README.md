# GemiRead - Active Reader Counter para IAs

![GemiRead Banner](https://via.placeholder.com/800x400.png?text=GemiRead+-+Convierte+tus+chats+en+lectura)

GemiRead es una extensión minimalista para Google Chrome (Manifest V3) que transforma el tiempo que pasas interactuando con Inteligencias Artificiales en una métrica tangible y positiva: **Páginas Leídas**.

En lugar de sentir que pierdes el tiempo haciendo "doomscrolling" en chats, GemiRead cuenta automáticamente las palabras generadas en la pantalla y te muestra tu progreso hacia una meta de lectura diaria.

## 🚀 Características

- **Conteo Inteligente en Tiempo Real:** Detecta nuevo texto generado en plataformas de IA compatibles y actualiza tu conteo sin afectar el rendimiento del navegador.
- **Tasa de Conversión Realista:** Utiliza el estándar de la industria editorial (250 palabras = 1 página) para gamificar tu experiencia de lectura.
- **Diseño Premium y Temas:** Soporte para "Dark Mode" (estilo Cyber/Neon) y "Light Mode" (estilo Cristal/Minimalista) con transiciones y animaciones fluidas basadas en Neuro-Behavioral Design.
- **Meta Diaria (Gamificación):** Barra de progreso visual que te motiva a alcanzar tu meta de lectura diaria (por defecto: 10 páginas).
- **100% Privado (Local Storage):** No lee tus conversaciones ni se conecta a servidores externos. Todo el cálculo se hace en tu navegador y el total de palabras se guarda de forma segura en `chrome.storage.local`.
- **Reinicio Automático:** El contador diario se resetea a cero cada medianoche automáticamente.

## 🌐 IAs Compatibles

Actualmente GemiRead funciona de manera automática en las interfaces web de:
- Google Gemini
- ChatGPT (OpenAI)
- Claude (Anthropic)
- DeepSeek
- Perplexity AI
- Microsoft Copilot
- Qwen
- Meta AI
- HuggingChat

## 🛠️ Instalación (Modo Desarrollador)

Para instalar la extensión manualmente en tu navegador Chrome basado en Chromium (Chrome, Brave, Edge):

1. Descarga o clona este repositorio.
2. Abre tu navegador y ve a la página de extensiones: `chrome://extensions/`
3. Activa el **"Modo desarrollador"** en la esquina superior derecha.
4. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked) en la esquina superior izquierda.
5. Selecciona la carpeta `GemiRead`.
6. ¡Listo! Fija el icono de GemiRead en tu barra de herramientas para acceder rápidamente.

## 📂 Estructura del Código

- `manifest.json`: Configuración principal y permisos requeridos por Chrome (Manifest V3).
- `background.js`: Service Worker que corre en segundo plano. Administra el estado global, suma las palabras y maneja el reinicio diario.
- `content.js`: Script inyectado en las páginas de las IAs. Usa un enfoque robusto para escanear el DOM periódicamente, calcular diferencias (deltas) de texto y enviarlas al cerebro.
- `popup.html / css / js`: La interfaz de usuario gráfica de la extensión que muestra el progreso.

## 📝 Licencia

Este proyecto es para uso personal y educativo.
