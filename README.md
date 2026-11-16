# Pocket Pattern Whisperer

# PROJETO: PeagAI FINANCE — AGENTE FINANCEIRO INTELIGENTE

## 1. VISÃO GERAL DO PRODUTO

Crie uma aplicação web profissional chamada **Finance AI**, um agente financeiro inteligente que funciona por meio de uma interface conversacional (chat).

O objetivo é permitir que um usuário converse com uma inteligência artificial sobre sua situação financeira, consulte contas bancárias, saldos, transações, categorias de gastos e receba análises financeiras baseadas em dados reais ou de demonstração.

O sistema deverá utilizar duas fontes de dados:

- **Plaid:** integração com a Plaid Sandbox para obter dados bancários fictícios, testar contas, saldos e transações.
- **Pluggy:** integração com a infraestrutura da Pluggy, voltada ao ecossistema financeiro brasileiro e ao Open Finance.

A inteligência artificial deverá funcionar como um analista financeiro pessoal. Em vez de simplesmente apresentar números, deverá interpretar os dados, identificar padrões, explicar comportamentos financeiros e responder a perguntas em linguagem natural.

Exemplo:

Usuário: "Quanto eu gastei com alimentação neste mês?"

Agente: "Você gastou R$ 847,50 com alimentação neste mês, aproximadamente 18% das suas despesas. Isso representa um aumento de 12% em relação ao mês anterior."

O agente deverá fundamentar suas respostas nos dados efetivamente disponíveis. Nunca inventar saldos, transações, instituições financeiras ou estatísticas.

## 2. IDENTIDADE VISUAL E DESIGN

Crie uma interface extremamente profissional, com aparência de uma fintech moderna, inspirada na qualidade visual de produtos como Linear, Stripe, Revolut e Mercury.

Não copie diretamente suas interfaces.

### Direção visual

