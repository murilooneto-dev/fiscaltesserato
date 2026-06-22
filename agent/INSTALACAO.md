# Fiscal Agente — Instalação

## Pré-requisitos

Instale os itens abaixo **antes** de rodar o instalador:

1. **Python 3.11 ou superior**
   - Acesse: https://www.python.org/downloads/
   - Na tela de instalação, marque **"Add Python to PATH"**

2. **Google Chrome**
   - Acesse: https://www.google.com/chrome/

---

## Instalação

1. Copie a pasta `agent/` para o computador do operador
2. Execute **`instalar_dependencias.bat`** (pode demorar alguns minutos na primeira vez)

---

## Configuração

1. Na pasta `agent/`, copie o arquivo `agent.env.example` e renomeie para **`agent.env`**
2. Abra o `agent.env` com o Bloco de Notas e preencha:

```
LOGIN=login_do_operador
SENHA=senha_do_operador
SERVIDOR=ip_do_servidor:3000
```

> O LOGIN e SENHA são os mesmos usados para entrar no sistema Fiscal Tesserato.
> O SERVIDOR é o endereço IP da máquina onde o sistema está instalado.

---

## Uso diário

- Execute **`iniciar.bat`** para iniciar o agente
- Um ícone aparecerá na bandeja do Windows (canto inferior direito)
- Verde = conectado ao servidor | Vermelho = desconectado
- Duplo clique no ícone abre a janela de logs

---

## Estrutura da pasta

```
agent/
  agent_tray.py              — programa principal do agente
  agent.env                  — configurações (login, senha, servidor)
  agent.env.example          — modelo de configuração
  iniciar.bat                — inicia o agente
  instalar_dependencias.bat  — instala dependências (rodar uma vez)
  requirements.txt           — dependências Python do agente
  T-ISS/                     — bot de ISS Municipal
  T-SIGA/                    — bot de SEFAZ SIGA
  T-MEI/                     — bot de Portal MEI
```

---

## Solução de problemas

**O agente pisca e fecha ao iniciar**
- Verifique se o arquivo `agent.env` existe na pasta `agent/`
- Confirme que LOGIN, SENHA e SERVIDOR estão preenchidos

**Erro: Python não encontrado**
- Reinstale o Python marcando "Add Python to PATH"
- Feche e abra um novo terminal após a instalação

**Agente aparece offline no sistema**
- Verifique se o endereço `SERVIDOR` está correto
- Confirme que o servidor Fiscal Tesserato está rodando
- Verifique se o firewall não está bloqueando a porta 3000
