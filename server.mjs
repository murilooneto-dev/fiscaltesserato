import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import nodemailer from "nodemailer";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const appTimeZone = process.env.APP_TIME_ZONE || "America/Sao_Paulo";
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "fiscal-system.sqlite");
const distDir = path.join(__dirname, "dist");
const eventClients = new Set();
let botIssProcess  = null;
let botSigaProcess = null;
let botMeiProcess  = null;

// Agentes locais conectados: operadorId → WebSocket
const agentesConectados = new Map();
// Bot em execução por operador: operadorId → "iss"|"siga"|"mei"
const botRodandoPorOperador = new Map();
const BOT_ISS_DIR   = process.env.BOT_ISS_DIR  || "C:\\Users\\Client\\Documents\\Bot Novo\\bot_iss";
const RUNNERS_DIR   = path.join(__dirname, "runners");

function getRobotsConfig() {
  try {
    const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
    if (!row) return {};
    return (JSON.parse(row.payload).appSettings?.robotsConfig) || {};
  } catch { return {}; }
}

async function sendBotEmail(rc, botLabel) {
  if (!rc?.emailAtivo || !rc.emailRemetente || !rc.emailDestinatario || !rc.emailSenha) return;
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail", auth: { user: rc.emailRemetente, pass: rc.emailSenha },
    });
    const attachments = [];
    if (rc.pastaDownloads) {
      const { readdir, stat } = await import("fs/promises");
      try {
        const files = await readdir(rc.pastaDownloads);
        for (const f of files) {
          const fp = path.join(rc.pastaDownloads, f);
          const s = await stat(fp);
          if (s.isFile()) attachments.push({ filename: f, path: fp });
        }
      } catch {}
    }
    await transporter.sendMail({
      from: rc.emailRemetente,
      to: rc.emailDestinatario,
      subject: `[Fiscal Tesserato] ${botLabel} — execução concluída`,
      text: `O robô ${botLabel} finalizou a execução com sucesso.\n\nSegue em anexo os arquivos gerados.`,
      attachments,
    });
  } catch (e) {
    console.error(`[${botLabel}] Erro ao enviar email:`, e.message);
  }
}

await mkdir(dataDir, { recursive: true });

// ─── E-MAIL / RELATÓRIOS AUTOMÁTICOS ────────────────────────────────────────

const emailLastSentDate = ["", ""]; // índice 0 = rotina 1, índice 1 = rotina 2

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
  const list = clientesData.filter(c => (c.responsavel || "").trim().toUpperCase() === (responsavel || "").trim().toUpperCase());
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

