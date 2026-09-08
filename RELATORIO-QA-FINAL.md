# Relatório final de QA — Etapa 13

## 1. Resumo das alterações entregues

- O shell do dashboard passou a usar o breadcrumb global do aplicativo, que é alimentado pela configuração central do menu.
- O contêiner externo do dashboard recebeu apenas proteções de responsividade (`w-full`, `min-w-0` e espaçamentos responsivos); a composição interna dos cards foi preservada.
- Os indicadores do dashboard direcionam para as telas correspondentes, com parâmetros de filtro para portarias, contratos assinados e situação de repasse.
- A página de processos interpreta os parâmetros de filtro recebidos da navegação do dashboard.
- Foi incluída uma mensagem de erro geral para falhas de renderização do dashboard, com ação de recarregamento.
- O backlog de melhorias futuras de cards está registrado em [`BACKLOG-DASHBOARD.md`](./BACKLOG-DASHBOARD.md).

## 2. Rotas preservadas e rota nova

### Rotas verificadas por smoke test HTTP

| Grupo | Rotas |
| --- | --- |
| Início e visão geral | `/`, `/dashboard` |
| Monitoramento | `/processes`, `/process-timeline`, `/process-calendar`, `/monitoring/alerts` |
| Território | `/municipalities`, `/municipalities/:id`, `/municipalities/inconsistencies`, `/regional-nuclei`, `/map` |
| Análises e relatórios | `/indicators`, `/charts`, `/reports` |
| Apoio | `/documents`, `/dart`, `/fluxograma` |
| Administração e acesso | `/settings`, `/app-settings`, `/auth`, `/technical-auth`, `/favorites` |

A rota nova é `/monitoring/alerts`. Ela está declarada no roteador e disponível na navegação de **Monitoramento**. A rota `/favorites` também permanece declarada; seu conteúdo exige usuário técnico autenticado e redireciona acessos não autorizados para `/`.

## 3. Novas categorias de navegação

A configuração central de navegação contém as categorias:

1. Visão geral;
2. Monitoramento;
3. Território;
4. Análises e relatórios;
5. Apoio;
6. Administração.

## 4. Problemas encontrados, não corrigidos por dependerem de backend/dados

- **Dados territoriais (Etapa 7):** a tela de inconsistências somente identifica CNPJ duplicado, nome duplicado e nomes similares a partir da tabela `municipalities`. A correção dos cadastros duplicados, ausentes ou divergentes depende da fonte de dados/backend e não foi aplicada neste ciclo.
- **Indicadores e Gráficos (Etapa 8.5):** as telas `/indicators` e `/charts` permanecem dependentes das consultas de métricas do Supabase. A consolidação e a validação de valores dependem de dados de processos, parcelas, municípios e núcleos disponíveis no backend; nenhuma mudança de métrica ou de gráfico foi feita nesta etapa.
- **Dados para filtros de repasse:** os filtros de repasse da tela de processos dependem de parcelas com `payment_date` consistentes. Processos sem parcelas ou com dados de pagamento incompletos podem não representar a situação operacional esperada até a correção dos dados de origem.

## 5. Integridade dos cards do dashboard

**Confirmado:** nenhum arquivo em `src/components/dashboard/` foi alterado nesta entrega ou na Etapa 12. A revisão do diff contra o commit anterior à Etapa 12 confirmou que as únicas alterações funcionais do dashboard estão no shell de `src/pages/Dashboard.tsx`; títulos, valores, ordem, estilos, ícones, gráficos e espaçamentos internos dos cards permanecem inalterados.

## 6. Resultado das verificações

| Verificação | Resultado | Observação |
| --- | --- | --- |
| `npm run build` | Aprovado | O build de produção do Vite foi concluído. |
| `npm run lint` | Reprovado | Há 170 erros e 21 avisos já presentes no repositório, sobretudo `no-explicit-any` e regras de hooks, distribuídos por arquivos fora do escopo desta etapa. |
| Smoke test de rotas | Aprovado | Todas as rotas da tabela retornaram HTTP 200 pelo servidor Vite local. |
| Teste visual/manual em desktop, tablet, mobile, temas e teclado | Pendente por limitação de ambiente | Não há navegador/Playwright disponível no ambiente. A tentativa de obter Playwright via `npx` foi bloqueada pelo registro de pacotes (HTTP 403). Portanto, este relatório não declara uma validação visual/manual que não pôde ser executada. |
| Estados de carregamento, erro e ausência de dados | Revisão estática realizada | As páginas consultadas contêm estados implementados; a execução com dados reais do Supabase permanece pendente de ambiente com browser e backend acessível. |

O projeto não possui suíte de testes automatizados. Assim, não houve testes automatizados adicionais a executar além de lint, build e smoke test HTTP.

## 7. Próxima fase

As melhorias de cards que foram conscientemente adiadas estão detalhadas em [`BACKLOG-DASHBOARD.md`](./BACKLOG-DASHBOARD.md). Elas devem ser tratadas em uma etapa específica, com comparação visual e validação de acessibilidade antes de qualquer alteração nos cards.
