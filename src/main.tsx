import { createRoot } from 'react-dom/client'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, ChefHat, ChevronRight, Croissant, Menu, Minus, Plus, Search, ShoppingBag, Trash2, Utensils, X } from 'lucide-react'
import { foto, moeda, produtos, whatsapp } from './catalogo'
import type { Grupo, Molho, Produto } from './catalogo'
import './style.css'

const categorias = [
  { nome: 'Panquecas', foto: 'panquecas', grupo: 'panquecas', Icon: Utensils },
  { nome: 'Pastéis', foto: 'pasteis', grupo: 'pasteis', Icon: Croissant },
  { nome: 'Salgados', foto: 'salgados', grupo: 'assados', Icon: ChefHat },
  { nome: 'Assados', foto: 'assados', grupo: 'assados', Icon: ChefHat },
] satisfies { nome: string; foto: string; grupo: Grupo; Icon: typeof ChefHat }[]

import { montarPedido, produtoPorId, subtotal } from './pedido'
import type { Linha, Pedido } from './pedido'
type Painel = 'menu' | 'pesquisa' | 'carrinho' | 'checkout'
const chave = 'roh-carrinho-v1'
function carrinhoSalvo(): Linha[] {
  try {
    const dados: unknown = JSON.parse(localStorage.getItem(chave) || '[]')
    if (!Array.isArray(dados)) return []
    return dados.filter(linha => {
      const produto = linha && produtoPorId.get(linha.id)
      return produto && Number.isSafeInteger(linha.quantidade) && linha.quantidade > 0 &&
        (produto.molhos ? produto.molhos.includes(linha.molho) : linha.molho === undefined)
    })
  } catch {
    return []
  }
}

