import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";

import ECAC from "./assets/ECAC-QgjzeHs-.png";
import ECONTADOR from "./assets/ECONTADOR-removebg-preview.png";
import EDUZZ from "./assets/EDUZZ-Bk7xe67p.png";
import GCLICK from "./assets/GCLICK.png";
import IOB from "./assets/IOB_2-removebg-preview.png";
import NFSTOCK from "./assets/NF_STOCK-removebg-preview.png";
import SEFAZ from "./assets/SEFAZ_2-removebg-preview.png";
import TAX from "./assets/TAX.png";
import WEBMAIL from "./assets/WEBMAIL.png";
import ZAPPY from "./assets/ZAPPY.png";


// Logo SVG da Tesserato
const TesseratoLogo = ({size=36})=>(
  <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00c2e0"/>
        <stop offset="100%" stopColor="#0077b6"/>
      </linearGradient>
      <linearGradient id="tg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a3a8f"/>
        <stop offset="100%" stopColor="#0d2260"/>
      </linearGradient>
    </defs>
    <rect x="14" y="14" width="92" height="92" rx="16" fill="url(#tg1)" transform="rotate(45 60 60)"/>
    <rect x="24" y="24" width="72" height="72" rx="11" fill="url(#tg2)" transform="rotate(45 60 60)"/>
    <text x="60" y="57" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="bold" fontFamily="Arial,sans-serif" letterSpacing="0.5">TESSERATO</text>
    <text x="60" y="70" textAnchor="middle" fill="#7dd8f0" fontSize="7.2" fontFamily="Arial,sans-serif" letterSpacing="1.5">CONTABILIDADE</text>
  </svg>
);

const EyeIcon = ({hidden=false,size=18})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {hidden?(
      <>
        <path d="M3 3l18 18"/>
        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/>
        <path d="M9.88 5.09A10.7 10.7 0 0 1 12 4.88c5 0 8.5 4.5 9.5 7.12a13.2 13.2 0 0 1-2.1 3.25"/>
        <path d="M6.6 6.6A13.1 13.1 0 0 0 2.5 12c1 2.62 4.5 7.12 9.5 7.12 1.4 0 2.7-.35 3.86-.94"/>
      </>
    ):(
      <>
        <path d="M2.5 12c1-2.62 4.5-7.12 9.5-7.12s8.5 4.5 9.5 7.12c-1 2.62-4.5 7.12-9.5 7.12S3.5 14.62 2.5 12Z"/>
        <circle cx="12" cy="12" r="2.5"/>
      </>
    )}
  </svg>
);

const FaviconImg = ({domain}:{domain:string})=>{
  const [src,setSrc]=useState(`https://${domain}/favicon.ico`);
  const [dead,setDead]=useState(false);
  const handleError=()=>{
    if(!src.includes("google.com/s2")){
      setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    } else {
      setDead(true);
    }
  };
  if(dead) return(
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7dd8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
  return <img src={src} onError={handleError} width={20} height={20} style={{objectFit:"contain",borderRadius:3}} alt=""/>;
};


const CARD_LOGOS: Record<string,string> = {
  "CAV Receita Federal": ECAC,
  "eContador Alterdata": ECONTADOR,
  "Nutror": EDUZZ,
  "GClick": GCLICK,
  "IOB Online": IOB,
  "NFStock Alterdata": NFSTOCK,
  "SIGA SEFAZ CE": SEFAZ,
  "Tax Prático": TAX,
  "Webmail": WEBMAIL,
  "Zap Contábil": ZAPPY,
};

const CardLogo = ({title}:{title:string})=>{
  const logo = CARD_LOGOS[title];
  if(!logo) return null;
  return <img src={logo} alt={title} width={28} height={28} style={{width:28,height:28,objectFit:"contain"}} />;
};


const BOTS_CONFIG_VAZIO = {
  iss:  { pastaDownloads: "", emailRemetente: "", emailSenha: "", emailDestinatario: "" },
  siga: { pastaDownloads: "", emailRemetente: "", emailSenha: "", emailDestinatario: "" },
  mei:  { pastaDownloads: "", emailRemetente: "", emailSenha: "", emailDestinatario: "" },
};

const USERS = [
  { id: 1, name: "Admin",    login: "admin",    senha: "admin123",    role: "admin",    color: "#6366f1", botsConfig: { ...BOTS_CONFIG_VAZIO } },
  { id: 2, name: "Sandra",   login: "sandra",   senha: "sandra123",   role: "operador", color: "#ec4899", botsConfig: { ...BOTS_CONFIG_VAZIO } },
  { id: 3, name: "Daynne",   login: "daynne",   senha: "daynne123",   role: "operador", color: "#f59e0b", botsConfig: { ...BOTS_CONFIG_VAZIO } },
  { id: 4, name: "Gabryela", login: "gabryela", senha: "gabryela123", role: "operador", color: "#10b981", botsConfig: { ...BOTS_CONFIG_VAZIO } },
];

const TAREFAS_NORMAL = ["ENTRADA","SAIDAS","SIGET","SPEED GOV","ISS","ENV. DAS","PIS/COFINS","ICMS/ICMS ST","IRPJ/CSLL","REINF/INSS","EFD FISCAL","EFD PIS/COFINS"];
const TAREFAS_SIMPLES = ["ENTRADA","SAIDAS","SIGET","SPEED GOV","ISS","FECHAMENTO SIMPLES","GUIAS ENVIADAS","ICMS ST","REINF"];
const TAREFAS_MEI = ["DAS"];
const TAREFAS_REGIME_NORMAL_ONLY = new Set(["PIS/COFINS","IRPJ/CSLL","EFD FISCAL","EFD PIS/COFINS"]);
const API_BASE_URL = (() => {
  const configured = String(import.meta.env?.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!configured) return "";

  try {
    const url = new URL(configured);
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (isLoopback && window.location.hostname && !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/+$/, "");
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return configured;
  }
})();
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const UF_BY_CODE = {
  "11":"RO","12":"AC","13":"AM","14":"RR","15":"PA","16":"AP","17":"TO",
  "21":"MA","22":"PI","23":"CE","24":"RN","25":"PB","26":"PE","27":"AL","28":"SE","29":"BA",
  "31":"MG","32":"ES","33":"RJ","35":"SP",
  "41":"PR","42":"SC","43":"RS",
  "50":"MS","51":"MT","52":"GO","53":"DF",
};
const ufFromInvoiceKey=(key)=>UF_BY_CODE[String(key||"").slice(0,2)]||"";

// Calendário fiscal oficial 2026
const CALENDARIO_FISCAL = [
  { id:"siget", nome:"SIGET", dia:5, regimes:["normal","simples"], cor:"#16a34a", desc:"Prazo interno do escritório para rotinas SIGET." },
  { id:"speed-gov", nome:"SPEED GOV", dia:10, regimes:["normal","simples"], cor:"#0ea5e9", desc:"Prazo interno do escritório para rotinas Speed Gov." },
  { id:"efd-reinf", nome:"EFD-Reinf", dia:15, regimes:["normal","simples"], cor:"#8b5cf6", desc:"Retenções na fonte, serviços tomados e prestados." },
  { id:"efd-contribuicoes", nome:"EFD-Contribuições", dia:"ultimo", regimes:["normal"], cor:"#0891b2", desc:"PIS, COFINS e Contribuição Previdenciária sobre Receita." },
  { id:"das-simples", nome:"DAS / PGDAS-D", dia:15, regimes:["simples","mei"], cor:"#10b981", desc:"Documento de Arrecadação do Simples Nacional." },
  { id:"iss", nome:"ISS", dia:15, regimes:["normal","simples"], cor:"#f59e0b", desc:"Imposto Sobre Serviços." },
  { id:"icms", nome:"ICMS / ICMS-ST", dia:15, regimes:["normal","simples"], cor:"#ef4444", desc:"ICMS e Substituição Tributária." },
  { id:"pis-cofins", nome:"PIS / COFINS", dia:20, regimes:["normal"], cor:"#f97316", desc:"Apuração de PIS e COFINS." },
  { id:"dctfweb", nome:"DCTFWeb", dia:20, regimes:["normal","simples"], cor:"#7c3aed", desc:"Declaração de débitos e créditos tributários federais previdenciários." },
  { id:"irpj-csll", nome:"IRPJ / CSLL", dia:20, regimes:["normal"], cor:"#dc2626", desc:"Obrigação trimestral.", meses:[1,4,7,10] },
];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const clientes_raw = [
  {
    "cod": "00000",
    "nome": "Loja Simbolica Deus e Humanidade Numero 14",
    "cnpj": "06741201000126",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Loja Maçonica Construtores do Amanhã nº 158",
    "cnpj": "46779774000163",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "A.R.L.S. Jacques de Molay N. 4810",
    "cnpj": "53923209000193",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Associação 3 Marias",
    "cnpj": "45080136000197",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Colonia de Pescadores",
    "cnpj": "08703718000156",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Associação dos Moradores da Vila Marrocos  (procuração expirada)",
    "cnpj": "02632012000164",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "",
    "grupo": "normal",
    "obs": "Declarações Anuais"
  },
  {
    "cod": "00000",
    "nome": "Augusta e Respeitável Loja Simbolica Jose Simão Abu Marrul N4853",
    "cnpj": "62993238000112",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Loja Maçonica Padre Vicente Feitosa N 4.697",
    "cnpj": "50706182000199",
    "regime": "Fechamento ISS, acesso solicitado ao setor",
    "atividade": "",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "A.R.L.S. Jacques de Molay N. 4810",
    "cnpj": "53923209000193#2",
    "regime": "Fechamento ISS, Senha Padão",
    "atividade": "",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "cnpjOriginal": "53923209000193",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Loja Maçonica Construtores do Amanhã N 158",
    "cnpj": "IM: 1578172",
    "regime": "Fechamento ISS, Senha: 597820",
    "atividade": "",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Declarações Anuais",
    "mit": "23.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Sindicato dos Servidores Publicos Municipais de Missão Velha - CE",
    "cnpj": "11844314000197",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "mit": "06.02.2026"
  },
  {
    "cod": "00000",
    "nome": "Associação dos Amigos e Pacientes Renais do Cariri",
    "cnpj": "05754763000141",
    "regime": "Isenta",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "mit": "06.02.2026"
  },
  {
    "cod": "00005",
    "nome": "Construtora e Empreendimentos São Bento",
    "cnpj": "07387700000120",
    "regime": "Presumido",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "mit": "06.02.2026"
  },
  {
    "cod": "00007",
    "nome": "ADF Engenharia e Projetos LTDA + REINF R2000",
    "cnpj": "28917133000146",
    "regime": "Presumido / EPP",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "prioridade": 5,
    "mit": "06.02.2026"
  },
  {
    "cod": "00150",
    "nome": "ADF Engenharia e Projetos LTDA",
    "cnpj": "28917133000227",
    "regime": "Presumido / EPP",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00058",
    "nome": "DF Medicina Aplicada LTDA",
    "cnpj": "40620996000152",
    "regime": "Presumido / EPP",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "normal",
    "prioridade": 5
  },
  {
    "cod": "00237",
    "nome": "Fisiopalmeira LTDA (Declarações de extinção)",
    "cnpj": "40403869000100",
    "regime": "Presumido",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00249",
    "nome": "JD Construtora",
    "cnpj": "49787578000129",
    "regime": "Presumido",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00299",
    "nome": "JD Construtora (filial)",
    "cnpj": "49787578000200",
    "regime": "Presumido",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00102",
    "nome": "Instituto de Psiquiatria do Cariri LTDA",
    "cnpj": "47053879000101",
    "regime": "Presumido",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00046",
    "nome": "Complexo Cultural Shoenberg LTDA",
    "cnpj": "01426689000183",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00174",
    "nome": "Francisco de Assis de Alencar Freitas LTDA",
    "cnpj": "00404607000137",
    "regime": "Presumido",
    "atividade": "Industria/ Serv",
    "responsavel": "DAYNNE",
    "grupo": "normal",
    "obs": "NFe"
  },
  {
    "cod": "00288",
    "nome": "Previdencia na Pratica LTDA",
    "cnpj": "42316951000114",
    "regime": "Presumido",
    "atividade": "Industria/ Serv e Com",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00200",
    "nome": "Atacadão do Lar LTDA",
    "cnpj": "32649437000147",
    "regime": "Presumido",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Nfe / NFCe"
  },
  {
    "cod": "00178",
    "nome": "Paraiso Piscinas LTDA",
    "cnpj": "33005883000181",
    "regime": "Presumido",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "normal",
    "obs": "Nfe / NFCe",
    "mit": "06.02.2026"
  },
  {
    "cod": "00184",
    "nome": "O Melhor Atacarejo LTDA",
    "cnpj": "56321546000107",
    "regime": "Lucro Real",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Nfe / NFCe"
  },
  {
    "cod": "00257",
    "nome": "O Melhor Atacarejo LTDA",
    "cnpj": "56321546000280",
    "regime": "Lucro Real",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "Nfe / NFCe"
  },
  {
    "cod": "00121",
    "nome": "Vila Alta Motos LTDA",
    "cnpj": "49878412000118",
    "regime": "Presumido",
    "atividade": "Comercio / Serv",
    "responsavel": "SANDRA",
    "grupo": "normal",
    "obs": "NFe"
  },
  {
    "cod": "00232",
    "nome": "JBO Comercio Varejista LTDA",
    "cnpj": "18712063000136",
    "regime": "Presumido",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "normal"
  },
  {
    "cod": "00028",
    "nome": "LPF Comercial LTDA",
    "cnpj": "36787294000190",
    "regime": "Presumido",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "normal",
    "obs": "-",
    "mit": "06.02.2026"
  },
  {
    "cod": "00166",
    "nome": "+ 88 Eventos LTDA",
    "cnpj": "54930792000122",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: NFC-E"
  },
  {
    "cod": "00280",
    "nome": "AB Preço Único LTDA",
    "cnpj": "63972955000120",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "-",
    "nome": "Atemus LTDA",
    "cnpj": "66115688000163",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00270",
    "nome": "Audi Nery Aparelhos Auditivos LTDA",
    "cnpj": "40922922000170",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "01006",
    "nome": "Alison Werbeti Lucena Gonçalves",
    "cnpj": "34470157000100",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Falar com o pessoal do sistema para solicitar o movimento"
  },
  {
    "cod": "00177",
    "nome": "Agace Personalizados LTDA",
    "cnpj": "55817568000191",
    "regime": "Simples",
    "atividade": "Industria/Comer / Serv",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: NFC-E"
  },
  {
    "cod": "00248",
    "nome": "Agência Pauta de Noticias LTDA",
    "cnpj": "55474733000150",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00201",
    "nome": "Antonia Luenia Martins Teixeira",
    "cnpj": "48839114000156",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00213",
    "nome": "As Marias Bonitas loja LTDA",
    "cnpj": "58917560000195",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00169",
    "nome": "Ana Borges do Nascimento",
    "cnpj": "22546424000199",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: CF-E"
  },
  {
    "cod": "00287",
    "nome": "Atualdiesel Comercio e Serviço LTDA",
    "cnpj": "44136710000119",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00161",
    "nome": "Ana Munisso Clinica Terapeutica LTDA",
    "cnpj": "54620978000185",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00294",
    "nome": "Ampa Pizzaria LTDA  (SEFAZ PE)",
    "cnpj": "65224043000104",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00180",
    "nome": "Alde Consultoria de Negocios Inclusiva LTDA",
    "cnpj": "55785594000185",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00036",
    "nome": "Avenida Locações LTDA",
    "cnpj": "24332211000190",
    "regime": "Simples / EPP",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00256",
    "nome": "Batata Diferenciada LTDA",
    "cnpj": "38379605000108",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00151",
    "nome": "Barbosa Móveis LTDA",
    "cnpj": "53718190000143",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NFC-E | Speed/XML: SPED"
  },
  {
    "cod": "00107",
    "nome": "Beatriz Silton Servicos de Saude LTDA",
    "cnpj": "47282169000145",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00078",
    "nome": "Boaventura e Lavor Adv e Consultores",
    "cnpj": "10585798000134",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "prioridade": 4,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "-",
    "nome": "Cantaze Mix LTDA",
    "cnpj": "66157733000142",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00216",
    "nome": "C.F. Vieira Nicolau",
    "cnpj": "46241906000107",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00272",
    "nome": "Cavalcante Gestão e Serviços LTDA",
    "cnpj": "63435003000178",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00285",
    "nome": "Casa do Piso LTDA",
    "cnpj": "64653979000180",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00075",
    "nome": "Casa da Arvore Produções LTDA",
    "cnpj": "43624299000168",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "prioridade": 5,
    "obs": "Cupom: - | Speed/XML: SPED"
  },
  {
    "cod": "00147",
    "nome": "Centro de Educação Infantil Nana Nenem LTDA",
    "cnpj": "23104319000162",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00245",
    "nome": "Clinica Tratte LTDA",
    "cnpj": "60799793000182",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00244",
    "nome": "Cicera Carla Sobreira Queiroz",
    "cnpj": "11368663000180",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00054",
    "nome": "Cicero Edimar Barbosa de Oliveira",
    "cnpj": "20829477000191",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "prioridade": 4,
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00175",
    "nome": "CN Maquinas LTDA",
    "cnpj": "41766968000100",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00132",
    "nome": "Construimoveis Construtora e Imobiliaria LTDA",
    "cnpj": "12848413000100",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: CF-E / NFC-E"
  },
  {
    "cod": "00016",
    "nome": "Correspondente Caixa Aqui Barbalha LTDA",
    "cnpj": "33167960000108",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00191",
    "nome": "CD Motor LTDA",
    "cnpj": "52924013000150",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00251",
    "nome": "Dra Sally Mariah - Serviços Médicos em Ortopedia e Traumatologia LTDA",
    "cnpj": "12305705000104",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00123",
    "nome": "Dmattos Centro de Bleza LTDA",
    "cnpj": "50317260000163",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00219",
    "nome": "E de A Freitas LTDA",
    "cnpj": "19865691000114",
    "regime": "Simples",
    "atividade": "Comercio/Industria",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00283",
    "nome": "Edson Pereira da Rocha",
    "cnpj": "39301966000102",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00038",
    "nome": "Escola Casa da Arvore LTDA",
    "cnpj": "32457736000180",
    "regime": "Simples / EPP",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "prioridade": 5,
    "obs": "Cupom: NF-e | Speed/XML: XML"
  },
  {
    "cod": "00077",
    "nome": "Fikabem Make LTDA",
    "cnpj": "13350226000164",
    "regime": "Simples / EPP",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 4,
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00242",
    "nome": "FF Engenharia de Incendio LTDA",
    "cnpj": "60645607000150",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00010",
    "nome": "F M S Bezerra LTDA",
    "cnpj": "35283284000155",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: NF-E/ CF-E | Speed/XML: XML"
  },
  {
    "cod": "00179",
    "nome": "F S Tomaz Calçados",
    "cnpj": "44884405000105",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00060",
    "nome": "Fio de Palha LTDA",
    "cnpj": "31656444000103",
    "regime": "Simples / EPP",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: NF-E/ CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00000",
    "nome": "Francisco Jean Gomes Ferreira",
    "cnpj": "41875383000129",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: -"
  },
  {
    "cod": "00210",
    "nome": "Fuá Espeto e Cerva LTDA",
    "cnpj": "58529572000142",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "-",
    "nome": "Gonçalves, Sampaio e Santana Advogados Associados",
    "cnpj": "66526397000168",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00039",
    "nome": "Glam Aplicativo de Servicos da Beleza LTDA",
    "cnpj": "38663934000186",
    "regime": "Simples / EPP",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: SM"
  },
  {
    "cod": "00226",
    "nome": "Greenblox Digital Group LTDA",
    "cnpj": "59378696000137",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00262",
    "nome": "Hudson Cruz Sociedade Individual de Advocacia",
    "cnpj": "62400388000175",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00241",
    "nome": "IFF Serviços Administrativos LTDA",
    "cnpj": "60571391000126",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00149",
    "nome": "Industria de Carvão Vegetal São Francisco",
    "cnpj": "53540532000188",
    "regime": "Simples",
    "atividade": "Industria",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00286",
    "nome": "J Daniel Nunes LTDA",
    "cnpj": "61938280000178",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00266",
    "nome": "J Fernando de Oliveira",
    "cnpj": "28162641000161",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00296",
    "nome": "JCK Diesel Oficina LTDA",
    "cnpj": "65298618000125",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00279",
    "nome": "Jaqueline Pereira Psicologia LTDA",
    "cnpj": "63969548000164",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00144",
    "nome": "Jota Materiais de Construções LTDA",
    "cnpj": "41797988000149",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: CF-E / NFE-E"
  },
  {
    "cod": "00259",
    "nome": "Jota Materiais de Construções LTDA - (Filial Crato)",
    "cnpj": "41797988000220",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00260",
    "nome": "Jota Materiais de Construções LTDA - (Filial Barbalha)",
    "cnpj": "41797988000300",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00255",
    "nome": "JN Conect Telecomunicações LTDA",
    "cnpj": "61967458000109",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00254",
    "nome": "JP KIDS LTDA",
    "cnpj": "33379396000189",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00215",
    "nome": "JT LTDA",
    "cnpj": "59118871000157",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00158",
    "nome": "J M Moto Peças LTDA",
    "cnpj": "51354940000110",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NF-E / NFC-E"
  },
  {
    "cod": "01003",
    "nome": "José Francisval de Souza",
    "cnpj": "03007281000100",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00196",
    "nome": "Jose Hermeson Lopes Angelin",
    "cnpj": "35341078000154",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00243",
    "nome": "José Rodrigues de Morais Junior (lançar valor remanescente )",
    "cnpj": "07754967000108",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00165",
    "nome": "Juatran Serviços Medicos LTDA",
    "cnpj": "54953519000113",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00235",
    "nome": "Juatran Serviços Medicos II LTDA",
    "cnpj": "60061812000179",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00263",
    "nome": "Lab Modas LTDA",
    "cnpj": "62402735000107",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00271",
    "nome": "LC Medicina LTDA",
    "cnpj": "63072886000107",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00217",
    "nome": "L.S Centro Automotivo LTDA",
    "cnpj": "24357255000174",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00221",
    "nome": "Lojas Areia Branca Cariri LTDA",
    "cnpj": "50323168000106",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00222",
    "nome": "Lojas Areia Branca Cariri LTDA",
    "cnpj": "50323168000297",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00220",
    "nome": "Lojas Areia Branca Cariri II LTDA",
    "cnpj": "31024199000111",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00223",
    "nome": "Lojas Areia Branca Cariri II LTDA",
    "cnpj": "31024199000200",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00298",
    "nome": "Loja Brejo Santo LTDA",
    "cnpj": "65411337000137",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00282",
    "nome": "Lima e Souza Comercio de Serviço de Auto Peças LTDA",
    "cnpj": "59696837000160",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00072",
    "nome": "Limptop LTDA",
    "cnpj": "27313838000191",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00152",
    "nome": "Liege Lorenna Serviços de Psicologia LTDA",
    "cnpj": "50919880000172",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Speed/XML: XML"
  },
  {
    "cod": "00167",
    "nome": "Loger Construções e Consultoria LTDA",
    "cnpj": "42443781000139",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Speed/XML: XML"
  },
  {
    "cod": "00110",
    "nome": "Locações Martins LTDA",
    "cnpj": "47716997000144",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00276",
    "nome": "Luna Planejamento e Custos LTDA",
    "cnpj": "63801092000129",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "-",
    "nome": "Lucas Cruz Sociedade Unipessoal de Advocacia 07/2026",
    "cnpj": "47888967000115",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00131",
    "nome": "Lucas Moveis LTDA",
    "cnpj": "46493286000195",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: NFC-E"
  },
  {
    "cod": "00059",
    "nome": "Madame X LTDA",
    "cnpj": "28978128000143",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: NFC-E | Speed/XML: SPED"
  },
  {
    "cod": "00252",
    "nome": "Mayara de Freitas Gomes LTDA (bloq - apenas os serviços até comp 03/2026.",
    "cnpj": "61237698000158",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00204",
    "nome": "Movelaria Jesus Maria Jose LTDA",
    "cnpj": "11067441000127",
    "regime": "Simples",
    "atividade": "Comercio/Industria",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00205",
    "nome": "Movelaria Jesus Maria Jose LTDA",
    "cnpj": "11067441000208",
    "regime": "Simples",
    "atividade": "Comercio/Industria",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00234",
    "nome": "M Scussiato LTDA",
    "cnpj": "60130020000109",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Speed/XML: XML"
  },
  {
    "cod": "00011",
    "nome": "M Isabel O Torres",
    "cnpj": "15446166000103",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00656",
    "nome": "Mabbel Doces Gourmet LTDA",
    "cnpj": "31759348000190",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NFC-E/ NF-E | Speed/XML: SPED"
  },
  {
    "cod": "00657",
    "nome": "Mabbel Doces Gourmet II LTDA",
    "cnpj": "49414731000172",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NFC-E | Speed/XML: SPED"
  },
  {
    "cod": "00211",
    "nome": "Maciovos LTDA",
    "cnpj": "58650817000195",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00281",
    "nome": "O ponto do Açaí LTDA",
    "cnpj": "38344849000155",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00275",
    "nome": "Rosa de Saron LTDA",
    "cnpj": "42066736000102",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "-",
    "nome": "MN Marketing e Anuncios On-line LTDA 07/2026",
    "cnpj": "52328447000198",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00048",
    "nome": "Maria da Conceição Teixeira de Azevevo 0001",
    "cnpj": "26005430000190",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00049",
    "nome": "Maria da Conceição Teixeira de Azevevo 0002",
    "cnpj": "26005430000270",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00050",
    "nome": "Maria da Conceição Teixeira de Azevevo 0003",
    "cnpj": "26005430000351",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00051",
    "nome": "Maria da Conceição Teixeira de Azevevo 0005",
    "cnpj": "26005430000513",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00652",
    "nome": "Maria do Socorro A de Carvalho LTDA",
    "cnpj": "44677911000123",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: NF-E/ CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00202",
    "nome": "M. A. Comercio de Artigos Opticos LTDA",
    "cnpj": "08745737000145",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00145",
    "nome": "Maxwell Alves Serviços de Informática LTDA",
    "cnpj": "52913533000168",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00231",
    "nome": "Mercantil Jamilly LTDA",
    "cnpj": "59913354000170",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00157",
    "nome": "Mecanica Fempcar LTDA",
    "cnpj": "54179217000130",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00261",
    "nome": "Motor Hud Distribuidora LTDA",
    "cnpj": "62342395000168",
    "regime": "Simples",
    "atividade": "Industria/Comer / Serv",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00302",
    "nome": "Motor Hud Distribuidora LTDA Filial",
    "cnpj": "62342395000249",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00267",
    "nome": "Monica Reinaldo de Moura",
    "cnpj": "43029802000137",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00176",
    "nome": "Moto Andrade Peças e Serviços LTDA",
    "cnpj": "30596228000157",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "SANDRA",
    "grupo": "simples"
  },
  {
    "cod": "00238",
    "nome": "Muleste Software LTDA",
    "cnpj": "60269812000169",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00053",
    "nome": "Nutrielo Nutrição Animal LTDA",
    "cnpj": "33365647000176",
    "regime": "Simples",
    "atividade": "Comercio/Industria/ Serv",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "obs": "Cupom: NF-E | Speed/XML: SPED"
  },
  {
    "cod": "00246",
    "nome": "Nordeste Software LTDA",
    "cnpj": "61270446000120",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00066",
    "nome": "Nova Bossa Eventos",
    "cnpj": "41801047000131",
    "regime": "Simples / EPP",
    "atividade": "Serviço",
    "responsavel": "SANDRA",
    "grupo": "simples",
    "prioridade": 5,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00206",
    "nome": "Otica Influency LTDA (Silvia)",
    "cnpj": "39440900000195",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00185",
    "nome": "Otica Visualle LTDA (Expedito)",
    "cnpj": "29341893000110",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: NFCe - NFe"
  },
  {
    "cod": "00189",
    "nome": "Ocean empreendimentos e Agencia Digitais LTDA",
    "cnpj": "49231612000184",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00019",
    "nome": "Patricia Silva do Nascimento",
    "cnpj": "14161577000190",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00119",
    "nome": "Poesia da Luz LTDA",
    "cnpj": "10238862000100",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00274",
    "nome": "Pollianna Comercio Plasticos LTDA",
    "cnpj": "20888679000104",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00193",
    "nome": "Photonx Soluções Energéticas LTDA",
    "cnpj": "49221256000118",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00018",
    "nome": "Race Custom Cuidados Automotivos LTDA",
    "cnpj": "32590696000140",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00125",
    "nome": "RG Ferreira Comércio de Bijuteria e Semijoiais",
    "cnpj": "15262898000143",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NF-E/ CF-E | Speed/XML: SPED"
  },
  {
    "cod": "00146",
    "nome": "RodBem Diesel e Flex LTDA",
    "cnpj": "22477754000170",
    "regime": "Simples",
    "atividade": "Serv/Comer",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: NFE-E / NFC-E"
  },
  {
    "cod": "00289",
    "nome": "Rufino Odonto LTDA",
    "cnpj": "64757765000153",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00208",
    "nome": "Rodrigo Lins Sociedade Individual de Advocacia",
    "cnpj": "58414026000166",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00001",
    "nome": "S de O Nascimento",
    "cnpj": "23663399000196",
    "regime": "Simples",
    "atividade": "Industria",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00096",
    "nome": "Serve bem Nova Aliança LTDA",
    "cnpj": "11267413000153",
    "regime": "Simples",
    "atividade": "Comercio",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "obs": "Cupom: NFC-E | Speed/XML: -"
  },
  {
    "cod": "00108",
    "nome": "Silva e Silva Servicos e Comercio em Saude LTDA",
    "cnpj": "47314897000191",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00156",
    "nome": "Stenio Pereira dos Santos LTDA",
    "cnpj": "21597601000101",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00290",
    "nome": "Tarcisio Gomes Engenharia LTDA",
    "cnpj": "64867136000186",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00047",
    "nome": "Tesserato Contabilidade LTDA",
    "cnpj": "39741414000107",
    "regime": "Simples / EPP",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00297",
    "nome": "Tony Fotos LTDA",
    "cnpj": "65379619000102",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00034",
    "nome": "(inss) TOS Engenharia",
    "cnpj": "24675276000138",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 4,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00092",
    "nome": "USCA Colegio LTDA",
    "cnpj": "36564893000145",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00093",
    "nome": "USCA Colegio LTDA filial salgueiro",
    "cnpj": "36564893000307",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "-",
    "nome": "USCA Colegio LTDA filial Parnamirim PE",
    "cnpj": "36564893000498",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00142",
    "nome": "USCA Colegio LTDA Petrolina PE",
    "cnpj": "52809892000170",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: - | Speed/XML: XML"
  },
  {
    "cod": "00212",
    "nome": "Vanessa Alencar Industria de Calçados LTDA",
    "cnpj": "58881595000111",
    "regime": "Simples",
    "atividade": "Industria",
    "responsavel": "GABRYELA",
    "grupo": "simples",
    "obs": "Cupom: -"
  },
  {
    "cod": "00117",
    "nome": "Victor Torquato - Instituto de Medicina e Ensino LTDA",
    "cnpj": "49647577000189",
    "regime": "Simples",
    "atividade": "Serviço",
    "responsavel": "GABRYELA",
    "grupo": "simples"
  },
  {
    "cod": "00239",
    "nome": "VSFA Industria e Empreendimentos LTDA",
    "cnpj": "60388268000174",
    "regime": "Simples",
    "atividade": "Industria/Comer / Serv",
    "responsavel": "DAYNNE",
    "grupo": "simples"
  },
  {
    "cod": "00136",
    "nome": "World Piscinas LTDA",
    "cnpj": "43651894000192",
    "regime": "Simples",
    "atividade": "Industria / Serv",
    "responsavel": "DAYNNE",
    "grupo": "simples",
    "prioridade": 3,
    "obs": "Cupom: NFE-E | Speed/XML: XML"
  },
  {
    "cod": "00029",
    "nome": "Andreia Santos Silva 89003160368",
    "cnpj": "34102522000116",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "00269",
    "nome": "Jose Gilson Bernardo",
    "cnpj": "63019744000178",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Ednaldo Ferreira Pereira 76193586334",
    "cnpj": "44978771000123",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "00103",
    "nome": "Kyara Coeli Soares Ribeiro 61337757349",
    "cnpj": "46945565000142",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "00006",
    "nome": "Maria Aurea Nogueira do Nascimento 72026731349",
    "cnpj": "42500674000103",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "137",
    "nome": "João Glauco dos Santos",
    "cnpj": "30835807000105",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "148",
    "nome": "Thamires Feliciano Ferreira Brito",
    "cnpj": "53514382000138",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Vanize Gorette Barbosa",
    "cnpj": "45059068000184",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "prioridade": 1,
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Damiana Gomes Ferreira",
    "cnpj": "47148012000121",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "00091",
    "nome": "Ivan Rodrigues Belarmino",
    "cnpj": "07515667000176",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Mãe de Cris / Enviar no WhatsApp",
    "cnpj": "13903629000193",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Expedito Fialho de Brito Neto",
    "cnpj": "62605500000104",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Fernando Antonio Sampaio Junior",
    "cnpj": "63402649000159",
    "regime": "MEI caminhoneiro",
    "atividade": "MEI caminhoneiro",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Samya Clarice Monteiro da Silva",
    "cnpj": "59379060000100",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Sara Angelica Lima Maia",
    "cnpj": "63477885000134",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Mauro Dos Santos Barbosa 75899957387",
    "cnpj": "18482260000106",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Francisco Fagner Sales Tomaz",
    "cnpj": "48460175000108",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Elan Silva Araujo",
    "cnpj": "65106787000116",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  },
  {
    "cod": "-",
    "nome": "Cicero Weverton Santos Parente",
    "cnpj": "55587425000130",
    "regime": "MEI",
    "atividade": "MEI",
    "responsavel": "GABRYELA",
    "grupo": "mei",
    "obs": "Não se aplica | Sistema: SM"
  }
];

function getTarefas(g) { return g==="normal"?TAREFAS_NORMAL:g==="simples"?TAREFAS_SIMPLES:TAREFAS_MEI; }
function badgeColor(r) {
  if(r?.includes("Lucro Real")) return "#7c3aed";
  if(r?.includes("Presumido")) return "#2563eb";
  if(r?.includes("Simples")) return "#059669";
  if(r==="MEI") return "#d97706";
  if(r?.includes("Isenta")) return "#64748b";
  return "#64748b";
}
function userColor(n) { const u=USERS.find(u=>u.name.toUpperCase()===n?.toUpperCase()); return u?.color||"#94a3b8"; }
const TAREFA_RENAMES = {
  FECHADA: "FECHAMENTO SIMPLES",
  ENVIADA: "GUIAS ENVIADAS",
};
const normalizeTarefaName=(t)=>{
  const name=String(t||"").trim().toUpperCase();
  if(TAREFA_RENAMES[name]) return [TAREFA_RENAMES[name]];
  if(name==="ISSQN") return ["ISS"];
  if(name==="SPEEDGOV"||name==="SPEED GOV") return ["SPEED GOV"];
  if(name==="ISSQN/SPEEDGOV"||name==="ISSQN / SPEEDGOV"||name==="ISS/SPEEDGOV"||name==="ISS / SPEEDGOV") return ["ISS","SPEED GOV"];
  return name?[name]:[];
};
const normalizeTarefasList=(tarefas)=>{
  const result=[];
  tarefas.forEach(t=>{
    normalizeTarefaName(t).forEach(name=>{
      if(!result.includes(name)) result.push(name);
    });
  });
  return result;
};
const normalizeTarefasMap=(tarefas={})=>{
  const next={};
  Object.entries(tarefas||{}).forEach(([key,value])=>{
    normalizeTarefaName(key).forEach(name=>{
      if(next[name]===undefined||next[name]==="") next[name]=value;
    });
  });
  return next;
};
const normalizeClientesData=(clientes=[])=>clientes.map(c=>({
  ...c,
  ...(c?.tarefas?.length?{tarefas:normalizeTarefasList(c.tarefas)}:{}),
}));
const normalizeSavedState=(savedState={})=>{
  const next={};
  Object.entries(savedState||{}).forEach(([cnpj,meses])=>{
    next[cnpj]={};
    Object.entries(meses||{}).forEach(([mes,data])=>{
      next[cnpj][mes]={...data,tarefas:normalizeTarefasMap(data?.tarefas)};
    });
  });
  return next;
};
const normalizeText=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
const clienteTemAtividade=(cliente,atividade)=>{
  if(atividade==="TODOS") return true;
  return normalizeText(cliente?.atividade)===normalizeText(atividade);
};
const sortByNome=(a,b)=>String(a?.nome||a?.name||"").localeCompare(String(b?.nome||b?.name||""),"pt-BR",{sensitivity:"base"});
const CHECKLIST_TAREFAS = new Set(["ENTRADA","SAIDAS","SAÍDAS","SAIDA","SAÍDA"]);
const CHECKLIST_FIELDS = [
  { key:"recebido", label:"Recebido?" },
  { key:"importado", label:"Importado?" },
  { key:"conferido", label:"Conferido?" },
];
const isChecklistTarefa=(t)=>CHECKLIST_TAREFAS.has(String(t||"").trim().toUpperCase());
const getChecklistStatus=(value)=>{
  if(value&&typeof value==="object") {
    return {
      recebido:!!value.recebido,
      importado:!!value.importado,
      conferido:!!value.conferido,
    };
  }
  const done=!!value&&value!=="";
  return { recebido:done, importado:done, conferido:done };
};
const getDateInputValue=(value)=>{
  const raw=String(value??"").trim();
  if(!raw) return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date=new Date(`${raw}T00:00:00`);
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===raw?raw:"";
  }
  const match=raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if(!match) return "";
  const [,d,m,y]=match;
  const iso=`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  const date=new Date(`${iso}T00:00:00`);
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:"";
};
const isTaskDateValue=(value)=>!!getDateInputValue(value);
const isTarefaConcluida=(t,value)=>{
  if(isChecklistTarefa(t)) {
    const checks=getChecklistStatus(value);
    return CHECKLIST_FIELDS.every(field=>checks[field.key]);
  }
  return isTaskDateValue(value);
};

const _nowInit = new Date();
const ANO_ATUAL = _nowInit.getFullYear();
const MES_ATUAL_IDX = _nowInit.getMonth(); // 0 = Janeiro … 11 = Dezembro
const APP_TIME_ZONE = "America/Sao_Paulo";
const MESES_HIST = [];
for(let m=0;m<12;m++) MESES_HIST.push(`${String(m+1).padStart(2,"0")}/${ANO_ATUAL}`);

const parseDateKey=(dateKey)=>{
  const match=String(dateKey||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return null;
  const [,year,month,day]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  return Number.isNaN(date.getTime())?null:date;
};

const getTodayInTimeZone=()=>{
  try{
    const parts=new Intl.DateTimeFormat("en-US",{
      timeZone:APP_TIME_ZONE,
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
    }).formatToParts(new Date());
    const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
    return parseDateKey(`${values.year}-${values.month}-${values.day}`)||new Date();
  }catch{
    const now=new Date();
    return new Date(now.getFullYear(),now.getMonth(),now.getDate());
  }
};
const getDateKey=(date)=>{
  const safeDate=date instanceof Date&&!Number.isNaN(date.getTime())?date:getTodayInTimeZone();
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth()+1).padStart(2,"0")}-${String(safeDate.getDate()).padStart(2,"0")}`;
};

