
# PM Control & Seguimiento — Netlify FULL

Incluye Functions + autodetección + función `hello` para validar que Functions están online.

## CLI (recomendado)
npm install -g netlify-cli
netlify login
netlify init
netlify env:set OPENAI_API_KEY TU_CLAVE_DE_OPENAI
netlify deploy --dir=public --functions=functions
netlify deploy --prod --dir=public --functions=functions

## Comprobar
/.netlify/functions/hello → debe devolver JSON ok:true
/.netlify/functions/activities → lista (vacía) 200
/api/activities → debe redirigir (200) si el redirect está activo
