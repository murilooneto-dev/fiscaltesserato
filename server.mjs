import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const appTimeZone = process.env.APP_TIME_ZONE || "America/Sao_Paulo";
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "fiscal-system.sqlite");
const distDir = path.join(__dirname, "dist");
const eventClients = new Set();
let botIssProcess = null;
const BOT_ISS_DIR = process.env.BOT_ISS_DIR || "C:\\Users\\Client\\Documents\\Bot Novo\\bot_iss";

await mkdir(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS client_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    content BLOB NOT NULL,
    uploaded_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_client_files_client_id
  ON client_files (client_id);

  CREATE TABLE IF NOT EXISTS deletion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_name TEXT NOT NULL,
    deleted_by TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    details TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at
  ON deletion_logs (deleted_at);

  CREATE TABLE IF NOT EXISTS agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    data_compromisso TEXT NOT NULL,
    hora_compromisso TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente',
    lembrete_3_dias INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_agenda_user_id ON agenda (user_id);
  CREATE INDEX IF NOT EXISTS idx_agenda_data ON agenda (data_compromisso);
`);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders(),
  });
  res.end(JSON.stringify(body));
}

function broadcastEvent(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  eventClients.forEach(client => client.write(payload));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function getServerDateInfo() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: appTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    iso: now.toISOString(),
    date: `${values.year}-${values.month}-${values.day}`,
    timeZone: appTimeZone,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleApi(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (requestUrl.pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      ...corsHeaders(),
    });
    res.write(": connected\n\n");
    eventClients.add(res);
    req.on("close", () => eventClients.delete(res));
    return;
  }

  if (req.url === "/api/health") {
    return sendJson(res, 200, { ok: true, version: "0.0.1", dbPath, serverDate: getServerDateInfo() });
  }

  if (req.url === "/api/data" && req.method === "GET") {
    const row = db.prepare("SELECT payload, updated_at FROM app_data WHERE id = 1").get();
    if (!row) return sendJson(res, 200, { savedAt: null });
    return sendJson(res, 200, { ...JSON.parse(row.payload), savedAt: row.updated_at });
  }

  if (req.url === "/api/data" && req.method === "PUT") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed.users) || !Array.isArray(parsed.clientesData) || !parsed.state) {
        return sendJson(res, 400, { ok: false, error: "Dados inválidos." });
      }
      const updatedAt = new Date().toISOString();
      const existingRow = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
      const existingData = existingRow ? JSON.parse(existingRow.payload) : {};
      db.prepare(`
        INSERT INTO app_data (id, payload, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
      `).run(JSON.stringify({
        users: parsed.users,
        clientesData: parsed.clientesData,
        state: parsed.state,
        appSettings: parsed.appSettings || {},
        parcelamentos: parsed.parcelamentos?.length > 0 ? parsed.parcelamentos : (existingData.parcelamentos || []),
      }), updatedAt);
      broadcastEvent({ type: "app-data-updated", savedAt: updatedAt, sourceClientId: parsed.clientId || null });
      return sendJson(res, 200, { ok: true, savedAt: updatedAt });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Erro ao salvar." });
    }
  }


  if (requestUrl.pathname.startsWith("/api/client-files/") && req.method === "DELETE") {
    const fileId = Number(requestUrl.pathname.split("/").pop());
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return sendJson(res, 400, { ok: false, error: "Arquivo invalido." });
    }

    const result = db.prepare("DELETE FROM client_files WHERE id = ?").run(fileId);
    if (result.changes === 0) {
      return sendJson(res, 404, { ok: false, error: "Arquivo nao encontrado." });
    }

    broadcastEvent({ type: "client-files-updated", fileId, savedAt: new Date().toISOString() });
    return sendJson(res, 200, { ok: true, deletedId: fileId });
  }

  if (requestUrl.pathname === "/api/client-files" && req.method === "DELETE") {
    const clientId = requestUrl.searchParams.get("client_id") || "";
    if (!clientId) return sendJson(res, 400, { ok: false, error: "Cliente nao informado." });

    const result = db.prepare("DELETE FROM client_files WHERE client_id = ?").run(clientId);
    broadcastEvent({ type: "client-files-updated", clientId, savedAt: new Date().toISOString() });
    return sendJson(res, 200, { ok: true, deletedCount: result.changes });
  }

  if (requestUrl.pathname === "/api/client-files" && req.method === "GET") {
    const clientId = requestUrl.searchParams.get("client_id") || "";
    const includeContent = requestUrl.searchParams.get("include_content") === "1";
    if (!clientId) return sendJson(res, 400, { ok: false, error: "Cliente não informado." });

    const rows = db.prepare(`
      SELECT id, client_id, name, size, uploaded_at${includeContent ? ", content" : ""}
      FROM client_files
      WHERE client_id = ?
      ORDER BY uploaded_at DESC, id DESC
    `).all(clientId);

    return sendJson(res, 200, {
      ok: true,
      files: rows.map(row => ({
        id: row.id,
        client_id: row.client_id,
        name: row.name,
        size: row.size,
        uploaded_at: row.uploaded_at,
        ...(includeContent ? { contentBase64: Buffer.from(row.content).toString("base64") } : {}),
      })),
    });
  }

  if (requestUrl.pathname === "/api/client-files" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      if (!parsed.client_id || !parsed.name || !parsed.contentBase64) {
        return sendJson(res, 400, { ok: false, error: "Arquivo inválido." });
      }
      const content = Buffer.from(parsed.contentBase64, "base64");
      const size = Number(parsed.size || content.length);
      const uploadedAt = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO client_files (client_id, name, size, content, uploaded_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(String(parsed.client_id), String(parsed.name), size, content, uploadedAt);
      broadcastEvent({ type: "client-files-updated", clientId: String(parsed.client_id), savedAt: uploadedAt });

      return sendJson(res, 200, {
        ok: true,
        file: {
          id: Number(result.lastInsertRowid),
          client_id: String(parsed.client_id),
          name: String(parsed.name),
          size,
          uploaded_at: uploadedAt,
        },
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Erro ao salvar arquivo." });
    }
  }

  if (req.url === "/api/deletion-logs" && req.method === "GET") {
    const rows = db.prepare("SELECT * FROM deletion_logs ORDER BY deleted_at DESC LIMIT 2000").all();
    return sendJson(res, 200, { ok: true, logs: rows });
  }

  if (req.url === "/api/deletion-logs" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      if (!parsed.entity_type || !parsed.entity_name || !parsed.deleted_by) {
        return sendJson(res, 400, { ok: false, error: "Campos obrigatórios faltando." });
      }
      const deletedAt = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO deletion_logs (entity_type, entity_id, entity_name, deleted_by, deleted_at, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        String(parsed.entity_type),
        parsed.entity_id != null ? String(parsed.entity_id) : null,
        String(parsed.entity_name),
        String(parsed.deleted_by),
        deletedAt,
        parsed.details ? JSON.stringify(parsed.details) : null
      );
      return sendJson(res, 200, { ok: true, id: Number(result.lastInsertRowid), deleted_at: deletedAt });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Erro ao salvar log." });
    }
  }

  if (req.url === "/api/bot-iss/status" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, running: botIssProcess !== null });
  }

  // Atualiza uma tarefa individual no state (chamado pelo bot após processar cada empresa)
  // Body: { cnpj, periodo, tarefa, valor }
  // Exemplo: { cnpj: "28917133000146", periodo: "04/2026", tarefa: "ISS", valor: "2026-04-30" }
  if (req.url === "/api/bot-iss/update-tarefa" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      const { cnpj, periodo, tarefa, valor } = parsed;
      if (!cnpj || !periodo || !tarefa) {
        return sendJson(res, 400, { ok: false, error: "Campos obrigatórios: cnpj, periodo, tarefa." });
      }

      const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
      if (!row) return sendJson(res, 404, { ok: false, error: "Estado do sistema não encontrado." });

      const data = JSON.parse(row.payload);
      const state = data.state || {};

      // Garante que o path cnpj > periodo > tarefas existe
      if (!state[cnpj]) state[cnpj] = {};
      if (!state[cnpj][periodo]) state[cnpj][periodo] = { tarefas: {}, obs: "", mit: "" };
      if (!state[cnpj][periodo].tarefas) state[cnpj][periodo].tarefas = {};

      state[cnpj][periodo].tarefas[tarefa] = valor ?? "";

      // Quando o Bot ISS conclui com sucesso, preenche SPEED GOV automaticamente também
      if (tarefa === "ISS" && valor && valor !== "ERRO") {
        state[cnpj][periodo].tarefas["SPEED GOV"] = valor;
      }

      data.state = state;

      const updatedAt = new Date().toISOString();
      db.prepare(`
        INSERT INTO app_data (id, payload, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
      `).run(JSON.stringify(data), updatedAt);

      broadcastEvent({ type: "app-data-updated", savedAt: updatedAt, sourceClientId: "bot-iss" });
      return sendJson(res, 200, { ok: true, cnpj, periodo, tarefa, valor, savedAt: updatedAt });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Erro ao atualizar tarefa." });
    }
  }

  if (req.url === "/api/bot-iss/run" && req.method === "POST") {
    if (botIssProcess !== null) {
      return sendJson(res, 409, { ok: false, error: "Bot já está em execução." });
    }

    let cnpjs = [];
    try {
      const body = await readBody(req);
      if (body) cnpjs = JSON.parse(body).cnpjs || [];
    } catch {}

    // PYTHON_CMD pode ser "python", "py -3.11", "python3", etc.
    const pythonRaw = (process.env.PYTHON_CMD || "python").trim();
    const pythonParts = pythonRaw.split(/\s+/);
    const pythonCmd = pythonParts[0];
    const pythonArgs = [...pythonParts.slice(1), "bot_iss.py"];
    const proc = spawn(pythonCmd, pythonArgs, {
      cwd: BOT_ISS_DIR,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        ...(cnpjs.length > 0 ? { BOT_ISS_CNPJS: cnpjs.join(",") } : {}),
      },
    });

    botIssProcess = proc;
    broadcastEvent({ type: "bot-iss-started" });

    const onData = (stream) => (chunk) => {
      const lines = chunk.toString("utf-8").split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) broadcastEvent({ type: "bot-iss-log", line, stream });
      }
    };

    proc.stdout.on("data", onData("stdout"));
    proc.stderr.on("data", onData("stderr"));

    proc.on("close", (code) => {
      botIssProcess = null;
      if (code === 0) {
        broadcastEvent({ type: "bot-iss-done", code });
      } else {
        broadcastEvent({ type: "bot-iss-error", code, error: `Processo encerrado com código ${code}` });
      }
    });

    proc.on("error", (err) => {
      botIssProcess = null;
      broadcastEvent({ type: "bot-iss-error", code: -1, error: err.message });
    });

    return sendJson(res, 200, { ok: true, started: true });
  }

  if (requestUrl.pathname === "/api/agenda" && req.method === "GET") {
    const userId = Number(requestUrl.searchParams.get("user_id"));
    if (!userId) return sendJson(res, 400, { ok: false, error: "user_id obrigatório." });
    const rows = db.prepare(
      "SELECT * FROM agenda WHERE user_id = ? ORDER BY data_compromisso ASC, hora_compromisso ASC"
    ).all(userId);
    return sendJson(res, 200, { ok: true, items: rows });
  }

  if (requestUrl.pathname === "/api/agenda" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const p = JSON.parse(body);
      if (!p.user_id || !p.titulo || !p.data_compromisso)
        return sendJson(res, 400, { ok: false, error: "Campos obrigatórios: user_id, titulo, data_compromisso." });
      const now = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO agenda (user_id, titulo, descricao, data_compromisso, hora_compromisso, status, lembrete_3_dias, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(p.user_id), String(p.titulo), String(p.descricao || ""),
        String(p.data_compromisso), String(p.hora_compromisso || ""),
        String(p.status || "pendente"), p.lembrete_3_dias ? 1 : 0, now, now
      );
      return sendJson(res, 200, { ok: true, id: Number(result.lastInsertRowid) });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
  }

  if (requestUrl.pathname.match(/^\/api\/agenda\/\d+$/) && req.method === "PUT") {
    try {
      const id = Number(requestUrl.pathname.split("/").pop());
      const body = await readBody(req);
      const p = JSON.parse(body);
      if (!p.user_id) return sendJson(res, 400, { ok: false, error: "user_id obrigatório." });
      const now = new Date().toISOString();
      const result = db.prepare(`
        UPDATE agenda SET titulo=?, descricao=?, data_compromisso=?, hora_compromisso=?, status=?, lembrete_3_dias=?, atualizado_em=?
        WHERE id=? AND user_id=?
      `).run(
        String(p.titulo), String(p.descricao || ""), String(p.data_compromisso),
        String(p.hora_compromisso || ""), String(p.status || "pendente"),
        p.lembrete_3_dias ? 1 : 0, now, id, Number(p.user_id)
      );
      if (result.changes === 0) return sendJson(res, 404, { ok: false, error: "Compromisso não encontrado." });
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
  }

  if (requestUrl.pathname.match(/^\/api\/agenda\/\d+$/) && req.method === "DELETE") {
    const id = Number(requestUrl.pathname.split("/").pop());
    const userId = Number(requestUrl.searchParams.get("user_id"));
    if (!userId) return sendJson(res, 400, { ok: false, error: "user_id obrigatório." });
    const result = db.prepare("DELETE FROM agenda WHERE id=? AND user_id=?").run(id, userId);
    if (result.changes === 0) return sendJson(res, 404, { ok: false, error: "Compromisso não encontrado." });
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { ok: false, error: "Rota não encontrada." });
}

async function serveStatic(req, res) {
  if (!existsSync(distDir)) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Frontend não compilado. Execute: npm run build");
    return;
  }

  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const requested = safePath === "/" ? "index.html" : safePath.slice(1);
  const filePath = path.join(distDir, requested);
  const resolved = path.resolve(filePath);
  const distResolved = path.resolve(distDir);

  if (!resolved.startsWith(distResolved)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(resolved);
    const ext = path.extname(resolved);
    res.writeHead(200, {
      "Content-Type": mimeTypes.get(ext) || "application/octet-stream",
      "Cache-Control": requested === "index.html" ? "no-store" : "public, max-age=31536000, immutable",
    });
    res.end(data);
  } catch {
    const data = await readFile(path.join(distDir, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(data);
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS" && req.url?.startsWith("/api/")) {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
    }
    if (req.url?.startsWith("/api/")) return await handleApi(req, res);
    return await serveStatic(req, res);
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message || "Erro interno." });
  }
});

server.listen(port, host, () => {
  console.log(`Fiscal System 0.0.1 rodando em http://${host}:${port}`);
  console.log(`Banco local: ${dbPath}`);
});
