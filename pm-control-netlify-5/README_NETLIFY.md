# Despliegue en Netlify — PM Control

Instrucciones rápidas para probar y desplegar este sitio en Netlify.

Requisitos locales
- Node.js 18+
- npm
- netlify-cli (recomendado para pruebas locales)

Instalación (opcional)
```bash
# instalar dependencias del proyecto
npm install
# instalar netlify-cli si no lo tienes (opcional)
npm install -g netlify-cli
```

Variables de entorno necesarias
- `OPENAI_API_KEY`: clave para que `functions/ai.js` consulte la API de OpenAI.

Pruebas locales con Netlify Dev
```bash
# Exportar la clave si vas a probar la función AI
export OPENAI_API_KEY="sk_..."
# Iniciar entorno local (sirve frontend + funciones)
npx netlify dev
# Luego abre http://localhost:8888
```

Comprobaciones útiles
- `/.netlify/functions/hello` debe responder con JSON.
- `/.netlify/functions/activities` debe permitir GET/POST.

Despliegue a Netlify (CLI)
```bash
# Login (si no has iniciado sesión)
netlify login
# Deploy producción (directorio `public`)
netlify deploy --prod --dir=public
```

Despliegue por GitHub (recomendado)
1. Conecta el repositorio a Netlify desde la UI (Site settings → Deploys → Connect to Git provider).
2. Asegura que `Publish directory` esté configurado como `public`.
3. En `Site settings → Build & deploy → Environment`, agrega `OPENAI_API_KEY`.

Notas importantes
- `functions/activities.js` usa `@netlify/blobs`. Asegúrate que tu cuenta/plan soporte Netlify Blobs o adapta la función a otro backend de almacenamiento.
- No existe paso de `build` en la configuración actual: la carpeta `public/` contiene el sitio final.

Si quieres, puedo:
- ejecutar `npx netlify dev` aquí para probar (necesitaré permiso para instalar dependencias y ejecutar procesos),
- o abrir un PR con cambios adicionales (scripts, README mejorado, tests).