const initState = () => {
  const s={};
  clientes_raw.forEach(c=>{
    s[c.cnpj]={};
    MESES_HIST.forEach(mes=>{
      s[c.cnpj][mes]={ tarefas:{}, obs:c.obs||"", mit:c.mit||"" };
      getTarefas(c.grupo).forEach(t=>{ s[c.cnpj][mes].tarefas[t]=""; });
    });
  });
  return s;
};

const columnName=(index)=>{
  let name="",n=index+1;
  while(n>0){const r=(n-1)%26;name=String.fromCharCode(65+r)+name;n=Math.floor((n-1)/26);}
  return name;
};

export default function App() {
  const [users,setUsers]=useState(USERS);
  const [clientesData,setClientesData]=useState(clientes_raw);
  const [user,setUser]=useState(null);
  const userRef=useRef<any>(null);
  const [login,setLogin]=useState("");
  const [senha,setSenha]=useState("");
  const [showSenha,setShowSenha]=useState(false);
  const [err,setErr]=useState("");
  const [state,setState]=useState(initState);
  const [page,setPage]=useState("intranet");
  const [filtroResp,setFiltroResp]=useState("TODOS");
  const [filtroGrupo,setFiltroGrupo]=useState("TODOS");
  const [filtroAtividade,setFiltroAtividade]=useState("TODOS");
  const [clientesSomentePendentes,setClientesSomentePendentes]=useState(false);
  const [busca,setBusca]=useState("");
  const [clienteSel,setClienteSel]=useState(null);
  const [mesAtual,setMesAtual]=useState(MESES_HIST[MES_ATUAL_IDX]);
  const [histMes,setHistMes]=useState(MESES_HIST[MES_ATUAL_IDX]);
  const [histResp,setHistResp]=useState("TODOS");
  const [relResp,setRelResp]=useState("TODOS");
  const [relGrupo,setRelGrupo]=useState("TODOS");
  const [relTarefa,setRelTarefa]=useState("TODAS");
  const [relSomentePendentes,setRelSomentePendentes]=useState(false);
  const [configClienteBusca,setConfigClienteBusca]=useState("");
  const [configClienteRegime,setConfigClienteRegime]=useState("TODOS");
  const [configClienteResponsavel,setConfigClienteResponsavel]=useState("TODOS");
  const [configClienteAtividade,setConfigClienteAtividade]=useState("TODOS");
  const [usuarioEditId,setUsuarioEditId]=useState(null);
  const [usuarioForm,setUsuarioForm]=useState({name:"",login:"",senha:"",role:"operador",color:"#6366f1",pages:[]});
  const [clienteEditCnpj,setClienteEditCnpj]=useState(null);
  const [clienteFormOpen,setClienteFormOpen]=useState(false);
  const [clienteForm,setClienteForm]=useState({cod:"",nome:"",cnpj:"",regime:"Simples",atividade:"Serviço",responsavel:"",grupo:"simples",prioridade:"",declaracaoAnual:false,municipio:"",uf:"",enviaIss:false,loginIss:"",senhaIss:"",emailEnvioIss:"",confereSiga:false,tarefas:TAREFAS_SIMPLES.join("\n")});
  const [cnpjFetching,setCnpjFetching]=useState(false);
  const [cnpjFetchErr,setCnpjFetchErr]=useState("");
  // Functional updater helper — never captures stale clienteForm
  const patchForm=(patch:Partial<typeof clienteForm>)=>setClienteForm(prev=>({...prev,...patch}));
  // Mini-formulário de adição de tarefa
  const novaTarefaEmpty={titulo:"",tipo:"data" as "data"|"descricao",valor:""};
  const [novaTarefaForm,setNovaTarefaForm]=useState(novaTarefaEmpty);
  const [novaTarefaOpen,setNovaTarefaOpen]=useState(false);
  const [novaTarefaErro,setNovaTarefaErro]=useState("");
  const [parcReportOpen,setParcReportOpen]=useState(false);
  const [parcReportFiltroCliente,setParcReportFiltroCliente]=useState("");
  const [parcReportFiltroSecao,setParcReportFiltroSecao]=useState("TODOS");
  const [deletionLog,setDeletionLog]=useState([]);
  const [deletionLogOpen,setDeletionLogOpen]=useState(false);
  const [deletionLogItems,setDeletionLogItems]=useState<any[]>([]);
  const [deletionLogLoading,setDeletionLogLoading]=useState(false);
  const [appSettings,setAppSettings]=useState({dashboardAnnouncement:"",emailGmailUser:"",emailGmailPass:"",emailDestino:"",emailAtivo:false,emailRotinas:[{diaEnvio:"1",horario:"08:00",ativo:false},{diaEnvio:"15",horario:"08:00",ativo:false}],logRotinas:[{diaEnvio:"1",horario:"08:00",ativo:false},{diaEnvio:"1",horario:"08:00",ativo:false},{diaEnvio:"1",horario:"08:00",ativo:false},{diaEnvio:"1",horario:"08:00",ativo:false}],robotsConfig:{iss:{pastaDownloads:"",emailAtivo:false,emailRemetente:"",emailSenha:"",emailDestinatario:""},siga:{pastaDownloads:"",emailAtivo:false,emailRemetente:"",emailSenha:"",emailDestinatario:""},mei:{pastaDownloads:"",emailAtivo:false,emailRemetente:"",emailSenha:"",emailDestinatario:""}}});
  const [configMsg,setConfigMsg]=useState("");
  const [dteFile,setDteFile]=useState(null);
  const [sistemaFile,setSistemaFile]=useState(null);
  const [confClienteCnpj,setConfClienteCnpj]=useState("");
  const [confClienteBusca,setConfClienteBusca]=useState("");
  const [clientFiles,setClientFiles]=useState({});
  const [clientFilesLoading,setClientFilesLoading]=useState(false);
  const [clientFileMsg,setClientFileMsg]=useState("");
  const [conferencia,setConferencia]=useState(null);
  const [conferenciaErro,setConferenciaErro]=useState("");
  const [comparando,setComparando]=useState(false);
  const [parcelamentos,setParcelamentos]=useState([]);
  const [parcSel,setParcSel]=useState(null);
  const [parcBusca,setParcBusca]=useState("");
  const [parcSecao,setParcSecao]=useState("TODOS");
  const PARC_FORM_INIT={id:"",secao:"RECEITA FEDERAL - ECAC",empresa:"",cnpj:"",regime:"",responsavel:"",local:"",tarefa:"",jan:"",fev:"",mar:"",abr:"",mai:"",jun:"",jul:"",ago:"",set:"",out:"",nov:"",dez:"",senhas:""};
  const [parcFormMode,setParcFormMode]=useState(null);
  const [parcForm,setParcForm]=useState(PARC_FORM_INIT);
  const [parcDeleteId,setParcDeleteId]=useState(null);
  // Trava de tarefas
  const [focusedTaskKey,setFocusedTaskKey]=useState<string|null>(null);
  const [unlockModal,setUnlockModal]=useState<{cnpj:string;empresa:string;tarefa:string;isChecklist:boolean}|null>(null);
  const [unlockMotivo,setUnlockMotivo]=useState("");
  const [unlockOldValue,setUnlockOldValue]=useState("");
  const [unlockOldChecks,setUnlockOldChecks]=useState<Record<string,boolean>>({});
  const [unlockNewValue,setUnlockNewValue]=useState("");
  const [unlockNewChecks,setUnlockNewChecks]=useState<Record<string,boolean>>({});
  const [unlockErr,setUnlockErr]=useState("");
  const [taskLogOpen,setTaskLogOpen]=useState(false);
  const [taskLogData,setTaskLogData]=useState<any[]>([]);
  const [parcDeleteSenha,setParcDeleteSenha]=useState("");
  const [parcDeleteErr,setParcDeleteErr]=useState("");
  const [parcClientSearch,setParcClientSearch]=useState("");
  const [dataLoaded,setDataLoaded]=useState(false);
  const [roboissGrupo,setRoboissGrupo]=useState("TODOS");
  const [roboissSearch,setRoboissSearch]=useState("");
  const [roboissQueue,setRoboissQueue]=useState<Set<string>>(new Set());
  const [agenteConectado,setAgenteConectado]=useState(false);
  const [algumAgenteConectado,setAlgumAgenteConectado]=useState(false);
  const [mcUserId,setMcUserId]=useState<number>(0);
  const [roboissRunning,setRoboissRunning]=useState(false);
  const [roboissLog,setRoboissLog]=useState<{text:string,stream:string}[]>([]);
  const [roboissResult,setRoboissResult]=useState<{ok:boolean,msg:string}|null>(null);
  const roboissLogRef=useRef<HTMLDivElement|null>(null);
  const [ferramentasRobo,setFerramentasRobo]=useState<"iss"|"siga"|"mei">("iss");
  const [botSigaRunning,setBotSigaRunning]=useState(false);
  const [botSigaLog,setBotSigaLog]=useState<{text:string,stream:string}[]>([]);
  const [botSigaResult,setBotSigaResult]=useState<{ok:boolean,msg:string}|null>(null);
  const [botSigaToast,setBotSigaToast]=useState<{ok:boolean,msg:string}|null>(null);
  const sigaLogRef=useRef<HTMLDivElement|null>(null);
  const [botMeiRunning,setBotMeiRunning]=useState(false);
  const [botMeiLog,setBotMeiLog]=useState<{text:string,stream:string}[]>([]);
  const [botMeiResult,setBotMeiResult]=useState<{ok:boolean,msg:string}|null>(null);
  const meiLogRef=useRef<HTMLDivElement|null>(null);
  const [saveStatus,setSaveStatus]=useState("Carregando banco local...");
  const [hoje,setHoje]=useState(getTodayInTimeZone);
  const [agendaItems,setAgendaItems]=useState<any[]>([]);
  const [agendaYear,setAgendaYear]=useState(()=>new Date().getFullYear());
  const [agendaMonth,setAgendaMonth]=useState(()=>new Date().getMonth());
  const [agendaSelDay,setAgendaSelDay]=useState<string|null>(null);
  const [agendaDayModal,setAgendaDayModal]=useState(false);
  const [agendaFormModal,setAgendaFormModal]=useState(false);
  const [agendaEditItem,setAgendaEditItem]=useState<any>(null);
  const agendaFormInit={titulo:"",descricao:"",data_compromisso:"",hora_compromisso:"",status:"pendente",lembrete_3_dias:false};
  const [agendaForm,setAgendaForm]=useState<any>(agendaFormInit);
  const [agendaFormErr,setAgendaFormErr]=useState("");
  const [agendaSaving,setAgendaSaving]=useState(false);
  const clientIdRef=useRef(crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`);
  const skipNextAutoSaveRef=useRef(false);
  const lastSavedAtRef=useRef(null);

  const getClientTarefas=(c)=>{
    const tarefas=normalizeTarefasList(c?.tarefas?.length?c.tarefas:getTarefas(c?.grupo));
    return c?.grupo==="normal"?tarefas:tarefas.filter(t=>!TAREFAS_REGIME_NORMAL_ONLY.has(String(t||"").trim().toUpperCase()));
  };
  const getClientDoc=(c)=>c?.cnpjOriginal||c?.cnpj||"";
  const getMesNumber=(mes)=>Number(String(mes||"").split("/")[0]);
  const obrigacaoAplicaMes=(obrig,mes)=>!obrig.meses||obrig.meses.includes(getMesNumber(mes));
  const getObrigacaoDia=(obrig,mes)=>{
    const [m,a]=String(mes||"").split("/").map(Number);
    if(obrig.dia==="ultimo") return new Date(a,m,0).getDate();
    return Number(obrig.dia);
  };
  const getUserColor=(n)=>{
    const u=users.find(u=>u.name.toUpperCase()===n?.toUpperCase());
    return u?.color||"#94a3b8";
  };
  const parseTarefas=(value)=>normalizeTarefasList(value.split(/\n|,/));
  const applyServerData=(data,{remote=false}={})=>{
    const normalizedClientes=data?.clientesData?.length?normalizeClientesData(data.clientesData):null;
    if(data?.users?.length) {
      const mkBots=(u:any)=>{
        const mk=(x:any)=>({
          pastaDownloads: String(x?.pastaDownloads||""),
          emailRemetente: String(x?.emailRemetente||""),
          emailSenha:     String(x?.emailSenha||""),
          emailDestinatario: String(x?.emailDestinatario||""),
        });
        const bc=u?.botsConfig||{};
        return {iss:mk(bc.iss),siga:mk(bc.siga),mei:mk(bc.mei)};
      };
      setUsers(prev=>data.users.map((u:any)=>{
        const base=prev.find((p:any)=>p.id===u.id)||{};
        return {...base,...u,botsConfig:mkBots(u)};
      }));
    }
    if(normalizedClientes){
      setClientesData(normalizedClientes);
      setClienteSel(prev=>prev?normalizedClientes.find(c=>c.cnpj===prev.cnpj)||prev:prev);
    }
    if(data?.state) setState(normalizeSavedState(data.state));
    if(data?.parcelamentos?.length) setParcelamentos(data.parcelamentos);
    if(data?.deletionLog) setDeletionLog(data.deletionLog||[]);
    const savedRotinas=data?.appSettings?.emailRotinas;
    const savedLogRotina=data?.appSettings?.logRotina;
    setAppSettings({
      dashboardAnnouncement:String(data?.appSettings?.dashboardAnnouncement||""),
      emailGmailUser:String(data?.appSettings?.emailGmailUser||""),
      emailGmailPass:String(data?.appSettings?.emailGmailPass||""),
      emailDestino:String(data?.appSettings?.emailDestino||""),
      emailAtivo:Boolean(data?.appSettings?.emailAtivo||false),
      emailRotinas:Array.isArray(savedRotinas)&&savedRotinas.length>=2
        ?savedRotinas.slice(0,2)
        :[{diaEnvio:"1",horario:"08:00",ativo:false},{diaEnvio:"15",horario:"08:00",ativo:false}],
      logRotinas:(()=>{
        const saved=data?.appSettings?.logRotinas;
        if(Array.isArray(saved)&&saved.length>=4) return saved.slice(0,4);
        const old=data?.appSettings?.logRotina;
        const base=old&&old.diaEnvio?[old]:[{diaEnvio:"1",horario:"08:00",ativo:false}];
        while(base.length<4) base.push({diaEnvio:"1",horario:"08:00",ativo:false});
        return base;
      })(),
      robotsConfig:(()=>{
        const rc=data?.appSettings?.robotsConfig||{};
        const mk=(x:any)=>({pastaDownloads:String(x?.pastaDownloads||""),emailAtivo:Boolean(x?.emailAtivo||false),emailRemetente:String(x?.emailRemetente||""),emailSenha:String(x?.emailSenha||""),emailDestinatario:String(x?.emailDestinatario||"")});
        return{iss:mk(rc.iss),siga:mk(rc.siga),mei:mk(rc.mei)};
      })(),
    });
    if(data?.savedAt) lastSavedAtRef.current=data.savedAt;
    setSaveStatus(remote?"Atualizado em tempo real.":data?.savedAt?"Dados carregados do banco local.":"Banco local iniciado.");
  };
  const loadServerData=async(options={})=>{
    const r=await fetch(apiUrl("/api/data"));
    if(!r.ok) throw new Error("Banco local indisponível");
    const data=await r.json();
    applyServerData(data,options);
    return data;
  };
  const loadAgenda=async(uid:number)=>{
    const r=await fetch(apiUrl(`/api/agenda?user_id=${uid}`));
    if(r.ok){const d=await r.json();if(d.ok)setAgendaItems(d.items);}
  };
  const agendaCreate=async(form:any)=>{
    const r=await fetch(apiUrl("/api/agenda"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,user_id:user.id,lembrete_3_dias:form.lembrete_3_dias?1:0})});
    const d=await r.json();
    if(d.ok){await loadAgenda(user.id);return true;}
    return false;
  };
  const agendaUpdate=async(id:number,form:any)=>{
    const r=await fetch(apiUrl(`/api/agenda/${id}`),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,user_id:user.id,lembrete_3_dias:form.lembrete_3_dias?1:0})});
    const d=await r.json();
    if(d.ok){await loadAgenda(user.id);return true;}
    return false;
  };
  const agendaDelete=async(id:number)=>{
    const r=await fetch(apiUrl(`/api/agenda/${id}?user_id=${user.id}`),{method:"DELETE"});
    const d=await r.json();
    if(d.ok){await loadAgenda(user.id);return true;}
    return false;
  };
  const persistData=async({manual=false}={})=>{
    setSaveStatus(manual?"Salvando no banco agora...":"Salvando alterações...");
    const r=await fetch(apiUrl("/api/data"),{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({users,clientesData,state,appSettings,parcelamentos,clientId:clientIdRef.current})
    });
    if(!r.ok) throw new Error("Falha ao salvar");
    const data=await r.json();
    if(data?.savedAt) lastSavedAtRef.current=data.savedAt;
    setSaveStatus(manual?"Alterações confirmadas no banco.":"Alterações salvas no banco local.");
    return data;
  };
  useEffect(()=>{
    let cancelled=false;
    loadServerData()
      .then(data=>{
        if(cancelled) return;
      })
      .catch(()=>setSaveStatus("Rodando sem conexão com o banco local."))
      .finally(()=>!cancelled&&setDataLoaded(true));
    return()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    let cancelled=false;
    fetch(apiUrl("/api/health"))
      .then(r=>r.ok?r.json():Promise.reject(new Error("Data do servidor indisponível")))
      .then(data=>{
        if(cancelled) return;
        const serverDate=parseDateKey(data?.serverDate?.date);
        if(serverDate) setHoje(serverDate);
      })
      .catch(()=>setHoje(getTodayInTimeZone()));
    return()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    if(!dataLoaded) return;
    if(skipNextAutoSaveRef.current){
      skipNextAutoSaveRef.current=false;
      return;
    }
    const id=setTimeout(()=>{
      persistData()
        .catch(()=>setSaveStatus("Não foi possível salvar no banco local."));
    },600);
    return()=>clearTimeout(id);
  },[dataLoaded,users,clientesData,state,appSettings,parcelamentos]);
  useEffect(()=>{
    if(!dataLoaded||typeof EventSource==="undefined") return;
    const source=new EventSource(apiUrl("/api/events"));
    source.onmessage=(event)=>{
      try{
        const data=JSON.parse(event.data||"{}");
        if(data.sourceClientId===clientIdRef.current) return;
        if(data.type==="app-data-updated"){
          if(data.savedAt&&data.savedAt===lastSavedAtRef.current) return;
          skipNextAutoSaveRef.current=true;
          loadServerData({remote:true}).catch(()=>{
            skipNextAutoSaveRef.current=false;
            setSaveStatus("Não foi possível sincronizar em tempo real.");
          });
        }
        if(data.type==="client-files-updated"&&clienteSel?.cnpj){
          loadClientFiles(clienteSel.cnpj).catch(()=>{});
        }
        if(data.type==="agent-connected"){
          setAlgumAgenteConectado(true);
          if(data.operadorId===user?.id) setAgenteConectado(true);
        }
        if(data.type==="agent-disconnected"){
          if(data.operadorId===user?.id) setAgenteConectado(false);
          fetch(apiUrl("/api/agent/status")).then(r=>r.json()).then(d=>{
            setAlgumAgenteConectado((d.conectados||[]).length>0);
          }).catch(()=>{});
        }
        const meuEvento=!data.operadorId||String(data.operadorId)===String(userRef.current?.id);
        if(data.type==="bot-iss-log"&&meuEvento){setRoboissLog(prev=>[...prev,{text:data.line||"",stream:data.stream||"stdout"}]);}
        if(data.type==="bot-iss-done"&&meuEvento){setRoboissRunning(false);setRoboissResult({ok:true,msg:"Bot concluído com sucesso."});}
        if(data.type==="bot-iss-error"&&meuEvento){setRoboissRunning(false);setRoboissResult({ok:false,msg:data.error||`Erro (código ${data.code})`});}
        if(data.type==="bot-siga-log"&&meuEvento){setBotSigaLog(prev=>[...prev,{text:data.line||"",stream:data.stream||"stdout"}]);}
        if(data.type==="bot-siga-done"&&meuEvento){
          setBotSigaRunning(false);
          setBotSigaResult({ok:true,msg:"Processo concluído com sucesso."});
          setBotSigaToast({ok:true,msg:"T-SIGA finalizado com sucesso!"});
          if(Notification.permission==="granted"){new Notification("T-SIGA",{body:"Processo finalizado com sucesso!",icon:"/favicon.ico"});}
          else if(Notification.permission!=="denied"){Notification.requestPermission().then(p=>{if(p==="granted")new Notification("T-SIGA",{body:"Processo finalizado com sucesso!",icon:"/favicon.ico"});});}
          setTimeout(()=>setBotSigaToast(null),8000);
        }
        if(data.type==="bot-siga-error"&&meuEvento){
          setBotSigaRunning(false);
          const errMsg=data.error||`Erro (código ${data.code})`;
          setBotSigaResult({ok:false,msg:errMsg});
          setBotSigaToast({ok:false,msg:`T-SIGA encerrou com erro: ${errMsg}`});
          if(Notification.permission==="granted"){new Notification("T-SIGA — Erro",{body:errMsg,icon:"/favicon.ico"});}
          setTimeout(()=>setBotSigaToast(null),12000);
        }
        if(data.type==="bot-mei-log"&&meuEvento){setBotMeiLog(prev=>[...prev,{text:data.line||"",stream:data.stream||"stdout"}]);}
        if(data.type==="bot-mei-done"&&meuEvento){setBotMeiRunning(false);setBotMeiResult({ok:true,msg:"Bot concluído com sucesso."});}
        if(data.type==="bot-mei-error"&&meuEvento){setBotMeiRunning(false);setBotMeiResult({ok:false,msg:data.error||`Erro (código ${data.code})`});}
      }catch{}
    };
    source.onerror=()=>setSaveStatus("Sincronização em tempo real tentando reconectar...");
    return()=>source.close();
  },[dataLoaded,clienteSel?.cnpj]);
  useEffect(()=>{
    if(roboissLogRef.current){roboissLogRef.current.scrollTop=roboissLogRef.current.scrollHeight;}
  },[roboissLog]);
  useEffect(()=>{
    if(sigaLogRef.current){sigaLogRef.current.scrollTop=sigaLogRef.current.scrollHeight;}
  },[botSigaLog]);
  useEffect(()=>{
    if(meiLogRef.current){meiLogRef.current.scrollTop=meiLogRef.current.scrollHeight;}
  },[botMeiLog]);
  useEffect(()=>{
    fetch(apiUrl("/api/bot-iss/status")).then(r=>r.json()).then(d=>{if(d.running)setRoboissRunning(true);}).catch(()=>{});
    fetch(apiUrl("/api/bot-siga/status")).then(r=>r.json()).then(d=>{if(d.running)setBotSigaRunning(true);}).catch(()=>{});
    fetch(apiUrl("/api/bot-mei/status")).then(r=>r.json()).then(d=>{if(d.running)setBotMeiRunning(true);}).catch(()=>{});
  },[]);
  useEffect(()=>{
    if(!user?.id) return;
    fetch(apiUrl("/api/agent/status")).then(r=>r.json()).then(d=>{
      const lista=d.conectados||[];
      setAgenteConectado(lista.some((c:any)=>c.operadorId===user.id));
      setAlgumAgenteConectado(lista.length>0);
    }).catch(()=>{});
  },[user?.id]);
  useEffect(()=>{
    if(user?.id) loadAgenda(user.id).catch(()=>{});
  },[user?.id]);
  useEffect(()=>{
    if(!clienteSel?.cnpj) return;
    setClientFilesLoading(true);
    setClientFileMsg("");
    loadClientFiles(clienteSel.cnpj)
      .catch(e=>setClientFileMsg(e?.message||"Não foi possível carregar os arquivos."))
      .finally(()=>setClientFilesLoading(false));
  },[clienteSel?.cnpj]);
  const readWorkbookFile=(file)=>new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(XLSX.read(reader.result,{type:"array",cellDates:true}));
    reader.onerror=()=>reject(new Error("Não foi possível ler a planilha."));
    reader.readAsArrayBuffer(file);
  });
  const fileToBase64=(file)=>new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||"");
    reader.onerror=()=>reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
  const workbookFromBase64=(base64)=>{
    const binary=atob(base64);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    return XLSX.read(bytes,{type:"array",cellDates:true});
  };
  const formatFileSize=(size)=>{
    if(size<1024) return `${size} B`;
    if(size<1024*1024) return `${(size/1024).toFixed(1)} KB`;
    return `${(size/1024/1024).toFixed(1)} MB`;
  };
  const formatFileDate=(value)=>value?new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"";
  const loadClientFiles=async(clientId,includeContent=false)=>{
    if(!clientId) return [];
    const r=await fetch(apiUrl(`/api/client-files?client_id=${encodeURIComponent(clientId)}${includeContent?"&include_content=1":""}`));
    if(!r.ok) throw new Error("Não foi possível carregar os arquivos do cliente.");
    const data=await r.json();
    if(!includeContent) setClientFiles(prev=>({...prev,[clientId]:data.files||[]}));
    return data.files||[];
  };
  const uploadClientFile=async(file)=>{
    if(!clienteSel||!file) return;
    setClientFileMsg("Enviando arquivo...");
    try{
      const contentBase64=await fileToBase64(file);
      const r=await fetch(apiUrl("/api/client-files"),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({client_id:clienteSel.cnpj,name:file.name,size:file.size,contentBase64})
      });
      if(!r.ok) throw new Error("Não foi possível salvar o arquivo.");
      await loadClientFiles(clienteSel.cnpj);
      setClientFileMsg("Arquivo salvo no banco local.");
    }catch(e){
      setClientFileMsg(e?.message||"Erro ao enviar arquivo.");
    }
  };
  const deleteClientFile=async(file)=>{
    if(!clienteSel||!file?.id) return;
    if(!window.confirm(`Tem certeza que deseja excluir ${file.name}?`)) return;
    setClientFileMsg("Excluindo arquivo...");
    try{
      const r=await fetch(apiUrl(`/api/client-files/${encodeURIComponent(file.id)}`),{method:"DELETE"});
      if(!r.ok) throw new Error("Não foi possível excluir o arquivo.");
      setClientFiles(prev=>({
        ...prev,
        [clienteSel.cnpj]:(prev[clienteSel.cnpj]||[]).filter(item=>item.id!==file.id)
      }));
      setClientFileMsg("Arquivo excluído do cadastro e do banco local.");
    }catch(e){
      setClientFileMsg(e?.message||"Erro ao excluir arquivo.");
    }
  };
  const normalizeInvoiceKey=(value)=>String(value??"").trim().replace(/\D/g,"");
  const normalizeHeaderText=(value)=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const looksLikeMoney=(value)=>{
    const text=String(value??"").trim();
    if(!text||extractInvoiceKeysFromCell(text).length>0) return false;
    const clean=text.replace(/[R$\s]/gi,"").replace(/\./g,"").replace(",",".");
    if(!/^-?\d+(\.\d{1,2})?$/.test(clean)) return false;
    const number=Number(clean);
    return Number.isFinite(number)&&Math.abs(number)>0&&Math.abs(number)<1_000_000_000;
  };
  const looksLikeSender=(value)=>{
    const text=String(value??"").trim();
    if(!text||extractInvoiceKeysFromCell(text).length>0) return false;
    if(/\d{5,}/.test(text)||looksLikeMoney(text)||/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(text)) return false;
    return /[A-Za-zÀ-ÿ]{3,}/.test(text)&&text.length>=4;
  };
  const bestColumnByScore=(scores,minScore=1)=>{
    let best=-1,bestScore=minScore-1;
    scores.forEach((score,col)=>{
      if(score>bestScore){best=col;bestScore=score;}
    });
    return best;
  };
  const findDetailColumns=(rows)=>{
    const numberPatterns=[/(^|[^a-z])n(umero|um|[roºo])?([^a-z]|$)/,/numero\s*(da\s*)?(nota|nf|nfe)/,/nota\s*fiscal/,/documento/,/doc/];
    const valuePatterns=[/valor(\s+da)?\s*(nfe|nf|nota)?/,/valor\s*nf/,/valor\s*da\s*nfe/,/vlr/,/total/];
    const senderPatterns=[/fornecedor/,/emitente/,/remetente/];
    const datePatterns=[/emissao/,/data/,/dt/];
    const maxCols=Math.max(0,...rows.map(row=>row.length));
    const numberScores=Array(maxCols).fill(0);
    const valueScores=Array(maxCols).fill(0);
    const senderScores=Array(maxCols).fill(0);
    const dateScores=Array(maxCols).fill(0);

    rows.forEach((row,rowIdx)=>{
      row.forEach((cell,col)=>{
        const header=normalizeHeaderText(cell);
        if(rowIdx<25&&!header.includes("chave")){
          if(numberPatterns.some(pattern=>pattern.test(header))) numberScores[col]+=6;
          if(valuePatterns.some(pattern=>pattern.test(header))) valueScores[col]+=8;
          if(senderPatterns.some(pattern=>pattern.test(header))) senderScores[col]+=8;
          if(datePatterns.some(pattern=>pattern.test(header))) dateScores[col]+=6;
        }
        if(looksLikeMoney(cell)) valueScores[col]+=1;
        if(looksLikeSender(cell)) senderScores[col]+=1;
      });
    });

    return {
      headerRow:-1,
      numberCol:bestColumnByScore(numberScores,2),
      valueCol:bestColumnByScore(valueScores,3),
      senderCol:bestColumnByScore(senderScores,3),
      dateCol:bestColumnByScore(dateScores,2),
    };
  };
  const extractInvoiceKeysFromCell=(value)=>{
    const text=String(value??"");
    const direct=text.match(/\d{44}/g)||[];
    const compact=normalizeInvoiceKey(text);
    return [...new Set([...direct, ...(compact.length===44?[compact]:[])])];
  };
  const getCellText=(row,col)=>col>=0?String(row[col]??"").trim():"";
  const noteNumberFromKey=(key)=>{
    const value=String(key||"").slice(25,34).replace(/^0+/,"");
    return value||"";
  };
  const dateFromKey=(key)=>{
    const raw=String(key||"").slice(2,6);
    if(!/^\d{4}$/.test(raw)) return "";
    return `${raw.slice(2,4)}/${raw.slice(0,2)}`;
  };
  const extractInvoiceRecords=(workbook,origem)=>{
    const records=new Map();
    workbook.SheetNames.forEach(sheetName=>{
      const rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:"",raw:false});
      const columns=findDetailColumns(rows);
      rows.forEach((row,idx)=>{
        const keys=row.flatMap(extractInvoiceKeysFromCell);
        if(keys.length===0) return;
        keys.forEach(chaveNota=>{
        const keyColIndex=row.findIndex(cell=>extractInvoiceKeysFromCell(cell).includes(chaveNota));
        const chaveNotaOriginal=String(row[keyColIndex]??chaveNota).trim();
        if(records.has(chaveNota)) return;
        const valor=getCellText(row,columns.valueCol)||row.find((cell,col)=>col!==keyColIndex&&looksLikeMoney(cell))||"";
        const emitente=getCellText(row,columns.senderCol)||row.find((cell,col)=>col!==keyColIndex&&looksLikeSender(cell))||"";
        records.set(chaveNota,{
          key:chaveNota,
          chaveNota,
          chaveNotaOriginal,
          uf:ufFromInvoiceKey(chaveNota),
          numero:getCellText(row,columns.numberCol)||noteNumberFromKey(chaveNota),
          valor:String(valor??"").trim(),
          emitente:String(emitente??"").trim(),
          data:getCellText(row,columns.dateCol)||dateFromKey(chaveNota),
          origem,
          sheetName,
          row:idx+1,
          keyCol:columnName(keyColIndex),
        });
        });
      });
    });
    return [...records.values()];
  };
  const compararPlanilhas=async()=>{
    if(!confClienteCnpj||!sistemaFile){setConferenciaErro("Selecione o cliente e a planilha SISTEMA.");return;}
    setComparando(true);
    setConferenciaErro("");
    try{
      const storedFiles=await loadClientFiles(confClienteCnpj,true);
      if(storedFiles.length===0) throw new Error("O cliente selecionado não possui planilhas DTE salvas.");
      const sistemaWb=await readWorkbookFile(sistemaFile);
      const dteItems=storedFiles.flatMap(file=>extractInvoiceRecords(workbookFromBase64(file.contentBase64),`DTE - ${file.name}`));
      const sistemaItems=extractInvoiceRecords(sistemaWb,"SISTEMA");
      if(dteItems.length===0) throw new Error("Nenhum registro com CHAVE DA NOTA foi encontrado nos arquivos DTE salvos.");
      if(sistemaItems.length===0) throw new Error("Nenhum registro com CHAVE DA NOTA foi encontrado na planilha SISTEMA.");
      const dteMap=new Map(dteItems.map(item=>[item.chaveNota,item]));
      const sistemaKeys=new Set(sistemaItems.map(item=>item.chaveNota));
      const faltandoSistema=[...dteMap.values()].filter(item=>!sistemaKeys.has(item.chaveNota));
      setConferencia({clienteId:confClienteCnpj,storedFiles,dteTotal:dteItems.length,sistemaTotal:sistemaItems.length,faltandoSistema,total:faltandoSistema.length});
    }catch(e){
      setConferenciaErro(e?.message||"Erro ao comparar as planilhas.");
      setConferencia(null);
    }finally{
      setComparando(false);
    }
  };
  const exportDivergenceReport=()=>{
    if(!conferencia?.faltandoSistema?.length) return;
    const rows=conferencia.faltandoSistema.map(item=>({
      "Numero da nota": item.numero||"",
      "Valor": item.valor||"",
      "UF": item.uf||"",
      "Chave da nota": item.chaveNota,
      "Emitente/Remetente": item.emitente||"",
      "Data": item.data||"",
      "Origem": item.origem,
      "Aba": item.sheetName,
      "Linha": item.row,
      "Coluna da chave": item.keyCol,
    }));
    const worksheet=XLSX.utils.json_to_sheet(rows);
    const workbook=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,worksheet,"DTE sem SISTEMA");
    const cliente=clientesData.find(c=>c.cnpj===conferencia.clienteId);
    const name=String(cliente?.nome||"cliente").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"cliente";
    XLSX.writeFile(workbook,`divergencias-dte-sistema-${name}.xlsx`);
  };
  const syncClienteState=(cliente,tarefas)=>{
    setState(prev=>{
      const next={...prev,[cliente.cnpj]:{...(prev[cliente.cnpj]||{})}};
      MESES_HIST.forEach(mes=>{
        const old=prev[cliente.cnpj]?.[mes];
        const tarefasMes={};
        tarefas.forEach(t=>{ tarefasMes[t]=old?.tarefas?.[t]||""; });
        next[cliente.cnpj][mes]={tarefas:tarefasMes,obs:old?.obs??cliente.obs??"",mit:old?.mit??cliente.mit??""};
      });
      return next;
    });
  };
  const resetUsuarioForm=()=>{setUsuarioEditId(null);setUsuarioForm({name:"",login:"",senha:"",role:"operador",color:"#6366f1",pages:[]});};
  const editUsuario=(u)=>{setUsuarioEditId(u.id);setUsuarioForm({name:u.name,login:u.login,senha:u.senha,role:u.role,color:u.color,pages:u.pages||[]});};
  const saveUsuario=()=>{
    if(!usuarioForm.name.trim()||!usuarioForm.login.trim()||!usuarioForm.senha.trim()){setConfigMsg("Preencha nome, login e senha do usuário.");return;}
    const clean={...usuarioForm,name:usuarioForm.name.trim(),login:usuarioForm.login.trim().toLowerCase(),senha:usuarioForm.senha.trim()};
    setUsers(prev=>{
      if(usuarioEditId) return prev.map(u=>u.id===usuarioEditId?{...clean,pages:usuarioForm.pages,id:u.id}:u);
      const nextId=Math.max(0,...prev.map(u=>u.id))+1;
      return [...prev,{...clean,pages:usuarioForm.pages,id:nextId}];
    });
    if(user?.id===usuarioEditId) setUser({...user,...clean,pages:usuarioForm.pages});
    resetUsuarioForm();
    setConfigMsg("Usuário salvo.");
  };
  const resetClienteForm=()=>{setClienteEditCnpj(null);setClienteFormOpen(false);setCnpjFetchErr("");setClienteForm({cod:"",nome:"",cnpj:"",regime:"Simples",atividade:"Serviço",responsavel:"",grupo:"simples",prioridade:"",declaracaoAnual:false,municipio:"",uf:"",enviaIss:false,loginIss:"",senhaIss:"",emailEnvioIss:"",confereSiga:false,tarefas:TAREFAS_SIMPLES.join("\n")});setNovaTarefaForm(novaTarefaEmpty);setNovaTarefaOpen(false);setNovaTarefaErro("");};
  const openNewClienteModal=()=>{resetClienteForm();setClienteFormOpen(true);};
  const openEditClienteModal=(c)=>{editClienteConfig(c);setClienteFormOpen(true);};
  const editClienteConfig=(c)=>{
    setClienteEditCnpj(c.cnpj);
    setClienteForm({
      cod:c.cod||"",
      nome:c.nome||"",
      cnpj:getClientDoc(c),
      regime:c.regime||"",
      atividade:c.atividade||"",
      responsavel:c.responsavel||"",
      grupo:c.grupo||"simples",
      prioridade:c.prioridade||"",
      declaracaoAnual:!!c.declaracaoAnual,
      municipio:c.municipio||"",
      uf:c.uf||"",
      enviaIss:!!c.enviaIss,
      loginIss:c.loginIss||"",
      senhaIss:c.senhaIss||"",
      emailEnvioIss:c.emailEnvioIss||"",
      confereSiga:!!c.confereSiga,
      tarefas:getClientTarefas(c).join("\n")
    });
  };
  const fetchCnpjData=async(cnpj:string)=>{
    const digits=cnpj.replace(/\D/g,"");
    if(digits.length!==14) return;
    setCnpjFetching(true);setCnpjFetchErr("");
    // Title-case each word ("JUAZEIRO DO NORTE" → "Juazeiro do Norte")
    const titleCase=(s:string)=>s?s.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()):"";
    try{
      let raw:any=null;
      let source="";
      try{
        const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if(r.ok){raw=await r.json();source="brasilapi";}
      }catch{}
      if(!raw){
        try{
          const r=await fetch(`https://publica.cnpj.ws/cnpj/${digits}`);
          if(r.ok){raw=await r.json();source="cnpjws";}
        }catch{}
      }
      console.log("[CNPJ fetch source]", source);
      if(raw){
        let municipio="";
        let uf="";
        let rawMunicipioValue:any;
        if(source==="brasilapi"){
          rawMunicipioValue=raw?.municipio;
          municipio=rawMunicipioValue?titleCase(String(rawMunicipioValue)):"";
          uf=String(raw.uf||"").toUpperCase();
        } else if(source==="cnpjws"){
          rawMunicipioValue=raw?.estabelecimento?.cidade?.nome;
          municipio=rawMunicipioValue?String(rawMunicipioValue):"";
          uf=String(raw.estabelecimento?.estado?.sigla||"").toUpperCase();
        }
        const razao=String(raw.razao_social||"");
        // --- diagnostics ---
        console.log("[CNPJ municipio raw]", rawMunicipioValue);
        console.log("[CNPJ municipio parsed]", municipio);
        const domEl=document.querySelector('[placeholder="Ex: Fortaleza"]') as HTMLInputElement|null;
        console.log("[CNPJ municipio DOM el]", domEl?`exists, current="${domEl.value}"`:"NOT IN DOM — form may not be open");
        // -------------------
        setClienteForm(prev=>({...prev,
          nome:razao||prev.nome,
          municipio:municipio||prev.municipio,
          uf:uf||prev.uf,
        }));
        setTimeout(()=>{
          const el=document.querySelector('[placeholder="Ex: Fortaleza"]') as HTMLInputElement|null;
          console.log("[CNPJ after setState municipio DOM]", el?`"${el.value}"`:"form closed");
        },80);
      } else {
        setCnpjFetchErr("CNPJ não encontrado na Receita Federal.");
      }
    }catch(err){
      console.error("[CNPJ error]",err);
      setCnpjFetchErr("Erro ao consultar Receita Federal.");
    }finally{
      setCnpjFetching(false);
    }
  };
  const saveCliente=()=>{
    // Fecha o mini-form de nova tarefa se ainda estiver aberto sem confirmar
    if(novaTarefaOpen) setNovaTarefaOpen(false);
    const tarefas=parseTarefas(clienteForm.tarefas);
    if(!clienteForm.nome.trim()||!clienteForm.cnpj.trim()||tarefas.length===0){setConfigMsg("Preencha empresa, CNPJ e pelo menos uma tarefa.");return;}
    const cliente={
      cod:clienteForm.cod.trim()||"-",
      nome:clienteForm.nome.trim(),
      cnpj:clienteForm.cnpj.replace(/\D/g,"")||clienteForm.cnpj.trim(),
      regime:clienteForm.regime.trim()||"Simples",
      atividade:clienteForm.atividade.trim()||"Serviço",
      responsavel:clienteForm.responsavel.trim().toUpperCase(),
      grupo:clienteForm.grupo,
      prioridade:clienteForm.prioridade?Number(clienteForm.prioridade):undefined,
      declaracaoAnual:!!clienteForm.declaracaoAnual,
      municipio:clienteForm.municipio.trim()||"",
      uf:clienteForm.uf.trim()||"",
      enviaIss:!!clienteForm.enviaIss,
      loginIss:clienteForm.loginIss.trim()||"",
      confereSiga:!!clienteForm.confereSiga,
      senhaIss:clienteForm.senhaIss.trim()||"",
      emailEnvioIss:clienteForm.emailEnvioIss.trim()||"",
      tarefas
    };
    setClientesData(prev=>clienteEditCnpj?prev.map(c=>c.cnpj===clienteEditCnpj?cliente:c):[...prev,cliente]);
    syncClienteState(cliente,tarefas);
    if(clienteSel?.cnpj===clienteEditCnpj) setClienteSel(cliente);
    resetClienteForm();
    setClienteFormOpen(false);
    setConfigMsg("Empresa salva.");
  };
  const deleteCliente=async(cliente)=>{
    if(user?.role!=="admin"||!cliente?.cnpj) return;
    const ok=window.confirm(`Excluir o cliente "${cliente.nome}"?\n\nEsta ação remove a empresa, o histórico mensal e as planilhas DTE armazenadas para este cliente.`);
    if(!ok) return;

    addDeletionLog({type:"cliente",name:cliente.nome,cnpj:cliente.cnpj,who:user.name});
    setClientesData(prev=>prev.filter(c=>c.cnpj!==cliente.cnpj));
    setState(prev=>{
      const next={...prev};
      delete next[cliente.cnpj];
      return next;
    });
    setClientFiles(prev=>{
      const next={...prev};
      delete next[cliente.cnpj];
      return next;
    });
    if(clienteSel?.cnpj===cliente.cnpj) setClienteSel(null);
    if(confClienteCnpj===cliente.cnpj){
      setConfClienteCnpj("");
      setConfClienteBusca("");
      setConferencia(null);
    }
    if(clienteEditCnpj===cliente.cnpj) resetClienteForm();

    try{
      const r=await fetch(apiUrl(`/api/client-files?client_id=${encodeURIComponent(cliente.cnpj)}`),{method:"DELETE"});
      if(!r.ok) throw new Error("Não foi possível excluir as planilhas do cliente.");
      setConfigMsg("Cliente excluído.");
      setSaveStatus("Cliente removido. Salvando alterações...");
    }catch(e){
      setConfigMsg(e?.message||"Cliente removido, mas houve erro ao excluir planilhas.");
    }
  };

  useEffect(()=>{userRef.current=user;},[user]);

  const handleLogin=()=>{
    const u=users.find(u=>u.login===login.toLowerCase()&&u.senha===senha);
    if(u){setUser(u);setErr("");}else setErr("Usuário ou senha incorretos.");
  };

  const applyTarefaValue=(prev,cnpj,tarefa,val)=>{
    const cliente=clientesData.find(c=>c.cnpj===cnpj);
    const shouldPropagate=cliente?.declaracaoAnual&&isTarefaConcluida(tarefa,val);
    const startIndex=Math.max(0,MESES_HIST.indexOf(mesAtual));
    const meses=shouldPropagate?MESES_HIST.slice(startIndex):[mesAtual];
    const next={...prev,[cnpj]:{...(prev[cnpj]||{})}};

    meses.forEach(mes=>{
      const old=prev[cnpj]?.[mes]||{tarefas:{}};
      next[cnpj][mes]={
        ...old,
        tarefas:{...(old.tarefas||{}),[tarefa]:typeof val==="object"&&val!==null?{...val}:val}
      };
    });

    return next;
  };

  const updateTarefa=(cnpj,tarefa,val)=>{
    setState(prev=>applyTarefaValue(prev,cnpj,tarefa,val));
  };
  const updateChecklistTarefa=(cnpj,tarefa,field,checked)=>{
    setState(prev=>{
      const current=prev[cnpj]?.[mesAtual]?.tarefas?.[tarefa];
      const checks=getChecklistStatus(current);
      const nextValue={...checks,[field]:checked};
      return applyTarefaValue(prev,cnpj,tarefa,nextValue);
    });
  };
  const taskKey=(cnpj:string,tarefa:string)=>`${cnpj}||${tarefa}||${mesAtual}`;
  const isTaskLocked=(cnpj:string,tarefa:string,val:any)=>{
    if(!val) return false;
    const key=taskKey(cnpj,tarefa);
    if(focusedTaskKey===key) return false;
    const filled=typeof val==="object"
      ?(val.entrada||val.saida)
      :/^\d{4}-\d{2}-\d{2}$/.test(String(val).trim());
    return filled;
  };
  const confirmUnlock=async()=>{
    if(!unlockModal) return;
    if(!unlockMotivo.trim()){setUnlockErr("Informe o motivo.");return;}
    if(!unlockModal.isChecklist&&!unlockNewValue){setUnlockErr("Informe a nova data.");return;}
    const empresa=clientesData.find(c=>c.cnpj===unlockModal.cnpj)?.nome||unlockModal.empresa||unlockModal.cnpj;
    // Aplica o novo valor
    if(unlockModal.isChecklist){
      updateTarefa(unlockModal.cnpj,unlockModal.tarefa,unlockNewChecks);
    } else {
      updateTarefa(unlockModal.cnpj,unlockModal.tarefa,unlockNewValue);
    }
    // Formata info antiga e atual para o log
    const fmtDate=(s:string)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?`${m[3]}/${m[2]}/${m[1]}`:s||"(vazio)";};
    const fmtVal=(v:any)=>typeof v==="object"?Object.entries(v).filter(([,ok])=>ok).map(([k])=>k).join(", ")||"(nenhum)":fmtDate(String(v||""));
    const infoAntiga=unlockModal.isChecklist?fmtVal(unlockOldChecks):fmtVal(unlockOldValue);
    const infoAtual=unlockModal.isChecklist?fmtVal(unlockNewChecks):fmtVal(unlockNewValue);
    // Registra no log
    try{
      await fetch(apiUrl("/api/task-unlock-log"),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({cnpj:unlockModal.cnpj,empresa,tarefa:unlockModal.tarefa,mes:mesAtual,motivo:unlockMotivo.trim(),usuario:user.name,infoAntiga,infoAtual}),
      });
    }catch{}
    setUnlockModal(null);
    setUnlockMotivo("");
    setUnlockOldValue("");
    setUnlockOldChecks({});
    setUnlockNewValue("");
    setUnlockNewChecks({});
    setUnlockErr("");
  };
  const openTaskLog=async()=>{
    try{
      const r=await fetch(apiUrl("/api/task-unlock-log"));
      const d=await r.json();
      setTaskLogData(d.logs||[]);
    }catch{setTaskLogData([]);}
    setTaskLogOpen(true);
  };
  const markDeclaracaoAnualEnviada=(cliente)=>{
    const tarefas=getClientTarefas(cliente);
    const startIndex=Math.max(0,MESES_HIST.indexOf(mesAtual));
    const meses=MESES_HIST.slice(startIndex);
    const doneDate=getDateKey(hoje);
    setState(prev=>{
      const next={...prev,[cliente.cnpj]:{...(prev[cliente.cnpj]||{})}};
      meses.forEach(mes=>{
        const old=prev[cliente.cnpj]?.[mes]||{tarefas:{}};
        const tarefasMes={...(old.tarefas||{})};
        tarefas.forEach(t=>{
          tarefasMes[t]=isChecklistTarefa(t)
            ? CHECKLIST_FIELDS.reduce((acc,field)=>({...acc,[field.key]:true}),{})
            : doneDate;
        });
        next[cliente.cnpj][mes]={...old,tarefas:tarefasMes};
      });
      return next;
    });
  };
  const updateObs=(cnpj,val)=>{
    setState(prev=>({...prev,[cnpj]:{...prev[cnpj],[mesAtual]:{...prev[cnpj][mesAtual],obs:val}}}));
  };
  const updateMit=(cnpj,val)=>{
    setState(prev=>({...prev,[cnpj]:{...prev[cnpj],[mesAtual]:{...prev[cnpj][mesAtual],mit:val}}}));
  };

  // Stats do mês atual
  const stats=useMemo(()=>{
    let total=0,feitos=0;
    const porResp={};
    users.filter(u=>u.role==="operador").forEach(u=>{porResp[u.name.toUpperCase()]={total:0,feito:0};});
    clientesData.forEach(c=>{
      const ts=getClientTarefas(c);
      total+=ts.length;
      const r=c.responsavel?.toUpperCase();
      if(r&&porResp[r]) porResp[r].total+=ts.length;
      ts.forEach(t=>{
        const v=state[c.cnpj]?.[mesAtual]?.tarefas[t];
        if(isTarefaConcluida(t,v)){feitos++;if(r&&porResp[r])porResp[r].feito++;}
      });
    });
    return{total,feitos,porResp};
  },[state,mesAtual,users,clientesData]);

  const pct=stats.total>0?Math.round((stats.feitos/stats.total)*100):0;

  // Alertas do calendário
  const alertas=useMemo(()=>{
    const [m,a]=mesAtual.split("/").map(Number);
    const alerts=[];
    CALENDARIO_FISCAL.filter(obrig=>obrigacaoAplicaMes(obrig,mesAtual)).forEach(obrig=>{
      const dia=getObrigacaoDia(obrig,mesAtual);
      const dVenc=new Date(a,m-1,dia);
      const diff=Math.ceil((dVenc-hoje)/(1000*60*60*24));
      if(diff>=-3&&diff<=7){
        let tipo="normal";
        if(diff<0) tipo="vencido";
        else if(diff<=3) tipo="urgente";
        else if(diff<=7) tipo="proximo";
        alerts.push({...obrig,dia,diff,tipo,dVenc});
      }
    });
    return alerts.sort((a,b)=>a.diff-b.diff);
  },[mesAtual,hoje]);

  const clientes=useMemo(()=>{
    let list=clientesData;
    if(user?.role==="operador") list=list.filter(c=>c.responsavel?.toUpperCase()===user.name.toUpperCase());
    else if(filtroResp!=="TODOS") list=list.filter(c=>c.responsavel?.toUpperCase()===filtroResp);
    if(filtroGrupo!=="TODOS") list=list.filter(c=>c.grupo===filtroGrupo);
    if(filtroAtividade!=="TODOS") list=list.filter(c=>clienteTemAtividade(c,filtroAtividade));
    if(clientesSomentePendentes) list=list.filter(c=>{
      const ts=getClientTarefas(c);
      const cl=state[c.cnpj]?.[mesAtual];
      return ts.some(t=>!isTarefaConcluida(t,cl?.tarefas[t]));
    });
    if(busca) list=list.filter(c=>c.nome.toLowerCase().includes(busca.toLowerCase())||getClientDoc(c).includes(busca)||String(c.atividade||"").toLowerCase().includes(busca.toLowerCase()));
    return [...list].sort(sortByNome);
  },[filtroResp,filtroGrupo,filtroAtividade,clientesSomentePendentes,busca,user,clientesData,state,mesAtual]);

  // Relatório
  const relData=useMemo(()=>{
    let list=clientesData;
    if(user?.role==="operador") list=list.filter(c=>c.responsavel?.toUpperCase()===user.name.toUpperCase());
    else if(relResp!=="TODOS") list=list.filter(c=>c.responsavel?.toUpperCase()===relResp);
    if(relGrupo!=="TODOS") list=list.filter(c=>c.grupo===relGrupo);
    if(relTarefa!=="TODAS") list=list.filter(c=>getClientTarefas(c).includes(relTarefa));
    const mapped=list.map(c=>{
      const ts=getClientTarefas(c);
      const cl=state[c.cnpj]?.[mesAtual];
      const feito=ts.filter(t=>isTarefaConcluida(t,cl?.tarefas[t])).length;
      const pendentes=ts.filter(t=>!isTarefaConcluida(t,cl?.tarefas[t]));
      return{...c,total:ts.length,feito,pendentes,pct:ts.length>0?Math.round(feito/ts.length*100):0,obs:cl?.obs||"",mit:cl?.mit||""};
    });
    return (relSomentePendentes?mapped.filter(c=>c.pendentes.length>0):mapped).sort(sortByNome);
  },[relResp,relGrupo,relTarefa,relSomentePendentes,mesAtual,state,user,clientesData]);

  const histClientes=useMemo(()=>{
    if(histResp==="TODOS") return [...clientesData].sort(sortByNome);
    return clientesData.filter(c=>c.responsavel?.toUpperCase()===histResp).sort(sortByNome);
  },[clientesData,histResp]);
  const histRespLabel=histResp==="TODOS"?"Todos":users.find(u=>u.name.toUpperCase()===histResp)?.name||histResp;

  const configResponsaveis=useMemo(()=>
    ["TODOS",...Array.from(new Set(clientesData.map(c=>c.responsavel||"").filter(Boolean))).sort()]
  ,[clientesData]);
  const configClientes=useMemo(()=>{
    let list=clientesData;
    if(configClienteRegime!=="TODOS") list=list.filter(c=>c.grupo===configClienteRegime);
    if(configClienteResponsavel!=="TODOS") list=list.filter(c=>(c.responsavel||"")===configClienteResponsavel);
    if(configClienteAtividade!=="TODOS") list=list.filter(c=>clienteTemAtividade(c,configClienteAtividade));
    if(configClienteBusca.trim()){
      const termo=configClienteBusca.trim().toLowerCase();
      list=list.filter(c=>
        c.nome.toLowerCase().includes(termo)||
        getClientDoc(c).toLowerCase().includes(termo)||
        String(c.cod||"").toLowerCase().includes(termo)
      );
    }
    return [...list].sort(sortByNome);
  },[clientesData,configClienteBusca,configClienteRegime,configClienteResponsavel,configClienteAtividade]);
  const conferenciaClientes=useMemo(()=>[...clientesData].sort(sortByNome),[clientesData]);
  const getConferenciaClienteLabel=(c)=>`${c.nome} - ${getClientDoc(c)}`;
  const selectConferenciaCliente=(cnpj,label="")=>{
    setConfClienteCnpj(cnpj);
    setConfClienteBusca(label);
    setConferencia(null);
    setConferenciaErro("");
    if(cnpj) loadClientFiles(cnpj).catch(err=>setConferenciaErro(err?.message||"Não foi possível carregar os arquivos."));
  };
  const handleConferenciaClienteBusca=(value)=>{
    setConfClienteBusca(value);
    const termo=normalizeText(value.trim());
    const cliente=conferenciaClientes.find(c=>
      normalizeText(getConferenciaClienteLabel(c))===termo||
      normalizeText(getClientDoc(c))===termo||
      normalizeText(c.nome)===termo
    );
    selectConferenciaCliente(cliente?.cnpj||"",cliente?getConferenciaClienteLabel(cliente):value);
  };

  const openNewParcForm=()=>{
    setParcForm({...PARC_FORM_INIT,responsavel:user.name});
    setParcClientSearch("");
    setParcFormMode("new");
  };
  const openEditParcForm=(p)=>{
    setParcForm({...p});
    setParcClientSearch("");
    setParcFormMode("edit");
  };
  const saveParcForm=()=>{
    if(!parcForm.empresa.trim())return;
    if(parcFormMode==="new"){
      const newRec={...parcForm,id:`parc_${Date.now()}`};
      setParcelamentos(prev=>[...prev,newRec]);
    } else {
      setParcelamentos(prev=>prev.map(p=>p.id===parcForm.id?{...parcForm}:p));
      setParcSel({...parcForm});
    }
    setParcFormMode(null);
  };
  const addDeletionLog=async(entry:any)=>{
    setDeletionLog(prev=>[{...entry,date:new Date().toISOString()},...prev].slice(0,500));
    try{
      await fetch(apiUrl("/api/deletion-logs"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({entity_type:entry.type,entity_id:entry.cnpj||entry.id||null,entity_name:entry.name,deleted_by:entry.who,details:{cnpj:entry.cnpj,secao:entry.secao,local:entry.local,login:entry.login}})});
    }catch{}
  };
  const openDeletionLog=async()=>{
    setDeletionLogOpen(true);
    setDeletionLogLoading(true);
    try{
      const r=await fetch(apiUrl("/api/deletion-logs"));
      const data=await r.json();
      if(data.ok) setDeletionLogItems(data.logs.map((row:any)=>({type:row.entity_type,name:row.entity_name,who:row.deleted_by,date:row.deleted_at,...JSON.parse(row.details||"{}")})));
    }catch{}finally{setDeletionLogLoading(false);}
  };
  const updateParcMes=(id,key,value)=>setParcelamentos(prev=>prev.map(p=>p.id===id?{...p,[key]:value}:p));
  const confirmDeleteParc=()=>{
    if(parcDeleteSenha!==user.senha){setParcDeleteErr("Senha incorreta.");return;}
    const toDelete=parcelamentos.find(p=>p.id===parcDeleteId);
    if(toDelete) addDeletionLog({type:"parcelamento",name:toDelete.empresa,secao:toDelete.secao,local:toDelete.local,who:user.name});
    setParcelamentos(prev=>prev.filter(p=>p.id!==parcDeleteId));
    if(parcSel?.id===parcDeleteId)setParcSel(null);
    setParcDeleteId(null);setParcDeleteSenha("");setParcDeleteErr("");
  };

  const S={
    page:{minHeight:"100vh",background:"radial-gradient(circle at 18% 0%,#0b6f9f33 0,#0b6f9f00 34%),linear-gradient(145deg,#071527 0%,#0a1b33 48%,#07111f 100%)",fontFamily:"Inter,system-ui,sans-serif",color:"#eef7ff", zoom:1.1},
    header:{background:"linear-gradient(90deg,#0a2442f2,#102f55f2)",borderBottom:"1px solid #185985",padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 10px 30px #02081755",position:"sticky",top:0,zIndex:5},
    card:{background:"linear-gradient(180deg,#102744,#0d2038)",borderRadius:10,padding:20,border:"1px solid #1b5f8d",boxShadow:"0 16px 38px #0208173d"},
    btn:(active)=>({padding:"7px 14px",borderRadius:8,border:active?"1px solid #5bd6ef":"1px solid transparent",cursor:"pointer",fontWeight:700,fontSize:13,background:active?"linear-gradient(135deg,#0077b6,#00b4d8)":"transparent",color:active?"#fff":"#9ed8ed",boxShadow:active?"0 8px 22px #0099cc33":"none"}),
    input:{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #245a7c",background:"#061729",color:"#eef7ff",fontSize:13,boxSizing:"border-box",outlineColor:"#00b4d8"},
    label:{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:5},
    subtle:{color:"#7f9db3",fontSize:11},
  };

  // LOGIN
  if(!user) return(
    <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0a1628 0%,#0f2044 50%,#0a1628 100%)"}}>
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {[...Array(6)].map((_,i)=>(
          <div key={i} style={{position:"absolute",borderRadius:"50%",border:"1px solid #ffffff08",
            width:200+i*120,height:200+i*120,top:"50%",left:"50%",
            transform:`translate(-50%,-50%)`}}/>
        ))}
      </div>
      <div style={{background:"#111d35",borderRadius:20,padding:"40px 36px",width:340,boxShadow:"0 32px 80px #00000066",border:"1px solid #1e3a5f",position:"relative",zIndex:1}}>
        {/* Logo centralizada */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
            <TesseratoLogo size={72}/>
          </div>
          <div style={{fontWeight:800,fontSize:20,color:"#e2eaf8",letterSpacing:2}}>TESSERATO</div>
          <div style={{fontSize:10,color:"#0099cc",letterSpacing:3,fontWeight:600,marginTop:2}}>CONTABILIDADE</div>
          <div style={{marginTop:10,height:1,background:"linear-gradient(90deg,transparent,#1e4a7a,transparent)"}}/>
          <div style={{fontSize:11,color:"#64748b",marginTop:10}}>Controle de Rotinas do Setor Fiscal</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:"#7dd8f0",fontSize:10,display:"block",marginBottom:5,fontWeight:600,letterSpacing:1}}>USUÁRIO</label>
          <input value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="seu login"
            style={{...S.input,background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,padding:"11px 14px",color:"#e2eaf8"}}/>
        </div>
        <div style={{marginBottom:22}}>
          <label style={{color:"#7dd8f0",fontSize:10,display:"block",marginBottom:5,fontWeight:600,letterSpacing:1}}>SENHA</label>
          <div style={{position:"relative"}}>
            <input type={showSenha?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="sua senha"
              style={{...S.input,background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,padding:"11px 44px 11px 14px",color:"#e2eaf8"}}/>
            <button
              type="button"
              onClick={()=>setShowSenha(prev=>!prev)}
              aria-label={showSenha?"Ocultar senha":"Mostrar senha"}
              title={showSenha?"Ocultar senha":"Mostrar senha"}
              style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:30,height:30,display:"inline-flex",alignItems:"center",justifyContent:"center",border:"none",background:"transparent",color:"#7dd8f0",cursor:"pointer",borderRadius:6,padding:0}}
            >
              <EyeIcon hidden={showSenha}/>
            </button>
          </div>
        </div>
        {err&&<div style={{color:"#f87171",fontSize:12,marginBottom:12,textAlign:"center",background:"#450a0a",borderRadius:6,padding:"6px 10px"}}>{err}</div>}
        <button onClick={handleLogin}
          style={{width:"100%",padding:"12px",borderRadius:10,background:"linear-gradient(135deg,#0077b6,#0099cc)",color:"#fff",fontWeight:800,fontSize:14,border:"none",cursor:"pointer",letterSpacing:1,boxShadow:"0 4px 20px #0077b640"}}>
          ENTRAR
        </button>
        <div style={{marginTop:20,padding:"12px 14px",background:"#0a1628",borderRadius:8,border:"1px solid #1e3a5f"}}>
          <div style={{color:"#475569",fontSize:10,marginBottom:6,fontWeight:600}}>USUÁRIOS CADASTRADOS:</div>
          {users.map(u=>(
            <div key={u.id} style={{display:"flex",justifyContent:"space-between",color:"#64748b",fontSize:10,marginBottom:2}}>
              <span style={{color:u.color,fontWeight:600}}>{u.name}</span>
              <span>{u.role==="admin"?"Admin":"Operador"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // DETALHE CLIENTE
  if(clienteSel){
    const c=clienteSel;
    const ts=getClientTarefas(c);
    const cl=state[c.cnpj]?.[mesAtual];
    const feito=ts.filter(t=>isTarefaConcluida(t,cl?.tarefas[t])).length;
    const isRegimeNormal=c.grupo==="normal";
    const arquivosCliente=clientFiles[c.cnpj]||[];
    const mesesRestantes=MESES_HIST.slice(Math.max(0,MESES_HIST.indexOf(mesAtual)));
    const declaracaoAnualEnviada=c.declaracaoAnual&&mesesRestantes.every(m=>
      ts.every(t=>isTarefaConcluida(t,state[c.cnpj]?.[m]?.tarefas[t]))
    );
    return(
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={()=>setClienteSel(null)} style={{background:"#334155",border:"none",color:"#f1f5f9",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12}}>← Voltar</button>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>{c.nome}</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>{getClientDoc(c)} · {c.regime} · {c.atividade}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <select value={mesAtual} onChange={e=>setMesAtual(e.target.value)} style={{...S.input,width:"auto",fontSize:12}}>
              {MESES_HIST.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{background:getUserColor(c.responsavel),color:"#fff",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600}}>{c.responsavel||"—"}</div>
            <button onClick={()=>persistData({manual:true}).catch(()=>setSaveStatus("Não foi possível confirmar no banco."))} style={{background:"#10b981",border:"none",color:"#052e1b",borderRadius:7,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:"pointer"}}>Salvar</button>
          </div>
        </div>
        <div style={{maxWidth:780,margin:"0 auto",padding:20}}>
          <div style={{...S.card,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:600}}>Tarefas — {mesAtual}</div>
              <div style={{fontSize:12,color:feito===ts.length?"#10b981":"#94a3b8"}}>{feito}/{ts.length}</div>
            </div>
            <div style={{background:"#0f172a",borderRadius:6,overflow:"hidden",marginBottom:14}}>
              <div style={{height:5,background:"#10b981",width:`${ts.length>0?Math.round(feito/ts.length*100):0}%`,transition:"width .3s"}}/>
            </div>
            {c.declaracaoAnual&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:declaracaoAnualEnviada?"#0d2d1a":"#1c1009",border:`1px solid ${declaracaoAnualEnviada?"#166534":"#d97706"}`,borderRadius:8,padding:"10px 12px",marginBottom:12,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:declaracaoAnualEnviada?"#86efac":"#fbbf24"}}>Declaração enviada?</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Sim marca este cliente como concluído de {mesAtual} até dezembro.</div>
                </div>
                <button onClick={()=>markDeclaracaoAnualEnviada(c)} disabled={declaracaoAnualEnviada} style={{background:declaracaoAnualEnviada?"#14532d":"#10b981",border:"none",color:declaracaoAnualEnviada?"#bbf7d0":"#052e1b",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:declaracaoAnualEnviada?"default":"pointer"}}>
                  {declaracaoAnualEnviada?"Enviada":"Sim"}
                </button>
              </div>
            )}
            {ts.map(t=>{
              const v=cl?.tarefas[t]||"";
              const isChecklist=isChecklistTarefa(t);
              const checks=getChecklistStatus(v);
              const concluida=isTarefaConcluida(t,v);
              const locked=isTaskLocked(c.cnpj,t,v);
              return(
                <div key={t} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:concluida?"#0d2d1a":"#0f172a",borderRadius:7,border:`1px solid ${locked?"#854d0e":concluida?"#166534":"#334155"}`,marginBottom:7,flexWrap:isChecklist?"wrap":"nowrap",position:"relative"}}>
                  <div style={{minWidth:150,fontSize:13,fontWeight:500}}>{t}</div>
                  {isChecklist?(
                    <div style={{display:"flex",gap:10,flex:1,flexWrap:"wrap",opacity:locked?0.6:1,pointerEvents:locked?"none":"auto"}}>
                      {CHECKLIST_FIELDS.map(field=>(
                        <label key={field.key} style={{display:"flex",alignItems:"center",gap:6,color:checks[field.key]?"#bbf7d0":"#cbd5e1",fontSize:12,fontWeight:600,cursor:locked?"not-allowed":"pointer",background:checks[field.key]?"#14532d":"#1e293b",border:`1px solid ${checks[field.key]?"#16a34a":"#334155"}`,borderRadius:6,padding:"5px 8px"}}>
                          <input type="checkbox" checked={checks[field.key]} onChange={e=>updateChecklistTarefa(c.cnpj,t,field.key,e.target.checked)} disabled={locked}/>
                          {field.label}
                        </label>
                      ))}
                    </div>
                  ):(
                    <input type="date" value={getDateInputValue(v)} onChange={e=>updateTarefa(c.cnpj,t,e.target.value)}
                      onFocus={()=>setFocusedTaskKey(taskKey(c.cnpj,t))}
                      onBlur={()=>setFocusedTaskKey(null)}
                      disabled={locked}
                      style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${locked?"#854d0e":"#334155"}`,color:locked?"#92400e":"#f1f5f9",fontSize:13,padding:"2px 4px",outline:"none",cursor:locked?"not-allowed":"text"}}/>
                  )}
                  {concluida&&!locked&&<span style={{color:"#10b981",fontSize:11,fontWeight:800}}>OK</span>}
                  {locked&&(
                    <button
                      title="Tarefa bloqueada — clique para desbloquear"
                      onClick={()=>{setUnlockModal({cnpj:c.cnpj,empresa:c.nome,tarefa:t,isChecklist});setUnlockOldValue(getDateInputValue(v));setUnlockOldChecks({...checks});setUnlockNewValue(getDateInputValue(v));setUnlockNewChecks({...checks});setUnlockMotivo("");setUnlockErr("");}}
                      style={{background:"#78350f",border:"1px solid #d97706",color:"#fde68a",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      🔒 Desbloquear
                    </button>
                  )}
                  {!locked&&concluida&&(
                    <span style={{background:"#14532d",border:"1px solid #16a34a",color:"#86efac",borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:700,flexShrink:0}}>
                      🔓 Desbloqueada
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:isRegimeNormal?"1fr 1.4fr":"1fr",gap:14,marginBottom:14}}>
            {isRegimeNormal&&(
            <div style={S.card}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>MIT (Data envio)</div>
              <input value={cl?.mit||""} onChange={e=>updateMit(c.cnpj,e.target.value)} placeholder="dd.mm.aaaa" style={S.input}/>
            </div>
            )}
            <div style={S.card}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>Observações</div>
              <textarea value={cl?.obs||""} onChange={e=>updateObs(c.cnpj,e.target.value)} placeholder="Anotações e pendências..." style={{...S.input,minHeight:118,resize:"vertical",lineHeight:1.45}}/>
            </div>
          </div>
          <div style={{...S.card,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:10,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>Planilhas DTE armazenadas</div>
                <div style={S.subtle}>Arquivos usados na conferência deste cliente. Sem pré-visualização.</div>
              </div>
              <label style={{background:"#1e40af",color:"#dbeafe",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                Enviar planilha
                <input type="file" accept=".xls,.xlsx" onChange={e=>{uploadClientFile(e.target.files?.[0]);e.target.value="";}} style={{display:"none"}}/>
              </label>
            </div>
            {clientFileMsg&&<div style={{fontSize:11,color:clientFileMsg.includes("salvo")?"#86efac":"#fbbf24",marginBottom:8}}>{clientFileMsg}</div>}
            {clientFilesLoading?(
              <div style={{color:"#64748b",fontSize:12}}>Carregando arquivos...</div>
            ):arquivosCliente.length===0?(
              <div style={{color:"#64748b",fontSize:12}}>Nenhuma planilha armazenada para este cliente.</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {arquivosCliente.map(file=>(
                  <div key={file.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:10,alignItems:"center",background:"#0f172a",border:"1px solid #334155",borderRadius:7,padding:"8px 10px"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{file.name}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>Cliente: {getClientDoc(c)}</div>
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>{formatFileSize(file.size)}</div>
                    <div style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>{formatFileDate(file.uploaded_at)}</div>
                    <button onClick={()=>deleteClientFile(file)} style={{background:"#7f1d1d",border:"1px solid #b91c1c",color:"#fecaca",borderRadius:6,padding:"5px 9px",fontSize:11,fontWeight:800,cursor:"pointer"}}>Excluir</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Histórico do cliente */}
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:12,fontSize:13}}>Histórico Mensal</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {MESES_HIST.map(m=>{
                const tss=getClientTarefas(c);
                const clm=state[c.cnpj]?.[m];
                const f=tss.filter(t=>isTarefaConcluida(t,clm?.tarefas[t])).length;
                const p=tss.length>0?Math.round(f/tss.length*100):0;
                const isCur=m===mesAtual;
                return(
                  <div key={m} onClick={()=>setMesAtual(m)} style={{background:isCur?"#1e40af":"#0f172a",borderRadius:8,padding:10,cursor:"pointer",border:`1px solid ${isCur?"#3b82f6":"#334155"}`,textAlign:"center"}}>
                    <div style={{fontSize:11,color:isCur?"#93c5fd":"#94a3b8",marginBottom:4}}>{m}</div>
                    <div style={{fontSize:18,fontWeight:700,color:p===100?"#10b981":p>0?"#f59e0b":"#475569"}}>{p}%</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{f}/{tss.length}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      {unlockModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setUnlockModal(null);setUnlockMotivo("");setUnlockOldValue("");setUnlockOldChecks({});setUnlockNewValue("");setUnlockNewChecks({});setUnlockErr("");}}>
          <div style={{background:"#1a0a00",border:"1px solid #d97706",borderRadius:14,padding:28,width:"100%",maxWidth:440,boxShadow:"0 32px 80px #00000099"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:20,marginBottom:6}}>🔒</div>
            <div style={{fontWeight:800,fontSize:15,color:"#fde68a",marginBottom:4}}>Desbloquear tarefa</div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>
              <span style={{color:"#fbbf24",fontWeight:700}}>{unlockModal.tarefa}</span> — {unlockModal.empresa}<br/>
              <span style={{color:"#64748b",fontSize:11}}>Competência: {mesAtual}</span>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"#d97706",fontWeight:700,display:"block",marginBottom:6}}>Nova informação *</label>
              {unlockModal?.isChecklist?(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {CHECKLIST_FIELDS.map(field=>(
                    <label key={field.key} style={{display:"flex",alignItems:"center",gap:6,color:unlockNewChecks[field.key]?"#bbf7d0":"#cbd5e1",fontSize:12,fontWeight:600,cursor:"pointer",background:unlockNewChecks[field.key]?"#14532d":"#1e293b",border:`1px solid ${unlockNewChecks[field.key]?"#16a34a":"#334155"}`,borderRadius:6,padding:"5px 8px"}}>
                      <input type="checkbox" checked={!!unlockNewChecks[field.key]} onChange={e=>setUnlockNewChecks(prev=>({...prev,[field.key]:e.target.checked}))}/>
                      {field.label}
                    </label>
                  ))}
                </div>
              ):(
                <input type="date" autoFocus value={unlockNewValue} onChange={e=>{setUnlockNewValue(e.target.value);setUnlockErr("");}} style={{...S.input,borderColor:"#d97706"}}/>
              )}
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"#d97706",fontWeight:700,display:"block",marginBottom:6}}>Motivo da alteração *</label>
              <textarea rows={3} value={unlockMotivo} onChange={e=>{setUnlockMotivo(e.target.value);setUnlockErr("");}} placeholder="Descreva o motivo da alteração..." style={{...S.input,resize:"vertical" as const,lineHeight:1.45,borderColor:"#d97706"}}/>
              {unlockErr&&<div style={{fontSize:11,color:"#f87171",marginTop:4}}>{unlockErr}</div>}
            </div>
            <div style={{fontSize:10,color:"#78350f",background:"#1c0a00",border:"1px solid #78350f",borderRadius:6,padding:"7px 10px",marginBottom:16}}>
              ⚠️ Esta ação ficará registrada no log com seu nome, data e horário.
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setUnlockModal(null);setUnlockMotivo("");setUnlockOldValue("");setUnlockOldChecks({});setUnlockNewValue("");setUnlockNewChecks({});setUnlockErr("");}} style={{background:"#334155",border:"none",color:"#94a3b8",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              <button onClick={confirmUnlock} style={{background:"#d97706",border:"none",color:"#fff",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Salvar alteração</button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  // MAIN
  return(
    <div style={S.page}>
      {/* Toast de conclusão do T-SIGA */}
      {botSigaToast&&(
        <div onClick={()=>setBotSigaToast(null)} style={{position:"fixed",bottom:28,right:28,zIndex:9999,minWidth:300,maxWidth:420,padding:"16px 20px",borderRadius:12,background:botSigaToast.ok?"#052e16":"#450a0a",border:`2px solid ${botSigaToast.ok?"#16a34a":"#dc2626"}`,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:14,animation:"fadeInUp 0.3s ease"}}>
          <span style={{fontSize:26,lineHeight:1}}>{botSigaToast.ok?"✅":"❌"}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:botSigaToast.ok?"#4ade80":"#f87171",marginBottom:4}}>T-SIGA</div>
            <div style={{fontSize:13,color:botSigaToast.ok?"#86efac":"#fca5a5",lineHeight:1.4}}>{botSigaToast.msg}</div>
            <div style={{fontSize:10,color:"#64748b",marginTop:6}}>Clique para fechar</div>
          </div>
        </div>
      )}
      <div style={S.header}>        <TesseratoLogo size={34}/>
        <div style={{marginRight:8}}>
          <div style={{fontWeight:700,fontSize:15}}>Setor Fiscal</div>
          <div style={{fontSize:10,color:"#7dd8f0",letterSpacing:1}}>Tesserato Contabilidade</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {(user.role==="admin"
            ?["intranet","dashboard","clientes","calendario","conferencia","relatorios","historico","cadastros","parcelamentos","ferramentas","parametros"]
            :(user.pages?.length>0?user.pages:["intranet","dashboard","clientes","calendario","conferencia","relatorios","historico","cadastros","parcelamentos","ferramentas","parametros"])
          ).map(p=>{
            const lbl:Record<string,string>={intranet:"Intranet",dashboard:"Dashboard",clientes:"Clientes",calendario:"Calendário",conferencia:"Conferência",relatorios:"Relatórios",historico:"Histórico",cadastros:"Empresas",parcelamentos:"Parcelamentos",ferramentas:"⚙ Ferramentas",parametros:"Parâmetros"};
            return(<button key={p} onClick={()=>setPage(p)} style={S.btn(page===p)}>{lbl[p]||p}</button>);
          })}
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <select value={mesAtual} onChange={e=>setMesAtual(e.target.value)} style={{...S.input,width:"auto",fontSize:11,padding:"4px 8px"}}>
            {MESES_HIST.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <span
            title={agenteConectado?"Agente conectado — bots rodam neste PC":"Agente desconectado — inicie o FiscalAgente no seu PC"}
            style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:agenteConectado?"#4ade80":"#f87171",cursor:"default",userSelect:"none" as any}}
          >
            <span style={{fontSize:9}}>{agenteConectado?"●":"○"}</span>
            {agenteConectado?"Agente online":"Agente offline"}
          </span>
          <div style={{width:7,height:7,borderRadius:"50%",background:getUserColor(user.name)}}/>
          <span style={{fontSize:12}}>{user.name}</span>
          <span title={saveStatus} style={{fontSize:10,color:saveStatus.includes("salvas")||saveStatus.includes("carregados")||saveStatus.includes("iniciado")?"#7dd8f0":saveStatus.includes("Salvando")?"#fbbf24":"#fca5a5",maxWidth:190,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{saveStatus}</span>
          <button onClick={()=>setUser(null)} style={{background:"#334155",border:"none",color:"#94a3b8",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Sair</button>
        </div>
      </div>

      <div style={page==="parcelamentos"
        ?{height:"calc(100vh - 60px)",display:"flex",flexDirection:"column",overflow:"hidden",padding:"16px 20px",boxSizing:"border-box" as const}
        :page==="roboiss"
        ?{maxWidth:1600,margin:"0 auto",padding:20}
        :{maxWidth:1100,margin:"0 auto",padding:20}
      }>

        {/* INTRANET */}
        {page==="intranet"&&(()=>{
          const DIAS_SEMANA=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
          const MESES_NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
          const pad=(n:number)=>String(n).padStart(2,"0");
          const toKey=(y:number,m:number,d:number)=>`${y}-${pad(m+1)}-${pad(d)}`;
          const todayKey=toKey(hoje.getFullYear(),hoje.getMonth(),hoje.getDate());
          const firstDay=new Date(agendaYear,agendaMonth,1).getDay();
          const daysInMonth=new Date(agendaYear,agendaMonth+1,0).getDate();
          const itemsByDay:Record<string,any[]>={};
          agendaItems.forEach(item=>{
            const k=item.data_compromisso?.slice(0,10);
            if(k){if(!itemsByDay[k])itemsByDay[k]=[];itemsByDay[k].push(item);}
          });
          const todayObj=new Date(todayKey+"T00:00:00");
          const reminders=agendaItems.filter(item=>{
            if(item.status==="cancelado"||item.status==="concluido") return false;
            const d=new Date(item.data_compromisso+"T00:00:00");
            const diff=Math.floor((d.getTime()-todayObj.getTime())/(1000*60*60*24));
            return diff>=0&&diff<=3;
          }).sort((a,b)=>a.data_compromisso.localeCompare(b.data_compromisso));
          const STATUS_LABEL:Record<string,string>={pendente:"Pendente",concluido:"Concluído",cancelado:"Cancelado"};
          const STATUS_COLOR:Record<string,string>={pendente:"#f59e0b",concluido:"#10b981",cancelado:"#6b7280"};
          const openNewForm=(dayKey:string)=>{
            setAgendaEditItem(null);
            setAgendaForm({...agendaFormInit,data_compromisso:dayKey});
            setAgendaFormErr("");
            setAgendaFormModal(true);
          };
          const openEditForm=(item:any)=>{
            setAgendaEditItem(item);
            setAgendaForm({titulo:item.titulo,descricao:item.descricao||"",data_compromisso:item.data_compromisso,hora_compromisso:item.hora_compromisso||"",status:item.status||"pendente",lembrete_3_dias:!!item.lembrete_3_dias});
            setAgendaFormErr("");
            setAgendaFormModal(true);
          };
          const handleSaveForm=async()=>{
            if(!agendaForm.titulo.trim()){setAgendaFormErr("Título obrigatório.");return;}
            if(!agendaForm.data_compromisso){setAgendaFormErr("Data obrigatória.");return;}
            setAgendaSaving(true);setAgendaFormErr("");
            try{
              let ok=false;
              if(agendaEditItem){ok=await agendaUpdate(agendaEditItem.id,agendaForm);}
              else{ok=await agendaCreate(agendaForm);}
              if(ok){setAgendaFormModal(false);setAgendaEditItem(null);}
              else{setAgendaFormErr("Não foi possível salvar.");}
            }finally{setAgendaSaving(false);}
          };
          const handleDelete=async(id:number)=>{
            if(!confirm("Excluir este compromisso?")) return;
            await agendaDelete(id);
          };
          const selDayItems=agendaSelDay?itemsByDay[agendaSelDay]||[]:[];
          const cells:Array<{key:string,day:number}|null>=[];
          for(let i=0;i<firstDay;i++) cells.push(null);
          for(let d=1;d<=daysInMonth;d++) cells.push({key:toKey(agendaYear,agendaMonth,d),day:d});
          return(
          <>
            {appSettings.dashboardAnnouncement.trim()&&(
              <div style={{background:"linear-gradient(135deg,#0f2f1d,#123a5a)",border:"1px solid #10b981",borderRadius:10,padding:"14px 16px",marginBottom:20,boxShadow:"0 16px 38px #0208173d"}}>
                <div style={{fontSize:11,fontWeight:900,color:"#86efac",textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Comunicado</div>
                <div style={{fontSize:15,fontWeight:700,color:"#eef7ff",whiteSpace:"pre-wrap",lineHeight:1.45}}>{appSettings.dashboardAnnouncement.trim()}</div>
              </div>
            )}
            <div style={{fontWeight:800,fontSize:10,color:"#7dd8f0",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Links Úteis</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
              {[
                {title:"Tax Prático",url:"https://taxpratico.com.br/"},
                {title:"IOB Online",url:"https://www.iobonline.com.br/index/login"},
                {title:"Zap Contábil",url:"https://tesserato.zapcontabil.chat/contacts"},
                {title:"GClick",url:"https://appp.gclick.com.br/autenticacao"},
                {title:"eContador Alterdata",url:"https://econtador.alterdata.com.br/"},
                {title:"Webmail",url:"https://webmail-seguro.com.br/v2/?_task=mail&_mbox=INBOX"},
                {title:"CAV Receita Federal",url:"https://cav.receita.fazenda.gov.br/autenticacao/login"},
                {title:"SIGA SEFAZ CE",url:"https://siga.sefaz.ce.gov.br/ui/selecao-contribuinte/monitoramento"},
                {title:"NFStock Alterdata",url:"https://nfstock.alterdata.com.br/"},
                {title:"Nutror",url:"https://accounts.eduzz.com/sso/login?redirectTo=app.nutror.com"},
              ].map(link=>(
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{background:"#071929",border:"1px solid #1b4a6e",borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,textDecoration:"none",color:"#eef7ff",cursor:"pointer",transition:"border-color .15s,background .15s",overflow:"hidden"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="#00b4d8";(e.currentTarget as HTMLAnchorElement).style.background="#091e30";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="#1b4a6e";(e.currentTarget as HTMLAnchorElement).style.background="#071929";}}
                >
                  <div style={{width:36,height:36,borderRadius:8,background:"#0d2540",border:"1px solid #1e4a72",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CardLogo title={link.title}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{link.title}</div>
                    <div style={{fontSize:10,color:"#4a8aaa",marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{new URL(link.url).hostname.replace(/^www\./,"")}</div>
                  </div>
                  <svg style={{flexShrink:0,color:"#3a6a8a"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ))}
            </div>

            {/* AGENDA */}
            <div style={{marginTop:32}}>
              <div style={{fontWeight:800,fontSize:10,color:"#7dd8f0",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Minha Agenda</div>

              {/* Lembretes próximos */}
              {reminders.length>0&&(
                <div style={{background:"linear-gradient(135deg,#1a1000,#1a2200)",border:"1px solid #f59e0b",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:900,color:"#fbbf24",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    Lembretes — próximos 3 dias
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {reminders.map(item=>{
                      const d=new Date(item.data_compromisso+"T00:00:00");
                      const diff=Math.floor((d.getTime()-todayObj.getTime())/(1000*60*60*24));
                      const label=diff===0?"Hoje":diff===1?"Amanhã":`Em ${diff} dias`;
                      return(
                        <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,background:"#1f1200",borderRadius:7,padding:"7px 12px",border:"1px solid #78350f"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:STATUS_COLOR[item.status]||"#f59e0b",flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <span style={{fontWeight:700,fontSize:13,color:"#fef3c7"}}>{item.titulo}</span>
                            {item.hora_compromisso&&<span style={{fontSize:11,color:"#d97706",marginLeft:6}}>{item.hora_compromisso}</span>}
                          </div>
                          <div style={{fontSize:11,fontWeight:700,color:"#fbbf24",whiteSpace:"nowrap"}}>{label}</div>
                          <div style={{fontSize:11,color:STATUS_COLOR[item.status],whiteSpace:"nowrap"}}>{STATUS_LABEL[item.status]||item.status}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Calendário */}
              <div style={{background:"#071929",border:"1px solid #1b4a6e",borderRadius:12,padding:20}}>
                {/* Header navegação */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <button onClick={()=>{
                    let m=agendaMonth-1,y=agendaYear;
                    if(m<0){m=11;y--;}
                    setAgendaMonth(m);setAgendaYear(y);setAgendaSelDay(null);setAgendaDayModal(false);
                  }} style={{background:"#0d2540",border:"1px solid #1b4a6e",color:"#7dd8f0",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:15,fontWeight:700}}>‹</button>
                  <div style={{fontWeight:800,fontSize:16,color:"#eef7ff"}}>{MESES_NOMES[agendaMonth]} {agendaYear}</div>
                  <button onClick={()=>{
                    let m=agendaMonth+1,y=agendaYear;
                    if(m>11){m=0;y++;}
                    setAgendaMonth(m);setAgendaYear(y);setAgendaSelDay(null);setAgendaDayModal(false);
                  }} style={{background:"#0d2540",border:"1px solid #1b4a6e",color:"#7dd8f0",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:15,fontWeight:700}}>›</button>
                </div>

                {/* Cabeçalho dias da semana */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
                  {DIAS_SEMANA.map(d=>(
                    <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#4a8aaa",padding:"4px 0"}}>{d}</div>
                  ))}
                </div>

                {/* Grade de dias */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {cells.map((cell,i)=>{
                    if(!cell) return <div key={`empty-${i}`}/>;
                    const isToday=cell.key===todayKey;
                    const isSel=cell.key===agendaSelDay;
                    const hasItems=!!(itemsByDay[cell.key]?.length);
                    const hasReminder=itemsByDay[cell.key]?.some(it=>it.status==="pendente"&&(()=>{const d=new Date(it.data_compromisso+"T00:00:00");const diff=Math.floor((d.getTime()-todayObj.getTime())/(1000*60*60*24));return diff>=0&&diff<=3;})());
                    return(
                      <div key={cell.key} onClick={()=>{
                        setAgendaSelDay(cell.key);
                        setAgendaDayModal(true);
                      }} style={{
                        borderRadius:8,
                        padding:"8px 4px 6px",
                        textAlign:"center",
                        cursor:"pointer",
                        background:isSel?"#0d3a5a":isToday?"#0d2540":"transparent",
                        border:isSel?"1px solid #00b4d8":isToday?"1px solid #1e5a8a":"1px solid transparent",
                        transition:"background .12s,border-color .12s",
                        minHeight:54,
                        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      }}
                      onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background="#0a1e30";}}
                      onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background=isToday?"#0d2540":"transparent";}}
                      >
                        <span style={{fontSize:13,fontWeight:isToday?800:500,color:isToday?"#7dd8f0":isSel?"#eef7ff":"#94a3b8"}}>{cell.day}</span>
                        {hasItems&&(
                          <div style={{display:"flex",gap:2,flexWrap:"wrap",justifyContent:"center"}}>
                            {(itemsByDay[cell.key]||[]).slice(0,3).map(it=>(
                              <div key={it.id} style={{width:6,height:6,borderRadius:"50%",background:hasReminder&&it.status==="pendente"?"#f59e0b":STATUS_COLOR[it.status]||"#00b4d8"}}/>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legenda */}
                <div style={{display:"flex",gap:14,marginTop:14,flexWrap:"wrap"}}>
                  {[{color:"#f59e0b",label:"Pendente (≤3 dias)"},{color:"#10b981",label:"Concluído"},{color:"#00b4d8",label:"Pendente"},{color:"#6b7280",label:"Cancelado"}].map(l=>(
                    <div key={l.label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:l.color}}/>
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal do dia selecionado */}
              {agendaDayModal&&agendaSelDay&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setAgendaDayModal(false);setAgendaSelDay(null);}}>
                  <div style={{background:"#071929",border:"1px solid #1b4a6e",borderRadius:12,padding:24,width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:"#eef7ff"}}>
                          {(()=>{const[y,m,d]=agendaSelDay.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});})()}
                        </div>
                        <div style={{fontSize:11,color:"#4a8aaa",marginTop:2}}>{selDayItems.length} compromisso(s)</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{setAgendaDayModal(false);openNewForm(agendaSelDay);}} style={{background:"linear-gradient(135deg,#0077b6,#00b4d8)",border:"none",color:"#fff",borderRadius:7,padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>+ Novo</button>
                        <button onClick={()=>{setAgendaDayModal(false);setAgendaSelDay(null);}} style={{background:"#0d2540",border:"1px solid #1b4a6e",color:"#94a3b8",borderRadius:7,padding:"7px 12px",cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    </div>
                    {selDayItems.length===0?(
                      <div style={{textAlign:"center",color:"#4a8aaa",fontSize:13,padding:"24px 0"}}>Nenhum compromisso neste dia.<br/><span style={{fontSize:12}}>Clique em "+ Novo" para adicionar.</span></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {selDayItems.map(item=>(
                          <div key={item.id} style={{background:"#0d2540",border:"1px solid #1b4a6e",borderRadius:9,padding:"12px 14px"}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                                  <div style={{width:7,height:7,borderRadius:"50%",background:STATUS_COLOR[item.status]||"#00b4d8",flexShrink:0}}/>
                                  <span style={{fontWeight:700,fontSize:14,color:"#eef7ff"}}>{item.titulo}</span>
                                </div>
                                {item.hora_compromisso&&<div style={{fontSize:11,color:"#7dd8f0",marginBottom:3}}>🕐 {item.hora_compromisso}</div>}
                                {item.descricao&&<div style={{fontSize:12,color:"#94a3b8",marginBottom:4,whiteSpace:"pre-wrap"}}>{item.descricao}</div>}
                                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                                  <span style={{fontSize:11,color:STATUS_COLOR[item.status],fontWeight:700}}>{STATUS_LABEL[item.status]||item.status}</span>
                                  {item.lembrete_3_dias?<span style={{fontSize:10,color:"#f59e0b",background:"#1f1200",border:"1px solid #78350f",borderRadius:4,padding:"1px 5px"}}>Lembrete ativo</span>:null}
                                </div>
                              </div>
                              <div style={{display:"flex",gap:6,flexShrink:0}}>
                                <button onClick={()=>{setAgendaDayModal(false);openEditForm(item);}} style={{background:"#1e40af",border:"none",color:"#dbeafe",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer"}}>Editar</button>
                                <button onClick={()=>handleDelete(item.id)} style={{background:"#7f1d1d",border:"none",color:"#fca5a5",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer"}}>Excluir</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal de formulário (novo / editar) */}
              {agendaFormModal&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1010,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setAgendaFormModal(false);setAgendaEditItem(null);}}>
                  <div style={{background:"#071929",border:"1px solid #1b4a6e",borderRadius:12,padding:24,width:"100%",maxWidth:460}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:800,fontSize:15,color:"#eef7ff",marginBottom:18}}>{agendaEditItem?"Editar Compromisso":"Novo Compromisso"}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div>
                        <div style={{fontSize:11,color:"#7dd8f0",fontWeight:700,marginBottom:4}}>Título *</div>
                        <input value={agendaForm.titulo} onChange={e=>setAgendaForm((p:any)=>({...p,titulo:e.target.value}))} style={{...S.input,width:"100%",boxSizing:"border-box" as const}} placeholder="Título do compromisso"/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        <div>
                          <div style={{fontSize:11,color:"#7dd8f0",fontWeight:700,marginBottom:4}}>Data *</div>
                          <input type="date" value={agendaForm.data_compromisso} onChange={e=>setAgendaForm((p:any)=>({...p,data_compromisso:e.target.value}))} style={{...S.input,width:"100%",boxSizing:"border-box" as const}}/>
                        </div>
                        <div>
                          <div style={{fontSize:11,color:"#7dd8f0",fontWeight:700,marginBottom:4}}>Horário</div>
                          <input type="time" value={agendaForm.hora_compromisso} onChange={e=>setAgendaForm((p:any)=>({...p,hora_compromisso:e.target.value}))} style={{...S.input,width:"100%",boxSizing:"border-box" as const}}/>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:"#7dd8f0",fontWeight:700,marginBottom:4}}>Descrição</div>
                        <textarea value={agendaForm.descricao} onChange={e=>setAgendaForm((p:any)=>({...p,descricao:e.target.value}))} rows={3} style={{...S.input,width:"100%",boxSizing:"border-box" as const,resize:"vertical" as const}} placeholder="Detalhes do compromisso..."/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"end"}}>
                        <div>
                          <div style={{fontSize:11,color:"#7dd8f0",fontWeight:700,marginBottom:4}}>Status</div>
                          <select value={agendaForm.status} onChange={e=>setAgendaForm((p:any)=>({...p,status:e.target.value}))} style={{...S.input,width:"100%",boxSizing:"border-box" as const}}>
                            <option value="pendente">Pendente</option>
                            <option value="concluido">Concluído</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none" as const,paddingBottom:1}}>
                          <input type="checkbox" checked={agendaForm.lembrete_3_dias} onChange={e=>setAgendaForm((p:any)=>({...p,lembrete_3_dias:e.target.checked}))} style={{width:14,height:14,accentColor:"#f59e0b"}}/>
                          <span style={{fontSize:12,color:"#d97706",fontWeight:600}}>Lembrete 3 dias antes</span>
                        </label>
                      </div>
                    </div>
                    {agendaFormErr&&<div style={{marginTop:10,fontSize:12,color:"#fca5a5",fontWeight:600}}>{agendaFormErr}</div>}
                    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
                      <button onClick={()=>{setAgendaFormModal(false);setAgendaEditItem(null);}} style={{background:"#0d2540",border:"1px solid #1b4a6e",color:"#94a3b8",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Cancelar</button>
                      <button onClick={handleSaveForm} disabled={agendaSaving} style={{background:"linear-gradient(135deg,#0077b6,#00b4d8)",border:"none",color:"#fff",borderRadius:7,padding:"8px 20px",cursor:"pointer",fontWeight:700,fontSize:13,opacity:agendaSaving?0.7:1}}>{agendaSaving?"Salvando...":"Salvar"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
          );
        })()}

        {/* FERRAMENTAS */}
        {page==="ferramentas"&&(()=>{
          const fmtCnpj=(v:string)=>{const d=v.replace(/\D/g,"");if(d.length===14)return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,"$1.$2.$3/$4-$5");return v;};
          const getIssStatus=(c:any)=>{
            const issVal=state[c.cnpj]?.[mesAtual]?.tarefas?.["ISS"];
            if(issVal&&typeof issVal==="string"&&issVal.trim()){
              const d=new Date(issVal);
              const label=!isNaN(d.getTime())?d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}):issVal;
              return{done:true,label:`Concluído ${label}`};
            }
            return{done:false,label:"Pendente"};
          };

          // lista de clientes para cada robô (sempre filtrada por responsável)
          const allClientes=clientesData.filter(c=>user.role==="admin"||(c.responsavel||"").toUpperCase()===(user.name||"").toUpperCase());
          const issClientes=allClientes.filter(c=>!!c.enviaIss);
          const sigaClientes=allClientes.filter(c=>!!c.confereSiga);
          const meiClientes=allClientes.filter(c=>(c.regime||"").toLowerCase()==="mei");
          const listaAtual=ferramentasRobo==="iss"?issClientes:ferramentasRobo==="siga"?sigaClientes:ferramentasRobo==="mei"?meiClientes:allClientes;

          const q=(roboissSearch||"").trim().toLowerCase();
          const filtrados=listaAtual.filter(c=>{
            if(!q)return true;
            const nome=(c.nome||"").toLowerCase();
            const cnpjRaw=(c.cnpj||"").replace(/\D/g,"");
            const qRaw=q.replace(/\D/g,"");
            return nome.includes(q)||(qRaw.length>0&&cnpjRaw.includes(qRaw));
          });

          const allSelected=filtrados.length>0&&filtrados.every(c=>roboissQueue.has(c.cnpj));
          const toggleAll=()=>{
            const next=new Set(roboissQueue);
            if(allSelected){filtrados.forEach(c=>next.delete(c.cnpj));}
            else{filtrados.forEach(c=>next.add(c.cnpj));}
            setRoboissQueue(next);
          };
          const toggleOne=(cnpj:string)=>{
            const next=new Set(roboissQueue);
            next.has(cnpj)?next.delete(cnpj):next.add(cnpj);
            setRoboissQueue(next);
          };

          const anyBotRunning=roboissRunning||botSigaRunning||botMeiRunning;
          const activeRunning=ferramentasRobo==="iss"?roboissRunning:ferramentasRobo==="siga"?botSigaRunning:botMeiRunning;
          const activeLog=ferramentasRobo==="iss"?roboissLog:ferramentasRobo==="siga"?botSigaLog:botMeiLog;
          const activeResult=ferramentasRobo==="iss"?roboissResult:ferramentasRobo==="siga"?botSigaResult:botMeiResult;
          const activeLogRef=ferramentasRobo==="iss"?roboissLogRef:ferramentasRobo==="siga"?sigaLogRef:meiLogRef;
          const clearActiveLog=()=>{
            if(ferramentasRobo==="iss"){setRoboissLog([]);setRoboissResult(null);}
            else if(ferramentasRobo==="siga"){setBotSigaLog([]);setBotSigaResult(null);}
            else{setBotMeiLog([]);setBotMeiResult(null);}
          };

          const botCards=[
            {id:"iss" as const,label:"T-ISS",desc:"ISS Municipal",color:"#7dd8f0",running:roboissRunning},
            {id:"siga" as const,label:"T-SIGA",desc:"SEFAZ SIGA",color:"#a78bfa",running:botSigaRunning},
            {id:"mei" as const,label:"T-MEI",desc:"Portal MEI",color:"#6ee7b7",running:botMeiRunning},
          ];

          const handleRun=async()=>{
            if(activeRunning||roboissQueue.size===0)return;
            const selected=filtrados.filter(c=>roboissQueue.has(c.cnpj));
            if(ferramentasRobo==="iss"){
              setRoboissRunning(true);setRoboissResult(null);setRoboissLog([]);
              try{
                const empresasIss=selected.map(c=>({cnpj:c.cnpj,nome:c.nome,login:c.loginIss||"",senha:c.senhaIss||"",municipio:c.municipio||"",email:c.emailEnvioIss||""}));
                const r=await fetch(apiUrl("/api/bot-iss/run"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({empresas:empresasIss,operadorId:user?.id})});
                const d=await r.json();
                if(!d.ok){setRoboissRunning(false);alert(d.error||"Erro ao iniciar o bot.");}
              }catch{setRoboissRunning(false);alert("Erro de conexão.");}
            } else if(ferramentasRobo==="siga"){
              setBotSigaRunning(true);setBotSigaResult(null);setBotSigaLog([]);
              try{
                const empresas=selected.map(c=>({cnpj:c.cnpj,nome:c.nome}));
                const r=await fetch(apiUrl("/api/bot-siga/run"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({empresas,operadorId:user?.id})});
                const d=await r.json();
                if(!d.ok){setBotSigaRunning(false);alert(d.error||"Erro ao iniciar o bot.");}
              }catch{setBotSigaRunning(false);alert("Erro de conexão.");}
            } else {
              setBotMeiRunning(true);setBotMeiResult(null);setBotMeiLog([]);
              try{
                const empresas=selected.map(c=>({cnpj:c.cnpj,nome:c.nome}));
                const r=await fetch(apiUrl("/api/bot-mei/run"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({empresas,operadorId:user?.id})});
                const d=await r.json();
                if(!d.ok){setBotMeiRunning(false);alert(d.error||"Erro ao iniciar o bot.");}
              }catch{setBotMeiRunning(false);alert("Erro de conexão.");}
            }
          };

          const activeCard=botCards.find(b=>b.id===ferramentasRobo)!;
          const canRun=!activeRunning&&roboissQueue.size>0&&algumAgenteConectado;

          return(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* ── Seletor de robô ── */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {botCards.map(bc=>{
                  const active=ferramentasRobo===bc.id;
                  const listLen=bc.id==="iss"?issClientes.length:bc.id==="siga"?sigaClientes.length:meiClientes.length;
                  return(
                    <div key={bc.id} onClick={()=>setFerramentasRobo(bc.id)}
                      style={{position:"relative",background:active?"#071929":"#060f1e",border:`1.5px solid ${active?bc.color:"#1a2f45"}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"border-color .15s,background .15s",overflow:"hidden"}}
                    >
                      <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:active?bc.color:"transparent",borderRadius:"12px 12px 0 0",transition:"background .15s"}}/>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontWeight:700,fontSize:18,color:active?bc.color:"#475569",letterSpacing:0.5,transition:"color .15s"}}>{bc.label}</div>
                        {bc.running?(
                          <span style={{fontSize:9,fontWeight:700,color:"#fbbf24",background:"rgba(146,64,14,0.35)",border:"1px solid #92400e",borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap"}}>RODANDO</span>
                        ):(
                          <span style={{fontSize:10,color:active?"#475569":"#2d4a63",fontWeight:600}}>{listLen} empresa{listLen!==1?"s":""}</span>
                        )}
                      </div>
                      <div style={{fontSize:11,color:active?"#64748b":"#2d4a63",letterSpacing:0.2}}>{bc.desc}</div>
                      {active&&roboissQueue.size>0&&(
                        <div style={{marginTop:8,fontSize:10,color:bc.color,fontWeight:600}}>{roboissQueue.size} selecionada{roboissQueue.size!==1?"s":""}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Barra de ações ── */}
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{position:"relative",flex:"1 1 220px",minWidth:180}}>
                  <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#475569",fontSize:13,pointerEvents:"none"}}>⌕</span>
                  <input
                    value={roboissSearch}
                    onChange={e=>setRoboissSearch(e.target.value)}
                    placeholder="Buscar empresa ou CNPJ…"
                    style={{...S.input,width:"100%",paddingLeft:28,fontSize:12,boxSizing:"border-box"}}
                  />
                </div>
                <button
                  onClick={()=>{const next=new Set<string>();filtrados.forEach(c=>next.add(c.cnpj));setRoboissQueue(next);}}
                  style={{background:"#071929",border:"1px solid #1a2f45",borderRadius:7,color:"#64748b",fontSize:11,padding:"6px 12px",cursor:"pointer",whiteSpace:"nowrap"}}
                >
                  Selecionar todos
                </button>
                <button
                  onClick={()=>setRoboissQueue(new Set())}
                  style={{background:"#071929",border:"1px solid #1a2f45",borderRadius:7,color:"#475569",fontSize:11,padding:"6px 12px",cursor:"pointer",whiteSpace:"nowrap"}}
                >
                  Limpar seleção
                </button>
                <div style={{flex:1}}/>
                {activeRunning?(
                  <button
                    onClick={async()=>{
                      if(!confirm("Deseja interromper o processo em execução?"))return;
                      await fetch(apiUrl("/api/bot/stop"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operadorId:user?.id})});
                    }}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 20px",background:"#450a0a",border:"1.5px solid #991b1b",borderRadius:8,color:"#fca5a5",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}
                  >
                    <span style={{fontSize:13}}>■</span> Parar
                  </button>
                ):(
                  <button
                    disabled={!canRun}
                    title={!algumAgenteConectado?"Nenhum FiscalAgente conectado — inicie o agente em algum PC":undefined}
                    onClick={handleRun}
                    style={{
                      display:"flex",alignItems:"center",gap:8,padding:"8px 20px",
                      background:canRun?activeCard.color:"#0d1e30",
                      border:`1.5px solid ${canRun?activeCard.color:"#1a2f45"}`,
                      borderRadius:8,
                      color:canRun?"#040c17":"#2d4a63",
                      fontWeight:700,fontSize:12,
                      cursor:canRun?"pointer":"not-allowed",
                      transition:"all .15s",whiteSpace:"nowrap",
                    }}
                  >
                    <span style={{fontSize:11}}>▶</span> Executar {activeCard.label}{roboissQueue.size>0?` (${roboissQueue.size})`:""}
                  </button>
                )}
              </div>

              {/* ── Tabela de clientes ── */}
              <div style={{borderRadius:10,border:"1px solid #1a2f45",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}>
                  <colgroup>
                    <col style={{width:40}}/>
                    <col/>
                    <col style={{width:145}}/>
                    {ferramentasRobo==="iss"&&<>
                      <col style={{width:100}}/>
                      <col style={{width:120}}/>
                      <col style={{width:108}}/>
                      <col style={{width:108}}/>
                      <col style={{width:118}}/>
                    </>}
                    {(ferramentasRobo==="siga"||ferramentasRobo==="mei")&&<col style={{width:130}}/>}
                  </colgroup>
                  <thead>
                    <tr style={{background:"#040d19",borderBottom:`2px solid ${activeCard.color}22`}}>
                      <th style={{padding:"10px 8px",textAlign:"center"}}>
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{cursor:"pointer",accentColor:activeCard.color}}/>
                      </th>
                      <th style={{padding:"10px 10px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Empresa</th>
                      <th style={{padding:"10px 10px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>CNPJ</th>
                      {ferramentasRobo==="iss"&&<>
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Regime</th>
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Município</th>
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#b45309",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Login ISS</th>
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#b45309",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Senha ISS</th>
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>ISS {mesAtual}</th>
                      </>}
                      {(ferramentasRobo==="siga"||ferramentasRobo==="mei")&&(
                        <th style={{padding:"10px 8px",textAlign:"left",color:"#475569",fontWeight:600,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>Responsável</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length===0&&(
                      <tr><td colSpan={9} style={{padding:32,textAlign:"center",color:"#2d4a63",fontSize:13}}>Nenhuma empresa encontrada.</td></tr>
                    )}
                    {filtrados.map((c,i)=>{
                      const sel=roboissQueue.has(c.cnpj);
                      return(
                        <tr key={c.cnpj} onClick={()=>toggleOne(c.cnpj)}
                          style={{
                            borderBottom:"1px solid #0b1e30",
                            background:sel?`${activeCard.color}0f`:i%2===0?"#050e1a":"#060f1e",
                            cursor:"pointer",transition:"background .1s",
                          }}
                        >
                          <td style={{padding:"8px 8px",textAlign:"center",borderLeft:sel?`2.5px solid ${activeCard.color}`:"2.5px solid transparent"}} onClick={e=>{e.stopPropagation();toggleOne(c.cnpj);}}>
                            <input type="checkbox" checked={sel} onChange={()=>toggleOne(c.cnpj)} style={{cursor:"pointer",accentColor:activeCard.color}}/>
                          </td>
                          <td style={{padding:"8px 10px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            <span style={{color:sel?activeCard.color:"#cbd5e1",fontWeight:sel?600:400,fontSize:12}}>{c.nome}</span>
                          </td>
                          <td style={{padding:"8px 10px",color:"#475569",fontFamily:"'Cascadia Code','Consolas',monospace",fontSize:11,whiteSpace:"nowrap"}}>{fmtCnpj(c.cnpj)}</td>
                          {ferramentasRobo==="iss"&&(()=>{
                            const issStatus=getIssStatus(c);
                            return<>
                              <td style={{padding:"8px 8px"}}>
                                <span style={{background:"#0b1e30",border:"1px solid #1a2f45",borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:600,color:"#64748b"}}>{c.regime||"—"}</span>
                              </td>
                              <td style={{padding:"8px 8px",color:"#475569",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.municipio||"—"}</td>
                              <td style={{padding:"8px 8px",color:"#d97706",fontSize:11,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.loginIss||"—"}</td>
                              <td style={{padding:"8px 8px",color:"#d97706",fontSize:11,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.senhaIss||"—"}</td>
                              <td style={{padding:"8px 8px"}}>
                                <span style={{
                                  background:issStatus.done?"#052e1b":"#1a0800",
                                  border:`1px solid ${issStatus.done?"#065f46":"#7c2d12"}`,
                                  borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,
                                  color:issStatus.done?"#34d399":"#fb923c",whiteSpace:"nowrap",
                                }}>
                                  {issStatus.done?"✓ ":""}{issStatus.label}
                                </span>
                              </td>
                            </>;
                          })()}
                          {(ferramentasRobo==="siga"||ferramentasRobo==="mei")&&(
                            <td style={{padding:"8px 8px",color:"#475569",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.responsavel||"—"}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtrados.length>0&&(
                  <div style={{padding:"7px 14px",background:"#040d19",borderTop:"1px solid #0b1e30",fontSize:10,color:"#2d4a63",textAlign:"right"}}>
                    {filtrados.length} empresa{filtrados.length!==1?"s":""} exibida{filtrados.length!==1?"s":""}
                    {roboissSearch?" · filtrada":""}
                    {roboissQueue.size>0&&<span style={{color:activeCard.color,marginLeft:6}}>· {roboissQueue.size} selecionada{roboissQueue.size!==1?"s":""}</span>}
                  </div>
                )}
              </div>

              {/* ── Log de execução ── */}
              {(activeRunning||activeLog.length>0)&&(
                <div style={{borderRadius:10,border:`1px solid ${activeCard.color}33`,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",background:"#040d19",borderBottom:`1px solid ${activeCard.color}22`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:activeRunning?"#fbbf24":activeResult?.ok?"#34d399":"#64748b",flexShrink:0}}/>
                    <span style={{fontWeight:600,fontSize:12,color:activeCard.color}}>{activeCard.label}</span>
                    <span style={{fontSize:11,color:"#475569"}}>— log de execução</span>
                    {activeRunning&&(
                      <span style={{fontSize:10,color:"#fbbf24",background:"rgba(146,64,14,0.25)",border:"1px solid #92400e33",borderRadius:20,padding:"2px 10px",fontWeight:600}}>rodando…</span>
                    )}
                    {!activeRunning&&activeResult&&(
                      <span style={{fontSize:10,fontWeight:600,
                        color:activeResult.ok?"#34d399":"#f87171",
                        background:activeResult.ok?"rgba(5,46,27,0.5)":"rgba(45,15,0,0.5)",
                        border:`1px solid ${activeResult.ok?"#065f4633":"#7c2d1233"}`,
                        borderRadius:20,padding:"2px 10px",
                      }}>
                        {activeResult.ok?"✓":"✗"} {activeResult.msg}
                      </span>
                    )}
                    {!activeRunning&&(
                      <button onClick={clearActiveLog}
                        style={{marginLeft:"auto",background:"transparent",border:"1px solid #1a2f45",borderRadius:5,color:"#2d4a63",fontSize:10,padding:"2px 10px",cursor:"pointer"}}
                      >Limpar</button>
                    )}
                  </div>
                  <div ref={activeLogRef}
                    style={{height:260,overflowY:"auto",padding:"12px 16px",fontFamily:"'Cascadia Code','Consolas',monospace",fontSize:11,lineHeight:1.75,background:"#030a12"}}
                  >
                    {activeLog.length===0&&(
                      <span style={{color:"#1e3a5a",fontStyle:"italic"}}>aguardando saída do processo…</span>
                    )}
                    {activeLog.filter(l=>(l.text||"").startsWith("__OK__:")||(l.text||"").startsWith("__ERRO__:")).length===0&&(
                      <span style={{color:"#1e3a5a",fontStyle:"italic"}}>{activeRunning?"Processando empresas…":"Nenhum resultado ainda."}</span>
                    )}
                    {activeLog.map((l,i)=>{
                      const txt=l.text||"";
                      if(txt.startsWith("__OK__:")){
                        const parts=txt.slice(7).split(":");
                        const cnpjOk=parts[0]||"";
                        const nomeOk=parts.slice(1).join(":")||cnpjOk;
                        return(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,margin:"3px 0",padding:"6px 10px",background:"#052e16",border:"1px solid #166534",borderRadius:6}}>
                            <span style={{color:"#4ade80",fontWeight:700,fontSize:13}}>✓</span>
                            <span style={{color:"#86efac",flex:1}}>{nomeOk}</span>
                            <span style={{color:"#4ade80",opacity:0.5,fontSize:10,fontFamily:"monospace"}}>{cnpjOk}</span>
                          </div>
                        );
                      }
                      if(txt.startsWith("__ERRO__:")){
                        const parts=txt.slice(9).split(":");
                        const cnpjErr=parts[0]||"";
                        const nomeErr=parts.slice(1).join(":")||cnpjErr;
                        return(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,margin:"3px 0",padding:"6px 10px",background:"#450a0a",border:"1px solid #991b1b",borderRadius:6}}>
                            <span style={{color:"#f87171",fontWeight:700,fontSize:13}}>✗</span>
                            <span style={{color:"#fca5a5",flex:1}}>{nomeErr}</span>
                            <span style={{color:"#f87171",opacity:0.5,fontSize:10,fontFamily:"monospace"}}>{cnpjErr}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* DASHBOARD */}
        {page==="dashboard"&&(
          <>
            {/* Alertas */}
            {alertas.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontWeight:600,marginBottom:10,fontSize:13,color:"#94a3b8"}}>⚡ ALERTAS DO CALENDÁRIO FISCAL — {mesAtual}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {alertas.map(a=>(
                    <div key={a.id} style={{background:a.tipo==="vencido"?"#450a0a":a.tipo==="urgente"?"#431407":"#0c1a2e",border:`1px solid ${a.tipo==="vencido"?"#dc2626":a.tipo==="urgente"?"#ea580c":"#1e40af"}`,borderRadius:10,padding:"10px 14px",minWidth:180,flex:"0 0 auto"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:a.cor}}/>
                        <span style={{fontWeight:600,fontSize:12}}>{a.nome}</span>
                        <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:a.tipo==="vencido"?"#fca5a5":a.tipo==="urgente"?"#fdba74":"#93c5fd"}}>
                          {a.tipo==="vencido"?`${Math.abs(a.diff)}d atraso`:a.diff===0?"HOJE":`${a.diff}d`}
                        </span>
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>Vence dia {a.dia} · {a.desc.substring(0,50)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:20}}>
              <div style={S.card}>
                <div style={{color:"#94a3b8",fontSize:11,marginBottom:4}}>PROGRESSO — {mesAtual}</div>
                <div style={{fontSize:30,fontWeight:700,color:pct===100?"#10b981":pct>50?"#f59e0b":"#f1f5f9"}}>{pct}%</div>
                <div style={{marginTop:6,background:"#0f172a",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:5,background:"#6366f1",width:`${pct}%`,transition:"width .3s"}}/>
                </div>
                <div style={{color:"#64748b",fontSize:10,marginTop:4}}>{stats.feitos}/{stats.total} tarefas</div>
              </div>
              <div style={S.card}>
                <div style={{color:"#94a3b8",fontSize:11,marginBottom:4}}>CLIENTES</div>
                <div style={{fontSize:30,fontWeight:700}}>{clientesData.length}</div>
                <div style={{color:"#64748b",fontSize:10,marginTop:4}}>
                  {clientesData.filter(c=>c.grupo==="normal").length} Normal · {clientesData.filter(c=>c.grupo==="simples").length} Simples · {clientesData.filter(c=>c.grupo==="mei").length} MEI
                </div>
              </div>
              {Object.entries(stats.porResp).map(([nome,s])=>{
                const p=s.total>0?Math.round(s.feito/s.total*100):0;
                return(
                  <div key={nome} style={S.card}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:getUserColor(nome)}}/>
                      <div style={{color:"#94a3b8",fontSize:11}}>{nome}</div>
                    </div>
                    <div style={{fontSize:26,fontWeight:700,color:getUserColor(nome)}}>{p}%</div>
                    <div style={{marginTop:5,background:"#0f172a",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:4,background:getUserColor(nome),width:`${p}%`,transition:"width .3s"}}/>
                    </div>
                    <div style={{color:"#64748b",fontSize:10,marginTop:3}}>{s.feito}/{s.total} · {clientesData.filter(c=>c.responsavel?.toUpperCase()===nome).length} clientes</div>
                  </div>
                );
              })}
            </div>
            {/* Pendências */}
            <div style={S.card}>
              <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Clientes com observações / pendências</div>
              {clientesData.filter(c=>state[c.cnpj]?.[mesAtual]?.obs).length===0
                ?<div style={{color:"#64748b",fontSize:13}}>Nenhuma observação registrada.</div>
                :clientesData.filter(c=>state[c.cnpj]?.[mesAtual]?.obs).map(c=>(
                  <div key={c.cnpj} onClick={()=>setClienteSel(c)} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 12px",borderRadius:8,background:"#0f172a",marginBottom:7,cursor:"pointer",border:"1px solid #334155"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:13}}>{c.nome}</div>
                      <div style={{color:"#f59e0b",fontSize:11,marginTop:2}}>{state[c.cnpj][mesAtual].obs}</div>
                    </div>
                    <div style={{color:getUserColor(c.responsavel),fontSize:11}}>{c.responsavel}</div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* CLIENTES */}
        {page==="clientes"&&(
          <>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar cliente ou CNPJ..."
                style={{...S.input,flex:1,minWidth:180}}/>
              {user.role==="admin"&&(
                <select value={filtroResp} onChange={e=>setFiltroResp(e.target.value)} style={{...S.input,width:"auto"}}>
                  <option>TODOS</option>
                  {users.filter(u=>u.role==="operador").map(u=><option key={u.id} value={u.name.toUpperCase()}>{u.name}</option>)}
                </select>
              )}
              <select value={filtroGrupo} onChange={e=>setFiltroGrupo(e.target.value)} style={{...S.input,width:"auto"}}>
                <option value="TODOS">Todos os grupos</option>
                <option value="normal">Regime Normal</option>
                <option value="simples">Simples Nacional</option>
                <option value="mei">MEI</option>
              </select>
              <select value={filtroAtividade} onChange={e=>setFiltroAtividade(e.target.value)} style={{...S.input,width:"auto"}}>
                <option value="TODOS">Todas as atividades</option>
                <option value="Serviço">Serviço</option>
                <option value="Comércio">Comércio</option>
                <option value="Indústria">Indústria</option>
                <option value="Serviço/Comércio">Serviço/Comércio</option>
                <option value="Indústria/Comércio">Indústria/Comércio</option>
                <option value="Serviço/Indústria">Serviço/Indústria</option>
                <option value="Serviço/Indústria/Comércio">Serviço/Indústria/Comércio</option>
              </select>
              <label style={{display:"flex",alignItems:"center",gap:7,background:"#061729",border:"1px solid #245a7c",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#bfefff",fontWeight:700,cursor:"pointer"}}>
                <input type="checkbox" checked={clientesSomentePendentes} onChange={e=>setClientesSomentePendentes(e.target.checked)}/>
                Apenas pendentes
              </label>
            </div>
            <div style={{color:"#64748b",fontSize:11,marginBottom:10}}>{clientes.length} clientes · {mesAtual}</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {clientes.map(c=>{
                const ts=getClientTarefas(c);
                const cl=state[c.cnpj]?.[mesAtual];
                const feito=ts.filter(t=>isTarefaConcluida(t,cl?.tarefas[t])).length;
                const p=ts.length>0?Math.round(feito/ts.length*100):0;
                return(
                  <div key={c.cnpj} onClick={()=>setClienteSel(c)}
                    style={{background:"#1e293b",borderRadius:9,padding:"12px 16px",cursor:"pointer",border:"1px solid #334155",display:"flex",gap:12,alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
                    {c.prioridade&&<div style={{background:"#dc2626",color:"#fff",fontSize:9,fontWeight:700,borderRadius:4,padding:"2px 5px"}}>P{c.prioridade}</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nome}</div>
                      <div style={{color:"#64748b",fontSize:10,marginTop:2}}>{getClientDoc(c)}</div>
                    </div>
                    <span style={{background:badgeColor(c.regime),color:"#fff",fontSize:9,fontWeight:600,borderRadius:4,padding:"2px 6px"}}>{c.regime}</span>
                    <span style={{background:"#0f766e",color:"#ccfbf1",fontSize:9,fontWeight:700,borderRadius:4,padding:"2px 6px",border:"1px solid #14b8a6"}}>{c.atividade||"—"}</span>
                    {c.declaracaoAnual&&<span style={{background:"#7c2d12",color:"#fed7aa",fontSize:9,fontWeight:800,borderRadius:4,padding:"2px 6px",border:"1px solid #fb923c"}}>DECLARAÇÃO ANUAL</span>}
                    <span style={{background:getUserColor(c.responsavel),color:"#fff",fontSize:9,fontWeight:600,borderRadius:4,padding:"2px 6px"}}>{c.responsavel||"—"}</span>
                    <div style={{minWidth:70,textAlign:"right"}}>
                      <div style={{fontSize:12,fontWeight:600,color:p===100?"#10b981":p>0?"#f59e0b":"#64748b"}}>{p}%</div>
                      <div style={{fontSize:9,color:"#64748b"}}>{feito}/{ts.length}</div>
                      <div style={{marginTop:3,background:"#0f172a",borderRadius:3,overflow:"hidden",width:60}}>
                        <div style={{height:3,background:p===100?"#10b981":"#6366f1",width:`${p}%`}}/>
                      </div>
                    </div>
                    {cl?.obs&&<span title={cl.obs} style={{color:"#f59e0b"}}>!</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CALENDÁRIO FISCAL */}
        {page==="calendario"&&(
          <>
            <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>Calendário Fiscal — Prazos 2026</div>
            <div style={{color:"#64748b",fontSize:11,marginBottom:16}}>Prazos internos do escritório para a competência selecionada.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:24}}>
              {CALENDARIO_FISCAL.filter(o=>obrigacaoAplicaMes(o,mesAtual)).sort((a,b)=>getObrigacaoDia(a,mesAtual)-getObrigacaoDia(b,mesAtual)).map(o=>{
                const [m,a]=mesAtual.split("/").map(Number);
                const dia=getObrigacaoDia(o,mesAtual);
                const dVenc=new Date(a,m-1,dia);
                const diff=Math.ceil((dVenc-hoje)/(1000*60*60*24));
                let status="normal", sBg="#0f172a", sBorder="#334155", sColor="#94a3b8";
                if(diff<0){status="vencido";sBg="#450a0a";sBorder="#dc2626";sColor="#fca5a5";}
                else if(diff===0){status="hoje";sBg="#431407";sBorder="#f97316";sColor="#fdba74";}
                else if(diff<=3){status="urgente";sBg="#1c1009";sBorder="#d97706";sColor="#fbbf24";}
                else if(diff<=7){status="proximo";sBg="#0c1a2e";sBorder="#3b82f6";sColor="#93c5fd";}
                return(
                  <div key={o.id} style={{background:sBg,border:`1px solid ${sBorder}`,borderRadius:10,padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:o.cor,flexShrink:0}}/>
                      <div style={{fontWeight:600,fontSize:13,flex:1}}>{o.nome}</div>
                      <div style={{background:sBorder,color:sColor,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                        Dia {dia} {diff<0?`(${Math.abs(diff)}d atraso)`:diff===0?"(HOJE)":diff<=7?`(${diff}d)`:""}
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{o.desc}</div>
                    {o.meses&&<div style={{fontSize:10,color:"#fca5a5",marginTop:6,fontWeight:700}}>Trimestral</div>}
                    <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
                      {o.regimes.map(r=>(
                        <span key={r} style={{background:"#1e293b",color:"#94a3b8",fontSize:9,borderRadius:4,padding:"2px 6px",border:"1px solid #334155"}}>{r==="normal"?"Regime Normal":r==="simples"?"Simples":r==="mei"?"MEI":r}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{...S.card}}>
              <div style={{fontWeight:600,marginBottom:12,fontSize:13}}>⚡ Ordem obrigatória das obrigações mensais</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {[
                  {nome:"SIGET",dia:5,cor:"#16a34a"},
                  {nome:"SPEED GOV",dia:10,cor:"#0ea5e9"},
                  {nome:"EFD-Reinf / DAS / ISS / ICMS",dia:15,cor:"#8b5cf6"},
                  {nome:"PIS-COFINS / DCTFWeb / IRPJ-CSLL",dia:20,cor:"#ef4444"},
                  {nome:"EFD-Contribuições",dia:"último dia",cor:"#0891b2"},
                ].map((o,i,arr)=>(
                  <div key={o.nome} style={{display:"contents"}}>
                    <div key={o.nome} style={{background:"#0f172a",border:`1px solid ${o.cor}`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                      <div style={{fontSize:11,fontWeight:600,color:o.cor}}>{o.nome}</div>
                      <div style={{fontSize:9,color:"#64748b",marginTop:2}}>dia {o.dia}</div>
                    </div>
                    {i<arr.length-1&&<div style={{color:"#334155",fontSize:18}}>→</div>}
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,fontSize:11,color:"#64748b"}}>Qualquer atraso nessa cadeia trava as declarações seguintes e gera multa automática.</div>
            </div>
          </>
        )}

        {/* CONFERENCIA */}
        {page==="conferencia"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Conferência DTE x SISTEMA</div>
                <div style={S.subtle}>Detecta automaticamente campos numéricos de 44 dígitos e compara as chaves dos DTEs armazenados contra a planilha SISTEMA enviada.</div>
              </div>
              <button onClick={compararPlanilhas} disabled={comparando} style={{padding:"10px 18px",borderRadius:8,background:comparando?"#245a7c":"linear-gradient(135deg,#00b4d8,#10b981)",color:"#04121f",fontWeight:900,border:"none",cursor:comparando?"default":"pointer"}}>
                {comparando?"Comparando...":"COMPARE"}
              </button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
              <div style={S.card}>
                <div style={S.label}>Cliente</div>
                <input value={confClienteBusca} onChange={e=>handleConferenciaClienteBusca(e.target.value)} placeholder="Buscar cliente ou CNPJ..." list="conferencia-clientes" style={S.input}/>
                <datalist id="conferencia-clientes">
                  {conferenciaClientes.map(c=>(
                    <option key={c.cnpj} value={getConferenciaClienteLabel(c)}/>
                  ))}
                </datalist>
              </div>
              <div style={S.card}>
                <div style={S.label}>PLANILHA DTE</div>
                <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:150,overflow:"auto"}}>
                  {!confClienteCnpj?(
                    <div style={S.subtle}>Selecione um cliente para carregar os arquivos armazenados.</div>
                  ):(clientFiles[confClienteCnpj]||[]).length===0?(
                    <div style={S.subtle}>Nenhum arquivo DTE armazenado para este cliente.</div>
                  ):(clientFiles[confClienteCnpj]||[]).map(file=>(
                    <div key={file.id} style={{display:"flex",justifyContent:"space-between",gap:10,background:"#061729",border:"1px solid #245a7c",borderRadius:7,padding:"7px 9px"}}>
                      <span style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>
                      <span style={{fontSize:10,color:"#7f9db3",whiteSpace:"nowrap"}}>{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
                <div style={{...S.subtle,marginTop:8}}>O botão COMPARE usa todos os arquivos listados acima.</div>
              </div>
              <div style={S.card}>
                <div style={S.label}>PLANILHA SISTEMA</div>
                <input type="file" accept=".xls,.xlsx" onChange={e=>{setSistemaFile(e.target.files?.[0]||null);setConferencia(null);}} style={S.input}/>
                <div style={{...S.subtle,marginTop:8}}>{sistemaFile?sistemaFile.name:"Selecione o arquivo XLSX com título SISTEMA."}</div>
              </div>
            </div>

            {conferenciaErro&&<div style={{background:"#450a0a",border:"1px solid #dc2626",color:"#fecaca",borderRadius:8,padding:"10px 12px",fontSize:13,marginBottom:14}}>{conferenciaErro}</div>}

            {conferencia&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:14}}>
                  {[
                    {label:"Chaves DTE",value:conferencia.dteTotal,color:"#00b4d8"},
                    {label:"Chaves SISTEMA",value:conferencia.sistemaTotal,color:"#7dd8f0"},
                    {label:"DTE sem SISTEMA",value:conferencia.faltandoSistema.length,color:"#f59e0b"},
                  ].map(card=>(
                    <div key={card.label} style={S.card}>
                      <div style={{...S.subtle,textTransform:"uppercase",fontWeight:800}}>{card.label}</div>
                      <div style={{fontSize:30,fontWeight:900,color:card.color,marginTop:4}}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {conferencia.total===0?(
                  <div style={{...S.card,borderColor:"#10b981"}}>
                    <div style={{fontWeight:800,color:"#86efac",fontSize:15}}>Conferência sem divergências</div>
                    <div style={{...S.subtle,marginTop:4}}>Todas as CHAVES DA NOTA dos arquivos DTE existem na planilha SISTEMA.</div>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:14}}>
                    {[
                      {title:"Encontrado no DTE e não no SISTEMA",items:conferencia.faltandoSistema,color:"#f59e0b"},
                    ].map(group=>(
                      <div key={group.title} style={S.card}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                          <div>
                            <div style={{fontWeight:800,fontSize:13,color:group.color}}>{group.title}</div>
                            <div style={{fontSize:11,color:"#7f9db3",marginTop:2}}>{group.items.length} itens</div>
                          </div>
                          <button onClick={exportDivergenceReport} style={{background:"#1e40af",border:"none",color:"#dbeafe",borderRadius:7,padding:"7px 10px",fontSize:11,fontWeight:900,cursor:"pointer"}}>Exportar relatório</button>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:430,overflow:"auto"}}>
                          {group.items.slice(0,300).map((item,idx)=>(
                            <div key={`${item.key}-${idx}`} style={{background:"#061729",border:"1px solid #245a7c",borderRadius:8,padding:"9px 10px"}}>
                              <div style={{fontSize:12,fontWeight:800,color:"#eef7ff",wordBreak:"break-all"}}>Chave da nota: {item.chaveNotaOriginal||item.chaveNota}</div>
                              <div style={{fontSize:11,color:"#bfefff",marginTop:4}}>
                                Nota {item.numero||"—"} · UF {item.uf||"—"} · Valor {item.valor||"—"} · Emitente {item.emitente||"—"} · Data {item.data||"—"}
                              </div>
                              <div style={{fontSize:10,color:"#7f9db3",marginTop:3}}>Origem {item.origem} · Aba {item.sheetName} · Linha {item.row} · Coluna {item.keyCol}</div>
                            </div>
                          ))}
                          {group.items.length>300&&<div style={{fontSize:11,color:"#fbbf24",padding:8}}>Mostrando os primeiros 300 itens. Refine as planilhas se precisar auditar uma lista menor.</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}


        {/* PARAMETROS */}
        {page==="parametros"&&user.role==="admin"&&(()=>{
          const ALL_PAGES=[{id:"intranet",label:"Intranet"},{id:"dashboard",label:"Dashboard"},{id:"clientes",label:"Clientes"},{id:"calendario",label:"Calendário"},{id:"conferencia",label:"Conferência"},{id:"relatorios",label:"Relatórios"},{id:"historico",label:"Histórico"},{id:"cadastros",label:"Empresas"},{id:"parcelamentos",label:"Parcelamentos"}];
          const togglePage=(pid)=>setUsuarioForm(f=>{const cur=f.pages||[];return{...f,pages:cur.includes(pid)?cur.filter(x=>x!==pid):[...cur,pid]};});
          return(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>Parâmetros</div>
                <div style={{color:"#64748b",fontSize:11}}>Ajustes administrativos exibidos para a equipe.</div>
              </div>
              {configMsg&&<div style={{background:"#0f2f1d",border:"1px solid #166534",color:"#86efac",borderRadius:8,padding:"8px 12px",fontSize:12}}>{configMsg}</div>}
              <button onClick={openDeletionLog} style={{padding:"7px 14px",borderRadius:8,background:"#2d1b4e",border:"1px solid #7c3aed",color:"#c4b5fd",fontWeight:700,fontSize:12,cursor:"pointer"}}>Log de Exclusões</button>
              <button onClick={openTaskLog} style={{padding:"7px 14px",borderRadius:8,background:"#1c0a00",border:"1px solid #d97706",color:"#fde68a",fontWeight:700,fontSize:12,cursor:"pointer"}}>Log de Tarefas</button>
            </div>

            <div style={{...S.card,marginBottom:14}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>Comunicado do dashboard</div>
              <textarea
                value={appSettings.dashboardAnnouncement}
                onChange={e=>setAppSettings(prev=>({...prev,dashboardAnnouncement:e.target.value}))}
                placeholder="Mensagem visível para todos no dashboard. Deixe vazio para ocultar."
                style={{...S.input,minHeight:92,resize:"vertical",lineHeight:1.45}}
              />
              <div style={{...S.subtle,marginTop:8}}>Somente administradores podem criar ou editar. Aparece para todos no dashboard em tempo real quando preenchido.</div>
            </div>

            {/* Rotinas de E-mail */}
            <div style={{...S.card,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:12,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>Rotinas de E-mail — Relatórios Automáticos</div>
                  <div style={{color:"#64748b",fontSize:11}}>Envia automaticamente 1 relatório por operador no dia e horário configurados.</div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:8,background:appSettings.emailAtivo?"#0f2f1d":"#1e293b",border:`1px solid ${appSettings.emailAtivo?"#16a34a":"#334155"}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,fontSize:12,color:appSettings.emailAtivo?"#86efac":"#94a3b8"}}>
                  <input type="checkbox" checked={!!appSettings.emailAtivo} onChange={e=>setAppSettings(p=>({...p,emailAtivo:e.target.checked}))} style={{accentColor:"#16a34a"}}/>
                  {appSettings.emailAtivo?"Ativo — enviando relatórios":"Inativo"}
                </label>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>Gmail remetente</label>
                  <input value={appSettings.emailGmailUser} onChange={e=>setAppSettings(p=>({...p,emailGmailUser:e.target.value}))} placeholder="seuemail@gmail.com" style={S.input}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>Senha de app Gmail</label>
                  <input type="password" value={appSettings.emailGmailPass} onChange={e=>setAppSettings(p=>({...p,emailGmailPass:e.target.value}))} placeholder="Senha de app (não a senha normal)" style={S.input}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>E-mail destinatário</label>
                  <input value={appSettings.emailDestino} onChange={e=>setAppSettings(p=>({...p,emailDestino:e.target.value}))} placeholder="destino@email.com" style={S.input}/>
                </div>
              </div>
              {/* Rotinas */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                {[0,1].map(idx=>{
                  const r=appSettings.emailRotinas?.[idx]||{diaEnvio:"1",horario:"08:00",ativo:false};
                  const upd=(field,val)=>setAppSettings(p=>{
                    const rot=[...(p.emailRotinas||[{},{} ])];
                    rot[idx]={...rot[idx],[field]:val};
                    return{...p,emailRotinas:rot};
                  });
                  return(
                    <div key={idx} style={{background:"#061729",border:`1px solid ${r.ativo?"#16a34a":"#1e3a5f"}`,borderRadius:8,padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontWeight:700,fontSize:12,color:"#7dd8f0"}}>Rotina {idx+1}</span>
                        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:r.ativo?"#86efac":"#64748b",fontWeight:700}}>
                          <input type="checkbox" checked={!!r.ativo} onChange={e=>upd("ativo",e.target.checked)} style={{accentColor:"#16a34a"}}/>
                          {r.ativo?"Ativa":"Inativa"}
                        </label>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:3}}>Dia do mês</label>
                          <input type="number" min="1" max="31" value={r.diaEnvio} onChange={e=>upd("diaEnvio",e.target.value)} style={{...S.input,fontSize:12}}/>
                        </div>
                        <div>
                          <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:3}}>Horário</label>
                          <input type="time" value={r.horario} onChange={e=>upd("horario",e.target.value)} style={{...S.input,fontSize:12}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Rotinas do Log de Tarefas */}
              <div style={{marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:"#fde68a",marginBottom:8}}>Rotinas — Log de Alterações de Tarefas</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[0,1,2,3].map(idx=>{
                    const lr=(appSettings.logRotinas||[])[idx]||{diaEnvio:"1",horario:"08:00",ativo:false};
                    const updLog=(field,val)=>setAppSettings(p=>{
                      const rot=[...(p.logRotinas||[{},{},{},{}])];
                      rot[idx]={...rot[idx],[field]:val};
                      return{...p,logRotinas:rot};
                    });
                    return(
                      <div key={idx} style={{background:"#1a1000",border:`1px solid ${lr.ativo?"#d97706":"#3d2000"}`,borderRadius:8,padding:"10px 12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:10,color:"#d97706",fontWeight:800}}>ENVIO {idx+1}</span>
                          <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:11,fontWeight:700,color:lr.ativo?"#fde68a":"#64748b"}}>
                            <input type="checkbox" checked={!!lr.ativo} onChange={e=>updLog("ativo",e.target.checked)} style={{accentColor:"#d97706"}}/>
                            {lr.ativo?"Ativo":"Inativo"}
                          </label>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div>
                            <label style={{fontSize:10,color:"#94a3b8",fontWeight:700,display:"block",marginBottom:3}}>Dia do mês</label>
                            <input type="number" min="1" max="31" value={lr.diaEnvio} onChange={e=>updLog("diaEnvio",e.target.value)} style={{...S.input,fontSize:12}}/>
                          </div>
                          <div>
                            <label style={{fontSize:10,color:"#94a3b8",fontWeight:700,display:"block",marginBottom:3}}>Horário</label>
                            <input type="time" value={lr.horario} onChange={e=>updLog("horario",e.target.value)} style={{...S.input,fontSize:12}}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{fontSize:10,color:"#475569",marginBottom:12,padding:"8px 12px",background:"#0f172a",borderRadius:6,border:"1px solid #1e3a5f"}}>
                ℹ️ Use uma <strong style={{color:"#7dd8f0"}}>Senha de App</strong> do Gmail (não a senha da conta). Gere em: <span style={{color:"#7dd8f0"}}>Conta Google → Segurança → Senhas de app</span>. O servidor precisa estar rodando no horário configurado.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap" as const}}>
                <button
                  onClick={async()=>{
                    await persistData({manual:true});
                    setSaveStatus("Configuração salva.");
                  }}
                  style={{background:"linear-gradient(135deg,#0077b6,#00b4d8)",border:"none",color:"#fff",padding:"9px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Salvar configuração
                </button>
                <button
                  onClick={async()=>{
                    setSaveStatus("Enviando relatórios de teste...");
                    await persistData();
                    try{
                      const r=await fetch(apiUrl("/api/email-report/send-now"),{method:"POST"});
                      const d=await r.json();
                      setSaveStatus(d.ok?`✓ ${d.msg}`:`Erro: ${d.error}`);
                    }catch{setSaveStatus("Erro ao conectar com o servidor.");}
                  }}
                  style={{background:"#334155",border:"none",color:"#e2e8f0",padding:"9px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Enviar relatórios agora (teste)
                </button>
                <button
                  onClick={async()=>{
                    setSaveStatus("Enviando log de tarefas...");
                    try{
                      const r=await fetch(apiUrl("/api/email-log/send-now"),{method:"POST"});
                      const d=await r.json();
                      setSaveStatus(d.ok?`✓ ${d.msg}`:`Erro: ${d.error}`);
                    }catch{setSaveStatus("Erro ao conectar com o servidor.");}
                  }}
                  style={{background:"#1c0a00",border:"1px solid #d97706",color:"#fde68a",padding:"9px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Enviar log agora (teste)
                </button>
              </div>
            </div>

            {/* Gerenciamento de usuários */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"start"}}>

              {/* Formulário */}
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"#e2eaf8"}}>{usuarioEditId?"Editar usuário":"Novo usuário"}</div>
                    <div style={{fontSize:10,color:"#475569",marginTop:2}}>Preencha os dados e salve</div>
                  </div>
                  {usuarioEditId&&<button onClick={resetUsuarioForm} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>+ Novo</button>}
                </div>
                <div style={{display:"grid",gap:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={{...S.label}}>Nome</label>
                      <input value={usuarioForm.name} onChange={e=>setUsuarioForm({...usuarioForm,name:e.target.value})} placeholder="Nome completo" style={S.input}/>
                    </div>
                    <div>
                      <label style={{...S.label}}>Login</label>
                      <input value={usuarioForm.login} onChange={e=>setUsuarioForm({...usuarioForm,login:e.target.value})} placeholder="nome.sobrenome" style={S.input}/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={{...S.label}}>Senha</label>
                      <input value={usuarioForm.senha} onChange={e=>setUsuarioForm({...usuarioForm,senha:e.target.value})} placeholder="••••••••" style={S.input}/>
                    </div>
                    <div>
                      <label style={{...S.label}}>Perfil</label>
                      <select value={usuarioForm.role} onChange={e=>setUsuarioForm({...usuarioForm,role:e.target.value})} style={S.input}>
                        <option value="operador">Operador</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{...S.label}}>Cor de identificação</label>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:4}}>
                      <input type="color" value={usuarioForm.color} onChange={e=>setUsuarioForm({...usuarioForm,color:e.target.value})} style={{width:36,height:36,border:"1px solid #334155",borderRadius:8,background:"#0f172a",padding:2,cursor:"pointer"}}/>
                      <div style={{width:36,height:36,borderRadius:8,background:usuarioForm.color,border:"1px solid #334155"}}/>
                      <span style={{fontSize:11,color:"#64748b"}}>{usuarioForm.color}</span>
                    </div>
                  </div>
                  {usuarioForm.role==="operador"&&(
                    <div style={{background:"#061729",border:"1px solid #1a3a5c",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:0.5,marginBottom:8}}>ACESSO ÀS ABAS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {ALL_PAGES.map(pg=>{
                          const active=(usuarioForm.pages||[]).includes(pg.id);
                          return(
                            <label key={pg.id} style={{display:"flex",alignItems:"center",gap:5,background:active?"#1e3a5f":"#0f172a",border:`1px solid ${active?"#3b82f6":"#334155"}`,borderRadius:6,padding:"5px 9px",fontSize:11,color:active?"#93c5fd":"#64748b",cursor:"pointer",userSelect:"none" as const}}>
                              <input type="checkbox" checked={active} onChange={()=>togglePage(pg.id)} style={{accentColor:"#3b82f6",cursor:"pointer"}}/>
                              {pg.label}
                            </label>
                          );
                        })}
                      </div>
                      <div style={{fontSize:10,color:"#334155",marginTop:7}}>Sem seleção = acesso a todas as abas.</div>
                    </div>
                  )}
                  <button onClick={saveUsuario} style={{padding:"10px 14px",borderRadius:8,background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",marginTop:2}}>
                    {usuarioEditId?"Salvar alterações":"Criar usuário"}
                  </button>
                </div>
              </div>

              {/* Lista de usuários */}
              <div style={S.card}>
                <div style={{fontWeight:700,fontSize:13,color:"#e2eaf8",marginBottom:4}}>Usuários cadastrados</div>
                <div style={{fontSize:10,color:"#475569",marginBottom:14}}>{users.length} usuário{users.length!==1?"s":""} no sistema</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[...users].sort(sortByNome).map(u=>{
                    const isEditing=usuarioEditId===u.id;
                    return(
                      <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,background:isEditing?"#0c1e38":"#0a1628",border:`1px solid ${isEditing?"#3b82f6":"#1a2f45"}`,borderRadius:10,padding:"10px 14px",transition:"border-color .15s"}}>
                        <div style={{width:32,height:32,borderRadius:8,background:u.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:800,fontSize:13,color:"#fff"}}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:"#e2eaf8"}}>{u.name}</div>
                          <div style={{fontSize:10,color:"#475569",marginTop:1}}>
                            <span style={{color:"#7dd8f0"}}>{u.login}</span>
                            {" · "}
                            <span style={{color:u.role==="admin"?"#a78bfa":"#64748b"}}>{u.role==="admin"?"Admin":"Operador"}</span>
                            {u.pages?.length>0&&<span style={{color:"#334155"}}>{` · ${u.pages.length} abas`}</span>}
                          </div>
                        </div>
                        <button onClick={()=>editUsuario(u)} style={{background:isEditing?"#1e3a8a":"#1e293b",border:`1px solid ${isEditing?"#3b82f6":"#334155"}`,color:isEditing?"#93c5fd":"#64748b",borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                          {isEditing?"Editando":"Editar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
          );
        })()}

        {/* CADASTROS */}
        {page==="cadastros"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>Empresas</div>
                <div style={{color:"#64748b",fontSize:11}}>Cadastre empresas e ajuste as tarefas fiscais de cada empresa.</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {configMsg&&<div style={{background:"#0f2f1d",border:"1px solid #166534",color:"#86efac",borderRadius:8,padding:"8px 12px",fontSize:12}}>{configMsg}</div>}
                <button onClick={openNewClienteModal} style={{padding:"8px 16px",borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#052e1b",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Nova Empresa</button>
              </div>
            </div>

            <div style={{...S.card,marginTop:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Empresas cadastradas</div>
                  <div style={S.subtle}>{configClientes.length} de {clientesData.length} empresas</div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",flex:1,justifyContent:"flex-end"}}>
                  <input value={configClienteBusca} onChange={e=>setConfigClienteBusca(e.target.value)} placeholder="Buscar empresa, CNPJ ou código..." style={{...S.input,width:260,maxWidth:"100%"}}/>
                  <select value={configClienteRegime} onChange={e=>setConfigClienteRegime(e.target.value)} style={{...S.input,width:180,maxWidth:"100%"}}>
                    <option value="TODOS">Todos os regimes</option>
                    <option value="normal">Regime Normal</option>
                    <option value="simples">Simples</option>
                    <option value="mei">MEI</option>
                  </select>
                  <select value={configClienteResponsavel} onChange={e=>setConfigClienteResponsavel(e.target.value)} style={{...S.input,width:160,maxWidth:"100%"}}>
                    {configResponsaveis.map(r=><option key={r} value={r}>{r==="TODOS"?"Todos os responsáveis":r}</option>)}
                  </select>
                  <select value={configClienteAtividade} onChange={e=>setConfigClienteAtividade(e.target.value)} style={{...S.input,width:"auto"}}>
                    <option value="TODOS">Todas as atividades</option>
                    <option value="Serviço">Serviço</option>
                    <option value="Comércio">Comércio</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Serviço/Comércio">Serviço/Comércio</option>
                    <option value="Indústria/Comércio">Indústria/Comércio</option>
                    <option value="Serviço/Indústria">Serviço/Indústria</option>
                    <option value="Serviço/Indústria/Comércio">Serviço/Indústria/Comércio</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {configClientes.map(c=>(
                  <div key={c.cnpj} style={{display:"flex",alignItems:"center",gap:10,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"9px 12px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nome}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{getClientDoc(c)} · {c.regime} · {c.atividade||"Sem atividade"}{c.municipio?` · ${c.municipio}${c.uf?`/${c.uf}`:""}`:""} · {getClientTarefas(c).length} tarefas{c.declaracaoAnual?" · Declaração anual":""}</div>
                  </div>
                  <span style={{background:getUserColor(c.responsavel),color:"#fff",fontSize:9,fontWeight:700,borderRadius:4,padding:"2px 6px"}}>{c.responsavel||"—"}</span>
                  <button onClick={()=>openEditClienteModal(c)} style={{background:"#1e40af",border:"none",color:"#dbeafe",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer"}}>Editar</button>
                  <button onClick={()=>deleteCliente(c)} style={{background:"#7f1d1d",border:"1px solid #b91c1c",color:"#fecaca",borderRadius:6,padding:"5px 9px",fontSize:11,fontWeight:800,cursor:"pointer"}}>Excluir</button>
                </div>
              ))}
                {configClientes.length===0&&(
                  <div style={{color:"#64748b",fontSize:12,textAlign:"center",padding:18}}>Nenhuma empresa encontrada.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* MINHA CONTA — configurações de bots por operador */}
        {page==="parametros"&&(()=>{
          const mcUserIdEfetivo=mcUserId||user?.id||0;
          const userAlvo=(user.role==="admin"?users.find((u:any)=>u.id===mcUserIdEfetivo):user)||user;
          const patchBotsConfig=(bot:string,campo:string,valor:string)=>{
            setUsers((prev:any[])=>prev.map((u:any)=>
              u.id===userAlvo.id
                ?{...u,botsConfig:{...u.botsConfig,[bot]:{...u.botsConfig?.[bot],[campo]:valor}}}
                :u
            ));
          };
          const bots=[
            {id:"iss", label:"T-ISS", temEmail:true},
            {id:"siga",label:"T-SIGA",temEmail:false},
            {id:"mei", label:"T-MEI", temEmail:true},
          ];
          return(
            <div style={{...S.card,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#7dd8f0",marginBottom:2}}>⚙ Minha Conta — Configurações dos Bots</div>
                  <div style={{fontSize:11,color:"#64748b"}}>Pasta de download e e-mail individuais para cada bot neste PC.</div>
                </div>
                {user.role==="admin"&&(
                  <select value={mcUserIdEfetivo} onChange={e=>setMcUserId(Number(e.target.value))} style={{...S.input,width:"auto",marginLeft:"auto"}}>
                    {users.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
                {bots.map(bot=>{
                  const bc=(userAlvo as any)?.botsConfig?.[bot.id]||{};
                  return(
                    <div key={bot.id} style={{background:"#040d19",border:"1px solid #1a2f45",borderRadius:10,padding:"14px 16px"}}>
                      <div style={{fontWeight:700,color:"#7dd8f0",marginBottom:12,fontSize:12,letterSpacing:0.5}}>{bot.label}</div>
                      <div style={{marginBottom:8}}>
                        <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>📁 Pasta de download</label>
                        <input
                          value={bc.pastaDownloads||""}
                          onChange={e=>patchBotsConfig(bot.id,"pastaDownloads",e.target.value)}
                          placeholder={`C:\\${(userAlvo as any)?.name||"Usuario"}\\${bot.id.toUpperCase()}`}
                          style={{...S.input,width:"100%",boxSizing:"border-box" as any}}
                        />
                      </div>
                      {bot.temEmail&&(<>
                        <div style={{marginBottom:8}}>
                          <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>✉ E-mail remetente</label>
                          <input
                            value={bc.emailRemetente||""}
                            onChange={e=>patchBotsConfig(bot.id,"emailRemetente",e.target.value)}
                            placeholder="remetente@gmail.com"
                            style={{...S.input,width:"100%",boxSizing:"border-box" as any}}
                          />
                        </div>
                        <div style={{marginBottom:8}}>
                          <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>🔑 Senha de app Gmail</label>
                          <input
                            type="password"
                            value={bc.emailSenha||""}
                            onChange={e=>patchBotsConfig(bot.id,"emailSenha",e.target.value)}
                            placeholder="xxxx xxxx xxxx xxxx"
                            style={{...S.input,width:"100%",boxSizing:"border-box" as any}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:10,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>📨 E-mail destinatário padrão</label>
                          <input
                            value={bc.emailDestinatario||""}
                            onChange={e=>patchBotsConfig(bot.id,"emailDestinatario",e.target.value)}
                            placeholder="destinatario@email.com"
                            style={{...S.input,width:"100%",boxSizing:"border-box" as any}}
                          />
                        </div>
                      </>)}
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:"#334155",marginTop:12}}>As alterações são salvas automaticamente.</div>
            </div>
          );
        })()}

        {/* RELATÓRIOS */}
        {page==="relatorios"&&(
          <>
            {/* Controles (não aparecem no PDF) */}
            <div className="no-print" style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{fontWeight:600,fontSize:14,flex:1}}>Relatório — {mesAtual}</div>
              {user.role==="admin"&&(
                <select value={relResp} onChange={e=>setRelResp(e.target.value)} style={{...S.input,width:"auto"}}>
                  <option>TODOS</option>
                  {users.filter(u=>u.role==="operador").map(u=><option key={u.id} value={u.name.toUpperCase()}>{u.name}</option>)}
                </select>
              )}
              <select value={relGrupo} onChange={e=>setRelGrupo(e.target.value)} style={{...S.input,width:"auto"}}>
                <option value="TODOS">Todos</option>
                <option value="normal">Normal</option>
                <option value="simples">Simples</option>
                <option value="mei">MEI</option>
              </select>
              <select value={relTarefa} onChange={e=>setRelTarefa(e.target.value)} style={{...S.input,width:"auto",minWidth:160}}>
                <option value="TODAS">Todas as tarefas</option>
                {[...new Set([...TAREFAS_NORMAL,...TAREFAS_SIMPLES,...TAREFAS_MEI])].sort().map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{display:"flex",alignItems:"center",gap:7,background:"#061729",border:"1px solid #245a7c",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#bfefff",fontWeight:700,cursor:"pointer"}}>
                <input type="checkbox" checked={relSomentePendentes} onChange={e=>setRelSomentePendentes(e.target.checked)}/>
                Apenas pendências
              </label>
              <button onClick={()=>{
                const now=new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
                const esc=(s:any)=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
                const respLabel=relResp==="TODOS"?"Todos":relResp;
                const grupoLabel=relGrupo==="TODOS"?"Todos":relGrupo==="normal"?"Regime Normal":relGrupo==="simples"?"Simples Nacional":"MEI";
                const tarefaLabel=relTarefa==="TODAS"?"Todas":relTarefa;
                const totalCli=relData.length;
                const concluidos=relData.filter(c=>c.pct===100).length;
                const andamento=relData.filter(c=>c.pct>0&&c.pct<100).length;
                const naoIniciados=relData.filter(c=>c.pct===0).length;
                const sorted=[...relData].sort((a,b)=>a.responsavel?.localeCompare(b.responsavel)||a.pct-b.pct);
                const pctColor=(p:number)=>p===100?"#059669":p>0?"#d97706":"#dc2626";
                const regimeBg=(r:string)=>{const l=(r||"").toLowerCase();if(l.includes("simples"))return{bg:"#dbeafe",c:"#1d4ed8"};if(l.includes("mei"))return{bg:"#fef3c7",c:"#92400e"};return{bg:"#f1f5f9",c:"#475569"};};
                const rows=sorted.map((c,i)=>{
                  const pc=c.pct;
                  const pColor=pctColor(pc);
                  const reg=regimeBg(c.regime);
                  const pendStr=c.pendentes.length>0?c.pendentes.join(", "):"✓ Concluído";
                  const pendColor=c.pendentes.length>0?"#dc2626":"#059669";
                  const rowBg=i%2===0?"#ffffff":"#f8fafc";
                  return`<tr style="background:${rowBg}">
<td style="padding:4pt 6pt;text-align:center;border:1pt solid #e2e8f0;font-size:7pt;color:#94a3b8;font-weight:700">${i+1}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-weight:700;color:#0f172a;font-size:8pt">${esc(c.nome)}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-family:monospace;font-size:7pt;color:#475569;white-space:nowrap">${esc(c.cnpj||c.cpf||"—")}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;text-align:center"><span style="background:${reg.bg};color:${reg.c};font-size:7pt;font-weight:700;padding:1pt 5pt;border-radius:3pt;white-space:nowrap">${esc(c.regime||"—")}</span></td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-weight:700;font-size:8pt;color:#1d4ed8">${esc(c.responsavel||"—")}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;text-align:center;white-space:nowrap">
  <span style="font-size:8pt;font-weight:800;color:${pColor}">${pc}%</span>
  <div style="width:100%;height:5pt;background:#e2e8f0;border-radius:3pt;margin-top:2pt;overflow:hidden"><div style="height:5pt;width:${pc}%;background:${pColor};border-radius:3pt"></div></div>
</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:${pendColor};max-width:140pt">${esc(pendStr)}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:#475569;white-space:nowrap">${esc(c.mit||"—")}</td>
<td style="padding:4pt 7pt;border:1pt solid #e2e8f0;font-size:7pt;color:#d97706;max-width:100pt">${esc(c.obs||"")}</td>
</tr>`;
                }).join("");
                const html=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório de Controle Fiscal — ${esc(mesAtual)}</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm 14mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>

<!-- CABEÇALHO -->
<table style="width:100%;border-collapse:collapse;border-bottom:3pt solid #1a3a6e;padding-bottom:10pt;margin-bottom:12pt">
<tr>
  <td style="width:32%;vertical-align:middle;padding-bottom:8pt">
    <table style="border-collapse:collapse">
      <tr>
        <td style="vertical-align:middle;padding-right:10pt">
          <svg width="52" height="52" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00b4d8"/><stop offset="100%" stop-color="#0077b6"/></linearGradient>
              <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a3a6e"/><stop offset="100%" stop-color="#0d2550"/></linearGradient>
            </defs>
            <rect x="18" y="18" width="84" height="84" rx="14" fill="url(#g1)" transform="rotate(45 60 60)"/>
            <rect x="26" y="26" width="68" height="68" rx="10" fill="url(#g2)" transform="rotate(45 60 60)"/>
            <text x="60" y="57" text-anchor="middle" fill="#fff" font-size="13" font-weight="bold" font-family="Arial,sans-serif">TESSERATO</text>
            <text x="60" y="70" text-anchor="middle" fill="#7ecfed" font-size="7" font-family="Arial,sans-serif" letter-spacing="1">CONTABILIDADE</text>
          </svg>
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:16pt;font-weight:900;color:#1a3a6e;letter-spacing:1px;line-height:1.1">TESSERATO</div>
          <div style="font-size:7pt;color:#0077b6;letter-spacing:2px;font-weight:700">CONTABILIDADE</div>
          <div style="font-size:7pt;color:#64748b;margin-top:2pt">Gestão Fiscal &amp; Tributária</div>
        </td>
      </tr>
    </table>
  </td>
  <td style="width:36%;text-align:center;vertical-align:middle;padding-bottom:8pt">
    <div style="font-size:19pt;font-weight:900;color:#0f172a;letter-spacing:-0.5px;line-height:1.1">Relatório de Controle Fiscal</div>
    <div style="font-size:11pt;color:#1a3a6e;font-weight:700;margin-top:3pt">Competência: ${esc(mesAtual)}</div>
  </td>
  <td style="width:32%;vertical-align:top;text-align:right;padding-bottom:8pt">
    <table style="border-collapse:collapse;margin-left:auto;border:1pt solid #e2e8f0;background:#f8fafc">
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Gerado em</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right;white-space:nowrap">${now}</td></tr>
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Responsável</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right">${esc(respLabel)}</td></tr>
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Grupo</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right">${esc(grupoLabel)}</td></tr>
      <tr><td style="padding:3pt 8pt;font-size:6.5pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Tarefa</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right">${esc(tarefaLabel)}</td></tr>
      <tr><td colspan="2" style="padding:5pt 8pt;text-align:center;background:#1a3a6e;color:#fff;font-size:7.5pt;font-weight:800">${totalCli} cliente${totalCli!==1?"s":""} encontrado${totalCli!==1?"s":""}</td></tr>
    </table>
  </td>
</tr>
</table>

<!-- CARDS DE RESUMO -->
<table style="width:100%;border-collapse:collapse;margin-bottom:12pt">
<tr>
  <td style="width:25%;padding:0 4pt 0 0">
    <table style="width:100%;border-collapse:collapse;background:#e8edf8;border:1pt solid #1a3a6e22;border-radius:4pt">
      <tr><td style="padding:8pt 12pt;text-align:center">
        <div style="font-size:24pt;font-weight:900;color:#1a3a6e">${totalCli}</div>
        <div style="font-size:7pt;color:#475569;font-weight:700;margin-top:2pt">TOTAL DE CLIENTES</div>
      </td></tr>
    </table>
  </td>
  <td style="width:25%;padding:0 4pt">
    <table style="width:100%;border-collapse:collapse;background:#d1fae5;border:1pt solid #05996922">
      <tr><td style="padding:8pt 12pt;text-align:center">
        <div style="font-size:24pt;font-weight:900;color:#059669">${concluidos}</div>
        <div style="font-size:7pt;color:#475569;font-weight:700;margin-top:2pt">CONCLUÍDOS (100%)</div>
      </td></tr>
    </table>
  </td>
  <td style="width:25%;padding:0 4pt">
    <table style="width:100%;border-collapse:collapse;background:#fef3c7;border:1pt solid #d9770622">
      <tr><td style="padding:8pt 12pt;text-align:center">
        <div style="font-size:24pt;font-weight:900;color:#d97706">${andamento}</div>
        <div style="font-size:7pt;color:#475569;font-weight:700;margin-top:2pt">EM ANDAMENTO</div>
      </td></tr>
    </table>
  </td>
  <td style="width:25%;padding:0 0 0 4pt">
    <table style="width:100%;border-collapse:collapse;background:#fee2e2;border:1pt solid #dc262622">
      <tr><td style="padding:8pt 12pt;text-align:center">
        <div style="font-size:24pt;font-weight:900;color:#dc2626">${naoIniciados}</div>
        <div style="font-size:7pt;color:#475569;font-weight:700;margin-top:2pt">NÃO INICIADOS</div>
      </td></tr>
    </table>
  </td>
</tr>
</table>

<!-- TABELA DE CLIENTES -->
<table style="width:100%;border-collapse:collapse">
<thead>
  <tr style="background:#1a3a6e;color:#fff">
    <th style="padding:5pt 6pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:3%">#</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:19%">CLIENTE / RAZÃO SOCIAL</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:11%">CNPJ / CPF</th>
    <th style="padding:5pt 7pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:9%">REGIME</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:9%">RESPONSÁVEL</th>
    <th style="padding:5pt 7pt;text-align:center;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:8%">PROGRESSO</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:29%">TAREFAS PENDENTES</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:7%">MIT</th>
    <th style="padding:5pt 7pt;text-align:left;border:1pt solid #2d4f8a;font-size:7pt;font-weight:700;width:10%">OBSERVAÇÕES</th>
  </tr>
</thead>
<tbody>
${rows||`<tr><td colspan="9" style="padding:16pt;text-align:center;color:#94a3b8;font-size:9pt">Nenhum cliente encontrado para os filtros selecionados.</td></tr>`}
</tbody>
</table>

<!-- RODAPÉ -->
<table style="width:100%;border-collapse:collapse;margin-top:10pt;background:#1a3a6e">
<tr>
  <td style="padding:7pt 12pt;font-size:7pt;color:#7ecfed;font-weight:600">Tesserato Contabilidade · Setor Fiscal · ${esc(mesAtual)}</td>
  <td style="padding:7pt 12pt;font-size:7pt;color:#7ecfed;text-align:center">${totalCli} cliente${totalCli!==1?"s":""} · ${concluidos} concluído${concluidos!==1?"s":""} · ${relData.filter(c=>c.pct<100).length} pendente${relData.filter(c=>c.pct<100).length!==1?"s":""}</td>
  <td style="padding:7pt 12pt;font-size:7pt;color:#7ecfed;text-align:right;font-style:italic">Gerado em ${now} — uso interno</td>
</tr>
</table>

</body>
</html>`;
                const w=window.open("","_blank","width=1280,height=900");
                if(!w)return;
                w.document.write(html);
                w.document.close();
                w.focus();
                setTimeout(()=>w.print(),500);
              }} style={{padding:"8px 18px",borderRadius:8,background:"#6366f1",color:"#fff",fontWeight:700,fontSize:13,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                Imprimir / Salvar PDF
              </button>
            </div>

            {/* Área imprimível */}
            <style>{`
              @media print {
                body { background: #fff !important; }
                .no-print { display: none !important; }
                .print-area { background: #fff !important; color: #111 !important; padding: 0 !important; }
                .print-header { display: flex !important; }
              }
              @media screen {
                .print-area { background: #1e293b; border-radius: 12px; padding: 0; overflow: hidden; }
              }
            `}</style>

            <div className="print-area">
              {/* Cabeçalho do relatório */}
              <div style={{background:"#fff",padding:"24px 32px",borderBottom:"3px solid #1a3a6e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                {/* Logo */}
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <img
                    src="https://i.imgur.com/placeholder.png"
                    onError={e=>{e.target.style.display="none";}}
                    style={{width:64,height:64,objectFit:"contain"}}
                    alt="logo"
                  />
                  {/* Logo SVG inline como fallback/base — substitui a imagem */}
                  <svg width="72" height="72" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00b4d8"/>
                        <stop offset="100%" stopColor="#0077b6"/>
                      </linearGradient>
                      <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a3a6e"/>
                        <stop offset="100%" stopColor="#0d2550"/>
                      </linearGradient>
                    </defs>
                    <rect x="18" y="18" width="84" height="84" rx="14" fill="url(#g1)" transform="rotate(45 60 60)"/>
                    <rect x="26" y="26" width="68" height="68" rx="10" fill="url(#g2)" transform="rotate(45 60 60)"/>
                    <text x="60" y="56" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="Arial,sans-serif">TESSERATO</text>
                    <text x="60" y="70" textAnchor="middle" fill="#7ecfed" fontSize="7.5" fontFamily="Arial,sans-serif" letterSpacing="1">CONTABILIDADE</text>
                  </svg>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:"#1a3a6e",letterSpacing:1}}>TESSERATO</div>
                    <div style={{fontSize:10,color:"#0077b6",letterSpacing:2,fontWeight:600}}>CONTABILIDADE</div>
                    <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Setor Fiscal</div>
                  </div>
                </div>
                {/* Título e info */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#1a3a6e",textTransform:"uppercase",letterSpacing:1}}>Relatório de Controle Fiscal</div>
                  <div style={{fontSize:13,color:"#0077b6",fontWeight:600,marginTop:2}}>Competência: {mesAtual}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>
                    Responsável: {relResp==="TODOS"?"Todos":relResp} &nbsp;·&nbsp;
                    Grupo: {relGrupo==="TODOS"?"Todos":relGrupo==="normal"?"Regime Normal":relGrupo==="simples"?"Simples Nacional":"MEI"} &nbsp;·&nbsp;
                    Tarefa: {relTarefa==="TODAS"?"Todas":relTarefa} &nbsp;·&nbsp;
                    Situação: {relSomentePendentes?"Apenas pendências":"Todos"}
                  </div>
                  <div style={{fontSize:9,color:"#b0b8c8",marginTop:2}}>Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>

              {/* Cards de resumo */}
              <div style={{background:"#f0f4fa",padding:"16px 32px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,borderBottom:"1px solid #dde3ee"}}>
                {[
                  {label:"Total de Clientes",val:relData.length,cor:"#1a3a6e",bg:"#e8edf8"},
                  {label:"Concluídos (100%)",val:relData.filter(c=>c.pct===100).length,cor:"#059669",bg:"#d1fae5"},
                  {label:"Em Andamento",val:relData.filter(c=>c.pct>0&&c.pct<100).length,cor:"#d97706",bg:"#fef3c7"},
                  {label:"Não Iniciados",val:relData.filter(c=>c.pct===0).length,cor:"#dc2626",bg:"#fee2e2"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,borderRadius:8,padding:"12px 16px",textAlign:"center",border:`1px solid ${s.cor}22`}}>
                    <div style={{fontSize:28,fontWeight:800,color:s.cor}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#475569",marginTop:2,fontWeight:600}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabela */}
              <div style={{background:"#fff",padding:"0 0 24px"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:"#1a3a6e"}}>
                      {["#","Cliente","CNPJ","Regime","Responsável","Progresso","Tarefas Pendentes","MIT","Observações"].map((h,i)=>(
                        <th key={h} style={{padding:"10px 10px",textAlign:i===0?"center":"left",color:"#fff",fontWeight:700,fontSize:10,whiteSpace:"nowrap",letterSpacing:0.5}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {relData.sort((a,b)=>a.responsavel?.localeCompare(b.responsavel)||a.pct-b.pct).map((c,idx)=>{
                      const bg=idx%2===0?"#fff":"#f8fafc";
                      const pctColor=c.pct===100?"#059669":c.pct>0?"#d97706":"#dc2626";
                      return(
                        <tr key={c.cnpj} onClick={()=>setClienteSel(c)} style={{background:bg,borderBottom:"1px solid #e2e8f0",cursor:"pointer"}} title="Abrir cliente">
                          <td style={{padding:"7px 8px",textAlign:"center",color:"#94a3b8",fontSize:9,fontWeight:600}}>{idx+1}</td>
                          <td style={{padding:"7px 10px",fontWeight:600,color:"#1e293b",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nome}</td>
                          <td style={{padding:"7px 10px",color:"#64748b",fontSize:9,whiteSpace:"nowrap"}}>{getClientDoc(c)}</td>
                          <td style={{padding:"7px 10px"}}>
                            <span style={{background:badgeColor(c.regime)+"22",color:badgeColor(c.regime),fontSize:8,borderRadius:4,padding:"2px 6px",fontWeight:700,border:`1px solid ${badgeColor(c.regime)}44`,whiteSpace:"nowrap"}}>{c.regime}</span>
                          </td>
                          <td style={{padding:"7px 10px",fontWeight:700,color:getUserColor(c.responsavel),fontSize:10}}>{c.responsavel||"—"}</td>
                          <td style={{padding:"7px 10px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:50,background:"#e2e8f0",borderRadius:3,overflow:"hidden",height:5}}>
                                <div style={{height:5,background:pctColor,width:`${c.pct}%`}}/>
                              </div>
                              <span style={{color:pctColor,fontWeight:700,fontSize:10}}>{c.pct}%</span>
                            </div>
                          </td>
                          <td style={{padding:"7px 10px",color:"#dc2626",fontSize:9,maxWidth:130}}>{c.pendentes.length>0?c.pendentes.slice(0,4).join(", ")+(c.pendentes.length>4?` +${c.pendentes.length-4}`:""):<span style={{color:"#059669",fontWeight:700}}>✓ Concluído</span>}</td>
                          <td style={{padding:"7px 10px",color:"#475569",fontSize:9,whiteSpace:"nowrap"}}>{c.mit||"—"}</td>
                          <td style={{padding:"7px 10px",color:"#d97706",fontSize:9,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>{c.obs||""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé */}
              <div style={{background:"#1a3a6e",padding:"12px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:9,color:"#7ecfed"}}>Tesserato Contabilidade · Setor Fiscal · {mesAtual}</div>
                <div style={{fontSize:9,color:"#7ecfed"}}>{relData.length} clientes · {relData.filter(c=>c.pct===100).length} concluídos · {relData.filter(c=>c.pct<100).length} pendentes</div>
              </div>
            </div>
          </>
        )}

        {/* HISTÓRICO */}
        {page==="historico"&&(
          <>
            <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>Histórico Anual — {ANO_ATUAL}</div>
            <div style={{color:"#64748b",fontSize:11,marginBottom:16}}>Progresso de cada mês do ano</div>
            {/* Gráfico de barras simples */}
            <div style={{...S.card,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,justifyContent:"space-between"}}>
                {MESES_HIST.map((m,i)=>{
                  let total=0,feito=0;
                  clientesData.forEach(c=>{
                    const ts=getClientTarefas(c);
                    total+=ts.length;
                    ts.forEach(t=>{
                      const v=state[c.cnpj]?.[m]?.tarefas[t];
                      if(isTarefaConcluida(t,v)) feito++;
                    });
                  });
                  const p=total>0?Math.round(feito/total*100):0;
                  const isCur=m===mesAtual;
                  return(
                    <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:10,color:p>0?"#f1f5f9":"#334155",fontWeight:600}}>{p>0?`${p}%`:""}</div>
                      <div style={{width:"100%",background:isCur?"#6366f1":p===100?"#10b981":p>0?"#3b82f6":"#1e293b",borderRadius:"4px 4px 0 0",height:`${Math.max(p,4)}%`,minHeight:4,transition:"height .3s",border:isCur?"2px solid #818cf8":"none"}}/>
                      <div style={{fontSize:9,color:"#64748b",textAlign:"center"}}>{MESES[i].substring(0,3)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Por responsável */}
            <div style={{fontWeight:600,marginBottom:12,fontSize:13}}>Progresso por responsável</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:20}}>
              {users.filter(u=>u.role==="operador").map(u=>{
                const isRespSelected=histResp===u.name.toUpperCase();
                return(
                <div key={u.id} onClick={()=>setHistResp(u.name.toUpperCase())} style={{...S.card,cursor:"pointer",border:isRespSelected?`1px solid ${u.color}`:S.card.border,boxShadow:isRespSelected?`0 0 0 1px ${u.color}55, 0 16px 38px #0208173d`:S.card.boxShadow}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:u.color}}/>
                    <span style={{fontWeight:600,fontSize:13}}>{u.name}</span>
                    {isRespSelected&&<span style={{marginLeft:"auto",fontSize:9,color:u.color,fontWeight:800}}>Selecionado</span>}
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {MESES_HIST.map((m,i)=>{
                      let total=0,feito=0;
                      clientesData.filter(c=>c.responsavel?.toUpperCase()===u.name.toUpperCase()).forEach(c=>{
                        const ts=getClientTarefas(c);
                        total+=ts.length;
                        ts.forEach(t=>{const v=state[c.cnpj]?.[m]?.tarefas[t];if(isTarefaConcluida(t,v)) feito++;});
                      });
                      const p=total>0?Math.round(feito/total*100):0;
                      const isCur=m===mesAtual;
                      return(
                        <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <div style={{width:"100%",background:isCur?u.color:p===100?"#10b981":p>0?"#334155":"#1e293b",borderRadius:"3px 3px 0 0",height:p>0?`${p*0.6}px`:"4px",minHeight:4,maxHeight:60}}/>
                          <div style={{fontSize:8,color:"#64748b"}}>{MESES[i].substring(0,1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );})}
            </div>
            {/* Tabela histórica por mês */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>Selecionar mês para detalhar</div>
                <div style={S.subtle}>Responsável: {histRespLabel}</div>
              </div>
              {histResp!=="TODOS"&&(
                <button onClick={()=>setHistResp("TODOS")} style={{background:"#334155",border:"none",color:"#cbd5e1",borderRadius:6,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>Ver todos</button>
              )}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {MESES_HIST.map((m,i)=>{
                let total=0,feito=0;
                histClientes.forEach(c=>{const ts=getClientTarefas(c);total+=ts.length;ts.forEach(t=>{const v=state[c.cnpj]?.[m]?.tarefas[t];if(isTarefaConcluida(t,v)) feito++;});});
                const p=total>0?Math.round(feito/total*100):0;
                const isCur=m===histMes;
                return(
                  <div key={m} onClick={()=>setHistMes(m)} style={{background:isCur?"#1e40af":"#1e293b",borderRadius:8,padding:"10px 14px",cursor:"pointer",border:`1px solid ${isCur?"#3b82f6":"#334155"}`}}>
                    <div style={{fontSize:12,fontWeight:600,color:isCur?"#93c5fd":"#e2e8f0"}}>{MESES[i]}</div>
                    <div style={{fontSize:20,fontWeight:700,color:p===100?"#10b981":p>0?"#f59e0b":"#475569",marginTop:4}}>{p}%</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{feito}/{total} tarefas</div>
                  </div>
                );
              })}
            </div>
            {histMes&&(
              <div style={S.card}>
                <div style={{fontWeight:600,marginBottom:12,fontSize:13}}>Detalhes — {histMes} · {histRespLabel}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {histClientes.filter(c=>{
                    const ts=getClientTarefas(c);
                    const cl=state[c.cnpj]?.[histMes];
                    return ts.some(t=>isTarefaConcluida(t,cl?.tarefas[t]));
                  }).slice(0,20).map(c=>{
                    const ts=getClientTarefas(c);
                    const cl=state[c.cnpj]?.[histMes];
                    const f=ts.filter(t=>isTarefaConcluida(t,cl?.tarefas[t])).length;
                    const p=Math.round(f/ts.length*100);
                    return(
                      <div key={c.cnpj} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#0f172a",borderRadius:7}}>
                        <span style={{color:getUserColor(c.responsavel),fontSize:10,minWidth:60}}>{c.responsavel}</span>
                        <span style={{flex:1,fontSize:12}}>{c.nome}</span>
                        <span style={{color:p===100?"#10b981":"#f59e0b",fontSize:11,fontWeight:600}}>{p}%</span>
                      </div>
                    );
                  })}
                  {histClientes.filter(c=>{const ts=getClientTarefas(c);const cl=state[c.cnpj]?.[histMes];return ts.some(t=>isTarefaConcluida(t,cl?.tarefas[t]));}).length===0&&(
                    <div style={{color:"#64748b",fontSize:13,textAlign:"center",padding:20}}>Nenhum dado registrado neste mês ainda.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* PARCELAMENTOS */}
        {page==="parcelamentos"&&(()=>{
          const SECOES_PARC=["RECEITA FEDERAL - ECAC","PGFN - ECAC","SEFAZ - PARCELAMENTO MULTA AUTONOMA","SEFAZ - PARCELAMENTOS","FGTS DIGITAL"];
          const SECAO_COLOR={"RECEITA FEDERAL - ECAC":"#2563eb","PGFN - ECAC":"#7c3aed","SEFAZ - PARCELAMENTO MULTA AUTONOMA":"#ea580c","SEFAZ - PARCELAMENTOS":"#16a34a","FGTS DIGITAL":"#0891b2"};
          const MESES_PARC=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
          const MESES_FULL=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
          const PARC_KEYS=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
          const getMesBg=(v)=>{
            if(!v)return"#0f172a";const l=v.toLowerCase();
            if(l.includes("liquid")||l.includes("pago")||l.includes("quitado")||l.includes("finaliz"))return"#14532d";
            if(l.includes("cancel")||l.includes("encerra")||l.includes("indisp")||l.includes("excluido"))return"#450a0a";
            if(l.includes("comunicado")||l.includes("informado")||l.includes("não")||l.includes("nao"))return"#431407";
            return"#172554";
          };
          const getMesFg=(v)=>{
            if(!v)return"#334155";const l=v.toLowerCase();
            if(l.includes("liquid")||l.includes("pago")||l.includes("quitado")||l.includes("finaliz"))return"#86efac";
            if(l.includes("cancel")||l.includes("encerra")||l.includes("indisp")||l.includes("excluido"))return"#fca5a5";
            if(l.includes("comunicado")||l.includes("informado")||l.includes("não")||l.includes("nao"))return"#fdba74";
            return"#93c5fd";
          };
          const btnAcao=(bg,cl)=>({background:bg,border:"none",color:cl||"#fff",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600});
          const fldLabel={fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase" as const,marginBottom:4,display:"block" as const};
          const q=parcBusca.toLowerCase();
          const clientMatches=parcClientSearch.length>=2?clientesData.filter(c=>c.nome.toLowerCase().includes(parcClientSearch.toLowerCase())||c.cnpj.includes(parcClientSearch)).slice(0,8):[];
          return(
            <>
              {/* ── Filters bar ── */}
              <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",alignItems:"center",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:17,color:"#f1f5f9",flex:"0 0 auto"}}>Parcelamentos 2026</div>
                <input placeholder="Buscar empresa, CNPJ ou responsável..." value={parcBusca} onChange={e=>setParcBusca(e.target.value)} style={{...S.input,flex:1,minWidth:200}}/>
                <select value={parcSecao} onChange={e=>setParcSecao(e.target.value)} style={{...S.input,width:"auto"}}>
                  <option value="TODOS">Todas as seções</option>
                  {SECOES_PARC.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                {parcBusca&&<button onClick={()=>setParcBusca("")} style={{...btnAcao("#334155","#94a3b8")}}>Limpar</button>}
                <button onClick={()=>{setParcReportFiltroCliente("");setParcReportFiltroSecao("TODOS");setParcReportOpen(true);}} style={{...btnAcao("#334155","#e2e8f0"),padding:"7px 14px",fontSize:13}}>Relatório</button>
                <button onClick={openNewParcForm} style={{...btnAcao("linear-gradient(135deg,#0077b6,#00b4d8)"),marginLeft:"auto",padding:"7px 16px",fontSize:13}}>+ Novo Parcelamento</button>
              </div>

              {/* ── Sections (scrollable) ── */}
              <div style={{flex:1,overflowY:"auto",overflowX:"hidden",minHeight:0}}>
              {SECOES_PARC.filter(s=>parcSecao==="TODOS"||parcSecao===s).map(secao=>{
                const items=parcelamentos.filter(p=>p.secao===secao&&(q===""||p.empresa.toLowerCase().includes(q)||p.cnpj.includes(q)||p.responsavel.toLowerCase().includes(q)||p.local.toLowerCase().includes(q)));
                if(items.length===0)return null;
                const cor=SECAO_COLOR[secao]||"#6366f1";
                return(
                  <div key={secao} style={{marginBottom:32}}>
                    <div style={{background:`linear-gradient(90deg,${cor}28,#0f172a)`,border:`1px solid ${cor}55`,borderRadius:8,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:4,minHeight:28,background:cor,borderRadius:2}}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#f1f5f9"}}>{secao}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{items.length} parcelamento{items.length!==1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <div style={{display:"grid",gridTemplateColumns:"180px 128px 72px 86px 170px repeat(12,64px)",gap:4,padding:"6px 12px",background:"#0f172a",borderRadius:6,fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.6,marginBottom:4,minWidth:"max-content"}}>
                        <div>EMPRESA</div><div>CNPJ</div><div>REGIME</div><div>RESPONSÁVEL</div><div>LOCAL / TIPO</div>
                        {MESES_PARC.map(m=><div key={m} style={{textAlign:"center"}}>{m}</div>)}
                      </div>
                      {items.map(p=>{
                        const isOpen=parcSel?.id===p.id;
                        return(
                          <div key={p.id} style={{marginBottom:3,minWidth:"max-content"}}>
                            <div onClick={()=>setParcSel(isOpen?null:p)} style={{display:"grid",gridTemplateColumns:"180px 128px 72px 86px 170px repeat(12,64px)",gap:4,padding:"7px 12px",background:isOpen?"#1e3a5f":"#1e293b",borderRadius:isOpen?"8px 8px 0 0":6,cursor:"pointer",border:`1px solid ${isOpen?cor+"99":"#334155"}`,alignItems:"center",fontSize:12}}>
                              <div style={{fontWeight:600,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={p.empresa}>{p.empresa}</div>
                              <div style={{color:"#94a3b8",fontFamily:"monospace",fontSize:11}}>{p.cnpj||"—"}</div>
                              <div style={{color:"#7dd8f0",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.regime||"—"}</div>
                              <div style={{color:"#a78bfa",fontSize:11}}>{p.responsavel||"—"}</div>
                              <div style={{color:"#94a3b8",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={p.local}>{p.local||"—"}</div>
                              {PARC_KEYS.map(k=>{
                                const v=p[k];
                                const dH=String(hoje.getDate()).padStart(2,"0");
                                const mH=String(hoje.getMonth()+1).padStart(2,"0");
                                return(
                                  <div key={k} style={{display:"flex",flexDirection:"column",gap:2}}>
                                    <div style={{background:getMesBg(v),borderRadius:4,padding:"3px 4px",textAlign:"center",fontSize:10,color:getMesFg(v),whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={v||""}>{v||"—"}</div>
                                    <button onClick={e=>{e.stopPropagation();updateParcMes(p.id,k,`${dH}/${mH}`);}}style={{background: "rgb(31, 173, 255)",border: "1px solid rgb(31, 173, 255)",borderRadius: "3px",color: "rgb(255, 255, 255)",fontSize: "8px",fontWeight: 800,cursor: "pointer",padding: "2px 0",letterSpacing: 0.3, width: "100%"}}>ENVIADO</button>
                                  </div>
                                );
                              })}
                            </div>
                            {/* ── Expanded detail ── */}
                            {isOpen&&(
                              <div style={{background:"#0f172a",border:`1px solid ${cor}77`,borderTop:"none",borderRadius:"0 0 8px 8px",padding:16,minWidth:"max-content"}}>
                                {/* Action bar */}
                                <div style={{display:"flex",gap:8,marginBottom:16}}>
                                  <button onClick={e=>{e.stopPropagation();openEditParcForm(p);}} style={{...btnAcao("#1d4ed8")}}>✏️ Editar</button>
                                  <button onClick={e=>{e.stopPropagation();setParcDeleteId(p.id);setParcDeleteSenha("");setParcDeleteErr("");}} style={{...btnAcao("#991b1b")}}>🗑️ Excluir</button>
                                </div>
                                {/* Info grid */}
                                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:16,maxWidth:900}}>
                                  {[["Empresa",p.empresa],["CNPJ",p.cnpj],["Regime",p.regime],["Responsável",p.responsavel],["Local / Tipo",p.local]].map(([lbl,val])=>(
                                    <div key={lbl}><div style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.5,marginBottom:3}}>{lbl}</div><div style={{fontSize:13,color:"#e2e8f0",wordBreak:"break-word"}}>{val||"—"}</div></div>
                                  ))}
                                </div>
                                {/* Monthly grid */}
                                <div style={{borderTop:"1px solid #1e293b",paddingTop:14,marginBottom:14}}>
                                  <div style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.5,marginBottom:10}}>PARCELAS MENSAIS</div>
                                  <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,maxWidth:700}}>
                                    {MESES_FULL.map((mes,i)=>{const v=p[PARC_KEYS[i]];return(
                                      <div key={mes} style={{background:getMesBg(v),borderRadius:6,padding:"8px 10px",border:`1px solid ${getMesFg(v)}33`}}>
                                        <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:4,letterSpacing:0.5}}>{mes.toUpperCase()}</div>
                                        <div style={{fontSize:12,color:getMesFg(v),fontWeight:600,wordBreak:"break-word"}}>{v||"—"}</div>
                                      </div>);
                                    })}
                                  </div>
                                </div>
                                {p.senhas&&(<div style={{background:"#1e1b4b",border:"1px solid #4f46e5",borderRadius:6,padding:"10px 14px",maxWidth:700}}><div style={{fontSize:10,color:"#818cf8",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>SENHAS E CÓDIGOS</div><div style={{fontSize:12,color:"#e2e8f0",fontFamily:"monospace",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{p.senhas}</div></div>)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {parcelamentos.length===0&&(<div style={{color:"#64748b",textAlign:"center",padding:40,fontSize:14}}>Nenhum parcelamento encontrado.</div>)}
              </div>{/* end scrollable sections */}

              {/* ══════════════════════════════════════════════
                  NEW / EDIT MODAL
              ══════════════════════════════════════════════ */}
              {parcFormMode&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setParcFormMode(null)}>
                  <div style={{background:"#0f1f35",border:"1px solid #245a7c",borderRadius:14,padding:28,width:"100%",maxWidth:760,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px #00000088"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:700,fontSize:16,color:"#f1f5f9",marginBottom:20}}>{parcFormMode==="new"?"Novo Parcelamento":"Editar Parcelamento"}</div>

                    {/* Row 1 – Section + Responsible */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div>
                        <label style={fldLabel}>Seção</label>
                        <select value={parcForm.secao} onChange={e=>setParcForm(f=>({...f,secao:e.target.value}))} style={S.input}>
                          {SECOES_PARC.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={fldLabel}>Responsável</label>
                        <select value={parcForm.responsavel} onChange={e=>setParcForm(f=>({...f,responsavel:e.target.value}))} style={S.input}>
                          <option value="">— selecione —</option>
                          {users.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 2 – Company search + CNPJ */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div style={{position:"relative"}}>
                        <label style={fldLabel}>Empresa</label>
                        <input
                          placeholder="Nome ou CNPJ para buscar cliente..."
                          value={parcClientSearch||(parcFormMode==="edit"?parcForm.empresa:"")}
                          onChange={e=>{setParcClientSearch(e.target.value);if(!e.target.value)setParcForm(f=>({...f,empresa:"",cnpj:"",regime:""}));}}
                          style={S.input}
                        />
                        {clientMatches.length>0&&(
                          <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1e293b",border:"1px solid #334155",borderRadius:"0 0 8px 8px",zIndex:20,maxHeight:200,overflowY:"auto"}}>
                            {clientMatches.map(c=>(
                              <div key={c.cnpj} onClick={()=>{setParcForm(f=>({...f,empresa:c.nome,cnpj:c.cnpj,regime:c.regime||""}));setParcClientSearch("");}} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #0f172a",transition:"background 0.1s"}} onMouseEnter={e=>(e.currentTarget.style.background="#2d3f55")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
                                <div style={{fontWeight:600,color:"#e2e8f0"}}>{c.nome}</div>
                                <div style={{fontSize:10,color:"#94a3b8"}}>{c.cnpj} · {c.regime}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {parcClientSearch===""&&parcForm.empresa&&<div style={{marginTop:4,fontSize:11,color:"#7dd8f0"}}>{parcForm.empresa}</div>}
                      </div>
                      <div>
                        <label style={fldLabel}>CNPJ</label>
                        <input placeholder="00.000.000/0000-00" value={parcForm.cnpj} onChange={e=>setParcForm(f=>({...f,cnpj:e.target.value}))} style={S.input}/>
                      </div>
                    </div>

                    {/* Row 3 – Regime + Local + Tarefa */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
                      <div>
                        <label style={fldLabel}>Regime</label>
                        <input placeholder="Ex: Simples Nacional, MEI..." value={parcForm.regime} onChange={e=>setParcForm(f=>({...f,regime:e.target.value}))} style={S.input}/>
                      </div>
                      <div>
                        <label style={fldLabel}>Local / Tipo</label>
                        <input placeholder="Ex: SIMPLES NACIONAL, PGFN - INSS..." value={parcForm.local} onChange={e=>setParcForm(f=>({...f,local:e.target.value}))} style={S.input}/>
                      </div>
                      <div>
                        <label style={fldLabel}>Tarefa Relacionada</label>
                        <select value={parcForm.tarefa||""} onChange={e=>setParcForm(f=>({...f,tarefa:e.target.value}))} style={S.input}>
                          <option value="">— nenhuma —</option>
                          {[...new Set([...TAREFAS_NORMAL,...TAREFAS_SIMPLES,...TAREFAS_MEI])].sort().map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Monthly entries */}
                    <div style={{borderTop:"1px solid #1e3a5f",paddingTop:18,marginBottom:18}}>
                      <div style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>Parcelas Mensais</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                        {MESES_FULL.map((mes,i)=>{
                          const k=PARC_KEYS[i];
                          return(
                            <div key={k}>
                              <label style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.5,marginBottom:4,display:"block"}}>{mes.toUpperCase()}</label>
                              <input
                                placeholder="—"
                                value={parcForm[k]||""}
                                onChange={e=>setParcForm(f=>({...f,[k]:e.target.value}))}
                                style={{...S.input,padding:"6px 10px",fontSize:12,background:getMesBg(parcForm[k]),color:getMesFg(parcForm[k])||"#e2e8f0",border:"1px solid #334155"}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Senhas */}
                    <div style={{marginBottom:20}}>
                      <label style={fldLabel}>Senhas e Códigos</label>
                      <textarea rows={2} placeholder="Credenciais de acesso..." value={parcForm.senhas||""} onChange={e=>setParcForm(f=>({...f,senhas:e.target.value}))} style={{...S.input,resize:"vertical" as const,fontFamily:"monospace"}}/>
                    </div>

                    {/* Footer */}
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>{setParcFormMode(null);setParcClientSearch("");}} style={{...btnAcao("#334155","#94a3b8"),padding:"9px 20px",fontSize:13}}>Cancelar</button>
                      <button onClick={saveParcForm} disabled={!parcForm.empresa.trim()} style={{...btnAcao("linear-gradient(135deg,#0077b6,#00b4d8)"),padding:"9px 22px",fontSize:13,opacity:parcForm.empresa.trim()?1:0.5,cursor:parcForm.empresa.trim()?"pointer":"not-allowed"}}>
                        {parcFormMode==="new"?"Criar Parcelamento":"Salvar Alterações"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  DELETE CONFIRMATION MODAL
              ══════════════════════════════════════════════ */}
              {/* ══════════════════════════════════════════════
                  REPORT MODAL
              ══════════════════════════════════════════════ */}
              {parcReportOpen&&(()=>{
                const empresasComParc=[...new Map(parcelamentos.map(p=>[p.cnpj||p.empresa,{empresa:p.empresa,cnpj:p.cnpj}])).values()].sort((a,b)=>a.empresa.localeCompare(b.empresa));
                const reportItems=parcelamentos.filter(p=>{
                  const matchCliente=!parcReportFiltroCliente||(p.cnpj===parcReportFiltroCliente||p.empresa===parcReportFiltroCliente);
                  const matchSecao=parcReportFiltroSecao==="TODOS"||p.secao===parcReportFiltroSecao;
                  return matchCliente&&matchSecao;
                });
                const esc=(s:any)=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
                const pBg=(v:string)=>{if(!v)return"#fff";const l=v.toLowerCase();if(l.includes("liquid")||l.includes("pago")||l.includes("quitado")||l.includes("finaliz"))return"#dcfce7";if(l.includes("pend")||l.includes("atras")||l.includes("venc"))return"#fee2e2";if(l.includes("acordo")||l.includes("parcel")||l.includes("negoc"))return"#fef3c7";return"#f8fafc";};
                const pFg=(v:string)=>{if(!v)return"#9ca3af";const l=v.toLowerCase();if(l.includes("liquid")||l.includes("pago")||l.includes("quitado")||l.includes("finaliz"))return"#166534";if(l.includes("pend")||l.includes("atras")||l.includes("venc"))return"#dc2626";if(l.includes("acordo")||l.includes("parcel")||l.includes("negoc"))return"#92400e";return"#374151";};
                const printReport=()=>{
                  const now=new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
                  const filtroClienteLabel=parcReportFiltroCliente?(empresasComParc.find(e=>e.cnpj===parcReportFiltroCliente||e.empresa===parcReportFiltroCliente)?.empresa||parcReportFiltroCliente):"Todos os clientes";
                  const secoesAtivas=SECOES_PARC.filter(s=>parcReportFiltroSecao==="TODOS"||s===parcReportFiltroSecao).filter(s=>reportItems.some(p=>p.secao===s));
                  const totalParc=reportItems.length;
                  /* cores por seção: bg claro, borda, texto escuro */
                  const SC:Record<string,{bg:string;brd:string;txt:string}>={
                    "RECEITA FEDERAL - ECAC":{bg:"#dbeafe",brd:"#2563eb",txt:"#1e3a8a"},
                    "PGFN - ECAC":{bg:"#ede9fe",brd:"#7c3aed",txt:"#4c1d95"},
                    "SEFAZ - PARCELAMENTO MULTA AUTONOMA":{bg:"#ffedd5",brd:"#ea580c",txt:"#7c2d12"},
                    "SEFAZ - PARCELAMENTOS":{bg:"#dcfce7",brd:"#16a34a",txt:"#14532d"},
                    "FGTS DIGITAL":{bg:"#cffafe",brd:"#0891b2",txt:"#164e63"},
                  };
                  const sectionsHtml=secoesAtivas.map(secao=>{
                    const grp=reportItems.filter(p=>p.secao===secao);
                    const sc=SC[secao]||{bg:"#f1f5f9",brd:"#64748b",txt:"#1e293b"};
                    const rows=grp.map((p,i)=>{
                      const rowBg=i%2===0?"#ffffff":"#f8fafc";
                      const months=PARC_KEYS.map(k=>{const v=p[k];return`<td style="padding:3pt 4pt;text-align:center;font-size:6.5pt;font-weight:600;white-space:nowrap;background:${pBg(v)};color:${pFg(v)};border:1px solid #e2e8f0">${esc(v)||"—"}</td>`;}).join("");
                      return`<tr style="background:${rowBg}">
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;font-weight:700;color:#0f172a;font-size:7.5pt"><span style="display:inline-block;background:#e2e8f0;color:#475569;border-radius:2pt;padding:0 3pt;font-size:6pt;font-weight:800;margin-right:3pt">${i+1}</span>${esc(p.empresa)}</td>
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;font-family:monospace;font-size:7pt;color:#475569">${esc(p.cnpj)||"—"}</td>
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;color:#1d4ed8;font-size:7pt">${esc(p.regime)||"—"}</td>
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;color:#6d28d9;font-size:7pt">${esc(p.responsavel)||"—"}</td>
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;color:#475569;font-size:7pt">${esc(p.local)||"—"}</td>
<td style="padding:3.5pt 5pt;border:1px solid #e2e8f0;color:#0891b2;font-size:7pt">${esc(p.tarefa)||"—"}</td>
${months}
</tr>`;
                    }).join("");
                    return`<table style="width:100%;border-collapse:collapse;margin-bottom:0">
<tr><td colspan="18" style="background:${sc.bg};border-left:5pt solid ${sc.brd};padding:5pt 10pt;font-size:9pt;font-weight:800;color:${sc.txt}">${esc(secao)}<span style="float:right;font-size:8pt;color:${sc.brd}">${grp.length} parcelamento${grp.length!==1?"s":""}</span></td></tr>
<tr style="background:#1e293b;color:#e2e8f0">
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:19%">EMPRESA / RAZÃO SOCIAL</th>
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:11%">CNPJ</th>
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:8%">REGIME</th>
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:8%">RESPONSÁVEL</th>
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:9%">LOCAL / TIPO</th>
<th style="padding:4pt 5pt;text-align:left;border:1px solid #334155;font-size:7pt;white-space:nowrap;width:8%">TAREFA</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">JAN</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">FEV</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">MAR</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">ABR</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">MAI</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">JUN</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">JUL</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">AGO</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">SET</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">OUT</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">NOV</th>
<th style="padding:4pt 5pt;text-align:center;border:1px solid #334155;font-size:7pt;width:3%">DEZ</th>
</tr>
${rows}
</table><div style="margin-bottom:18pt"></div>`;
                  }).join("");
                  const html=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatorio de Parcelamentos</title>
<style>
@page{size:A4 landscape;margin:12mm 10mm 14mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>

<!-- CABEÇALHO via TABLE para máxima compatibilidade de impressão -->
<table style="width:100%;border-collapse:collapse;margin-bottom:12pt;border-bottom:3pt solid #1e293b;padding-bottom:10pt">
<tr>
  <td style="width:30%;vertical-align:top;padding-bottom:8pt">
    <table style="border-collapse:collapse">
      <tr>
        <td style="vertical-align:middle;padding-right:10pt">
          <div style="width:44pt;height:44pt;background:#1e293b;border-radius:6pt;text-align:center;line-height:44pt;color:#fff;font-size:16pt;font-weight:900;letter-spacing:-1px">FT</div>
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:15pt;font-weight:900;color:#1e293b;line-height:1.1">Tesserato</div>
          <div style="font-size:8pt;font-weight:700;color:#1e293b;letter-spacing:2px">CONTABILIDADE</div>
          <div style="font-size:7pt;color:#64748b;margin-top:2pt">Gestão Fiscal &amp; Tributária</div>
        </td>
      </tr>
    </table>
  </td>
  <td style="width:40%;text-align:center;vertical-align:middle;padding-bottom:8pt">
    <div style="font-size:20pt;font-weight:900;color:#0f172a;letter-spacing:-0.5px;line-height:1.1">Relatório de Parcelamentos</div>
    <div style="font-size:8.5pt;color:#64748b;margin-top:4pt">${esc(parcReportFiltroSecao==="TODOS"?"Todas as seções":parcReportFiltroSecao)}</div>
  </td>
  <td style="width:30%;vertical-align:top;text-align:right;padding-bottom:8pt">
    <table style="border-collapse:collapse;margin-left:auto;border:1pt solid #e2e8f0;background:#f8fafc;border-radius:4pt">
      <tr><td style="padding:3pt 8pt;font-size:7pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Data de geração</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right">${now}</td></tr>
      <tr><td style="padding:3pt 8pt;font-size:7pt;color:#94a3b8;font-weight:700;text-transform:uppercase;border-bottom:1pt solid #e2e8f0;white-space:nowrap">Cliente</td><td style="padding:3pt 8pt;font-size:7.5pt;font-weight:700;color:#1e293b;border-bottom:1pt solid #e2e8f0;text-align:right">${esc(filtroClienteLabel)}</td></tr>
<tr><td colspan="2" style="padding:5pt 8pt;text-align:center;background:#1e293b;color:#fff;font-size:8pt;font-weight:800">${totalParc} parcelamento${totalParc!==1?"s":""} encontrado${totalParc!==1?"s":""}</td></tr>
    </table>
  </td>
</tr>
</table>

<!-- SEÇÕES -->
${sectionsHtml||`<p style="color:#94a3b8;text-align:center;padding:24pt;font-size:10pt">Nenhum parcelamento encontrado para os filtros selecionados.</p>`}

<!-- LEGENDA -->
<table style="width:100%;border-collapse:collapse;margin-top:10pt;background:#f8fafc;border:1pt solid #e2e8f0">
<tr>
  <td style="padding:6pt 10pt;font-size:7pt;font-weight:800;color:#475569;text-transform:uppercase;white-space:nowrap">Legenda de status mensal:</td>
  <td style="padding:6pt 8pt"><span style="display:inline-block;width:10pt;height:10pt;background:#dcfce7;border:1pt solid #86efac;border-radius:2pt;vertical-align:middle;margin-right:4pt"></span><span style="font-size:7pt;color:#166534;vertical-align:middle">Liquidado / Pago / Quitado</span></td>
  <td style="padding:6pt 8pt"><span style="display:inline-block;width:10pt;height:10pt;background:#fee2e2;border:1pt solid #fca5a5;border-radius:2pt;vertical-align:middle;margin-right:4pt"></span><span style="font-size:7pt;color:#dc2626;vertical-align:middle">Pendente / Em atraso</span></td>
  <td style="padding:6pt 8pt"><span style="display:inline-block;width:10pt;height:10pt;background:#fef3c7;border:1pt solid #fcd34d;border-radius:2pt;vertical-align:middle;margin-right:4pt"></span><span style="font-size:7pt;color:#92400e;vertical-align:middle">Em acordo / Parcelando</span></td>
  <td style="padding:6pt 8pt"><span style="display:inline-block;width:10pt;height:10pt;background:#f8fafc;border:1pt solid #cbd5e1;border-radius:2pt;vertical-align:middle;margin-right:4pt"></span><span style="font-size:7pt;color:#374151;vertical-align:middle">Outros / Sem status</span></td>
</tr>
</table>

<!-- RODAPÉ -->
<table style="width:100%;border-collapse:collapse;margin-top:10pt;border-top:1.5pt solid #e2e8f0;padding-top:6pt">
<tr>
  <td style="padding-top:6pt;font-size:7pt;color:#94a3b8"><strong style="color:#475569">Tesserato Contabilidade</strong> — Sistema de Gestão Fiscal &amp; Tributária</td>
  <td style="padding-top:6pt;font-size:7pt;color:#94a3b8;text-align:right;font-style:italic">Documento gerado em ${now} — uso interno</td>
</tr>
</table>

</body>
</html>`;
                  const w=window.open("","_blank","width=1280,height=900");
                  if(!w)return;
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(()=>w.print(),500);
                };
                return(
                  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:1010,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setParcReportOpen(false)}>
                    <div style={{background:"#0f1f35",border:"1px solid #245a7c",borderRadius:14,padding:28,width:"100%",maxWidth:900,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px #00000088",display:"flex",flexDirection:"column",gap:16}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                        <div style={{fontWeight:700,fontSize:16,color:"#f1f5f9"}}>Relatório de Parcelamentos</div>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                          <select value={parcReportFiltroCliente} onChange={e=>setParcReportFiltroCliente(e.target.value)} style={{...S.input,width:"auto",minWidth:200}}>
                            <option value="">Todos os clientes</option>
                            {empresasComParc.map(e=><option key={e.cnpj||e.empresa} value={e.cnpj||e.empresa}>{e.empresa}{e.cnpj?` (${e.cnpj})`:""}</option>)}
                          </select>
                          <select value={parcReportFiltroSecao} onChange={e=>setParcReportFiltroSecao(e.target.value)} style={{...S.input,width:"auto"}}>
                            <option value="TODOS">Todas as seções</option>
                            {SECOES_PARC.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
<button onClick={printReport} style={{...btnAcao("#6366f1"),padding:"7px 14px",fontSize:12}}>Imprimir / PDF</button>
                          <button onClick={()=>setParcReportOpen(false)} style={{...btnAcao("#334155","#94a3b8"),padding:"7px 12px",fontSize:12}}>Fechar</button>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:"#64748b"}}>{reportItems.length} parcelamento{reportItems.length!==1?"s":""} encontrado{reportItems.length!==1?"s":""}</div>
                      {reportItems.length===0?(
                        <div style={{color:"#64748b",textAlign:"center",padding:32,fontSize:13}}>Nenhum parcelamento corresponde aos filtros selecionados.</div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:18}}>
                          {SECOES_PARC.filter(s=>parcReportFiltroSecao==="TODOS"||s===parcReportFiltroSecao).map(secao=>{
                            const grp=reportItems.filter(p=>p.secao===secao);
                            if(grp.length===0)return null;
                            const cor=SECAO_COLOR[secao]||"#6366f1";
                            return(
                              <div key={secao}>
                                <div style={{background:`linear-gradient(90deg,${cor}28,#0f172a)`,border:`1px solid ${cor}55`,borderRadius:6,padding:"8px 14px",marginBottom:8,fontWeight:700,fontSize:12,color:"#f1f5f9"}}>{secao} · {grp.length}</div>
                                <div style={{overflowX:"auto"}}>
                                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:700}}>
                                    <thead>
                                      <tr style={{background:"#0f172a",color:"#64748b",fontWeight:700,letterSpacing:0.5}}>
                                        {["Empresa","CNPJ","Regime","Responsável","Local/Tipo","JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",whiteSpace:"nowrap",borderBottom:"1px solid #1e293b"}}>{h}</th>)}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grp.map(p=>(
                                        <tr key={p.id} style={{borderBottom:"1px solid #1e293b"}}>
                                          <td style={{padding:"6px 8px",color:"#e2e8f0",fontWeight:600,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.empresa}</td>
                                          <td style={{padding:"6px 8px",color:"#94a3b8",fontFamily:"monospace"}}>{p.cnpj||"—"}</td>
                                          <td style={{padding:"6px 8px",color:"#7dd8f0"}}>{p.regime||"—"}</td>
                                          <td style={{padding:"6px 8px",color:"#a78bfa"}}>{p.responsavel||"—"}</td>
                                          <td style={{padding:"6px 8px",color:"#94a3b8",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.local||"—"}</td>
                                          {PARC_KEYS.map(k=>{const v=p[k];return<td key={k} style={{padding:"4px 6px",background:getMesBg(v),color:getMesFg(v),textAlign:"center",fontSize:10,whiteSpace:"nowrap",maxWidth:72,overflow:"hidden",textOverflow:"ellipsis"}}>{v||"—"}</td>;})}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ══════════════════════════════════════════════
                  DELETE CONFIRMATION MODAL
              ══════════════════════════════════════════════ */}


              {parcDeleteId&&(()=>{
                const target=parcelamentos.find(p=>p.id===parcDeleteId);
                return(
                  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1010,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setParcDeleteId(null);setParcDeleteSenha("");setParcDeleteErr("");}}>
                    <div style={{background:"#1a0a0a",border:"1px solid #7f1d1d",borderRadius:14,padding:28,width:"100%",maxWidth:420,boxShadow:"0 32px 80px #00000088"}} onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:20,marginBottom:10}}>🗑️</div>
                      <div style={{fontWeight:700,fontSize:15,color:"#fca5a5",marginBottom:6}}>Confirmar Exclusão</div>
                      <div style={{fontSize:13,color:"#e2e8f0",marginBottom:4}}>{target?.empresa||"Parcelamento"}</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginBottom:20}}>{target?.secao} · {target?.local}</div>
                      <div style={{fontSize:12,color:"#fbbf24",background:"#451a03",borderRadius:6,padding:"8px 12px",marginBottom:18}}>⚠️ Esta ação é irreversível e não poderá ser desfeita.</div>
                      <div style={{marginBottom:16}}>
                        <label style={{...fldLabel,color:"#fca5a5"}}>Confirme sua senha para excluir</label>
                        <input
                          type="password"
                          placeholder="sua senha"
                          value={parcDeleteSenha}
                          onChange={e=>{setParcDeleteSenha(e.target.value);setParcDeleteErr("");}}
                          onKeyDown={e=>e.key==="Enter"&&confirmDeleteParc()}
                          style={{...S.input,border:"1px solid #7f1d1d",background:"#2d0a0a"}}
                          autoFocus
                        />
                        {parcDeleteErr&&<div style={{fontSize:12,color:"#fca5a5",marginTop:6}}>{parcDeleteErr}</div>}
                      </div>
                      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                        <button onClick={()=>{setParcDeleteId(null);setParcDeleteSenha("");setParcDeleteErr("");}} style={{...btnAcao("#334155","#94a3b8"),padding:"9px 18px",fontSize:13}}>Cancelar</button>
                        <button onClick={confirmDeleteParc} style={{...btnAcao("#dc2626"),padding:"9px 18px",fontSize:13}}>Excluir</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          );
        })()}

      </div>

      {/* ══════════════════════════════════════════════
          DELETION LOG MODAL
      ══════════════════════════════════════════════ */}
      {deletionLogOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:1020,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setDeletionLogOpen(false)}>
          <div style={{background:"#0f1f35",border:"1px solid #7c3aed",borderRadius:14,padding:28,width:"100%",maxWidth:820,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 32px 80px #00000088",display:"flex",flexDirection:"column",gap:16}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#c4b5fd"}}>Log de Exclusões</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{deletionLogLoading?"Carregando...":deletionLogItems.length+" registro"+(deletionLogItems.length!==1?"s":"")+" · mais recentes primeiro"}</div>
              </div>
              <button onClick={()=>setDeletionLogOpen(false)} style={{background:"#334155",border:"none",color:"#94a3b8",borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Fechar</button>
            </div>
            {deletionLogLoading?(
              <div style={{color:"#64748b",textAlign:"center",padding:32,fontSize:13}}>Carregando registros...</div>
            ):deletionLogItems.length===0?(
              <div style={{color:"#64748b",textAlign:"center",padding:32,fontSize:13}}>Nenhuma exclusão registrada.</div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#0f172a",color:"#64748b",fontWeight:700,letterSpacing:0.5}}>
                    {["Tipo","Nome / Empresa","Detalhes","Quem excluiu","Data e hora"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",borderBottom:"1px solid #1e293b",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deletionLogItems.map((e:any,i:number)=>{
                    const typeBadge:any={cliente:{bg:"#0c2744",cl:"#93c5fd",label:"Cliente"},parcelamento:{bg:"#1a0a0a",cl:"#fca5a5",label:"Parcelamento"},usuario:{bg:"#2d1b4e",cl:"#c4b5fd",label:"Usuário"}};
                    const b=typeBadge[e.type]||{bg:"#1e293b",cl:"#e2e8f0",label:e.type};
                    const dt=e.date?new Date(e.date):null;
                    const dtStr=dt?dt.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
                    return(
                      <tr key={i} style={{borderBottom:"1px solid #1e293b"}}>
                        <td style={{padding:"8px 10px"}}><span style={{background:b.bg,color:b.cl,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>{b.label}</span></td>
                        <td style={{padding:"8px 10px",color:"#e2e8f0",fontWeight:600,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name||"—"}</td>
                        <td style={{padding:"8px 10px",color:"#94a3b8",fontSize:11,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.secao||e.cnpj||e.login||"—"}{e.local?` · ${e.local}`:""}</td>
                        <td style={{padding:"8px 10px",color:"#a78bfa",fontWeight:600}}>{e.who||"—"}</td>
                        <td style={{padding:"8px 10px",color:"#64748b",fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{dtStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EMPRESA FORM MODAL
      ══════════════════════════════════════════════ */}
      {clienteFormOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0f1f35",border:"1px solid #245a7c",borderRadius:14,padding:28,width:"100%",maxWidth:680,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px #00000088"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:16,color:"#f1f5f9"}}>{clienteEditCnpj?"Editar Empresa":"Nova Empresa"}</div>
              <button onClick={()=>setClienteFormOpen(false)} style={{background:"transparent",border:"none",color:"#64748b",fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 4px"}} title="Fechar">✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Código</label>
                <input value={clienteForm.cod} onChange={e=>patchForm({cod:e.target.value})} placeholder="Código" style={S.input}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>
                  CNPJ {cnpjFetching&&<span style={{color:"#fbbf24",fontWeight:400,textTransform:"none",letterSpacing:0}}> ⏳ consultando Receita Federal…</span>}
                </label>
                <input
                  value={clienteForm.cnpj}
                  onChange={e=>{const v=e.target.value;patchForm({cnpj:v});setCnpjFetchErr("");if(v.replace(/\D/g,"").length===14)fetchCnpjData(v);}}
                  onBlur={e=>{if(!cnpjFetching)fetchCnpjData(e.target.value);}}
                  placeholder="00.000.000/0000-00"
                  style={{...S.input,borderColor:cnpjFetchErr?"#ef4444":undefined}}
                  disabled={cnpjFetching}
                />
                {cnpjFetchErr&&<div style={{color:"#fca5a5",fontSize:10,marginTop:3}}>{cnpjFetchErr}</div>}
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Razão Social</label>
                <input value={clienteForm.nome} onChange={e=>patchForm({nome:e.target.value})} placeholder="Nome da empresa" style={S.input}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Regime</label>
                <input value={clienteForm.regime} onChange={e=>patchForm({regime:e.target.value})} placeholder="Regime" style={S.input}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Atividade</label>
                <select value={clienteForm.atividade} onChange={e=>{const v=e.target.value;patchForm(v.toLowerCase().includes("serviço")?{atividade:v}:{atividade:v,enviaIss:false,loginIss:"",senhaIss:"",emailEnvioIss:""});}} style={S.input}>
                  <option value="Serviço">Serviço</option>
                  <option value="Comércio">Comércio</option>
                  <option value="Indústria">Indústria</option>
                  <option value="Serviço/Comércio">Serviço/Comércio</option>
                  <option value="Indústria/Comércio">Indústria/Comércio</option>
                  <option value="Serviço/Indústria">Serviço/Indústria</option>
                  <option value="Serviço/Indústria/Comércio">Serviço/Indústria/Comércio</option>
                </select>
              </div>
              {clienteForm.atividade.toLowerCase().includes("serviço")&&(
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,background:"#061729",border:`1px solid ${clienteForm.enviaIss?"#f59e0b":"#245a7c"}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:clienteForm.enviaIss?"#fbbf24":"#bfefff",fontWeight:800,cursor:"pointer",transition:"border-color .15s,color .15s"}}>
                    <input type="checkbox" checked={clienteForm.enviaIss} onChange={e=>patchForm({enviaIss:e.target.checked})} style={{accentColor:"#f59e0b"}}/>
                    ENVIA ISS?
                    {clienteForm.enviaIss&&<span style={{marginLeft:6,fontSize:10,fontWeight:600,color:"#86efac"}}>✓ SIM — preencha as credenciais abaixo</span>}
                  </label>
                </div>
              )}
              <div style={{gridColumn:"1 / -1"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,background:"#061729",border:`1px solid ${clienteForm.confereSiga?"#a78bfa":"#245a7c"}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:clienteForm.confereSiga?"#a78bfa":"#bfefff",fontWeight:800,cursor:"pointer",transition:"border-color .15s,color .15s"}}>
                  <input type="checkbox" checked={clienteForm.confereSiga} onChange={e=>patchForm({confereSiga:e.target.checked})} style={{accentColor:"#a78bfa"}}/>
                  CONFERE SIGA?
                  {clienteForm.confereSiga&&<span style={{marginLeft:6,fontSize:10,fontWeight:600,color:"#86efac"}}>✓ SIM — aparece na lista do T-SIGA</span>}
                </label>
              </div>
              {clienteForm.atividade.toLowerCase().includes("serviço")&&clienteForm.enviaIss&&(
                <div style={{gridColumn:"1 / -1",background:"#050f1d",border:"1px solid #92400e",borderRadius:10,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#fbbf24",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>🔐 Credenciais ISS</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                    <div>
                      <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Login ISS</label>
                      <input value={clienteForm.loginIss} onChange={e=>patchForm({loginIss:e.target.value})} placeholder="Login da prefeitura" style={S.input}/>
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Senha ISS</label>
                      <input value={clienteForm.senhaIss} onChange={e=>patchForm({senhaIss:e.target.value})} placeholder="Senha" style={S.input}/>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                      <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Email Envio</label>
                      <input type="email" value={clienteForm.emailEnvioIss} onChange={e=>patchForm({emailEnvioIss:e.target.value})} placeholder="email@empresa.com" style={S.input}/>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Grupo</label>
                <select value={clienteForm.grupo} onChange={e=>patchForm({grupo:e.target.value,tarefas:getTarefas(e.target.value).join("\n")})} style={S.input}>
                  <option value="normal">Regime Normal</option>
                  <option value="simples">Simples Nacional</option>
                  <option value="mei">MEI</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Município</label>
                <input value={clienteForm.municipio} onChange={e=>patchForm({municipio:e.target.value})} placeholder="Ex: Fortaleza" style={S.input}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>UF</label>
                <input value={clienteForm.uf} onChange={e=>patchForm({uf:e.target.value.toUpperCase().slice(0,2)})} placeholder="CE" style={S.input}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Responsável</label>
                <select value={clienteForm.responsavel} onChange={e=>patchForm({responsavel:e.target.value})} style={S.input}>
                  <option value="">Sem responsável</option>
                  {users.filter(u=>u.role==="operador").map(u=><option key={u.id} value={u.name.toUpperCase()}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:4,display:"block"}}>Prioridade</label>
                <input type="number" min="1" max="5" value={clienteForm.prioridade} onChange={e=>patchForm({prioridade:e.target.value})} placeholder="1–5" style={S.input}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,background:"#061729",border:"1px solid #245a7c",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#bfefff",fontWeight:800,cursor:"pointer"}}>
                  <input type="checkbox" checked={clienteForm.declaracaoAnual} onChange={e=>patchForm({declaracaoAnual:e.target.checked})}/>
                  DECLARAÇÃO ANUAL
                </label>
              </div>
              {/* ── TAREFAS ── */}
              <div style={{gridColumn:"1 / -1"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <label style={{fontSize:10,color:"#7dd8f0",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>
                    Tarefas ({parseTarefas(clienteForm.tarefas).length})
                  </label>
                  <button
                    type="button"
                    onClick={()=>{setNovaTarefaOpen(v=>!v);setNovaTarefaErro("");setNovaTarefaForm(novaTarefaEmpty);}}
                    style={{background:novaTarefaOpen?"#334155":"#1e3a5a",border:"1px solid #245a7c",color:novaTarefaOpen?"#94a3b8":"#7dd8f0",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}
                  >
                    {novaTarefaOpen?"✕ Cancelar":"+ Adicionar Tarefa"}
                  </button>
                </div>

                {/* Lista de tarefas existentes */}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:novaTarefaOpen?12:0}}>
                  {parseTarefas(clienteForm.tarefas).map((t,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:"#0c1f35",border:"1px solid #1e3a5a",borderRadius:6,padding:"4px 8px 4px 10px",fontSize:11,fontWeight:600,color:"#e2e8f0"}}>
                      <span>{t}</span>
                      <button
                        type="button"
                        title="Remover tarefa"
                        onClick={()=>{
                          const lista=parseTarefas(clienteForm.tarefas).filter((_,j)=>j!==i);
                          patchForm({tarefas:lista.join("\n")});
                        }}
                        style={{background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,lineHeight:1,padding:"0 2px",display:"flex",alignItems:"center"}}
                      >✕</button>
                    </div>
                  ))}
                  {parseTarefas(clienteForm.tarefas).length===0&&(
                    <div style={{fontSize:11,color:"#4a6a8a",fontStyle:"italic",padding:"4px 0"}}>Nenhuma tarefa. Adicione pelo menos uma.</div>
                  )}
                </div>

                {/* Mini-formulário de nova tarefa */}
                {novaTarefaOpen&&(
                  <div style={{background:"#050f1d",border:"1px solid #245a7c",borderRadius:10,padding:"14px 16px",marginTop:4}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#7dd8f0",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Nova Tarefa</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:10}}>
                      <div>
                        <label style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:4,display:"block"}}>TÍTULO <span style={{color:"#ef4444"}}>*</span></label>
                        <input
                          value={novaTarefaForm.titulo}
                          onChange={e=>setNovaTarefaForm(p=>({...p,titulo:e.target.value.toUpperCase()}))}
                          placeholder="Ex: REVISÃO MENSAL"
                          style={{...S.input,fontSize:12}}
                          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();}}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:4,display:"block"}}>TIPO</label>
                        <select
                          value={novaTarefaForm.tipo}
                          onChange={e=>setNovaTarefaForm(p=>({...p,tipo:e.target.value as "data"|"descricao",valor:""}))}
                          style={{...S.input,fontSize:12}}
                        >
                          <option value="data">Data</option>
                          <option value="descricao">Descrição</option>
                        </select>
                      </div>
                    </div>
                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:4,display:"block"}}>
                        {novaTarefaForm.tipo==="data"?"DATA INICIAL (opcional)":"DESCRIÇÃO (opcional)"}
                      </label>
                      {novaTarefaForm.tipo==="data"?(
                        <input
                          type="date"
                          value={novaTarefaForm.valor}
                          onChange={e=>setNovaTarefaForm(p=>({...p,valor:e.target.value}))}
                          style={{...S.input,fontSize:12}}
                        />
                      ):(
                        <input
                          type="text"
                          value={novaTarefaForm.valor}
                          onChange={e=>setNovaTarefaForm(p=>({...p,valor:e.target.value}))}
                          placeholder="Texto descritivo"
                          style={{...S.input,fontSize:12}}
                        />
                      )}
                    </div>
                    {novaTarefaErro&&<div style={{color:"#fca5a5",fontSize:11,marginBottom:8}}>{novaTarefaErro}</div>}
                    <button
                      type="button"
                      onClick={()=>{
                        const titulo=novaTarefaForm.titulo.trim().toUpperCase();
                        if(!titulo){setNovaTarefaErro("Título é obrigatório.");return;}
                        const existentes=parseTarefas(clienteForm.tarefas);
                        if(existentes.some(t=>t.toUpperCase()===titulo)){setNovaTarefaErro("Já existe uma tarefa com este título.");return;}
                        patchForm({tarefas:[...existentes,titulo].join("\n")});
                        setNovaTarefaForm(novaTarefaEmpty);
                        setNovaTarefaErro("");
                        setNovaTarefaOpen(false);
                      }}
                      style={{background:"#1e40af",border:"none",color:"#dbeafe",borderRadius:7,padding:"8px 18px",fontSize:12,fontWeight:800,cursor:"pointer"}}
                    >
                      ✓ Adicionar
                    </button>
                  </div>
                )}
              </div>

              <div style={{gridColumn:"1 / -1",display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
                <button onClick={()=>setClienteFormOpen(false)} style={{padding:"10px 20px",borderRadius:8,background:"#334155",border:"none",color:"#94a3b8",fontWeight:600,cursor:"pointer"}}>Cancelar</button>
                <button onClick={saveCliente} style={{padding:"10px 24px",borderRadius:8,background:"#10b981",border:"none",color:"#052e1b",fontWeight:800,cursor:"pointer"}}>Salvar empresa</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL LOG DE TAREFAS */}
      {taskLogOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setTaskLogOpen(false)}>
          <div style={{background:"#0f1f35",border:"1px solid #245a7c",borderRadius:14,padding:28,width:"100%",maxWidth:900,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 32px 80px #00000099"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:15,color:"#f1f5f9"}}>Log de Desbloqueio de Tarefas</div>
              <button onClick={()=>setTaskLogOpen(false)} style={{background:"#334155",border:"none",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Fechar</button>
            </div>
            {taskLogData.length===0?(
              <div style={{color:"#64748b",textAlign:"center",padding:32}}>Nenhum registro encontrado.</div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#0f172a",color:"#64748b"}}>
                    {["Data/Hora","Usuário","Cliente","Tarefa","Competência","Info Antiga","Info Atual","Motivo"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",borderBottom:"1px solid #1e293b",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taskLogData.map((row,i)=>(
                    <tr key={row.id} style={{borderBottom:"1px solid #1e293b",background:i%2===0?"transparent":"#0a1525"}}>
                      <td style={{padding:"7px 10px",color:"#94a3b8",whiteSpace:"nowrap",fontSize:11}}>{row.timestamp}</td>
                      <td style={{padding:"7px 10px",color:"#7dd8f0",fontWeight:700}}>{row.usuario}</td>
                      <td style={{padding:"7px 10px",color:"#e2e8f0"}}>{row.empresa}</td>
                      <td style={{padding:"7px 10px",color:"#fbbf24",fontWeight:700}}>{row.tarefa}</td>
                      <td style={{padding:"7px 10px",color:"#64748b"}}>{row.mes}</td>
                      <td style={{padding:"7px 10px",color:"#fca5a5"}}>{row.info_antiga||"—"}</td>
                      <td style={{padding:"7px 10px",color:"#86efac",fontWeight:600}}>{row.info_atual||"—"}</td>
                      <td style={{padding:"7px 10px",color:"#e2e8f0"}}>{row.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

