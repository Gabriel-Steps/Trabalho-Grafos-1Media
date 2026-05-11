import { useState } from 'react'
import { getColor, NODE_R } from './utils/constants'
import GraphCanvas from './components/GraphCanvas'
import { dfs, bfs } from './algorithms/traversal'
import { calcFecho } from './algorithms/transitive_closure'
import { kosarajuSCC } from './algorithms/kosaraju'
import { isConnected } from './algorithms/connectivity'
import { useGraph } from './hooks/use_graph'
import { graphColoring } from './algorithms/graph_coloring'

import './App.css'

const TABS = ['Vértices', 'Arestas', 'Percurso', 'Fecho', 'Análise', 'Coloração']

export default function App() {
  const {
    graph,
    addVertex,
    removeVertex,
    addEdge,
    removeEdge,
    updateVertexPosition,
    setGraphDirected,
    replaceGraph
  } = useGraph()
  const vertices = Object.keys(graph.vertices)
  const edges = Object.values(graph.edges)
  const directed = graph.directed

  const [activeTab, setActiveTab] = useState('Vértices')
  const [result, setResult] = useState(null)
  const [highlight, setHighlight] = useState({})
  const [draggingNode, setDraggingNode] = useState(null)
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [vInput, setVInput] = useState('')
  const [eFrom, setEFrom] = useState('')
  const [eTo, setETo] = useState('')
  const [percursoStart, setPercursoStart] = useState('')
  const [fechoVertex, setFechoVertex] = useState('')
  const [fechoType, setFechoType] = useState('direto')
  const [coloringOrder, setColoringOrder] = useState([])

  const runColoring = () => {
    const result = graphColoring(graph)

    replaceGraph(result.graph)

    setColoringOrder(result.order)

    setHighlight({
      nodes: result.order,
      order: result.order
    })

    setResult({
      type: 'coloring',
      title: 'Ordem de coloração',
      data: result.order
    })
  }

  const runDFS = () => {
    const start = percursoStart || vertices[0]
    if (!start) return
    const order = dfs(start, graph)
    setHighlight({ nodes: order, order })
    setResult({ type: 'dfs', title: `DFS a partir de ${start}`, data: order })
  }

  const runBFS = () => {
    const start = percursoStart || vertices[0]
    if (!start) return
    const order = bfs(start, graph)
    setHighlight({ nodes: order, order })
    setResult({ type: 'bfs', title: `BFS a partir de ${start}`, data: order })
  }

  const runFecho = () => {
    const vertex = fechoVertex || vertices[0]

    if (!vertex) return

    const reverse =
      directed &&
      fechoType === 'inverso'

    const reach = calcFecho(
      vertex,
      graph,
      reverse
    )

    const title = directed
      ? `Fecho ${fechoType} de ${vertex}`
      : `Fecho transitivo de ${vertex}`

    setHighlight({
      nodes: [vertex, ...reach],
      selected: vertex
    })

    setResult({
      type: 'fecho',
      title,
      data: reach
    })
  }

  const runAnalise = () => {
    const conexo = isConnected(graph)

    const sccs =
      directed
        ? kosarajuSCC(graph)
        : null

    let comps = null

    if (!directed && !conexo) {
      const visited = new Set()

      comps = []

      vertices.forEach(vertex => {
        if (!visited.has(vertex)) {
          const component = dfs(vertex, graph)

          component.forEach(v => {
            visited.add(v)
          })

          comps.push(component)
        }
      })
    }

    setHighlight({})

    setResult({
      type: 'analise',
      conexo,
      sccs,
      comps
    })
  }

  const handleNodeClick = v => {
    if (activeTab === 'Arestas' && connectingFrom) {
      if (!edges.some(e => e.from === connectingFrom && e.to === v)) {
        addEdge(connectingFrom, v)
        setResult({ type: 'info', msg: `Aresta ${connectingFrom} ${directed ? '→' : '—'} ${v} adicionada.` })
      } else {
        setResult({ type: 'error', msg: 'Essa aresta já existe.' })
      }
      setConnectingFrom(null); setHighlight({})
      return
    }
    if (activeTab === 'Arestas') {
      setConnectingFrom(v)
      setHighlight({ selected: v })
      setResult({ type: 'info', msg: `Clique em outro vértice para conectar com "${v}". Pode clicar no mesmo para self-loop.` })
      return
    }
    setHighlight(h => h.selected === v ? {} : { selected: v })
  }

  const handleCanvasClick = (x, y) => {
    if (activeTab === 'Vértices') {
      const label = prompt('Nome do vértice:')
      if (!label) return
      const v = label.trim().toUpperCase()
      if (!v || vertices.includes(v)) return
      addVertex(v, x, y)
      setResult({ type: 'info', msg: `Vértice "${v}" adicionado.` })
    }
  }

  const clearHighlight = () => { setHighlight({}); setResult(null); setConnectingFrom(null) }
  const edgesDisplay = directed
    ? edges
    : edges.filter((e, i) =>
      e.from === e.to ||
      !edges.slice(0, i).some(x => x.from === e.to && x.to === e.from)
    )

  const handleAddVertexFromInput = () => {
    const v = vInput.trim().toUpperCase()

    if (!v || graph.vertices[v]) return

    const canvas = document.querySelector('canvas')

    const padding = 60

    const width = canvas?.width || 800
    const height = canvas?.height || 500

    const x =
      padding +
      Math.random() * (width - padding * 2)

    const y =
      padding +
      Math.random() * (height - padding * 2)

    addVertex(v, x, y)

    setVInput('')

    setResult({
      type: 'info',
      msg: `Vértice "${v}" adicionado.`
    })
  }

  const handleAddEdgeFromInputs = () => {
    if (!eFrom || !eTo) return

    if (
      edges.some(
        edge =>
          edge.from === eFrom &&
          edge.to === eTo
      )
    ) {
      setResult({
        type: 'error',
        msg: 'Essa aresta já existe.'
      })

      return
    }

    addEdge(eFrom, eTo)

    setEFrom('')
    setETo('')

    setResult({
      type: 'info',
      msg: `Aresta ${eFrom} ${directed ? '→' : '—'} ${eTo} adicionada.`
    })
  }

  const clearColoring = () => {
    const newVertices = {}

    Object.entries(graph.vertices).forEach(([id, vertex]) => {
      newVertices[id] = {
        ...vertex,
        color: undefined
      }
    })

    replaceGraph({
      ...graph,
      vertices: newVertices
    })

    setColoringOrder([])
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">GraphLab</span>
        </div>
        <div className="header-center">
          <button
            className={`toggle-btn ${!directed ? 'active' : ''}`}
            onClick={() => {
              setGraphDirected(false)
              clearHighlight()
            }}
          >Não-dirigido</button>
          <button
            className={`toggle-btn ${directed ? 'active' : ''}`}
            onClick={() => {
              setGraphDirected(true)
              clearHighlight()
            }}
          >Dirigido</button>
        </div>
        <div className="header-right">
          <span className="stat">{vertices.length} vértices</span>
          <span className="stat">{edgesDisplay.length} arestas</span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => {
                  if (
                    activeTab === 'Coloração' &&
                    t !== 'Coloração'
                  ) {
                    clearColoring()
                  }

                  setActiveTab(t)
                  clearHighlight()
                }}>{t}</button>
            ))}
          </nav>

          <div className="panel-content">
            {activeTab === 'Vértices' && (
              <div className="section">
                <p className="hint">Clique no canvas para adicionar, ou use o campo abaixo:</p>
                <div className="input-row">
                  <input value={vInput} onChange={e => setVInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddVertexFromInput()}
                    placeholder="Nome (ex: A)" maxLength={4} className="inp" />
                  <button className="btn-orange" onClick={handleAddVertexFromInput}>+</button>
                </div>
                <div className="list">
                  {vertices.length === 0 && <p className="empty">Nenhum vértice ainda.</p>}
                  {vertices.map((v, i) => (
                    <div key={v} className="list-item">
                      <span className="list-dot" style={{ background: getColor(i) }} />
                      <span className="list-label">{v}</span>
                      <button className="btn-remove" onClick={() => removeVertex(v)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'Arestas' && (
              <div className="section">
                <p className="hint">Clique em dois vértices no canvas, ou use o formulário:</p>
                {connectingFrom && (
                  <div className="connecting-badge">
                    De: <strong>{connectingFrom}</strong> → clique no destino
                  </div>
                )}
                <div className="input-row">
                  <select value={eFrom} onChange={e => setEFrom(e.target.value)} className="inp sel">
                    <option value="">De</option>
                    {vertices.map(v => <option key={v}>{v}</option>)}
                  </select>
                  <select value={eTo} onChange={e => setETo(e.target.value)} className="inp sel">
                    <option value="">Para</option>
                    {vertices.map(v => <option key={v}>{v}</option>)}
                  </select>
                  <button className="btn-orange" onClick={handleAddEdgeFromInputs}>+</button>
                </div>
                <div className="list">
                  {edgesDisplay.length === 0 && <p className="empty">Nenhuma aresta ainda.</p>}
                  {edgesDisplay.map((e, i) => (
                    <div key={i} className="list-item">
                      <span className="edge-label">{e.from} {directed ? '→' : '—'} {e.to}</span>
                      <button className="btn-remove" onClick={() => removeEdge(e.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'Percurso' && (
              <div className="section">
                <label className="field-label">Vértice inicial</label>
                <select value={percursoStart} onChange={e => setPercursoStart(e.target.value)} className="inp sel full">
                  {vertices.map(v => <option key={v}>{v}</option>)}
                </select>
                <div className="btn-group">
                  <button className="btn-action" onClick={runDFS}>DFS — Profundidade</button>
                  <button className="btn-action" onClick={runBFS}>BFS — Largura</button>
                </div>
              </div>
            )}
            {activeTab === 'Fecho' && (
              <div className="section">
                <label className="field-label">Vértice</label>
                <select value={fechoVertex} onChange={e => setFechoVertex(e.target.value)} className="inp sel full">
                  {vertices.map(v => <option key={v}>{v}</option>)}
                </select>
                {directed && (
                  <>
                    <label className="field-label" style={{ marginTop: 12 }}>Tipo de fecho</label>
                    <div className="radio-group">
                      <label className={`radio ${fechoType === 'direto' ? 'active' : ''}`}>
                        <input type="radio" value="direto" checked={fechoType === 'direto'} onChange={() => setFechoType('direto')} /> Direto
                      </label>
                      <label className={`radio ${fechoType === 'inverso' ? 'active' : ''}`}>
                        <input type="radio" value="inverso" checked={fechoType === 'inverso'} onChange={() => setFechoType('inverso')} /> Inverso
                      </label>
                    </div>
                  </>
                )}
                {!directed && (
                  <p className="hint" style={{ marginTop: 8 }}>
                    Em grafos não-dirigidos o fecho é único — arestas não têm sentido definido.
                  </p>
                )}
                <button className="btn-action full" onClick={runFecho}>Calcular Fecho</button>
              </div>
            )}
            {activeTab === 'Análise' && (
              <div className="section">
                <p className="hint">
                  Verifica conectividade e calcula Componentes Fortemente Conexos (Kosaraju) para grafos dirigidos,
                  ou componentes conexas para não-dirigidos.
                </p>
                <button className="btn-action full" onClick={runAnalise}>Analisar Grafo</button>
              </div>
            )}
            {activeTab === 'Coloração' && (
              <div className="section">
                <p className="hint">
                  Executa coloração gulosa usando heurística DSATUR.
                </p>

                <button
                  className="btn-action full"
                  onClick={runColoring}
                >
                  Colorir Grafo
                </button>

                {coloringOrder.length > 0 && (
                  <>
                    <div
                      className="result-subtitle"
                      style={{ marginTop: 16 }}
                    >
                      Ordem:
                    </div>

                    <div className="chip-list">
                      {coloringOrder.map(v => (
                        <span key={v} className="chip">
                          {v}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
        <main className="canvas-area">
          <GraphCanvas
            graph={graph}
            highlight={highlight}
            onNodeClick={handleNodeClick} onCanvasClick={handleCanvasClick}
            draggingNode={draggingNode} setDraggingNode={setDraggingNode}
            updateVertexPosition={updateVertexPosition}
          />
          {vertices.length === 0 && (
            <div className="canvas-empty">
              <p>Vá em <strong>Vértices</strong> e clique no canvas para começar</p>
            </div>
          )}
        </main>
        <aside className="result-panel">
          <div className="result-title">Resultado</div>
          {!result && <p className="empty" style={{ padding: '1rem' }}>Execute uma operação para ver o resultado aqui.</p>}
          {result?.type === 'info' && <div className="result-info">{result.msg}</div>}
          {result?.type === 'error' && <div className="result-error">{result.msg}</div>}
          {(result?.type === 'dfs' || result?.type === 'bfs') && (
            <div className="result-block">
              <div className="result-subtitle">{result.title}</div>
              <div className="result-seq">
                {result.data.map((v, i) => (
                  <span key={i} className="seq-chip">
                    <span className="seq-num">{i + 1}</span>{v}
                    {i < result.data.length - 1 && <span className="seq-arrow">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result?.type === 'fecho' && (
            <div className="result-block">
              <div className="result-subtitle">{result.title}</div>
              {result.data.length === 0
                ? <p className="empty" style={{ padding: '8px 0' }}>Nenhum vértice alcançável.</p>
                : <div className="chip-list">{result.data.map(v => <span key={v} className="chip">{v}</span>)}</div>
              }
            </div>
          )}
          {result?.type === 'analise' && (
            <div className="result-block">
              <div className={`conexo-badge ${result.conexo ? 'sim' : 'nao'}`}>
                {result.conexo ? '✓ Grafo Conexo' : '✗ Grafo Não-Conexo'}
              </div>
              {directed && result.sccs && (
                <div>
                  <div className="result-subtitle" style={{ marginTop: 12 }}>SCCs — Kosaraju:</div>
                  {result.sccs.map((scc, i) => (
                    <div key={i} className="scc-item">
                      <span className="scc-num">SCC {i + 1}</span>
                      <span className="chip-list">{scc.map(v => <span key={v} className="chip">{v}</span>)}</span>
                    </div>
                  ))}
                </div>
              )}
              {!directed && result.comps && (
                <div>
                  <div className="result-subtitle" style={{ marginTop: 12 }}>Componentes conexas:</div>
                  {result.comps.map((c, i) => (
                    <div key={i} className="scc-item">
                      <span className="scc-num">C{i + 1}</span>
                      <span className="chip-list">{c.map(v => <span key={v} className="chip">{v}</span>)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {result?.type === 'coloring' && (
            <div className="result-block">
              <div className="result-subtitle">
                {result.title}
              </div>

              <div className="result-seq">
                {result.data.map((v, i) => (
                  <span key={v} className="seq-chip">
                    <span className="seq-num">
                      {i + 1}
                    </span>

                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result && <button className="btn-clear" onClick={clearHighlight}>Limpar destaque</button>}
        </aside>
      </div>
    </div>
  )
}