import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import nodemailer from "nodemailer";

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

// ─── E-MAIL / RELATÓRIOS AUTOMÁTICOS ────────────────────────────────────────

let emailLastSentDate = ""; // ex: "2026-06-01" — evita envio duplo no mesmo dia

function getBrNow() {
  const now = new Date();
  const br = new Date(now.toLocaleString("en-US", { timeZone: appTimeZone }));
  return { day: br.getDate(), hour: br.getHours(), minute: br.getMinutes(), dateStr: br.toISOString().slice(0, 10) };
}

function getMesAtual() {
  const now = new Date();
  const br = new Date(now.toLocaleString("en-US", { timeZone: appTimeZone }));
  const mm = String(br.getMonth() + 1).padStart(2, "0");
  const yyyy = br.getFullYear();
  return `${mm}/${yyyy}`;
}

function getTarefas(grupo) {
  const NORMAL = ["ENTRADA","SAIDAS","SIGET","SPEED GOV","ISS","ENV. DAS","PIS/COFINS","ICMS/ICMS ST","IRPJ/CSLL","REINF/INSS","EFD FISCAL","EFD PIS/COFINS"];
  const SIMPLES = ["ENTRADA","SAIDAS","SIGET","SPEED GOV","ISS","FECHAMENTO SIMPLES","GUIAS ENVIADAS","ICMS ST","REINF"];
  const MEI = ["DAS"];
  return grupo === "normal" ? NORMAL : grupo === "simples" ? SIMPLES : MEI;
}

function isConcluida(val) {
  if (!val) return false;
  if (typeof val === "object") {
    return !!(val.entrada && val.saida);
  }
  return String(val).trim().length > 0;
}

