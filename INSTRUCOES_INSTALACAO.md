# Sistema Fiscal Tesserato 0.0.1

## O que esta versao entrega

- Sistema web acessado pelo navegador.
- Banco local SQLite em `data/fiscal-system.sqlite`.
- Usuarios, empresas, tarefas, observacoes, MIT e progresso mensal ficam salvos de forma permanente.
- Um computador servidor roda o sistema.
- Os demais computadores acessam pelo navegador usando o IP do servidor.

## Requisitos do servidor

- Windows 10/11 ou Windows Server.
- Node.js 24 ou superior.
- Porta liberada no firewall, por padrao `3000`.

## Instalacao no servidor

1. Copie a pasta `fiscal-system` para o servidor.
2. Abra o PowerShell dentro da pasta `fiscal-system`.
3. Instale as dependencias:

```powershell
npm install
```

4. Gere a versao final do frontend:

```powershell
npm run build
```

5. Inicie o sistema:

```powershell
npm run start
```

Alternativa: execute o arquivo `start-fiscal-system.bat`.

## Acesso no servidor

No proprio servidor, abra:

```text
http://localhost:3000
```

Esse endereco deve ser usado apenas no proprio servidor. Em outros computadores, `localhost` aponta para o computador do usuario e as alteracoes nao chegam ao banco do servidor.

## Acesso nos demais computadores

1. Descubra o IP do servidor:

```powershell
ipconfig
```

2. Nos outros computadores, abra no navegador:

```text
http://IP-DO-SERVIDOR:3000
```

Exemplo:

```text
http://192.168.0.10:3000
```

As chamadas da interface para a API usam o mesmo servidor aberto no navegador. Se precisar servir o frontend separado da API, gere o build informando o endereco do servidor:

```powershell
$env:VITE_API_BASE_URL="http://IP-DO-SERVIDOR:3000"
npm run build
```

## Liberar no firewall do Windows

No servidor, abra PowerShell como Administrador e rode:

```powershell
New-NetFirewallRule -DisplayName "Sistema Fiscal Tesserato" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Fazer o sistema iniciar junto com o Windows

Opcao simples pelo Agendador de Tarefas:

1. Abra "Agendador de Tarefas".
2. Crie uma tarefa basica.
3. Gatilho: "Ao iniciar o computador".
4. Acao: "Iniciar um programa".
5. Programa: selecione `start-fiscal-system.bat`.
6. Marque para executar mesmo sem usuario logado, se o Windows permitir.

## Backup

O banco fica em:

```text
data/fiscal-system.sqlite
```

Para backup, copie esse arquivo com o sistema parado. Guarde tambem uma copia da pasta inteira `fiscal-system`.

## Atualizacao futura

1. Pare o sistema.
2. Faca backup de `data/fiscal-system.sqlite`.
3. Substitua os arquivos da aplicacao.
4. Rode:

```powershell
npm install
npm run build
npm run start
```

## Observacoes

- Nao use `npm run dev` em producao. Use `npm run start`.
- O primeiro acesso cria o banco automaticamente.
- O banco SQLite fica no servidor, em `data/fiscal-system.sqlite`; nao ha string de conexao usando `127.0.0.1`.
- Se a porta `3000` ja estiver em uso, inicie com outra porta:

```powershell
$env:PORT="3001"
npm run start
```
