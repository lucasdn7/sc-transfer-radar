# 🚀 Quick Start - Google Sheets Integration

## Configuração Rápida

### 1. Definir ID da Planilha
```javascript
// Em api/sheets.js, linha 8:
const SPREADSHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI';
```

### 2. Compartilhar Planilha
Compartilhe sua planilha com:
```
formulario-de-processos@formulario-de-processos.iam.gserviceaccount.com
```

### 3. Criar Aba "Página11"
Certifique-se de que existe uma aba chamada "Página11" na planilha.

### 4. Criar arquivo .env
```bash
VITE_API_URL=http://localhost:3001
```

## Executar

### Terminal 1 - API:
```bash
npm run api
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

## Testar

### Teste de conectividade:
```bash
curl http://localhost:3001/api/sheets/test
```

### No formulário:
1. Preencha um processo
2. Submeta o formulário
3. Verifique os logs: `"Dados enviados para o Google Sheets"`

## 📚 Documentação Completa
Ver: `INTEGRACAO_GOOGLE_SHEETS.md`

---

**✅ Tudo funcionando? Os dados aparecerão automaticamente na planilha!**