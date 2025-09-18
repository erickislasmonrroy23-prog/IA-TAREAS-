
// functions/activities.js
import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

const FALLBACK_FILE = path.join(process.cwd(), ".netlify_blobs_fallback.json");

function ensureFallbackFile(){
  try{
    if (!fs.existsSync(FALLBACK_FILE)) fs.writeFileSync(FALLBACK_FILE, JSON.stringify({}), {encoding:"utf8"});
  }catch(e){}
}

function getFallbackStore(){
  ensureFallbackFile();
  return {
    async list(){
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE,"utf8")||"{}");
      return Object.keys(data).map(k=>({ key: k }));
    },
    async get(key, opts){
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE,"utf8")||"{}");
      const v = data[key];
      if (!v) return null;
      if (opts && opts.type === "json") return JSON.parse(v);
      return v;
    },
    async set(key, value, opts){
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE,"utf8")||"{}");
      data[key] = value;
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf8");
      return true;
    },
    async delete(key){
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE,"utf8")||"{}");
      delete data[key];
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf8");
      return true;
    }
  };
}

const STORE_NAME = "pm_actividades";

function cors(headers={}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    ...headers,
  };
}

function randomId() {
  return "act_" + Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join("");
}

async function readAll(store) {
  const list = await store.list();
  const arr = Array.isArray(list) ? list : (list?.blobs || list?.objects || []);
  const ids = arr.map(o => o.key).filter(k => k && k.startsWith("act_"));
  const items = [];
  for (const id of ids) {
    try {
      const obj = await store.get(id, { type: "json" });
      if (obj) items.push(obj);
    } catch (_) {}
  }
  items.sort((a,b) =>
    (b?.date||"").localeCompare(a?.date||"") ||
    (b?.updatedAt||"").localeCompare(a?.updatedAt||"")
  );
  return items;
}

export const handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path || "";
  const headers = cors();

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let store;
  try {
    store = getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (err) {
    // Si Netlify Blobs no está configurado en el entorno (local dev), usamos fallback en disco
    store = getFallbackStore();
  }

  try {
    const isActivitiesRoot =
      path.endsWith("/activities") ||
      path.endsWith("/activities/") ||
      path.endsWith("/.netlify/functions/activities") ||
      path.endsWith("/.netlify/functions/activities/");

    if (method === "GET" && isActivitiesRoot) {
      const items = await readAll(store);
      return { statusCode: 200, headers: cors({"Content-Type":"application/json"}), body: JSON.stringify(items) };
    }

    if (method === "POST" && isActivitiesRoot) {
      const body = JSON.parse(event.body || "{}");
      const id = body.id || randomId();
      const now = new Date().toISOString();
      const record = {
        id,
        createdAt: now,
        updatedAt: now,
        date: body.date || now.slice(0,10),
        start: body.start || "",
        end: body.end || "",
        duration: body.duration || "",
        area: body.area || "",
        title: body.title || "",
        steps: body.steps || "",
        expected_result: body.expected_result || "",
        reviewer: body.reviewer || "",
        evidence: body.evidence || "",
        comments: body.comments || "",
        status: body.status || "Planificado"
      };
      await store.set(id, JSON.stringify(record), { contentType: "application/json" });
      return { statusCode: 201, headers: cors({"Content-Type":"application/json"}), body: JSON.stringify(record) };
    }

    if ((method === "PUT" || method === "PATCH") && path.includes("/activities/")) {
      const id = path.split("/activities/")[1]?.split("?")[0];
      if (!id) return { statusCode: 400, headers, body: "Missing id" };
      const current = await store.get(id, { type: "json" });
      if (!current) return { statusCode: 404, headers, body: "Not found" };
      const body = JSON.parse(event.body || "{}");
      const updated = { ...current, ...body, id, updatedAt: new Date().toISOString() };
      await store.set(id, JSON.stringify(updated), { contentType: "application/json" });
      return { statusCode: 200, headers: cors({"Content-Type":"application/json"}), body: JSON.stringify(updated) };
    }

    if (method === "DELETE" && path.includes("/activities/")) {
      const id = path.split("/activities/")[1]?.split("?")[0];
      if (!id) return { statusCode: 400, headers, body: "Missing id" };
      await store.delete(id);
      return { statusCode: 204, headers, body: "" };
    }

    return { statusCode: 404, headers, body: `Route not found: ${method} ${path}` };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors({"Content-Type":"application/json"}),
      body: JSON.stringify({ error: e.message, stack: e.stack?.split("\n").slice(0,3).join("\n") })
    };
  }
};
