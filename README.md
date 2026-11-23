# Mi Recetario — OpenAI seguro + Gemini

## Qué cambia
- OpenAI se consulta desde `server.js`, nunca directamente desde el navegador.
- La clave se configura como variable de entorno `OPENAI_API_KEY` en el servidor.
- Gemini sigue disponible con su clave opcional desde Ajustes.
- Orden de uso: OpenAI del servidor → Gemini configurado en la app → motor local integrado.
- Se conserva el resto de la aplicación, datos locales y funciones existentes.

## Ejecutar en local
1. Instala Node.js 20 o superior.
2. En esta carpeta ejecuta `npm install`.
3. Configura `OPENAI_API_KEY` en el entorno del sistema o en un archivo `.env` (si usas dotenv, instala y configura el paquete; no es necesario en Render).
4. Ejecuta `npm start` y abre `http://localhost:3000`.

## Publicar en Render
1. Sube el contenido de esta carpeta a GitHub.
2. En Render crea/actualiza un servicio **Web Service** conectado al repositorio.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. En Environment añade `OPENAI_API_KEY` con tu clave real. Opcionalmente añade `OPENAI_MODEL`.
6. Guarda y despliega. No escribas la clave en `index.html` ni la subas a GitHub.

Comprueba `https://TU-DOMINIO/api/health`: debe devolver `openaiConfigured: true`.

La API de OpenAI tiene facturación independiente de ChatGPT. Si la cuenta API no tiene saldo/cuota, la app pasará a Gemini (si está configurado) y después al motor local.
