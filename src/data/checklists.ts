export interface LegalBasis {
  reference: string;
  url: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  guide: string;
  basis: LegalBasis[];
  condition?: string;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

export interface ChecklistDefinition {
  id: 'fomento' | 'convenio' | 'simplificado';
  title: string;
  shortTitle: string;
  description: string;
  summary: string;
  groups: ChecklistGroup[];
}

const federal13019 = 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13019compilado.htm';
const federal14133 = 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm';
const mroscState = 'https://leis.alesc.sc.gov.br/ato-normativo/50157/compilado';
const convenioState = 'https://leis.alesc.sc.gov.br/ato-normativo/50393';
const simplifiedLaw = 'https://leis.alesc.sc.gov.br/ato-normativo/22611';
const simplifiedDecree = 'https://www.sef.sc.gov.br/api/download?id=6640&mime=application%2Fpdf&nomeArquivo=3.+CS+-+Decreto+766+-+22.11.2024+-+Regulamenta+a+Lei+n.+19.903.2024.pdf';
const pgeSimplifiedOpinion = 'https://www.pge.sc.gov.br/wp-content/uploads/2024/11/Parecer-Referencial-n.-8-2024-PGE.pdf';

const item = (
  id: string,
  title: string,
  guide: string,
  basis: LegalBasis[],
  condition?: string,
): ChecklistItem => ({ id, title, guide, basis, condition });

const law = (reference: string, url: string): LegalBasis => ({ reference, url });

export const CHECKLISTS: ChecklistDefinition[] = [
  {
    id: 'fomento',
    title: 'Termo de Fomento',
    shortTitle: 'Fomento',
    description: 'Parceria entre o Estado e uma organização da sociedade civil cuja proposta parte da OSC.',
    summary: 'Confira a proposta e o plano de trabalho, os requisitos da organização e os documentos complementares antes da celebração da parceria.',
    groups: [
      {
        id: 'proposta',
        title: 'Proposta de transferência',
        description: 'Itens que compõem o plano de trabalho e a proposta da parceria.',
        items: [
          item('f-1-1', 'Objeto específico e finalidade', 'Confira se a proposta identifica com precisão o que será realizado e qual finalidade pública a parceria pretende atender.', [law('Lei nº 13.019/2014, art. 22, I', federal13019), law('Decreto SC nº 1.196/2017, art. 13, § 1º, I', mroscState)]),
          item('f-1-2', 'Descrição da realidade e vínculo com a proposta', 'Verifique se o plano apresenta a situação que motiva a parceria e conecta essa necessidade às atividades, projetos e metas propostos.', [law('Lei nº 13.019/2014, art. 22, I e II-A', federal13019), law('Decreto SC nº 1.196/2017, art. 13, § 1º, II', mroscState)]),
          item('f-1-3', 'Previsão de receitas e despesas', 'Confira se estão identificadas as fontes de receita e as despesas previstas para executar as atividades ou projetos.', [law('Lei nº 13.019/2014, art. 22, II-A', federal13019)]),
          item('f-1-4', 'Resultados esperados', 'Verifique se os resultados pretendidos estão descritos de forma relacionada ao objeto da parceria.', [law('Decreto SC nº 1.196/2017, art. 13, § 1º, III', mroscState)]),
          item('f-1-5', 'Metas, atividades, projetos e indicadores', 'Confira se as metas são identificáveis, se as atividades previstas estão relacionadas a elas e se há indicadores para aferir seu cumprimento.', [law('Lei nº 13.019/2014, art. 22, II', federal13019), law('Decreto SC nº 1.196/2017, art. 13, § 1º, IV', mroscState)]),
          item('f-1-6', 'Prazos e forma de execução', 'Verifique se o plano indica como e quando as atividades serão executadas e como os prazos se relacionam às metas.', [law('Lei nº 13.019/2014, art. 22, III e IV', federal13019), law('Decreto SC nº 1.196/2017, art. 13, § 1º, V', mroscState)]),
          item('f-1-7', 'Valor total da parceria', 'Confira se o valor total está explicitado e é compatível com os valores previstos nas demais partes da proposta.', [law('Decreto SC nº 1.196/2017, art. 13, § 1º, VI', mroscState)]),
          item('f-1-8', 'Plano de aplicação dos recursos', 'Verifique se o plano discrimina a aplicação dos recursos do concedente e da OSC e relaciona os bens e serviços previstos ao orçamento de referência ou projeto básico.', [law('Decreto SC nº 1.196/2017, art. 19, II', mroscState)]),
          item('f-1-9', 'Contrapartida em bens ou serviços', 'Quando houver contrapartida não financeira, confira a descrição dos bens ou serviços e os valores estimados correspondentes.', [law('Decreto SC nº 1.196/2017, art. 19, III', mroscState)], 'Quando houver contrapartida em bens ou serviços.'),
          item('f-1-10', 'Cronograma financeiro', 'Confira se o cronograma financeiro é compatível com as despesas e com o cronograma de execução, incluindo os aportes de contrapartida financeira, quando previstos.', [law('Decreto SC nº 1.196/2017, art. 19, IV', mroscState)]),
          item('f-1-11', 'Receitas previstas durante a execução', 'Verifique se foram indicadas as receitas que poderão ser obtidas durante a execução do objeto.', [law('Decreto SC nº 1.196/2017, art. 19, V', mroscState)]),
          item('f-1-12', 'Local de execução e público-alvo', 'Confira se o local ou região de execução e o público beneficiário estão identificados.', [law('Decreto SC nº 1.196/2017, art. 19, VI', mroscState)]),
        ],
      },
      {
        id: 'documentos-osc',
        title: 'Documentos e requisitos da OSC',
        description: 'Comprovações de regularidade, constituição e capacidade da organização.',
        items: [
          item('f-2-1', 'Certidões de regularidade', 'Confira as certidões fiscais, previdenciárias, tributárias, trabalhistas, de contribuições e de dívida ativa exigíveis para a OSC.', [law('Lei nº 13.019/2014, art. 34, II', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IV a VI', mroscState)]),
          item('f-2-2', 'Existência jurídica e estatuto', 'Verifique o registro que comprova a existência jurídica da OSC e o estatuto vigente, incluindo alterações. Para cooperativa, confira a certidão simplificada aplicável.', [law('Lei nº 13.019/2014, art. 34, III', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IX, “a”', mroscState)]),
          item('f-2-3', 'Ata de eleição da direção atual', 'Confira a ata que registra a eleição dos dirigentes em exercício e sua correspondência com a composição informada pela organização.', [law('Lei nº 13.019/2014, art. 34, V', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IX, “b”', mroscState)]),
          item('f-2-4', 'Relação atualizada de dirigentes', 'Confira se a relação identifica cada dirigente e contém os dados e comprovantes exigidos, inclusive residência, identidade e CPF.', [law('Lei nº 13.019/2014, art. 34, VI', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IX, “c”', mroscState)]),
          item('f-2-5', 'Comprovação de funcionamento no endereço declarado', 'Verifique se há documento que vincule o funcionamento da OSC ao endereço informado.', [law('Lei nº 13.019/2014, art. 34, VI', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IX, “d”', mroscState)]),
          item('f-2-6', 'Tempo de existência e cadastro ativo', 'Confira a comprovação de inscrição ativa no CNPJ pelo período exigível para o caso concreto e conforme a legislação aplicável.', [law('Lei nº 13.019/2014, art. 33, V, “a”', federal13019), law('Decreto SC nº 1.196/2017, art. 22, IX, “e”', mroscState)]),
          item('f-2-7', 'Experiência prévia da organização', 'Verifique se os documentos demonstram experiência efetiva na execução do objeto da parceria ou de objeto semelhante.', [law('Lei nº 13.019/2014, art. 33, V, “b”', federal13019), law('Decreto SC nº 1.196/2017, art. 22, X, “a”', mroscState)]),
          item('f-2-8', 'Instalações, materiais e capacidade operacional', 'Confira as evidências de que a OSC dispõe de estrutura e capacidade técnica e operacional compatíveis com as atividades e metas propostas.', [law('Lei nº 13.019/2014, art. 33, V, “c”', federal13019), law('Decreto SC nº 1.196/2017, art. 22, X, “b”', mroscState)]),
          item('f-2-9', 'DART regular', 'Confira se o Demonstrativo de Atendimento aos Requisitos para Transferências está regular e contempla os requisitos aplicáveis.', [law('Decreto SC nº 1.196/2017, art. 22, § 1º', mroscState)]),
          item('f-2-10', 'Direitos de exploração de marca, patente ou obra', 'Quando o objeto depender de direito de exploração comercial, confira a comprovação de titularidade ou autorização pertinente.', [law('Decreto SC nº 1.196/2017, art. 22, X, “c”', mroscState)], 'Quando o objeto ou as atividades envolverem direito de exploração comercial.'),
          item('f-2-11', 'Declaração de ausência de impedimentos', 'Confira a declaração do representante legal sobre os impedimentos da OSC e de seus dirigentes e o compromisso de comunicar fatos supervenientes.', [law('Lei nº 13.019/2014, art. 39', federal13019), law('Decreto SC nº 1.196/2017, art. 22, X, “d”', mroscState)]),
        ],
      },
      {
        id: 'complementares',
        title: 'Documentos complementares',
        description: 'Anexos financeiros, técnicos e de execução, conforme o objeto.',
        items: [
          item('f-3-1', 'Orçamento de referência', 'Confira o orçamento que dá suporte aos custos de bens e serviços ou, quando cabível, à obra sem exigência de projeto básico.', [law('Decreto SC nº 1.196/2017, art. 20, I', mroscState)], 'Quando houver aquisição de bens, serviços ou hipótese de obra dispensada de projeto básico.'),
          item('f-3-2', 'Memória de cálculo da contrapartida', 'Quando houver contrapartida, confira a estimativa de bens e serviços, as memórias de cálculo e os documentos que justificam os valores.', [law('Decreto SC nº 1.196/2017, art. 20, II', mroscState)], 'Quando houver contrapartida em bens ou serviços.'),
          item('f-3-3', 'Plano de mídia', 'Confira o plano de mídia e a identificação do apoio institucional quando houver despesas de publicidade.', [law('Decreto SC nº 1.196/2017, art. 20, III', mroscState)], 'Quando houver despesas com publicidade.'),
          item('f-3-4', 'Minuta de edital de premiação', 'Quando houver premiações, confira os critérios objetivos de classificação e os valores; observe as vedações legais de beneficiários.', [law('Decreto SC nº 1.196/2017, art. 20, IV', mroscState)], 'Quando a proposta previr despesas com premiações.'),
          item('f-3-5', 'Registro fotográfico da situação atual', 'Para intervenção em obra, confira o registro da situação do local antes da execução.', [law('Decreto SC nº 1.196/2017, art. 20, V, “a”', mroscState)], 'Quando o objeto envolver obra ou serviço de engenharia.'),
          item('f-3-6', 'Projeto básico e ART/RRT', 'Para obra ou serviço de engenharia, confira o projeto básico e a responsabilidade técnica correspondente, observadas as hipóteses legais de dispensa.', [law('Decreto SC nº 1.196/2017, art. 20, V, “b”', mroscState)], 'Quando o objeto envolver obra ou serviço de engenharia.'),
          item('f-3-7', 'Alvarás e licenças', 'Confira as licenças, permissões e autorizações exigidas pelos órgãos competentes para a execução do objeto.', [law('Decreto SC nº 1.196/2017, art. 20, V, “c”', mroscState)], 'Quando exigidos pela legislação específica para o objeto.'),
          item('f-3-8', 'Comprovação dos direitos sobre o imóvel', 'Para obra em imóvel, confira a certidão imobiliária recente ou a documentação substitutiva admitida na legislação para a situação do imóvel.', [law('Decreto SC nº 1.196/2017, art. 20, V, “f”', mroscState)], 'Quando houver obra ou intervenção em imóvel.'),
        ],
      },
    ],
  },
  {
    id: 'convenio',
    title: 'Convênio',
    shortTitle: 'Convênio',
    description: 'Transferência voluntária estadual para execução conjunta de programa, projeto ou atividade de interesse recíproco.',
    summary: 'Revise os elementos da proposta, a documentação do convenente e os documentos técnicos exigidos para a análise do convênio.',
    groups: [
      {
        id: 'proposta',
        title: 'Análise da proposta de transferência',
        description: 'Elementos administrativos que definem a proposta, os resultados e a execução.',
        items: [
          item('c-1-1', 'Objeto e finalidade', 'Confira se o objeto e a finalidade estão identificados e delimitam o resultado a ser obtido com o convênio.', [law('Decreto SC nº 733/2024, art. 12, § 1º, I', convenioState)]),
          item('c-1-2', 'Descrição da realidade que motiva a proposta', 'Verifique se a proposta apresenta a situação atual e relaciona essa realidade às atividades, projetos e metas previstos.', [law('Decreto SC nº 733/2024, art. 12, § 1º, II', convenioState)]),
          item('c-1-3', 'Metas, execução, prazos, parâmetros e custos', 'Confira se as metas são mensuráveis e se a proposta associa a cada uma forma de execução, período, parâmetros de aferição, etapas e custos.', [law('Decreto SC nº 733/2024, art. 12, § 1º, III', convenioState)]),
          item('c-1-4', 'Resultados esperados e interesse público', 'Verifique se os resultados estão descritos e evidenciam os benefícios sociais ou econômicos esperados.', [law('Decreto SC nº 733/2024, art. 12, § 1º, IV', convenioState)]),
          item('c-1-5', 'Valor total, repasse e contrapartida', 'Confira o valor necessário, o repasse solicitado, a previsão orçamentária da contrapartida e outras fontes de recursos asseguradas.', [law('Decreto SC nº 733/2024, art. 12, § 1º, V', convenioState)]),
          item('c-1-6', 'Bens, serviços ou obras e valores estimados', 'Verifique se os itens previstos para aquisição, contratação ou execução estão identificados e acompanhados dos valores estimados.', [law('Decreto SC nº 733/2024, art. 12, § 1º, VI', convenioState)]),
          item('c-1-7', 'Contrapartida não financeira', 'Quando houver contrapartida em bens ou serviços, confira sua descrição e os valores estimados.', [law('Decreto SC nº 733/2024, art. 12, § 1º, VII', convenioState)], 'Quando houver contrapartida não financeira.'),
          item('c-1-8', 'Cronograma financeiro', 'Confira a compatibilidade entre o cronograma financeiro, as despesas previstas e as etapas de execução, incluindo a contrapartida financeira.', [law('Decreto SC nº 733/2024, art. 12, § 1º, VIII', convenioState)]),
          item('c-1-9', 'Previsão de receitas do objeto', 'Verifique se estão previstas receitas que poderão ser geradas durante a execução, inclusive ingressos ou patrocínios, quando existirem.', [law('Decreto SC nº 733/2024, art. 12, § 1º, IX', convenioState)]),
          item('c-1-10', 'Capacidade técnica e operacional', 'Confira as informações que demonstram que o proponente dispõe de equipe, estrutura e experiência adequadas para alcançar os resultados.', [law('Decreto SC nº 733/2024, art. 12, § 1º, X', convenioState)]),
          item('c-1-11', 'Local de execução e público-alvo', 'Verifique se o local ou região de execução e o público beneficiado estão definidos.', [law('Decreto SC nº 733/2024, art. 12, § 1º, XI', convenioState)]),
          item('c-1-12', 'Procedimento de doação de bens', 'Quando houver previsão de doação, confira os critérios de seleção ou a identificação dos beneficiários previamente selecionados.', [law('Decreto SC nº 733/2024, art. 12, § 1º, XII', convenioState)], 'Quando o plano de trabalho prever doação de bens.'),
        ],
      },
      {
        id: 'documentacao-convenio',
        title: 'Documentos técnicos do processo',
        description: 'Identificação, representação, constituição e instrução técnica do proponente.',
        items: [
          item('c-2-1', 'Documento de identidade e CPF do representante', 'Confira a identificação e a inscrição no CPF da pessoa que representa o proponente.', [law('Decreto SC nº 733/2024, art. 9º, I', convenioState)]),
          item('c-2-2', 'Comprovante de residência do representante', 'Verifique se há comprovante de residência atualizado do representante indicado.', [law('Decreto SC nº 733/2024, art. 9º, II', convenioState)]),
          item('c-2-3', 'Ato de posse, nomeação ou eleição', 'Confira o documento que comprova os poderes atuais de representação e assinatura do convenente.', [law('Decreto SC nº 733/2024, art. 9º, III', convenioState)]),
          item('c-2-4', 'Lei de ratificação do protocolo de intenções', 'Para consórcio público, confira a publicação da lei de ratificação ou a hipótese legal de dispensa.', [law('Decreto SC nº 733/2024, art. 10, I e § 2º', convenioState)], 'Aplicável a consórcio público, observada a hipótese de dispensa prevista no § 2º.'),
          item('c-2-5', 'Contrato de consórcio público', 'Para consórcio público, confira o contrato de consórcio vigente e sua correspondência com o ente proponente.', [law('Decreto SC nº 733/2024, art. 10, II', convenioState)], 'Aplicável a consórcio público.'),
          item('c-2-6', 'Estatuto aprovado e atualizado', 'Para consórcio público, confira a versão vigente do estatuto aprovado.', [law('Decreto SC nº 733/2024, art. 10, III', convenioState)], 'Aplicável a consórcio público.'),
          item('c-2-7', 'Proposta de transferência compatível com o plano', 'Compare as informações da proposta com os elementos exigidos para o plano de trabalho e verifique se os dados permanecem coerentes.', [law('Decreto SC nº 733/2024, art. 12, § 1º', convenioState)]),
          item('c-2-8', 'Contrato ou ata de registro de preços vigente', 'Quando houver contratação, confira a vigência do contrato ou da ata e os termos aditivos existentes.', [law('Lei nº 14.133/2021, arts. 84 e 89', federal14133), law('Decreto SC nº 733/2024, art. 12, § 1º, VI', convenioState)]),
          item('c-2-9', 'Autorização de fornecimento, ordem ou declaração', 'No caso de ata de registro de preços, confira a autorização ou ordem correspondente; nas demais hipóteses, confira a declaração de comprometimento pertinente.', [law('Decreto SC nº 733/2024, arts. 12 e 21, VII', convenioState), law('Lei nº 14.133/2021, art. 95', federal14133)]),
          item('c-2-10', 'Estimativa de custos e memória de cálculo', 'Confira se a estimativa está acompanhada das memórias de cálculo e dos documentos de suporte dos valores.', [law('Decreto SC nº 733/2024, art. 13, I', convenioState)]),
          item('c-2-11', 'Termos de adjudicação e homologação', 'Quando houver procedimento licitatório, confira os atos finais de adjudicação e homologação correspondentes.', [law('Decreto SC nº 733/2024, art. 26, § 2º', convenioState), law('Lei nº 14.133/2021, art. 71, IV', federal14133)]),
          item('c-2-12', 'Projeto básico e ART/RRT', 'Para obra ou serviço de engenharia, confira o projeto básico, a responsabilidade técnica e os documentos de suporte exigidos.', [law('Decreto SC nº 733/2024, art. 13, III, “b” e § 1º', convenioState)], 'Quando houver obra ou serviço de engenharia, observadas as hipóteses legais de dispensa.'),
          item('c-2-13', 'Previsão orçamentária da contrapartida', 'Quando houver contrapartida financeira, confira se a previsão orçamentária está disponível e corresponde ao valor pactuado.', [law('Decreto SC nº 733/2024, art. 12, § 1º, V', convenioState), law('Decreto SC nº 733/2024, art. 25', convenioState)], 'Quando houver contrapartida financeira.'),
          item('c-2-14', 'Alvarás, licenças e autorizações', 'Para início de obra, confira as licenças, permissões e autorizações exigidas pela legislação específica.', [law('Decreto SC nº 733/2024, art. 13, III, “c”', convenioState)], 'Quando exigidos para início da obra ou intervenção.'),
          item('c-2-15', 'Aprovação em imóvel tombado', 'Em imóvel tombado, confira a aprovação do projeto pelas autoridades responsáveis e o ato de tombamento.', [law('Decreto SC nº 733/2024, art. 13, III, “d”', convenioState)], 'Quando a intervenção ocorrer em patrimônio tombado.'),
          item('c-2-16', 'Comprovação de titularidade ou direito sobre o imóvel', 'Para obra em imóvel, confira a certidão recente ou a documentação substitutiva admitida para demonstrar o direito de uso ou intervenção.', [law('Decreto SC nº 733/2024, art. 13, III, “e” e §§ 2º–3º', convenioState)], 'Quando houver obra ou intervenção em imóvel, observadas as exceções previstas no Decreto.'),
          item('c-2-17', 'Cronograma físico-financeiro e orçamento detalhado', 'Para projeto básico de engenharia, confira se cronograma e orçamento detalhado são compatíveis com os preços de mercado e parâmetros oficiais aplicáveis.', [law('Decreto SC nº 733/2024, art. 13, § 1º, I', convenioState)], 'Quando houver obra ou serviço de engenharia sujeito a projeto básico.'),
          item('c-2-18', 'Memorial descritivo e cálculo de quantitativos', 'Confira os documentos técnicos que detalham a solução e dão suporte aos quantitativos do projeto básico.', [law('Decreto SC nº 733/2024, art. 13, § 1º, II', convenioState)], 'Quando houver projeto básico de engenharia.'),
          item('c-2-19', 'Documentos de contratação direta', 'Se a contratação for direta, confira o parecer jurídico e técnico, a estimativa, a justificativa de preço e a autorização competente, conforme aplicável.', [law('Lei nº 14.133/2021, art. 72, III, VII e VIII', federal14133), law('Decreto SC nº 733/2024, art. 13, I', convenioState)], 'Quando houver dispensa ou inexigibilidade de licitação.'),
        ],
      },
      {
        id: 'descentralizacao',
        title: 'Descentralização financeira',
        description: 'Comprovações condicionadas à liberação dos recursos e às características do convênio.',
        items: [
          item('c-3-1', 'DART regular', 'Antes da liberação, confira se o DART está válido e cobre os requisitos de regularidade aplicáveis ao convenente.', [law('Decreto SC nº 733/2024, art. 16, §§ 1º–4º', convenioState)]),
          item('c-3-2', 'Ordem de serviço para ata de registro de preços', 'Quando a contratação ocorrer por ata de registro de preços, confira a ordem de serviço que autoriza o início da execução.', [law('Decreto SC nº 733/2024, art. 26, § 2º', convenioState), law('Lei nº 14.133/2021, art. 95', federal14133)], 'Quando a contratação decorrer de ata de registro de preços.'),
          item('c-3-3', 'Extrato bancário da contrapartida', 'Quando houver contrapartida financeira, confira o extrato da conta específica e a correspondência do aporte com o plano de trabalho.', [law('Decreto SC nº 733/2024, art. 25, § 1º', convenioState), law('Decreto SC nº 733/2024, art. 21, VI', convenioState)], 'Quando houver contrapartida financeira.'),
        ],
      },
    ],
  },
  {
    id: 'simplificado',
    title: 'Convênio Simplificado',
    shortTitle: 'Simplificado',
    description: 'Regime simplificado de convênio para transferências voluntárias do Estado aos Municípios.',
    summary: 'Acompanhe a proposta, os documentos necessários para contratação e a liberação do repasse. Itens condicionais devem ser avaliados conforme o objeto e o programa.',
    groups: [
      {
        id: 'cadastro',
        title: 'Cadastro do convênio simplificado',
        description: 'Requerimento, plano de trabalho e autorização para a celebração.',
        items: [
          item('s-1-1', 'Ofício de solicitação do recurso e descrição do objeto', 'Confira se o pedido formal identifica o município, o recurso solicitado e o objeto pretendido.', [law('Lei SC nº 19.093/2024, art. 4º, I', simplifiedLaw), law('Decreto SC nº 766/2024, art. 2º, I', simplifiedDecree)]),
          item('s-1-2', 'Plano de Trabalho Simplificado', 'Verifique se o plano aprovado define o objeto e parâmetros objetivos que permitam constatar seu cumprimento.', [law('Lei SC nº 19.093/2024, arts. 2º, I e 4º, I', simplifiedLaw), law('Decreto SC nº 766/2024, art. 2º, I', simplifiedDecree)]),
          item('s-1-3', 'Portaria conjunta de autorização publicada', 'Confira a portaria conjunta de autorização e a publicação oficial antes de avançar para a fase de contratação e repasse.', [law('Decreto SC nº 766/2024, art. 2º, III e IV', simplifiedDecree), law('Lei SC nº 18.674/2023, art. 35, § 2º (referência do checklist-base para a LDO 2024)', 'https://leis.alesc.sc.gov.br/ato-normativo/22067')]),
        ],
      },
      {
        id: 'repasse',
        title: 'Documentos para contratação e repasse',
        description: 'Peças da contratação, revisão do plano e condições específicas do objeto.',
        items: [
          item('s-2-1', 'Plano de trabalho atualizado após a contratação', 'Confira se o plano e o cronograma refletem os valores e condições resultantes da contratação.', [law('Decreto SC nº 766/2024, art. 2º, V, “a”, 2 e § 1º', simplifiedDecree), law('Lei SC nº 19.093/2024, art. 4º, III, “g”', simplifiedLaw)]),
          item('s-2-2', 'Termos de adjudicação e homologação', 'Quando houver licitação, confira os atos que encerram o procedimento e identificam o resultado homologado.', [law('Decreto SC nº 766/2024, art. 2º, V, “a”, 1', simplifiedDecree), law('Lei nº 14.133/2021, art. 71, IV', federal14133)]),
          item('s-2-3', 'Contrato ou ata de registro de preços vigente', 'Confira o instrumento vigente que formaliza a contratação e os aditivos existentes, quando houver.', [law('Decreto SC nº 766/2024, art. 2º, V, “a”, 1', simplifiedDecree), law('Lei nº 14.133/2021, arts. 84 e 89', federal14133)]),
          item('s-2-4', 'Solicitação de fornecimento ou declaração de comprometimento', 'Para ata de registro de preços, confira a solicitação de fornecimento; nas demais contratações, confira o documento que demonstre o compromisso correspondente.', [law('Decreto SC nº 766/2024, art. 2º, V, “a”, 1', simplifiedDecree), law('Lei nº 14.133/2021, art. 95', federal14133)]),
          item('s-2-5', 'Proposta de preços e cronograma físico-financeiro contratados', 'Confira se os valores e o cronograma apresentados correspondem à contratação concluída e ao plano atualizado.', [law('Decreto SC nº 766/2024, art. 2º, V, “a” e § 1º', simplifiedDecree), law('Lei SC nº 19.093/2024, art. 4º, III, “g”', simplifiedLaw)]),
          item('s-2-6', 'Previsão orçamentária da contrapartida', 'Quando houver contrapartida financeira, confira a previsão orçamentária e a compatibilidade com o valor e o cronograma do convênio.', [law('Lei SC nº 19.093/2024, art. 5º, § 1º, VII', simplifiedLaw), law('Decreto SC nº 766/2024, art. 2º, § 3º, VII', simplifiedDecree)], 'Quando houver contrapartida financeira.'),
          item('s-2-7', 'Projeto, memorial descritivo ou termo de referência', 'Para obra, confira os documentos técnicos necessários ao objeto. No regime simplificado, a lei dispensa análise e aceite prévios desses documentos pelo concedente; isso não elimina a responsabilidade do Município nem exigências legais específicas.', [law('Lei SC nº 19.093/2024, art. 2º, § 3º', simplifiedLaw), law('Lei nº 14.133/2021, art. 18, quando aplicável à contratação', federal14133)], 'Quando o objeto ou a contratação exigir documentação técnica.'),
          item('s-2-8', 'Conta bancária específica do convênio', 'Confira a abertura de conta exclusiva para o convênio no Banco do Brasil, ressalvadas as exceções previstas em regulamento.', [law('Lei SC nº 19.093/2024, art. 6º', simplifiedLaw), law('Lei SC nº 19.093/2024, art. 4º, III, “d”', simplifiedLaw)]),
          item('s-2-9', 'Justificativa de contratação direta', 'Quando houver dispensa ou inexigibilidade, confira a instrução do processo com justificativa de preço, pareceres e autorização competente, conforme o caso.', [law('Lei nº 14.133/2021, art. 72, III, VII e VIII', federal14133), law('Decreto SC nº 766/2024, art. 2º, V, “a”, 1', simplifiedDecree)], 'Quando a contratação for direta.'),
          item('s-2-10', 'Publicação da contratação direta', 'Quando houver contratação direta, confira se o ato autorizador ou seu extrato foi divulgado no sítio eletrônico oficial.', [law('Lei nº 14.133/2021, art. 72, parágrafo único', federal14133)], 'Quando houver dispensa ou inexigibilidade.'),
          item('s-2-11', 'Documentação do imóvel, faixa de domínio ou área', 'Para obra, confira a documentação que comprova o direito de intervenção no local e as autorizações específicas exigidas para a área.', [law('Decreto SC nº 733/2024, art. 13, III, “c” e “e”, como referência documental geral', convenioState), law('Lei SC nº 19.093/2024, art. 2º, § 3º (regra de não análise prévia no regime simplificado)', simplifiedLaw)], 'Quando houver obra ou intervenção em imóvel, rodovia ou área sujeita a autorização.'),
          item('s-2-12', 'Declaração de que não houve execução anterior à vigência', 'Confira a manifestação do interessado sobre o início da execução e a compatibilidade das despesas com a vigência do instrumento.', [law('Parecer Referencial nº 008/2024-PGE, Anexo III, cláusula sexta, V', pgeSimplifiedOpinion), law('Lei SC nº 19.093/2024, arts. 4º e 5º', simplifiedLaw)]),
        ],
      },
      {
        id: 'descentralizacao',
        title: 'Descentralização financeira',
        description: 'Requisitos a conferir para o pagamento da primeira parcela ou liberação dos recursos.',
        items: [
          item('s-3-1', 'DART regular', 'Antes do pagamento, confira a regularidade dos requisitos cobertos pelo DART; a previsão orçamentária da contrapartida, quando houver, permanece específica.', [law('Lei SC nº 19.093/2024, art. 5º, §§ 1º e 2º', simplifiedLaw), law('Decreto SC nº 766/2024, art. 2º, §§ 3º e 4º', simplifiedDecree)]),
          item('s-3-2', 'Ordem de serviço para ata de registro de preços', 'Quando a contratação ocorrer por ata, confira a ordem que autoriza o fornecimento ou início da execução.', [law('Decreto SC nº 766/2024, art. 2º, V, “a”, 1', simplifiedDecree), law('Lei nº 14.133/2021, art. 95', federal14133)], 'Quando a contratação decorrer de ata de registro de preços.'),
          item('s-3-3', 'Comprovante de aporte da contrapartida', 'Quando houver contrapartida financeira, confira o extrato da conta específica que demonstra o aporte conforme o plano de trabalho.', [law('Lei SC nº 19.093/2024, arts. 5º, § 1º, VII e 6º', simplifiedLaw), law('Decreto SC nº 766/2024, art. 2º, § 3º, VII', simplifiedDecree)], 'Quando houver contrapartida financeira.'),
        ],
      },
    ],
  },
];

export const LEGAL_UPDATE_NOTE = 'As referências seguem os itens dos checklists anexados e a legislação oficial consultada. O limite do regime simplificado foi alterado pela Lei SC nº 19.270/2025. A aplicação de cada exigência depende do objeto, do programa, do exercício e das regras do concedente; em caso de divergência, confirme a orientação jurídica e técnica responsável.';
