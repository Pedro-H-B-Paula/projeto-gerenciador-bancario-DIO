import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  colorVar: string;
  /** Words (accent-free, lowercase) that refer to this category in natural language. */
  keywords: string[];
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  alimentacao: { id: "alimentacao", label: "Alimentação", colorVar: "--chart-1", keywords: ["alimentacao", "comida", "restaurante", "restaurantes", "delivery", "lanche"] },
  mercado: { id: "mercado", label: "Mercado", colorVar: "--chart-6", keywords: ["mercado", "supermercado", "feira"] },
  transporte: { id: "transporte", label: "Transporte", colorVar: "--chart-2", keywords: ["transporte", "uber", "combustivel", "gasolina", "corrida", "corridas"] },
  moradia: { id: "moradia", label: "Moradia", colorVar: "--chart-5", keywords: ["moradia", "aluguel", "condominio"] },
  contas: { id: "contas", label: "Contas da casa", colorVar: "--chart-7", keywords: ["luz", "energia", "internet", "agua", "contas da casa"] },
  assinaturas: { id: "assinaturas", label: "Assinaturas", colorVar: "--chart-3", keywords: ["assinatura", "assinaturas", "streaming"] },
  saude: { id: "saude", label: "Saúde", colorVar: "--chart-4", keywords: ["saude", "farmacia", "medico", "academia"] },
  lazer: { id: "lazer", label: "Lazer", colorVar: "--chart-2", keywords: ["lazer", "cinema", "show", "viagem"] },
  compras: { id: "compras", label: "Compras", colorVar: "--chart-8", keywords: ["compras", "roupa", "roupas", "eletronicos"] },
  educacao: { id: "educacao", label: "Educação", colorVar: "--chart-6", keywords: ["educacao", "curso", "cursos", "livro", "livros"] },
  salario: { id: "salario", label: "Salário", colorVar: "--chart-1", keywords: ["salario"] },
  freelance: { id: "freelance", label: "Freelance", colorVar: "--chart-2", keywords: ["freelance", "freela"] },
  rendimentos: { id: "rendimentos", label: "Rendimentos", colorVar: "--chart-3", keywords: ["rendimento", "rendimentos", "juros"] },
  transferencia: { id: "transferencia", label: "Transferência interna", colorVar: "--chart-8", keywords: ["transferencia", "fatura"] },
  outros: { id: "outros", label: "Outros", colorVar: "--chart-8", keywords: [] },
};

export const categoryLabel = (id: CategoryId) => CATEGORIES[id]?.label ?? id;
export const categoryColor = (id: CategoryId) => `var(${CATEGORIES[id]?.colorVar ?? "--chart-8"})`;
