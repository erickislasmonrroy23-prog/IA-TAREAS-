
// functions/ai.js
export const handler = async (event) => {
  const headersBase = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: headersBase, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: headersBase, body: "Method not allowed" };

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };
  }

  try {
    const { prompt, system, mode } = JSON.parse(event.body || "{}");
    const baseSystem = system || "You are an assistant that turns hospital SOP checklists and KPIs into clear actions.";
    const sys = mode === "tasks"
      ? "Eres un analista de operaciones hospitalarias. A partir de un texto de entrada (extraído de PDF/DOCX/XLSX/PPTX), devuelve una lista JSON estricta de tareas con este esquema: [{\"title\":\"...\",\"area\":\"Finanzas/Operación/Comercial/TI\",\"steps\":\"(1) ... (2) ... (3) ...\",\"expected_result\":\"resultado observable\",\"where\":\"área/lugar/sistema\",\"when\":\"frecuencia o fecha sugerida\",\"who\":\"rol sugerido\",\"start\":\"YYYY-MM-DD opcional\",\"end\":\"YYYY-MM-DD opcional\",\"status\":\"Planificado\"}]. No agregues explicación fuera del JSON. Ajusta títulos concisos y claros."
      : baseSystem;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt || "Dame un checklist simple para cargos correctos en < 1 hora." }
        ]
      })
    });
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return { statusCode: 200, headers: { ...headersBase, "Content-Type":"application/json" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: e.message }) };
  }
};
