# 🔍 Diagnóstico - Google Sheets Integration

## Problema Relatado
✅ Processo adicionado pelo site com sucesso  
❌ Dados não aparecem na planilha Google Sheets

---

## 📋 Checklist de Diagnóstico

### **1️⃣ Verificar se a API está rodando**

#### **Passo 1.1 - Iniciar a API**
```bash
# Em um terminal separado, execute:
npm run api
```

**✅ Resultado esperado:**
```
🚀 Servidor da API rodando na porta 3001
📊 Endpoint Google Sheets: http://localhost:3001/api/sheets
```

#### **Passo 1.2 - Testar se a API responde**
```bash
# Em outro terminal, teste:
curl http://localhost:3001/health
```

**✅ Resultado esperado:**
```json
{"status":"API funcionando corretamente!"}
```

---

### **2️⃣ Testar conectividade com Google Sheets**

#### **Passo 2.1 - Teste de conectividade**
```bash
curl http://localhost:3001/api/sheets/test
```

**✅ Resultado esperado:**
```json
{
  "message": "Conexão com Google Sheets funcionando!",
  "spreadsheetId": "1WNv8peVjLwu-iJ4vvQFJM5HwpRg8YEBlfchCTWtSojA",
  "sheetName": "GEINFRA",
  "testCell": ["..."]
}
```

**❌ Possíveis erros:**
- `403`: Planilha não compartilhada com service account
- `404`: Planilha não encontrada ou aba "GEINFRA" não existe
- `ENOENT`: Arquivo credenciais.json não encontrado

---

### **3️⃣ Verificar logs do console do navegador**

#### **Passo 3.1 - Abrir DevTools**
1. No navegador, pressione `F12`
2. Vá para a aba "Console"
3. Preencha e submeta um processo
4. Observe as mensagens no console

**✅ Logs esperados:**
```
📊 Iniciando envio para Google Sheets...
📝 Dados preparados com nomes: {...}
✅ Dados enviados para o Google Sheets: {...}
Dados enviados para o Google Sheets
```

**❌ Logs de erro:**
```
❌ Erro ao enviar para o Google Sheets: [erro detalhado]
Erro ao enviar para Google Sheets: [mensagem]
```

---

### **4️⃣ Verificar arquivo .env**

#### **Passo 4.1 - Criar arquivo .env**
```bash
# Na raiz do projeto, crie o arquivo .env:
echo "VITE_API_URL=http://localhost:3001" > .env
```

#### **Passo 4.2 - Reiniciar o frontend**
```bash
# Pare o frontend (Ctrl+C) e inicie novamente:
npm run dev
```

---

### **5️⃣ Teste manual do endpoint**

#### **Passo 5.1 - Teste com dados fictícios**
```bash
curl -X POST http://localhost:3001/api/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "TESTE/2024",
    "object": "Processo de teste via API",
    "total_portaria_value": 1000000,
    "total_concedente_value": 800000,
    "total_proponente_value": 200000,
    "vigencia_date": "2024-12-31",
    "status_id": 1,
    "municipality_id": 1,
    "municipality_name": "Município Teste",
    "regional_nucleus_name": "Núcleo Teste"
  }'
```

**✅ Resultado esperado:**
```json
{
  "message": "Dados salvos na planilha!",
  "timestampId": "2024-01-15T...",
  "insertedRange": "GEINFRA!A[número]:S[número]"
}
```

---

## 🛠️ Soluções para Problemas Comuns

### **❌ Erro 403 - Permissão Negada**
**Solução:**
1. Compartilhe a planilha com: `formulario-de-processos@formulario-de-processos.iam.gserviceaccount.com`
2. Dê permissão de "Editor"

### **❌ Erro 404 - Planilha/Aba não encontrada**
**Solução:**
1. Verifique se o ID da planilha está correto: `1WNv8peVjLwu-iJ4vvQFJM5HwpRg8YEBlfchCTWtSojA`
2. Certifique-se de que existe uma aba chamada "GEINFRA"

### **❌ API não responde**
**Solução:**
1. Verifique se executou `npm install`
2. Confirme que o arquivo `credenciais.json` existe na raiz
3. Execute `npm run api` em terminal separado

### **❌ Frontend não conecta com API**
**Solução:**
1. Crie arquivo `.env` com `VITE_API_URL=http://localhost:3001`
2. Reinicie o frontend após criar o `.env`

### **❌ Dados não aparecem na planilha**
**Solução:**
1. Verifique se os logs mostram "Dados enviados para o Google Sheets"
2. Teste o endpoint manualmente
3. Verifique se está olhando a aba "GEINFRA" correta

---

## 📊 Status Esperado Após Correções

### **Console da API:**
```
🚀 Servidor da API rodando na porta 3001
📊 Endpoint Google Sheets: http://localhost:3001/api/sheets
📊 Recebendo dados para Google Sheets: {...}
📝 Dados preparados para inserção: [...]
✅ Dados inseridos com sucesso no Google Sheets: {...}
```

### **Console do Navegador:**
```
📊 Iniciando envio para Google Sheets...
📝 Dados preparados com nomes: {...}
✅ Dados enviados para o Google Sheets: {...}
Dados enviados para o Google Sheets
```

### **Planilha Google Sheets:**
- Nova linha adicionada na aba "GEINFRA"
- Dados nas colunas A-S conforme especificado
- Timestamp único na coluna A

---

## 🆘 Se o problema persistir

Execute este comando e compartilhe o resultado:

```bash
# Teste completo
echo "=== TESTE DE DIAGNÓSTICO COMPLETO ==="
echo "1. Testando API:"
curl -s http://localhost:3001/health || echo "❌ API não responde"
echo ""
echo "2. Testando Google Sheets:"
curl -s http://localhost:3001/api/sheets/test || echo "❌ Google Sheets não conecta"
echo ""
echo "3. Verificando arquivos:"
ls -la credenciais.json .env 2>/dev/null || echo "❌ Arquivos não encontrados"
```