- Design minimalista e sofisticado.
- Tema escuro como padrão.
- Fundo principal em grafite quase preto (#0B0D12).
- Superfícies em tons de cinza escuro (#141821).
- Cor de destaque verde-esmeralda (#21C98B).
- Tipografia moderna e extremamente legível.
- Bordas discretas.
- Sombras suaves.
- Cantos arredondados, sem exageros.
- Ícones consistentes.
- Microanimações discretas.
- Transições suaves entre telas.

Evite aparência de template genérico de dashboard.

A aplicação deve parecer um produto financeiro comercial pronto para apresentação a investidores ou demonstração a clientes.

Priorize desktop, mas desenvolva uma versão totalmente responsiva para dispositivos móveis.

## 3. ESTRUTURA DA APLICAÇÃO

A aplicação deverá possuir as seguintes páginas e funcionalidades:

### 3.1. Tela de apresentação e autenticação

Criar uma página inicial com:

- Logotipo Finance AI.
- Frase principal: "Sua vida financeira, finalmente compreendida."
- Breve explicação do funcionamento do agente.
- Botão "Começar agora".
- Botão para entrar na conta.
- Demonstração visual do agente analisando dados financeiros.

Criar autenticação para usuários, com estrutura preparada para integração com Supabase Auth.

Não exigir conexão bancária para visualizar a demonstração.

### 3.2. Dashboard financeiro

Criar um painel com visão geral das finanças.

Apresentar:

- Saldo total das contas conectadas.
- Receitas do mês.
- Despesas do mês.
- Resultado financeiro mensal.
- Quantidade de contas conectadas.
- Última atualização dos dados.

Adicionar gráficos:

1. Evolução do saldo ao longo do tempo.
2. Receitas versus despesas.
3. Distribuição dos gastos por categoria.
4. Histórico mensal de despesas.

Adicionar uma seção chamada "Insights do agente", contendo observações geradas a partir dos dados financeiros.

Exemplos:

- "Seus gastos com alimentação aumentaram 15%."
- "Você teve três despesas recorrentes nesta semana."
- "Seu saldo está 8% abaixo da média dos últimos três meses."

Os insights devem ser calculados a partir dos dados disponíveis, nunca gerados aleatoriamente.

### 3.3. Chat com o agente financeiro

Esta é a funcionalidade principal do produto.

Criar uma interface de chat elegante, ocupando a maior parte da tela.

Elementos:

- Histórico de conversas na lateral.
- Campo de mensagem na parte inferior.
- Botão de envio.
- Indicador de processamento.
- Mensagens do usuário e do agente com estilos diferentes.
- Suporte a Markdown.
- Tabelas financeiras.
- Gráficos incorporados às respostas.
- Cards de informações financeiras.
- Sugestões de perguntas iniciais.

Sugestões de perguntas:

- Quanto tenho disponível atualmente?
- Quanto gastei neste mês?
- Qual categoria consome mais dinheiro?
- Quais foram minhas maiores despesas?
- Compare meus gastos deste mês com o anterior.
- Identifique minhas despesas recorrentes.
- Estou gastando mais do que ganho?
- Quanto consegui economizar nos últimos três meses?

O agente deverá compreender perguntas formuladas de maneira natural, inclusive quando o usuário utilizar expressões como "semana passada", "mês passado", "últimos 30 dias" ou "desde janeiro".

### 3.4. Página de contas bancárias

Criar uma página para visualizar as instituições financeiras conectadas.

Cada instituição deverá possuir:

- Nome.
- Logotipo.
- Tipo de conexão.
- Status da conexão.
- Data da última sincronização.
- Quantidade de contas disponíveis.

Permitir:

- Adicionar instituição.
- Visualizar contas vinculadas.
- Consultar saldos.
- Atualizar dados.
- Desconectar instituição.

Criar dois caminhos de conexão:

**Plaid Sandbox**
- Conectar uma instituição fictícia.
- Utilizar o fluxo de autenticação de demonstração da Plaid.
- Buscar contas e saldos.
- Buscar transações fictícias.

**Pluggy**
- Preparar conexão com instituições brasileiras.
- Utilizar o fluxo oficial de conexão da Pluggy.
- Exibir instituições disponíveis conforme o ambiente e as permissões.
- Permitir sincronização de contas e transações.

Não simular uma conexão real quando ela não tiver sido concluída.

### 3.5. Página de transações

Criar uma tabela financeira com:

- Descrição da transação.
- Instituição.
- Data.
- Categoria.
- Valor.
- Tipo (receita ou despesa).

Adicionar filtros por:

- Período.
- Instituição.
- Categoria.
- Tipo de movimentação.
- Faixa de valores.

Permitir ordenação e pesquisa.

Destacar despesas e receitas visualmente.

### 3.6. Página de análises

Criar uma área de inteligência financeira com:

- Categorias que mais consomem dinheiro.
- Evolução dos gastos.
- Comparação entre períodos.
- Identificação de assinaturas.
- Despesas recorrentes.
- Maiores transações.
- Estimativa de economia.
- Relação entre receitas e despesas.

Adicionar gráficos interativos.

Todas as análises devem utilizar dados provenientes das integrações.

## 4. ARQUITETURA DAS INTEGRAÇÕES

A arquitetura deve ser modular, permitindo substituir, adicionar ou remover provedores financeiros sem reconstruir o restante do sistema.

Utilizar três camadas:

1. Interface do usuário.
2. Backend responsável pelas integrações e processamento.
3. Camada de inteligência artificial e ferramentas financeiras.

### 4.1. PLAID

Utilizar a Plaid Sandbox como primeira fonte de dados.

Integração esperada:

- Client ID.
- Sandbox Secret.
- Criação de Link Token.
- Fluxo de conexão do Plaid Link.
- Troca de Public Token por Access Token.
- Consulta de instituições e contas.
- Consulta de saldos.
- Consulta de transações.

Utilizar exclusivamente o ambiente Sandbox nesta primeira etapa.

IMPORTANTE SOBRE OS VALORES:

Na Plaid, valores positivos normalmente representam dinheiro saindo da conta, enquanto valores negativos representam entradas.

Criar uma camada de normalização para transformar os dados em um formato financeiro interno padronizado.

Não misturar as convenções de sinais da Plaid e da Pluggy.

### 4.2. PLUGGY

Preparar integração com a Pluggy para o ecossistema brasileiro.

Utilizar a documentação oficial como referência:

https://docs.pluggy.ai/

Preparar:

- Autenticação da API.
- Criação de Connect Token.
- Integração com Pluggy Connect.
- Criação e gerenciamento de Items.
- Consulta de contas.
- Consulta de saldos.
- Consulta de transações.
- Sincronização de informações.
- Tratamento de erros e expiração de conexões.

A integração deve respeitar os fluxos oficiais da Pluggy.

Não inventar endpoints, parâmetros ou formatos de resposta.

A aplicação deverá permitir trabalhar com Plaid e Pluggy de forma independente.

### 4.3. MCP — MODEL CONTEXT PROTOCOL

Preparar a arquitetura para utilização de servidores MCP como camada de ferramentas do agente.

Servidor Pluggy:

https://mcp.pluggy.ai/mcp

Considerar o transporte Streamable HTTP.

Servidor Plaid:
- Considerar o servidor mcp-server-plaid.
- Executado localmente via uvx no ambiente de desenvolvimento.
- Configuração por STDIO.
- Utilização das credenciais Sandbox por variáveis de ambiente.

IMPORTANTE:

O MCP local da Plaid não deverá ser tratado como um serviço disponível automaticamente no navegador ou na aplicação publicada.

O frontend não deverá tentar executar processos locais nem acessar diretamente servidores STDIO.

Criar uma camada de ferramentas no backend, com adaptadores independentes para Plaid e Pluggy.

Caso o ambiente de hospedagem não suporte conexões MCP diretamente, utilizar as APIs oficiais dos provedores por meio desses adaptadores.

O MCP deverá ser uma possibilidade de integração da camada de agente, não uma dependência obrigatória para o funcionamento do frontend.

## 5. INTELIGÊNCIA ARTIFICIAL

Criar um agente financeiro capaz de interpretar perguntas e selecionar as ferramentas necessárias.

O agente deverá possuir as seguintes capacidades:

### Consulta financeira

- Consultar saldo de contas.
- Consultar transações.
- Identificar receitas e despesas.
- Consultar gastos por categoria.
- Consultar movimentações por período.
- Comparar diferentes instituições.

### Análise financeira

- Identificar padrões de consumo.
- Identificar despesas recorrentes.
- Encontrar gastos incomuns.
- Comparar períodos.
- Calcular médias de despesas.
- Identificar tendências.
- Estimar capacidade de economia.

### Comunicação

O agente deverá responder em português brasileiro.

Utilizar linguagem simples, objetiva e profissional.

Não utilizar termos financeiros complexos sem explicação.

Sempre apresentar valores com duas casas decimais.

Utilizar o formato brasileiro:

R$ 1.250,00

Quando não houver informações suficientes, explicar claramente o que está faltando.

### Regras fundamentais

1. Nunca inventar movimentações.
2. Nunca inventar saldos.
3. Nunca afirmar que uma conta está conectada sem confirmação da integração.
4. Diferenciar dados reais, dados Sandbox e dados simulados.
5. Informar a data de atualização dos dados.
6. Não confundir receitas com despesas.
7. Não somar o mesmo saldo ou transação duas vezes.
8. Não apresentar estimativas como valores confirmados.
9. Explicar a metodologia dos cálculos quando solicitado.
10. Não realizar transferências, pagamentos ou operações financeiras nesta versão.

## 6. MOEDA E CONVERSÃO

A interface deverá utilizar o real brasileiro como moeda de apresentação.

Para dados provenientes da Plaid Sandbox, que podem estar em dólares:

- Preservar a moeda original.
- Identificar a moeda de origem.
- Permitir conversão para BRL.
- Informar a taxa de câmbio utilizada.
- Informar a data da taxa.
- Não apresentar valores convertidos como se fossem saldos bancários originais.

Criar uma camada de conversão independente dos provedores.

Não utilizar taxas de câmbio fictícias.

## 7. BACKEND E BANCO DE DADOS

Utilizar Supabase como infraestrutura inicial, incluindo:

- PostgreSQL.
- Autenticação.
- Edge Functions.
- Gerenciamento de segredos.
- Persistência de conversas.
- Persistência de contas e transações normalizadas.

Estruturar as tabelas:

### users
Dados dos usuários.

### financial_connections
Conexões bancárias e respectivos provedores.

### accounts
Contas financeiras.

### transactions
Transações normalizadas.

### conversations
Conversas dos usuários com o agente.

### messages
Mensagens enviadas e recebidas.

### financial_insights
Análises financeiras geradas.

### synchronization_logs
Histórico de sincronizações e erros.

Utilizar identificadores únicos e relacionamentos apropriados.

Aplicar Row Level Security (RLS) para impedir que usuários acessem dados financeiros de outras pessoas.

## 8. SEGURANÇA

A segurança é uma prioridade absoluta.

Implementar:

- Credenciais exclusivamente no backend.
- Segredos armazenados em variáveis de ambiente.
- Nunca expor Client ID e Secret privados no frontend.
- Nunca armazenar Access Tokens em localStorage.
- Criptografia de tokens armazenados.
- Autenticação e autorização.
- RLS no Supabase.
- Validação das requisições.
- Proteção contra acesso indevido.
- Logs sem informações bancárias sensíveis.
- Tratamento seguro de erros.
- Isolamento dos dados de cada usuário.

Não utilizar credenciais Sandbox como se fossem credenciais de produção.

Não utilizar dados bancários pessoais reais na demonstração inicial.

## 9. EXPERIÊNCIA DO USUÁRIO

A experiência deverá ser simples.

O usuário deverá conseguir:

1. Criar uma conta.
2. Entrar no dashboard.
3. Visualizar uma demonstração financeira.
4. Conectar uma instituição Sandbox.
5. Visualizar suas contas e transações.
6. Abrir o chat.
7. Fazer perguntas sobre seus dados.
8. Receber análises e gráficos.
9. Consultar seu histórico de conversas.

Criar estados visuais adequados para:

- Carregamento.
- Ausência de contas.
- Nenhuma transação encontrada.
- Falha de conexão.
- Credenciais inválidas.
- Sincronização em andamento.
- Conexão expirada.
- Dados indisponíveis.

Não deixar botões decorativos ou sem funcionalidade.

## 10. TECNOLOGIAS

Priorizar:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Shadcn/UI.
- Lucide Icons.
- Supabase.
- Recharts.
- Plaid Link.
- API oficial da Pluggy.
- Backend com Edge Functions.
- Integração com um provedor de LLM por meio do backend.

Organizar o código em componentes reutilizáveis.

Separar:

- Interface.
- Serviços.
- Integrações bancárias.
- Ferramentas do agente.
- Processamento financeiro.
- Banco de dados.
- Autenticação.

## 11. ETAPAS DE DESENVOLVIMENTO

Não tente implementar tudo de maneira desorganizada.

Divida o desenvolvimento em etapas.

### ETAPA 1 — INTERFACE E PROTÓTIPO FUNCIONAL

- Criar identidade visual.
- Criar autenticação.
- Criar dashboard.
- Criar chat.
- Criar páginas de contas e transações.
- Criar gráficos.
- Criar dados de demonstração claramente identificados.

O protótipo deve funcionar sem depender de conexões bancárias.

### ETAPA 2 — BACKEND E PLAID SANDBOX

- Configurar Supabase.
- Criar tabelas.
- Implementar autenticação.
- Implementar Plaid Link.
- Criar fluxo de conexão Sandbox.
- Buscar contas.
- Buscar saldos.
- Buscar transações.
- Normalizar os dados.
- Exibir dados reais retornados pela Sandbox.

### ETAPA 3 — PLUGGY

- Implementar autenticação.
- Implementar Pluggy Connect.
- Conectar instituições disponíveis no ambiente.
- Consultar contas.
- Consultar transações.
- Normalizar os dados.
- Integrar com o dashboard.

### ETAPA 4 — AGENTE FINANCEIRO

- Implementar conexão com LLM.
- Criar ferramentas de consulta.
- Implementar seleção de ferramentas.
- Criar memória de conversação.
- Implementar análises financeiras.
- Permitir respostas com gráficos e tabelas.
- Garantir fundamentação nas informações bancárias.

### ETAPA 5 — SEGURANÇA E PUBLICAÇÃO

- Revisar credenciais.
- Revisar RLS.
- Testar isolamento entre usuários.
- Testar integrações.
- Testar erros.
- Testar responsividade.
- Preparar publicação.

## 12. CRITÉRIOS DE ACEITAÇÃO

O projeto só deverá ser considerado funcional quando:

- O usuário conseguir entrar na aplicação.
- O dashboard apresentar dados corretamente.
- A conexão Sandbox da Plaid funcionar.
- Contas e transações forem obtidas da integração.
- A estrutura da Pluggy estiver implementada e preparada para credenciais válidas.
- O agente conseguir consultar os dados do usuário.
- As respostas forem fundamentadas nas informações obtidas.
- Os valores forem apresentados corretamente.
- Os usuários não conseguirem acessar dados uns dos outros.
- As credenciais privadas não estiverem expostas no navegador.

Não considerar uma integração concluída apenas porque sua interface foi criada.

## 13. INSTRUÇÕES DE EXECUÇÃO PARA O LOVABLE

Antes de começar a implementação:

1. Analise toda esta especificação.
2. Apresente uma proposta de arquitetura.
3. Identifique as dependências externas.
4. Identifique quais credenciais serão necessárias.
5. Identifique quais recursos podem ser implementados sem credenciais.
6. Identifique possíveis limitações da plataforma Lovable.
7. Apresente um plano de execução dividido em etapas.

Não invente credenciais ou dados de integração.

Não substitua conexões reais por respostas falsas sem identificar claramente o modo de demonstração.

Não exponha informações sensíveis.

Priorize código organizado, segurança, escalabilidade e uma experiência visual de alta qualidade.

**RESULTADO ESPERADO:**

Um agente financeiro inteligente, com interface de chat, capaz de interpretar dados bancários, consultar contas e transações, identificar padrões de consumo e fornecer análises financeiras personalizadas, utilizando Plaid Sandbox e Pluggy como fontes de dados independentes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2227d2c9-a5ad-40a6-8904-2a9b41828f02).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