function WhatsApp({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 17.3 3 21l3.9-1a9 9 0 1 0-2.9-2.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 7.6c-.3-.7-.6-.7-.8-.7-.6 0-1.4.5-1.4 1.8 0 2.8 4 6.9 6.8 7.5 1.4.3 2.6-.3 2.9-1.3.1-.5 0-.6-.3-.8l-2.2-1.1c-.3-.1-.5 0-.7.2l-.7.8c-1.8-.6-3.1-2-3.7-3.5l.7-.8c.2-.2.2-.4.1-.7Z" fill="currentColor"/></svg>
}

function Foto({ name, eager = false }: { name: string; eager?: boolean }) {
  const [estado, setEstado] = useState('loading')
  return <div className={'foto ' + estado}>
    {estado === 'error' ? <span>Foto indisponível</span> :
      <img src={foto(name)} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" onLoad={() => setEstado('ready')} onError={() => setEstado('error')} />}
  </div>
}

function Quantidade({ valor, mudar, nome }: { valor: number; mudar: (delta: number) => void; nome: string }) {
  return <div className="stepper">
    <button type="button" aria-label={'Diminuir quantidade de ' + nome} onClick={() => mudar(-1)}><Minus size={15}/></button>
    <output aria-label="Quantidade">{valor}</output>
    <button type="button" aria-label={'Aumentar quantidade de ' + nome} onClick={() => mudar(1)}><Plus size={15}/></button>
  </div>
}

function Cartao({ produto, adicionar }: { produto: Produto; adicionar: (linha: Linha, nome: string) => void }) {
  const [quantidade, setQuantidade] = useState(1)
  const [molho, setMolho] = useState<Molho | undefined>(produto.molhos?.[0])
  return <article className="produto">
    <Foto name={produto.foto}/>
    <div className="produto-info">
      <h3>{produto.nome}</h3><p>{produto.descricao}</p>
      {produto.molhos && <label>Molho<select value={molho} onChange={e => setMolho(e.target.value as Molho)}>
        {produto.molhos.map(opcao => <option key={opcao}>{opcao}</option>)}
      </select></label>}
      <strong>{moeda(produto.preco)}</strong>
      <div className="produto-acoes">
        <Quantidade valor={quantidade} nome={produto.nome} mudar={delta => setQuantidade(q => Math.max(1, q + delta))}/>
        <button className="button primary" onClick={() => { adicionar({ id: produto.id, quantidade, molho }, produto.nome); setQuantidade(1) }}>Adicionar</button>
      </div>
    </div>
  </article>
}

function normalizarPesquisa(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function Pesquisa({ adicionar }: { adicionar: (linha: Linha, nome: string) => void }) {
  const [termo, setTermo] = useState('')
  const palavras = normalizarPesquisa(termo.trim()).split(/\s+/)
  const resultados = produtos.filter(produto => {
    const texto = normalizarPesquisa(produto.nome + ' ' + produto.descricao)
    return palavras.every(palavra => texto.includes(palavra))
  })

  return <div className="pesquisa">
    <label>Buscar no cardápio
      <input type="search" autoFocus placeholder="Ex.: frango, pastel ou queijo" value={termo} onChange={e => setTermo(e.target.value)}/>
    </label>
    {resultados.length ? <div className="pesquisa-resultados">
      {resultados.map(produto => <Cartao key={produto.id} produto={produto} adicionar={adicionar}/>)}
    </div> : <p role="status">Nenhum produto encontrado. Tente outro termo.</p>}
  </div>
}

function Drawer({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-labelledby="painel-titulo" onCancel={e => { e.preventDefault(); fechar() }} onClick={e => { if (e.target === e.currentTarget) fechar() }}>
    <div className="drawer">
      <div className="drawer-header"><h2 id="painel-titulo">{titulo}</h2><button className="icon-button" aria-label="Fechar" onClick={fechar}><X/></button></div>
      {children}
    </div>
  </dialog>
}

function App() {
  const [categoria, setCategoria] = useState<typeof categorias[number]>()
  const [painel, setPainel] = useState<Painel>()
  const [linhas, setLinhas] = useState(carrinhoSalvo)
  const [feedback, setFeedback] = useState('')
  const [falhaPersistencia, setFalhaPersistencia] = useState(false)
  const [pedido, setPedido] = useState<Pedido>({ nome: '', telefone: '', modo: 'Retirada', endereco: '', observacoes: '' })
  const lista = useRef<HTMLElement>(null)
  const total = subtotal(linhas)
  const itens = linhas.reduce((soma, linha) => soma + linha.quantidade, 0)

  useEffect(() => {
    try { localStorage.setItem(chave, JSON.stringify(linhas)) }
    catch { setFalhaPersistencia(true) }
  }, [linhas])
  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(''), 2600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function selecionar(nova: typeof categorias[number]) {
    setCategoria(nova)
    setPainel(undefined)
    requestAnimationFrame(() => {
      lista.current?.focus({ preventScroll: true })
      lista.current?.scrollIntoView()
    })
  }

  function adicionar(nova: Linha, nome: string) {
    setLinhas(atuais => atuais.some(l => l.id === nova.id && l.molho === nova.molho)
      ? atuais.map(l => l.id === nova.id && l.molho === nova.molho ? { ...l, quantidade: l.quantidade + nova.quantidade } : l)
      : [...atuais, nova])
    setFeedback(nome + ' adicionado ao carrinho.')
  }

  function ajustar(indice: number, delta: number) {
    setLinhas(atuais => atuais.map((l, i) => i === indice ? { ...l, quantidade: l.quantidade + delta } : l).filter(l => l.quantidade > 0))
  }

  function trocarMolho(indice: number, molho: Molho) {
    setLinhas(atuais => {
      const linha = atuais[indice]
      const destino = atuais.findIndex((outra, i) => i !== indice && outra.id === linha.id && outra.molho === molho)
      if (destino === -1) return atuais.map((outra, i) => i === indice ? { ...outra, molho } : outra)
      return atuais.map((outra, i) => i === destino ? { ...outra, quantidade: outra.quantidade + linha.quantidade } : outra)
        .filter((_, i) => i !== indice)
    })
  }

  function finalizar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!linhas.length) return
    if (pedido.modo === 'Entrega' && !pedido.endereco.trim()) {
      const endereco = evento.currentTarget.elements.namedItem('endereco') as HTMLTextAreaElement
      endereco.setCustomValidity('Informe o endereço completo.')
      endereco.reportValidity()
      return
    }
    window.location.assign(montarPedido(linhas, pedido))
  }

  return <>
    <header className="topo" id="inicio"><div className="topo-inner">
      <button className="icon-button menu-trigger" aria-label="Abrir menu" onClick={() => setPainel('menu')}><Menu size={24}/></button>
      <a className="marca" href="#inicio"><ChefHat size={28} strokeWidth={1.4}/><span>Doce <i>&amp;</i> Sabor <em>da Roh</em><small>PANQUECARIA</small></span></a>
      <div className="topo-acoes">
        <button className="icon-button" aria-label="Pesquisar produtos" onClick={() => setPainel('pesquisa')}><Search size={22}/></button>
        <button className="icon-button bolsa" aria-label={`Carrinho, ${itens} itens`} onClick={() => setPainel('carrinho')}><ShoppingBag size={21}/>{itens > 0 && <span>{itens}</span>}</button>
      </div>
    </div></header>

    <main>
      <section className="hero" aria-labelledby="hero-titulo">
        <Foto name="banner" eager/>
        <div className="hero-inner"><div className="hero-copy">
          <h1 id="hero-titulo">Panquecas, pastéis<br className="desktop-break"/> e salgados com<br className="desktop-break"/> muito <em>Sabor!</em></h1>
          <p>Receitas feitas com carinho, qualidade e ingredientes selecionados.</p>
          <a className="button primary hero-button" href="#categorias">Ver Cardápio <ArrowRight size={19}/></a>
        </div></div>
      </section>

      <section className="categorias shell" id="categorias">
        <h2>Escolha o que você prefere</h2>
        <div className="grade">
          {categorias.map(cat => <button className="categoria" key={cat.nome} onClick={() => selecionar(cat)} aria-pressed={categoria?.nome === cat.nome}>
            <Foto name={cat.foto}/><span className="categoria-info"><span className="categoria-nome"><cat.Icon size={19}/>{cat.nome}</span><span className="seta"><ChevronRight size={19}/></span></span>
          </button>)}
        </div>
        <div className="pedido-direto"><a className="button green" href={whatsapp}><WhatsApp/> Peça pelo WhatsApp</a></div>
      </section>

      {categoria && <section key={categoria.nome} className="catalogo shell" ref={lista} tabIndex={-1} aria-labelledby="lista-titulo">
        <div className="catalogo-topo"><h2 id="lista-titulo">{categoria.nome}</h2><a href="#categorias">Ver categorias</a></div>
        <div className="produtos">{produtos.filter(p => p.grupo === categoria.grupo).map(p => <Cartao key={p.id} produto={p} adicionar={adicionar}/>)}</div>
      </section>}
    </main>

    <footer><a className="marca" href="#inicio"><ChefHat size={21}/><span>Doce <i>&amp;</i> Sabor <em>da Roh</em></span></a><a href={whatsapp}>(42) 99905-9158</a></footer>
    {itens > 0 && !painel && <button className="button primary carrinho-flutuante" onClick={() => setPainel('carrinho')}><ShoppingBag size={19}/> Carrinho ({itens}) <strong>{moeda(total)}</strong></button>}
    {!painel && <div className="feedback" role="status">{feedback && <span>{feedback}</span>}</div>}
    {painel && <Drawer titulo={{ menu: 'Menu', pesquisa: 'Pesquisar produtos', carrinho: 'Seu carrinho', checkout: 'Finalizar pedido' }[painel]} fechar={() => setPainel(undefined)}>
      {painel === 'menu' && <nav className="menu-lista" aria-label="Menu principal">
        <a href="#categorias" onClick={() => setPainel(undefined)}>Cardápio <ChevronRight size={18}/></a>
        {categorias.map(cat => <button key={cat.nome} onClick={() => selecionar(cat)}>{cat.nome}<ChevronRight size={18}/></button>)}
        <button onClick={() => setPainel('carrinho')}>Carrinho ({itens}) <ShoppingBag size={18}/></button>
        <a href={whatsapp}>WhatsApp <WhatsApp size={18}/></a>
      </nav>}
      {painel === 'pesquisa' && <>
        <Pesquisa adicionar={adicionar}/>
        <div className="pesquisa-carrinho">
          <p role="status">{feedback}</p>
          <button className="button primary full" onClick={() => setPainel('carrinho')}><ShoppingBag size={19}/> Ver carrinho ({itens})</button>
        </div>
      </>}
      {painel === 'carrinho' && <>
        {falhaPersistencia && <p>Seu navegador não permitiu salvar o carrinho. Você pode continuar com o pedido nesta página.</p>}
        {itens === 0 ? <div className="vazio"><ShoppingBag size={36}/><p>Seu carrinho está vazio.</p><a className="button primary" href="#categorias" onClick={() => setPainel(undefined)}>Ver Cardápio</a></div> :
          <>
            {linhas.map((linha, indice) => {
              const produto = produtoPorId.get(linha.id)!
              return <article className="linha" key={linha.id + ':' + (linha.molho || '')}>
                <div><strong>{produto.nome}</strong>{produto.molhos && <label className="molho-carrinho">Molho<select aria-label={'Molho de ' + produto.nome} value={linha.molho} onChange={e => trocarMolho(indice, e.target.value as Molho)}>
                  {produto.molhos.map(opcao => <option key={opcao}>{opcao}</option>)}
                </select></label>}<small>{moeda(produto.preco)} por unidade</small></div>
                <strong>{moeda(produto.preco * linha.quantidade)}</strong>
                <Quantidade valor={linha.quantidade} nome={produto.nome + (linha.molho ? ' com molho ' + linha.molho.toLowerCase() : '')} mudar={delta => ajustar(indice, delta)}/>
                <button className="icon-button" aria-label={'Remover ' + produto.nome} onClick={() => ajustar(indice, -linha.quantidade)}><Trash2 size={18}/></button>
              </article>
            })}
            <label className="observacoes">Observações do pedido<textarea value={pedido.observacoes} onChange={e => setPedido({ ...pedido, observacoes: e.target.value })} maxLength={500}/></label>
            <div className="subtotal"><span>Subtotal</span><strong>{moeda(total)}</strong></div>
            <button className="button primary full" onClick={() => setPainel('checkout')}>Continuar pedido <ArrowRight size={18}/></button>
          </>}
      </>}
      {painel === 'checkout' && <form className="checkout" onSubmit={finalizar}>
        <button className="texto-botao" type="button" onClick={() => setPainel('carrinho')}>Voltar ao carrinho</button>
        <label>Nome<input autoComplete="name" required pattern=".*\S.*" maxLength={100} value={pedido.nome} onChange={e => setPedido({ ...pedido, nome: e.target.value })}/></label>
        <label>Telefone com DDD<input type="tel" inputMode="tel" autoComplete="tel" required pattern={String.raw`(?:\+?55[ .-]?)?\(?[0-9]{2}\)?[ .-]?[0-9]{4,5}[ .-]?[0-9]{4}`} title="Informe o telefone com DDD" maxLength={22} value={pedido.telefone} onChange={e => setPedido({ ...pedido, telefone: e.target.value })}/></label>
        <fieldset><legend>Como deseja receber?</legend>
          {(['Retirada', 'Entrega'] as const).map(modo => <label className="radio" key={modo}><input type="radio" name="modo" checked={pedido.modo === modo} onChange={() => setPedido({ ...pedido, modo })}/>{modo}</label>)}
        </fieldset>
        {pedido.modo === 'Entrega' && <><label>Endereço completo<textarea name="endereco" required autoComplete="street-address" maxLength={350} placeholder="Rua, número, bairro, cidade e complemento" value={pedido.endereco} onChange={e => { e.target.setCustomValidity(e.target.value.trim() ? '' : 'Informe o endereço completo.'); setPedido({ ...pedido, endereco: e.target.value }) }}/></label><p className="taxa">A taxa de entrega será confirmada pelo estabelecimento.</p></>}
        <label>Observações do pedido<textarea maxLength={500} value={pedido.observacoes} onChange={e => setPedido({ ...pedido, observacoes: e.target.value })}/></label>
        <div className="subtotal"><span>Subtotal</span><strong>{moeda(total)}</strong></div>
        <button className="button green full" type="submit"><WhatsApp/> Finalizar pelo WhatsApp</button>
      </form>}
    </Drawer>}
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