function buildLogHtml() {
  const rows = db.prepare("SELECT * FROM task_unlock_log ORDER BY id DESC LIMIT 200").all();
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const now = new Date().toLocaleString("pt-BR",{timeZone:appTimeZone});
  if(rows.length===0) return null;
  const trs = rows.map(r=>`
<tr style="border-bottom:1px solid #dde">
  <td style="padding:5pt 8pt;font-size:8pt;white-space:nowrap">${esc(r.timestamp)}</td>
  <td style="padding:5pt 8pt;font-size:8pt;font-weight:700">${esc(r.usuario)}</td>
  <td style="padding:5pt 8pt;font-size:8pt">${esc(r.empresa)}</td>
  <td style="padding:5pt 8pt;font-size:8pt;font-weight:700">${esc(r.tarefa)}</td>
  <td style="padding:5pt 8pt;font-size:8pt">${esc(r.mes)}</td>
  <td style="padding:5pt 8pt;font-size:8pt;color:#c0392b">${esc(r.info_antiga)}</td>
  <td style="padding:5pt 8pt;font-size:8pt;color:#27ae60">${esc(r.info_atual)}</td>
  <td style="padding:5pt 8pt;font-size:8pt">${esc(r.motivo)}</td>
</tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Log de Alterações de Tarefas</title></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a237e;padding:18pt 24pt">
  <tr>
    <td style="color:#fff;font-size:14pt;font-weight:700">Tesserato Contabilidade</td>
    <td style="color:#90caf9;font-size:10pt;text-align:right">Log de Alterações de Tarefas</td>
  </tr>
</table>
<div style="padding:20pt 24pt">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8pt;border:1px solid #dde;border-collapse:collapse">
  <thead>
    <tr style="background:#1a237e;color:#fff">
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left;white-space:nowrap">Data/Hora</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Usuário</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Cliente</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Tarefa</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Competência</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Info Antiga</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Info Atual</th>
      <th style="padding:7pt 8pt;font-size:8pt;text-align:left">Motivo</th>
    </tr>
  </thead>
  <tbody>${trs}</tbody>
</table>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a237e;padding:10pt 24pt;margin-top:12pt">
  <tr><td style="color:#90caf9;font-size:7pt;text-align:right">Gerado automaticamente em ${now}</td></tr>
</table>
</body></html>`;
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

  const attachments = users.map(u => {
    const html = buildRelatorioHtml(clientesData, state, mesAtual, u.name);
    const fileName = `Relatorio_${u.name.replace(/\s+/g, "_")}_${mesAtual.replace("/", "-")}.html`;
    return { filename: fileName, content: html, contentType: "text/html" };
  });
  const logHtml = buildLogHtml();
  if (logHtml) attachments.push({ filename: `Log_Alteracoes_Tarefas_${mesAtual.replace("/","-")}.html`, content: logHtml, contentType: "text/html" });

  try {
    await transporter.sendMail({
      from: `"Tesserato Contabilidade" <${cfg.emailGmailUser}>`,
      to: cfg.emailDestino,
      subject: `Relatórios Fiscais — ${mesAtual}`,
      text: "SEGUE EM ANEXO RELATORIOS",
      attachments,
    });
    console.log(`[EMAIL] ${attachments.length} relatório(s) enviado(s) em 1 e-mail.`);
  } catch (e) {
    console.error("[EMAIL] Erro ao enviar:", e.message);
    return { ok: false, error: e.message };
  }

  return { ok: true, msg: `${attachments.length} relatório(s) enviado(s) em 1 e-mail com sucesso.` };
}

async function sendLogEmail() {
  const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
  if (!row) return { ok: false, error: "Sem dados no banco." };
  const cfg = (JSON.parse(row.payload).appSettings) || {};
  if (!cfg.emailGmailUser || !cfg.emailGmailPass || !cfg.emailDestino)
    return { ok: false, error: "Configuração de e-mail incompleta." };
  const logHtml = buildLogHtml();
  if (!logHtml) return { ok: false, error: "Nenhum registro no log." };
  const mesAtual = getMesAtual();
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: cfg.emailGmailUser, pass: cfg.emailGmailPass } });
  try {
    await transporter.sendMail({
      from: `"Tesserato Contabilidade" <${cfg.emailGmailUser}>`,
      to: cfg.emailDestino,
      subject: `Log de Alterações de Tarefas — ${mesAtual}`,
      text: "SEGUE EM ANEXO LOG DE ALTERAÇÕES DE TAREFAS",
      attachments: [{ filename: `Log_Alteracoes_Tarefas_${mesAtual.replace("/","-")}.html`, content: logHtml, contentType: "text/html" }],
    });
    return { ok: true, msg: "Log enviado com sucesso." };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

const logLastSentDates = ["","","",""];

// Cron: verifica a cada minuto se é hora de enviar (checa as 2 rotinas + 4 logRotinas)
setInterval(() => {
  const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
  if (!row) return;
  const cfg = (JSON.parse(row.payload).appSettings) || {};

  const { day, hour, minute, dateStr } = getBrNow();

  // Rotinas de relatório
  if (cfg.emailAtivo) {
    const rotinas = cfg.emailRotinas || [];
    rotinas.forEach((rotina, idx) => {
      if (!rotina || !rotina.ativo) return;
      const [hCfg, mCfg] = (rotina.horario || "08:00").split(":").map(Number);
      const diaCfg = Number(rotina.diaEnvio || 1);
      const sentKey = `${dateStr}-${idx}`;
      if (day === diaCfg && hour === hCfg && minute === mCfg && emailLastSentDate[idx] !== sentKey) {
        emailLastSentDate[idx] = sentKey;
        console.log(`[EMAIL] Rotina ${idx + 1} disparando — ${dateStr} ${rotina.horario}`);
        sendEmailReports().then(r => console.log(`[EMAIL] Rotina ${idx + 1}:`, r.ok ? r.msg : r.error));
      }
    });
  }

  // Rotinas do log de tarefas (até 4)
  const logRotinas = cfg.logRotinas || (cfg.logRotina ? [cfg.logRotina] : []);
  logRotinas.forEach((logRot, idx) => {
    if (!logRot || !logRot.ativo) return;
    const [hLog, mLog] = (logRot.horario || "08:00").split(":").map(Number);
    const diaLog = Number(logRot.diaEnvio || 1);
    const sentKey = `log-${dateStr}-${idx}`;
    if (day === diaLog && hour === hLog && minute === mLog && logLastSentDates[idx] !== sentKey) {
      logLastSentDates[idx] = sentKey;
      console.log(`[EMAIL-LOG] Rotina ${idx+1} disparando — ${dateStr} ${logRot.horario}`);
      sendLogEmail().then(r => console.log(`[EMAIL-LOG] Rotina ${idx+1}:`, r.ok ? r.msg : r.error));
    }
  });
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

  CREATE TABLE IF NOT EXISTS task_unlock_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT NOT NULL,
    empresa TEXT NOT NULL,
    tarefa TEXT NOT NULL,
    info_antiga TEXT,
    info_atual TEXT,
    mes TEXT NOT NULL,
    motivo TEXT NOT NULL,
    usuario TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_task_unlock_log_timestamp ON task_unlock_log (timestamp);
  CREATE INDEX IF NOT EXISTS idx_task_unlock_log_cnpj ON task_unlock_log (cnpj);
`);

// Migration: adiciona colunas info_antiga/info_atual se não existirem
try { db.exec("ALTER TABLE task_unlock_log ADD COLUMN info_antiga TEXT"); } catch {}
try { db.exec("ALTER TABLE task_unlock_log ADD COLUMN info_atual TEXT"); } catch {}

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

  if (req.url === "/api/agent/status" && req.method === "GET") {
    try {
      const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
      const users = row ? (JSON.parse(row.payload).users || []) : [];
      const conectados = [];
      for (const [opId] of agentesConectados) {
        const u = users.find(u => u.id === opId);
        if (u) conectados.push({ operadorId: opId, nome: u.name });
      }
      return sendJson(res, 200, { ok: true, conectados });
    } catch {
      return sendJson(res, 200, { ok: true, conectados: [] });
    }
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

      let updatedAt;
      db.transaction(() => {
        const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
        if (!row) throw Object.assign(new Error("Estado do sistema não encontrado."), { status: 404 });

        const data = JSON.parse(row.payload);
        const state = data.state || {};

        if (!state[cnpj]) state[cnpj] = {};
        if (!state[cnpj][periodo]) state[cnpj][periodo] = { tarefas: {}, obs: "", mit: "" };
        if (!state[cnpj][periodo].tarefas) state[cnpj][periodo].tarefas = {};

        state[cnpj][periodo].tarefas[tarefa] = valor ?? "";

        // Quando o Bot ISS conclui com sucesso, preenche SPEED GOV automaticamente também
        if (tarefa === "ISS" && valor && valor !== "ERRO") {
          state[cnpj][periodo].tarefas["SPEED GOV"] = valor;
        }

        data.state = state;
        updatedAt = new Date().toISOString();
        db.prepare(`
          INSERT INTO app_data (id, payload, updated_at)
          VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
        `).run(JSON.stringify(data), updatedAt);
      })();

      broadcastEvent({ type: "app-data-updated", savedAt: updatedAt, sourceClientId: "bot-iss" });
      return sendJson(res, 200, { ok: true, cnpj, periodo, tarefa, valor, savedAt: updatedAt });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Erro ao atualizar tarefa." });
    }
  }

  if (req.url === "/api/bot-iss/run" && req.method === "POST") {
    let empresas = [], operadorId = null;
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      empresas = parsed.empresas || [];
      operadorId = parsed.operadorId || null;
    } catch {}

    if (!operadorId) return sendJson(res, 400, { ok: false, error: "operadorId não informado." });
    const agente = agentesConectados.get(operadorId);
    if (!agente || agente.readyState !== 1) {
      return sendJson(res, 409, { ok: false, error: "Agente não conectado neste PC. Inicie o FiscalAgente." });
    }
    if (botRodandoPorOperador.get(operadorId)) {
      return sendJson(res, 409, { ok: false, error: "Bot já está em execução neste PC." });
    }
    const config = getBotsConfigOperador(operadorId, "iss");
    botRodandoPorOperador.set(operadorId, "iss");
    agente.send(JSON.stringify({ tipo: "rodar-bot", bot: "iss", empresas, config }));
    return sendJson(res, 200, { ok: true, started: true });
  }

  if (req.url === "/api/bot/stop" && req.method === "POST") {
    let operadorId = null;
    try { const b = await readBody(req); operadorId = JSON.parse(b).operadorId; } catch {}
    if (!operadorId) return sendJson(res, 400, { ok: false, error: "operadorId não informado." });
    const agente = agentesConectados.get(operadorId);
    if (agente && agente.readyState === 1) agente.send(JSON.stringify({ tipo: "cancelar-bot" }));
    botRodandoPorOperador.delete(operadorId);
    broadcastEvent({ type: "bot-iss-done", operadorId, code: -1 });
    broadcastEvent({ type: "bot-siga-done", operadorId, code: -1 });
    broadcastEvent({ type: "bot-mei-done", operadorId, code: -1 });
    return sendJson(res, 200, { ok: true });
  }

  // ── T-SIGA ──────────────────────────────────────────────────────────────────
  if (req.url === "/api/bot-siga/status" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, running: botSigaProcess !== null });
  }

  if (req.url === "/api/bot-siga/run" && req.method === "POST") {
    let empresas = [], operadorId = null;
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      empresas = parsed.empresas || [];
      operadorId = parsed.operadorId || null;
    } catch {}

    if (!operadorId) return sendJson(res, 400, { ok: false, error: "operadorId não informado." });
    const agente = agentesConectados.get(operadorId);
    if (!agente || agente.readyState !== 1) {
      return sendJson(res, 409, { ok: false, error: "Agente não conectado neste PC. Inicie o FiscalAgente." });
    }
    if (botRodandoPorOperador.get(operadorId)) {
      return sendJson(res, 409, { ok: false, error: "Bot já está em execução neste PC." });
    }
    const config = getBotsConfigOperador(operadorId, "siga");
    botRodandoPorOperador.set(operadorId, "siga");
    agente.send(JSON.stringify({ tipo: "rodar-bot", bot: "siga", empresas, config }));
    return sendJson(res, 200, { ok: true, started: true });
  }

  if (req.url === "/api/bot-siga/stop" && req.method === "POST") {
    if (botSigaProcess) { botSigaProcess.kill(); botSigaProcess = null; }
    return sendJson(res, 200, { ok: true });
  }

  // ── T-MEI ───────────────────────────────────────────────────────────────────
  if (req.url === "/api/bot-mei/status" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, running: botMeiProcess !== null });
  }

  if (req.url === "/api/bot-mei/run" && req.method === "POST") {
    let empresas = [], operadorId = null;
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      empresas = parsed.empresas || [];
      operadorId = parsed.operadorId || null;
    } catch {}

    if (!operadorId) return sendJson(res, 400, { ok: false, error: "operadorId não informado." });
    const agente = agentesConectados.get(operadorId);
    if (!agente || agente.readyState !== 1) {
      return sendJson(res, 409, { ok: false, error: "Agente não conectado neste PC. Inicie o FiscalAgente." });
    }
    if (botRodandoPorOperador.get(operadorId)) {
      return sendJson(res, 409, { ok: false, error: "Bot já está em execução neste PC." });
    }
    const config = getBotsConfigOperador(operadorId, "mei");
    botRodandoPorOperador.set(operadorId, "mei");
    agente.send(JSON.stringify({ tipo: "rodar-bot", bot: "mei", empresas, config }));
    return sendJson(res, 200, { ok: true, started: true });
  }

  if (req.url === "/api/bot-mei/stop" && req.method === "POST") {
    if (botMeiProcess) { botMeiProcess.kill(); botMeiProcess = null; }
    return sendJson(res, 200, { ok: true });
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

  // ── LOG DE DESBLOQUEIO DE TAREFAS ──────────────────────────────────────────
  if (requestUrl.pathname === "/api/task-unlock-log" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const { cnpj, empresa, tarefa, mes, motivo, usuario, infoAntiga, infoAtual } = JSON.parse(body);
      if (!cnpj || !tarefa || !motivo || !usuario) return sendJson(res, 400, { ok: false, error: "Campos obrigatórios ausentes." });
      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: appTimeZone, day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
      db.prepare("INSERT INTO task_unlock_log (cnpj, empresa, tarefa, mes, motivo, usuario, timestamp, info_antiga, info_atual) VALUES (?,?,?,?,?,?,?,?,?)")
        .run(cnpj, empresa || cnpj, tarefa, mes, motivo, usuario, timestamp, infoAntiga||"", infoAtual||"");
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (requestUrl.pathname === "/api/task-unlock-log" && req.method === "GET") {
    const rows = db.prepare("SELECT * FROM task_unlock_log ORDER BY id DESC LIMIT 500").all();
    return sendJson(res, 200, { ok: true, logs: rows });
  }

  if (requestUrl.pathname === "/api/email-report/send-now" && req.method === "POST") {
    const result = await sendEmailReports();
    return sendJson(res, result.ok ? 200 : 500, result);
  }

  if (requestUrl.pathname === "/api/email-log/send-now" && req.method === "POST") {
    const result = await sendLogEmail();
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

// ── Helper: configs do operador no banco ──────────────────────────────────────
function getBotsConfigOperador(operadorId, bot) {
  try {
    const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
    if (!row) return {};
    const payload = JSON.parse(row.payload);
    const settings = payload.appSettings || {};
    const user = (payload.users || []).find(u => u.id === operadorId);
    const bc = user?.botsConfig?.[bot] || {};
    // SMTP sempre vem das configurações globais
    const smtpGlobal = {
      emailRemetente: settings.emailGmailUser || "",
      emailSenha:     settings.emailGmailPass || "",
    };
    return { ...smtpGlobal, ...bc };
  } catch { return {}; }
}

// ── WebSocket /ws/agent ───────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let operadorId = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.tipo === "auth") {
      try {
        const row = db.prepare("SELECT payload FROM app_data WHERE id = 1").get();
        const payload = row ? JSON.parse(row.payload) : {};
        const found = (payload.users || []).find(u => u.login === msg.login && u.senha === msg.senha);
        if (!found) {
          ws.send(JSON.stringify({ tipo: "auth-erro", mensagem: "Credenciais inválidas." }));
          return;
        }
        operadorId = found.id;
        agentesConectados.set(operadorId, ws);
        ws.send(JSON.stringify({ tipo: "auth-ok", operadorId, nome: found.name }));
        broadcastEvent({ type: "agent-connected", operadorId, nome: found.name });
        console.log(`[WS] Agente conectado: ${found.name} (id=${operadorId})`);
      } catch (e) {
        ws.send(JSON.stringify({ tipo: "auth-erro", mensagem: "Erro interno." }));
      }
      return;
    }

    if (!operadorId) return;

    if (msg.tipo === "pong") return;

    if (msg.tipo === "log") {
      const bot = msg.bot || "iss";
      broadcastEvent({ type: `bot-${bot}-log`, operadorId, line: msg.linha, stream: msg.stream || "stdout" });
      return;
    }

    if (msg.tipo === "bot-done") {
      const bot = msg.bot || botRodandoPorOperador.get(operadorId) || "iss";
      botRodandoPorOperador.delete(operadorId);
      broadcastEvent({ type: `bot-${bot}-done`, operadorId, code: msg.code });
      return;
    }

    if (msg.tipo === "bot-erro") {
      const bot = msg.bot || botRodandoPorOperador.get(operadorId) || "iss";
      botRodandoPorOperador.delete(operadorId);
      broadcastEvent({ type: `bot-${bot}-error`, operadorId, code: -1, error: msg.mensagem });
      return;
    }
  });

  const onClose = () => {
    if (operadorId) {
      agentesConectados.delete(operadorId);
      botRodandoPorOperador.delete(operadorId);
      broadcastEvent({ type: "agent-disconnected", operadorId });
      console.log(`[WS] Agente desconectado: id=${operadorId}`);
    }
  };
  ws.on("close", onClose);
  ws.on("error", onClose);
});

setInterval(() => {
  for (const [id, ws] of agentesConectados) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ tipo: "ping" }));
    } else {
      agentesConectados.delete(id);
      broadcastEvent({ type: "agent-disconnected", operadorId: id });
    }
  }
}, 30_000);

server.listen(port, host, () => {
  console.log(`Fiscal System 0.0.1 rodando em http://${host}:${port}`);
  console.log(`Banco local: ${dbPath}`);
});
