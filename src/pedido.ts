import { moeda, produtos, whatsapp } from './catalogo.ts'
import type { Molho } from './catalogo.ts'

export type Linha = { id: string; molho?: Molho; quantidade: number }
export type Pedido = {
  nome: string
  telefone: string
  modo: 'Retirada' | 'Entrega'
  endereco: string
  observacoes: string
}

export const produtoPorId = new Map(produtos.map(produto => [produto.id, produto]))

export function subtotal(linhas: Linha[]) {
  return linhas.reduce((soma, linha) => soma + produtoPorId.get(linha.id)!.preco * linha.quantidade, 0)
}

export function montarPedido(linhas: Linha[], pedido: Pedido) {
  const mensagem = [
    'Olá! Gostaria de fazer um pedido na Doce & Sabor da Roh.',
    '', 'Nome: ' + pedido.nome.trim(), 'Telefone: ' + pedido.telefone.trim(), '',
    ...linhas.map(linha => {
      const produto = produtoPorId.get(linha.id)!
      return `${linha.quantidade}× ${produto.nome}${linha.molho ? ' (molho ' + linha.molho.toLowerCase() + ')' : ''} — ${moeda(produto.preco)} un. — ${moeda(produto.preco * linha.quantidade)}`
    }),
    '', 'Subtotal: ' + moeda(subtotal(linhas)), 'Recebimento: ' + pedido.modo,
    ...(pedido.modo === 'Entrega' ? ['Endereço: ' + pedido.endereco.trim(), 'Taxa de entrega a confirmar.'] : []),
    ...(pedido.observacoes.trim() ? ['Observações: ' + pedido.observacoes.trim()] : []),
  ].join('\n')
  return whatsapp + '?text=' + encodeURIComponent(mensagem)
}
