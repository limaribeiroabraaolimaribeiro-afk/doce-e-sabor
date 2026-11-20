export const whatsapp = 'https://wa.me/5542999059158'
export const molhos = ['Branco', 'Vermelho'] as const
export type Molho = typeof molhos[number]
export type Grupo = 'panquecas' | 'pasteis' | 'assados'
export const foto = (name: string) => '/fotos/' + name + '.webp'
export const moeda = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)

export interface Produto {
  id: string
  grupo: Grupo
  nome: string
  descricao: string
  preco: number
  foto: string
  molhos?: readonly Molho[]
}
export const produtos: Produto[] = [
  { id: 'panqueca-frango', grupo: 'panquecas', nome: 'Panqueca de Frango Cremoso', descricao: 'Recheio de frango cremoso com queijo. Escolha seu molho.', preco: 1200, foto: 'frango-panqueca', molhos },
  { id: 'panqueca-carne', grupo: 'panquecas', nome: 'Panqueca de Carne Moída', descricao: 'Recheio de carne moída com queijo. Escolha seu molho.', preco: 1400, foto: 'panquecas', molhos },
  { id: 'pastel-frango', grupo: 'pasteis', nome: 'Pastel de Frango Cremoso', descricao: 'Pastel frito na hora com recheio de frango cremoso.', preco: 1000, foto: 'frango-pastel' },
  { id: 'pastel-carne', grupo: 'pasteis', nome: 'Pastel de Carne Moída com Catupiry', descricao: 'Pastel frito na hora com carne moída e Catupiry.', preco: 1000, foto: 'carne-pastel' },
  { id: 'pastel-presunto', grupo: 'pasteis', nome: 'Pastel de Presunto e Queijo', descricao: 'Pastel frito na hora com presunto e queijo.', preco: 800, foto: 'pasteis' },
  { id: 'salgados-assados', grupo: 'assados', nome: 'Salgados Assados', descricao: 'Salgados assados, com massa dourada.', preco: 750, foto: 'assados' },
]
