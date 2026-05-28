<div align="center">
  <img src="https://via.placeholder.com/150/0b0e14/39ff14?text=GemiRead" alt="GemiRead Logo" width="120" height="120" style="border-radius:50%; border: 2px solid #39FF14">
  <h1>GemiRead</h1>
  <p><b>Convierte el tiempo que pasas leyendo respuestas de IA en libros reales.</b></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://www.google.com/chrome/)
</div>

---

## 📖 La Ironía Moderna

Se dice constantemente que "la gente ya no lee", que nuestra capacidad de atención se ha arruinado por los videos cortos y que los libros están muriendo. Sin embargo, hay una ironía gigante: **estamos leyendo más que nunca**, solo que lo hacemos a través de nuestras conversaciones kilométricas con Inteligencias Artificiales.

**GemiRead** nace para hacerte consciente de esto. Es una extensión de Chrome minimalista que funciona en segundo plano mientras usas ChatGPT, Gemini, Claude, etc. Cuenta implacablemente cada palabra que generas y lees en estas plataformas, y te la traduce a una métrica que realmente importa: **Libros Equivalentes**.

¿Leíste 80,000 palabras debatiendo con ChatGPT esta semana? Felicidades, acabas de leer el equivalente a *El Alquimista* de Paulo Coelho.

## ✨ Características

- **Seguimiento Automático:** Monitorea tu consumo de palabras en ChatGPT, Gemini, Claude y DeepSeek sin que tengas que hacer nada.
- **Equivalencias Literarias:** Convierte tu recuento de palabras en libros reales (desde cuentos cortos hasta obras magnas como *El Señor de los Anillos* o *Harry Potter*).
- **Dashboard Brutalista:** Interfaz "cyberpunk/hacker" limpia y directa, sin distracciones.
- **Modos de Apariencia:** Soporta temas Light, Dark y Hacker Matrix.
- **Privacidad Local:** No rastreamos tus conversaciones. La extensión cuenta las palabras a nivel de navegador y tu API de Gemini se almacena estrictamente de forma local en tu máquina.

## 🚀 Instalación (Modo Desarrollador)

Como esta extensión es Open Source y aún no está en la Chrome Web Store, puedes instalarla en 30 segundos:

1. **Descarga** este repositorio (o clónalo con `git clone`).
2. Abre Google Chrome y ve a `chrome://extensions/`.
3. Activa el **"Modo desarrollador"** (interruptor arriba a la derecha).
4. Haz clic en **"Cargar descomprimida"** (Load unpacked) y selecciona la carpeta de este repositorio.
5. Haz clic en el ícono de la extensión, añade tu API Key gratuita de Google Gemini (se guarda localmente) y ¡listo!

## ⚙️ Cómo Funciona

GemiRead se inyecta silenciosamente en las pestañas de IA. Cuando detecta que el modelo está generando un bloque de texto, extrae el texto puro, cuenta las palabras exactas, y actualiza tu base de datos local usando `chrome.storage.local`. Luego, pasa estos datos por una LLM para darte un análisis filosófico y sarcástico de tus hábitos de lectura moderna.

## 🤝 Contribuciones

Este es mi primer repositorio Open Source público. Si quieres mejorar el diseño, añadir soporte para más IAs, o hacer que el cálculo de palabras sea más robusto, ¡los Pull Requests son más que bienvenidos!

1. Haz un Fork del proyecto.
2. Crea tu rama de característica (`git checkout -b feature/MejoraIncreible`).
3. Haz Commit de tus cambios (`git commit -m 'Añadida mejora increíble'`).
4. Haz Push a la rama (`git push origin feature/MejoraIncreible`).
5. Abre un Pull Request.

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