function buildRelatorioHtml(clientesData, state, mesAtual, responsavel) {
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const list = clientesData.filter(c => (c.responsavel || "").toUpperCase() === responsavel.toUpperCase());
  const mapped = list.map(c => {
    const ts = getTarefas(c.grupo || "simples");
    const cl = (state[c.cnpj] || {})[mesAtual] || {};
    const feito = ts.filter(t => isConcluida((cl.tarefas || {})[t])).length;
    const pendentes = ts.filter(t => !isConcluida((cl.tarefas || {})[t]));
    const pct = ts.length > 0 ? Math.round(feito / ts.length * 100) : 0;
    return { ...c, total: ts.length, feito, pendentes, pct, obs: cl.obs || "", mit: cl.mit || "" };
  }).sort((a, b) => a.pct - b.pct || (a.nome || "").localeCompare(b.nome || ""));

  const totalCli = mapped.length;
  const concluidos = mapped.filter(c => c.pct === 100).length;
  const andamento = mapped.filter(c => c.pct > 0 && c.pct < 100).length;
  const naoIniciados = mapped.filter(c => c.pct === 0).length;
  const now = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: appTimeZone });

  const pctColor = (p) => p === 100 ? "#059669" : p > 0 ? "#d97706" : "#dc2626";
  const regBg = (r) => { const l = (r || "").toLowerCase(); if (l.includes("simples")) return { bg: "#dbeafe", c: "#1d4ed8" }; if (l.includes("mei")) return { bg: "#fef3c7", c: "#92400e" }; return { bg: "#f1f5f9", c: "#475569" }; };

  const rows = mapped.map((c, i) => {
    const pc = c.pct;
    const reg = regBg(c.regime);
    const pendStr = c.pendentes.length > 0 ? c.pendentes.join(", ") : "✓ Concluído";
    const pendColor = c.pendentes.length > 0 ? "#dc2626" : "#059669";
    const rowBg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    const docStr = c.cnpj || c.cpf || "—";
    return `<tr style="background:${rowBg}">
<td style="padding:4pt 6pt;text-align:center;border:1pt solid #e2e8f0;font-size:7pt;color:#94a3b8;font-weight:700">${i + 1}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-weight:700;color:#0f172a;font-size:8pt">${esc(c.nome)}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-family:monospace;font-size:7pt;color:#475569;white-space:nowrap">${esc(docStr)}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;text-align:center"><span style="background:${reg.bg};color:${reg.c};font-size:7pt;font-weight:700;padding:1pt 5pt;border-radius:3pt;white-space:nowrap">${esc(c.regime || "—")}</span></td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;text-align:center;white-space:nowrap">
  <span style="font-size:9pt;font-weight:800;color:${pctColor(pc)}">${pc}%</span>
</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:${pendColor}">${esc(pendStr)}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:#475569;white-space:nowrap">${esc(c.mit || "—")}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:#d97706">${esc(c.obs || "")}</td>
</tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/>
<title>Relatório — ${esc(responsavel)} — ${esc(mesAtual)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#1e293b;background:#fff}
</style>
</head>
<body style="padding:16pt">

<table style="width:100%;border-collapse:collapse;border-bottom:3pt solid #1a3a6e;padding-bottom:10pt;margin-bottom:12pt">
<tr>
  <td style="width:35%;vertical-align:middle;padding-bottom:8pt">
    <div style="font-size:18pt;font-weight:900;color:#1a3a6e;letter-spacing:1px">TESSERATO</div>
    <div style="font-size:8pt;color:#0077b6;letter-spacing:2px;font-weight:700">CONTABILIDADE</div>
    <div style="font-size:7pt;color:#64748b;margin-top:2pt">Gestão Fiscal &amp; Tributária</div>
  </td>
  <td style="width:30%;text-align:center;vertical-align:middle;padding-bottom:8pt">
    <div style="font-size:17pt;font-weight:900;color:#0f172a">Relatório de Controle Fiscal</div>
    <div style="font-size:10pt;color:#1a3a6e;font-weight:700;margin-top:3pt">Competência: ${esc(mesAtual)}</div>
  </td>
  <td style="width:35%;vertical-align:top;text-align:right;padding-bottom:8pt">
    <table style="border-collapse:collapse;margin-left:auto;border:1pt solid #e2e8f0;background:#f8fafc">
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Responsável</td><td style="padding:3pt 8pt;font-size:8pt;font-weight:800;color:#1a3a6e;border-bottom:1pt solid #e2e8f0;text-align:right">${esc(responsavel)}</td></tr>
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Gerado em</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right;white-space:nowrap">${now}</td></tr>
      <tr><td colspan="2" style="padding:5pt 8pt;text-align:center;background:#1a3a6e;color:#fff;font-size:7.5pt;font-weight:800">${totalCli} cliente${totalCli !== 1 ? "s" : ""}</td></tr>
    </table>
  </td>
</tr>
</table>

<table style="width:100%;border-collapse:collapse;margin-bottom:12pt">
<tr>
  <td style="width:25%;padding:0 4pt 0 0"><table style="width:100%;border-collapse:collapse;background:#e8edf8"><tr><td style="padding:8pt;text-align:center"><div style="font-size:22pt;font-weight:900;color:#1a3a6e">${totalCli}</div><div style="font-size:7pt;color:#475569;font-weight:700">TOTAL</div></td></tr></table></td>
  <td style="width:25%;padding:0 4pt"><table style="width:100%;border-collapse:collapse;background:#d1fae5"><tr><td style="padding:8pt;text-align:center"><div style="font-size:22pt;font-weight:900;color:#059669">${concluidos}</div><div style="font-size:7pt;color:#475569;font-weight:700">CONCLUÍDOS</div></td></tr></table></td>
  <td style="width:25%;padding:0 4pt"><table style="width:100%;border-collapse:collapse;background:#fef3c7"><tr><td style="padding:8pt;text-align:center"><div style="font-size:22pt;font-weight:900;color:#d97706">${andamento}</div><div style="font-size:7pt;color:#475569;font-weight:700">EM ANDAMENTO</div></td></tr></table></td>
  <td style="width:25%;padding:0 0 0 4pt"><table style="width:100%;border-collapse:collapse;background:#fee2e2"><tr><td style="padding:8pt;text-align:center"><div style="font-size:22pt;font-weight:900;color:#dc2626">${naoIniciados}</div><div style="font-size:7pt;color:#475569;font-weight:700">NÃO INICIADOS</div></td></tr></table></td>
</tr>
</table>

<table style="width:100%;border-collapse:collapse">
<thead>
  <tr style="background:#1a3a6e;color:#fff">
    <th style="padding:5pt 6pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;width:3%">#</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;width:22%">CLIENTE</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;width:12%">CNPJ / CPF</th>
    <th style="padding:5pt 7pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;width:10%">REGIME</th>
    <th style="padding:5pt 7pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;width:8%">PROGRESSO</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;width:32%">TAREFAS PENDENTES</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;width:7%">MIT</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;width:10%">OBS</th>
  </tr>
</thead>
<tbody>
${rows || `<tr><td colspan="8" style="padding:16pt;text-align:center;color:#94a3b8">Nenhum cliente encontrado.</td></tr>`}
</tbody>
</table>

<table style="width:100%;border-collapse:collapse;margin-top:10pt;background:#1a3a6e">
<tr>
  <td style="padding:6pt 12pt;font-size:7pt;color:#7ecfed">Tesserato Contabilidade · ${esc(responsavel)} · ${esc(mesAtual)}</td>
  <td style="padding:6pt 12pt;font-size:7pt;color:#7ecfed;text-align:right;font-style:italic">Gerado automaticamente em ${now}</td>
</tr>
</table>
</body>
</html>`;
}

async function sendEmailReports() {
  const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
  if (!row) return { ok: false, error: "Sem dados no banco." };
  const data = JSON.parse(row.payload);
  const cfg = data.appSettings || {};

  if (!cfg.emailGmailUser || !cfg.emailGmailPass || !cfg.emailDestino) {
    return { ok: false, error: "Configuração de e-mail incompleta." };
  }

  const mesAtual = getMesAtual();
  const clientesData = data.clientesData || [];
  const state = data.state || {};
  const users = (data.users || []).filter(u => u.role === "operador");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: cfg.emailGmailUser, pass: cfg.emailGmailPass },
  });

  const erros = [];
  for (const u of users) {
    const html = buildRelatorioHtml(clientesData, state, mesAtual, u.name);
    const fileName = `Relatorio_${u.name.replace(/\s+/g, "_")}_${mesAtual.replace("/", "-")}.html`;
    try {
      await transporter.sendMail({
        from: `"Tesserato Contabilidade" <${cfg.emailGmailUser}>`,
        to: cfg.emailDestino,
        subject: `Relatório Fiscal — ${u.name} — ${mesAtual}`,
        html,
        attachments: [{ filename: fileName, content: html, contentType: "text/html" }],
      });
      console.log(`[EMAIL] Relatório de ${u.name} enviado.`);
    } catch (e) {
      console.error(`[EMAIL] Erro ao enviar relatório de ${u.name}:`, e.message);
      erros.push(`${u.name}: ${e.message}`);
    }
  }

  return erros.length === 0
    ? { ok: true, msg: `${users.length} relatório(s) enviado(s) com sucesso.` }
    : { ok: false, error: erros.join(" | ") };
}

// Cron: verifica a cada minuto se é hora de enviar
setInterval(() => {
  const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
  if (!row) return;
  const cfg = (JSON.parse(row.payload).appSettings) || {};
  if (!cfg.emailAtivo) return;

  const { day, hour, minute, dateStr } = getBrNow();
  const [hCfg, mCfg] = (cfg.emailHorario || "08:00").split(":").map(Number);
  const diaCfg = Number(cfg.emailDiaEnvio || 1);

  if (day === diaCfg && hour === hCfg && minute === mCfg && emailLastSentDate !== dateStr) {
    emailLastSentDate = dateStr;
    console.log(`[EMAIL] Disparando relatórios automáticos — ${dateStr} ${cfg.emailHorario}`);
    sendEmailReports().then(r => console.log("[EMAIL]", r.ok ? r.msg : r.error));
  }
}, 60_000);

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

  if (requestUrl.pathname === "/api/email-report/send-now" && req.method === "POST") {
    const result = await sendEmailReports();
    return sendJson(res, result.ok ? 200 : 500, result);
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
