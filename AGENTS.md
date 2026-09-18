# Sistema de Notificações Automáticas - Transfer Radar

## Funcionamento

O sistema de notificações agora é **totalmente automático** e funciona da seguinte maneira:

### 1. Automação Baseada em Vigência de Processos

As notificações são criadas automaticamente quando os processos entram em períodos específicos de vencimento, com sistema de cores diferenciado:

- **30 dias antes do vencimento**: Notificação info (🔵 Azul)
- **15 dias antes do vencimento**: Notificação warning (🟡 Amarelo)  
- **7 dias antes do vencimento**: Notificação important (🟠 Laranja)
- **No dia do vencimento**: Notificação critical (🔴 Vermelho)
- **Atualizações de vigência**: Notificação informative (⚪ Cinza)

### 2. Mecanismo de Automação

A automação funciona em dois níveis:

#### Nível 1: Verificação Automática (Client-side)
- A cada 60 segundos, o componente `NotificationCenter` verifica automaticamente se há processos entrando nos períodos de vencimento
- Chama a função SQL `create_expiration_notifications()` automaticamente
- Em seguida, busca as notificações atualizadas para exibir ao usuário

#### Nível 2: Trigger de Atualização (Server-side)
- Quando a vigência de um processo é atualizada, um trigger SQL cria automaticamente uma notificação informativa
- Isso garante que mudanças manuais de vigência sejam notificadas imediatamente

### 3. Evitação de Duplicatas

O sistema inteligentemente evita notificações duplicadas:

- Para vencimentos (30, 15, 7 dias): Verifica se já existe uma notificação com "vence em" nas últimas 24 horas para o mesmo processo
- Para vencimentos críticos: Verifica se já existe uma notificação crítica nos últimos 7 dias para o mesmo processo

### 4. Interface do Usuário

No frontend:

- Ícone de sino no header mostra notificações
- Badge vermelho indica quantidade de notificações não lidas
- Ao clicar, abre painel com últimas 10 notificações
- Notificações podem ser marcadas como lidas individualmente
- Atualização automática a cada 60 segundos sem necessidade de ação manual

### 5. Tipos de Notificações e Sistema de Cores

O sistema utiliza uma escala de cores para indicar urgência:

- **Critical (🔴 Vermelho)**: Processos vencidos ou vencendo hoje
- **Important (🟠 Laranja)**: Processos vencendo em 7 dias
- **Warning (🟡 Amarelo)**: Processos vencendo em 15 dias
- **Info (🔵 Azul)**: Processos vencendo em 30 dias
- **Informative (⚪ Cinza)**: Atualizações de vigência de processos

As notificações agora são simplificadas, mostrando apenas:
- Número do processo
- Tempo restante para vencimento
- Cor correspondente ao nível de urgência

### 6. Segurança

- Políticas RLS aplicadas: Usuários autenticados podem ver notificações públicas ou destinadas a eles
- As notificações são públicas (`is_public = true`) para serem visíveis por todos os usuários autenticados

## Correções Realizadas

1. **Erro "Failed to fetch"**: Corrigido adicionando política RLS para permitir leitura de notificações públicas por usuários autenticados
2. **Tipo de dados notification_type**: Corrigido o tipo de parâmetro na função SQL para usar o tipo enum correto
3. **Automação real**: Removida dependência de ação manual, agora é automático a cada 60 segundos
4. **Filtro de duplicatas**: Melhorado para verificar especificamente notificações de vencimento vs notificações de atualização
5. **Sistema de cores melhorado**: Implementado sistema de cores diferenciado (azul > amarelo > laranja > vermelho) para indicar urgência
6. **Notificações simplificadas**: Removido objeto das notificações, agora mostram apenas número do processo e prazo
7. **Legenda visual**: Adicionada legenda de cores dentro da caixa de notificação para fácil entendimento

## Como Testar

1. Altere a vigência de um processo para 30 dias a partir de hoje
2. Aguarde até 60 segundos ou abra o painel de notificações
3. A notificação aparecerá automaticamente

Para testes rápidos, você pode executar:
```sql
SELECT public.create_expiration_notifications();
```

Isso forçará a verificação imediata de todos os processos e criação de notificações necessárias.