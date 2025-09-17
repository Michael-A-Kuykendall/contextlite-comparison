
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "1mb" }));

const CONF = {
  pineconeApiKey: process.env.PINECONE_API_KEY || "",
  pineconeIndexUrl: process.env.PINECONE_INDEX_URL || "",
  embedProvider: process.env.EMBED_PROVIDER || "openai",
  openaiKey: process.env.OPENAI_API_KEY || "",
  ctxBase: process.env.CTX_BASE || "http://contextlite:8080"
};

function bad(msg, code=400) { return { ok: false, code, msg }; }

async function embedOpenAI(q) {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONF.openaiKey}`
    },
    body: JSON.stringify({ input: q, model: "text-embedding-3-small" })
  });
  if (!r.ok) throw new Error(`OpenAI embed err ${r.status}`);
  const j = await r.json();
  return j.data[0].embedding;
}

async function pineconeQuery(q) {
  const t0 = Date.now();
  let vector = null;
  if (CONF.embedProvider === "openai") {
    vector = await embedOpenAI(q);
  } else {
    throw new Error("No embedding provider configured");
  }

  const r = await fetch(CONF.pineconeIndexUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": CONF.pineconeApiKey
    },
    body: JSON.stringify({
      vector,
      topK: 10,
      includeMetadata: true
    })
  });
  const data = await r.json();
  return { ms: Date.now() - t0, hits: data.matches || [], raw: data };
}

async function ctxliteQuery(q) {
  const t0 = Date.now();
  const r = await fetch(`${CONF.ctxBase}/search?q=${encodeURIComponent(q)}`);
  const data = await r.json().catch(()=> ({}));
  return { ms: Date.now() - t0, hits: data.hits || data.results || data.rows || [], raw: data };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ctxBase: CONF.ctxBase });
});

app.post("/api/search", async (req, res) => {
  try {
    const q = (req.body?.q || "").trim();
    if (!q || q.length > 256) return res.status(400).json(bad("invalid query"));
    const [pine, ctx] = await Promise.all([ pineconeQuery(q), ctxliteQuery(q) ]);
    res.json({ ok: true, q, pinecone: pine, contextlite: ctx });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API on :${port}`));
