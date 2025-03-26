# CellService - Sistema de Gerenciamento de Assistência Técnica

Este é um sistema web para gerenciamento de assistência técnica de celulares, conectado ao Google Drive como banco de dados usando a API do Google Sheets.

## Configuração Inicial

### 1. Criar Projeto no Google Cloud Platform

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative as seguintes APIs:
   - Google Sheets API
   - Google Drive API
   - Identity Services API

### 2. Configurar Credenciais

1. Vá para "APIs & Serviços" > "Credenciais"
2. Crie uma Chave de API
3. Crie um ID de Cliente OAuth 2.0 (tipo Web)
4. Configure as origens JavaScript autorizadas para incluir seu domínio
5. Copie a Chave de API e o ID do Cliente e substitua nos valores correspondentes no código JavaScript:

```javascript
const API_KEY = 'SUA_CHAVE_DE_API';
const CLIENT_ID = 'SEU_ID_DE_CLIENTE';
```

### 3. Criar Planilhas no Google Sheets

1. Crie duas planilhas no Google Sheets:
   - Uma para Clientes com as colunas: Nome, Email, Telefone, Serviços
   - Uma para Serviços com as colunas: Cliente, Tipo de Serviço, IMEI, Marca, Modelo, Valor, Forma de Pagamento, Data, Status, Observações
2. Copie os IDs das planilhas (da URL) e substitua no código:

```javascript
const CLIENTS_SHEET_ID = 'ID_DA_PLANILHA_DE_CLIENTES';
const SERVICES_SHEET_ID = 'ID_DA_PLANILHA_DE_SERVICOS';
```

3. Certifique-se de ajustar os nomes das abas das planilhas no código se necessário:

```javascript
const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: CLIENTS_SHEET_ID,
    range: 'Clientes!A2:E', // Ajuste o nome da aba aqui
});
```

### 4. Hospedagem

Para hospedar o sistema:

1. Coloque todos os arquivos em um servidor web
2. Ou utilize serviços como GitHub Pages, Netlify, ou Vercel
3. Certifique-se de configurar corretamente os domínios autorizados no Google Cloud Console

## Estrutura de Arquivos

- `index.html`: Estrutura principal da interface
- `style.css`: Estilos adicionais (se necessário)
- `main.js`: Funções principais de gerenciamento e API
- `form-handlers.js`: Manipuladores para formulários

## Funcionalidades Implementadas

- ✅ Autenticação com Google
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de Clientes
- ✅ Gerenciamento de Serviços
- ✅ Filtros e busca
- ✅ Atualizações de status
- ✅ Relatórios

## Integrações Disponíveis

O sistema está preparado para:

- Envio de notificações por e-mail
- Exportação de relatórios em PDF e Excel
- Integração com API de pagamento
- Integração com API de SMS

## Customização

### Adicionar Novos Campos

Para adicionar novos campos aos formulários:

1. Atualize os formulários HTML
2. Modifique as funções de manipulação no JavaScript
3. Atualize as estruturas nas planilhas do Google Sheets

### Alterar Layout

O sistema usa Tailwind CSS para estilização. Para alterar o layout:

1. Modifique as classes nos elementos HTML
2. Ou adicione estilos personalizados em um arquivo CSS separado

## Suporte

Para dúvidas ou suporte adicional, entre em contato com o desenvolvedor.

---

**Nota**: Este sistema é uma solução leve e eficiente para gerenciamento de assistência técnica de celulares, utilizando o Google Sheets como banco de dados, ideal para pequenos negócios que desejam uma solução com custo mínimo de hospedagem.
