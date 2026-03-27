import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'


function buildAdj(vertices, edges, directed) {
  const adj = {}
  vertices.forEach(v => { adj[v] = [] })
  edges.forEach(({ from, to }) => {
    if (adj[from]) adj[from].push(to)
    if (!directed && from !== to && adj[to]) adj[to].push(from)
  })
  return adj
}

function buildReverseAdj(vertices, edges) {
  const adj = {}
  vertices.forEach(v => { adj[v] = [] })
  edges.forEach(({ from, to }) => {
    if (adj[to]) adj[to].push(from)
  })
  return adj
}

function dfs(start, adj) {
  const visited = [], seen = new Set(), stack = [start]
  while (stack.length) {
    const v = stack.pop()
    if (seen.has(v)) continue
    seen.add(v)
    visited.push(v)
    ;[...(adj[v] || [])].reverse().forEach(n => { if (!seen.has(n)) stack.push(n) })
  }
  return visited
}

function bfs(start, adj) {
  const visited = [], seen = new Set([start]), queue = [start]
  while (queue.length) {
    const v = queue.shift()
    visited.push(v)
    ;(adj[v] || []).forEach(n => { if (!seen.has(n)) { seen.add(n); queue.push(n) } })
  }
  return visited
}

function calcFecho(start, adj) {
  const reach = new Set()
  const queue = [start]
  const visitedInQueue = new Set([start])
  while (queue.length) {
    const v = queue.shift()
    ;(adj[v] || []).forEach(n => {
      if (!visitedInQueue.has(n)) {
        visitedInQueue.add(n)
        reach.add(n)
        queue.push(n)
      }
    })
  }
  reach.delete(start)
  return [...reach]
}

function isConnected(vertices, edges, directed) {
  if (vertices.length === 0) return true
  if (vertices.length === 1) return true
  if (!directed) {
    const adj = buildAdj(vertices, edges, false)
    return dfs(vertices[0], adj).length === vertices.length
  }
  const adj  = buildAdj(vertices, edges, true)
  const radj = buildReverseAdj(vertices, edges)
  return dfs(vertices[0], adj).length  === vertices.length &&
         dfs(vertices[0], radj).length === vertices.length
}

function kosarajuSCC(vertices, edges) {
  if (vertices.length === 0) return []
  const adj  = buildAdj(vertices, edges, true)
  const radj = buildReverseAdj(vertices, edges)

  const visited = new Set()
  const order = []
  vertices.forEach(start => {
    if (visited.has(start)) return
    const stack = [[start, false]]
    while (stack.length) {
      const [v, processed] = stack.pop()
      if (processed) { order.push(v); continue }
      if (visited.has(v)) continue
      visited.add(v)
      stack.push([v, true])
      ;(adj[v] || []).forEach(n => { if (!visited.has(n)) stack.push([n, false]) })
    }
  })

  const visited2 = new Set()
  const sccs = []
  for (let i = order.length - 1; i >= 0; i--) {
    const start = order[i]
    if (visited2.has(start)) continue
    const comp = []
    const stack = [start]
    while (stack.length) {
      const v = stack.pop()
      if (visited2.has(v)) continue
      visited2.add(v)
      comp.push(v)
      ;(radj[v] || []).forEach(n => { if (!visited2.has(n)) stack.push(n) })
    }
    sccs.push(comp)
  }
  return sccs
}

const NODE_R = 22
const PALETTE = ['#ff6b35','#f7c59f','#00a6fb','#57cc99','#c77dff','#e63946','#a8dadc','#ffe66d','#06d6a0']
function getColor(i) { return PALETTE[i % PALETTE.length] }

function GraphCanvas({ vertices, edges, directed, highlight, onNodeClick, onCanvasClick, draggingNode, setDraggingNode, positions, setPositions }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const posRef    = useRef(positions)
  useEffect(() => { posRef.current = positions }, [positions])

  useEffect(() => {
    if (vertices.length === 0) return
    setPositions(prev => {
      const next = { ...prev }
      vertices.forEach((v, i) => {
        if (!next[v]) {
          const angle = (2 * Math.PI * i) / vertices.length - Math.PI / 2
          const r = Math.min(180, 60 + vertices.length * 20)
          next[v] = { x: 400 + r * Math.cos(angle), y: 250 + r * Math.sin(angle) }
        }
      })
      Object.keys(next).forEach(k => { if (!vertices.includes(k)) delete next[k] })
      return next
    })
  }, [vertices])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = posRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke() }
    for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke() }

    edges.forEach(({ from, to }) => {
      const a = pos[from], b = pos[to]
      if (!a || !b) return
      const hl = highlight.edges?.some(e => e.from === from && e.to === to)
      ctx.strokeStyle = hl ? '#ff6b35' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth   = hl ? 2.5 : 1.5

      if (from === to) {
        const loopR = NODE_R * 0.9
        ctx.beginPath()
        ctx.arc(a.x, a.y - NODE_R - loopR * 0.6, loopR, 0, Math.PI * 2)
        ctx.stroke()
        if (directed) {
          const ax = a.x + loopR * 0.5, ay = a.y - NODE_R - 2
          ctx.fillStyle = hl ? '#ff6b35' : 'rgba(255,255,255,0.2)'
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(ax - 8, ay - 8)
          ctx.lineTo(ax + 4, ay - 6)
          ctx.closePath(); ctx.fill()
        }
        return
      }

      ctx.beginPath()
      if (directed) {
        const dx = b.x-a.x, dy = b.y-a.y
        const dist = Math.sqrt(dx*dx+dy*dy)
        if (dist === 0) return
        const ux = dx/dist, uy = dy/dist
        const sx = a.x+ux*NODE_R, sy = a.y+uy*NODE_R
        const ex = b.x-ux*NODE_R, ey = b.y-uy*NODE_R
        ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke()
        const ang = Math.atan2(ey-sy, ex-sx)
        ctx.fillStyle = hl ? '#ff6b35' : 'rgba(255,255,255,0.2)'
        ctx.beginPath()
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - 12*Math.cos(ang-0.4), ey - 12*Math.sin(ang-0.4))
        ctx.lineTo(ex - 12*Math.cos(ang+0.4), ey - 12*Math.sin(ang+0.4))
        ctx.closePath(); ctx.fill()
      } else {
        ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke()
      }
    })

    vertices.forEach((v, i) => {
      const p = pos[v]; if (!p) return
      const isHl  = highlight.nodes?.includes(v)
      const isSel = highlight.selected === v
      const color = getColor(i)

      if (isHl || isSel) {
        const grd = ctx.createRadialGradient(p.x,p.y,NODE_R*0.5,p.x,p.y,NODE_R*2.5)
        grd.addColorStop(0, isSel ? 'rgba(255,107,53,0.4)' : 'rgba(255,107,53,0.22)')
        grd.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(p.x,p.y,NODE_R*2.5,0,Math.PI*2)
        ctx.fillStyle = grd; ctx.fill()
      }

      ctx.beginPath(); ctx.arc(p.x,p.y,NODE_R,0,Math.PI*2)
      ctx.fillStyle   = isHl ? '#ff6b35' : isSel ? '#e85d04' : '#2c2c2e'
      ctx.fill()
      ctx.strokeStyle = isHl || isSel ? '#ff6b35' : color
      ctx.lineWidth   = isSel ? 3 : 2
      ctx.stroke()

      ctx.fillStyle    = isHl ? '#fff' : color
      ctx.font         = `bold ${v.length > 2 ? '11' : '14'}px monospace`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(v, p.x, p.y)

      const ord = highlight.order?.indexOf(v)
      if (ord !== undefined && ord >= 0) {
        ctx.beginPath(); ctx.arc(p.x+NODE_R-2, p.y-NODE_R+2, 9, 0, Math.PI*2)
        ctx.fillStyle = '#ff6b35'; ctx.fill()
        ctx.fillStyle    = '#fff'
        ctx.font         = 'bold 9px monospace'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ord+1, p.x+NODE_R-2, p.y-NODE_R+2)
      }
    })
  }, [vertices, edges, directed, highlight])

  useEffect(() => {
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const getNode = (x, y) => {
    const pos = posRef.current
    return vertices.find(v => { const p = pos[v]; return p && Math.hypot(p.x-x, p.y-y) < NODE_R })
  }

  const handleMouseDown = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const node = getNode(x, y)
    if (node) setDraggingNode(node)
    else onCanvasClick(x, y)
  }

  const handleMouseMove = e => {
    if (!draggingNode) return
    const rect = canvasRef.current.getBoundingClientRect()
    setPositions(prev => ({ ...prev, [draggingNode]: { x: e.clientX-rect.left, y: e.clientY-rect.top } }))
  }

  const handleMouseUp = e => {
    if (draggingNode) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const p = posRef.current[draggingNode]
      if (p && Math.hypot(x-p.x, y-p.y) < 5) onNodeClick(draggingNode)
    }
    setDraggingNode(null)
  }

  return (
    <canvas ref={canvasRef} width={800} height={500}
      style={{ width:'100%', height:'100%', cursor: draggingNode ? 'grabbing' : 'crosshair', display:'block' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}

const TABS = ['Vértices', 'Arestas', 'Percurso', 'Fecho', 'Análise']

export default function App() {
  const [vertices,      setVertices]      = useState([])
  const [edges,         setEdges]         = useState([])
  const [directed,      setDirected]      = useState(false)
  const [activeTab,     setActiveTab]     = useState('Vértices')
  const [result,        setResult]        = useState(null)
  const [highlight,     setHighlight]     = useState({})
  const [positions,     setPositions]     = useState({})
  const [draggingNode,  setDraggingNode]  = useState(null)
  const [connectingFrom,setConnectingFrom]= useState(null)
  const [vInput,        setVInput]        = useState('')
  const [eFrom,         setEFrom]         = useState('')
  const [eTo,           setETo]           = useState('')
  const [percursoStart, setPercursoStart] = useState('')
  const [fechoVertex,   setFechoVertex]   = useState('')
  const [fechoType,     setFechoType]     = useState('direto')

  const addVertex = () => {
    const v = vInput.trim().toUpperCase()
    if (!v || vertices.includes(v)) return
    setVertices(p => [...p, v])
    setVInput('')
    setResult({ type:'info', msg:`Vértice "${v}" adicionado.` })
  }

  const removeVertex = v => {
    setVertices(p => p.filter(x => x !== v))
    setEdges(p => p.filter(e => e.from !== v && e.to !== v))
    setHighlight({})
    setResult({ type:'info', msg:`Vértice "${v}" removido.` })
  }

  const addEdge = () => {
    const f = eFrom.trim().toUpperCase()
    const t = eTo.trim().toUpperCase()
    if (!f || !t) return
    if (!vertices.includes(f) || !vertices.includes(t)) {
      setResult({ type:'error', msg:'Ambos os vértices devem existir no grafo.' }); return
    }
    if (edges.some(e => e.from === f && e.to === t)) {
      setResult({ type:'error', msg:'Essa aresta já existe.' }); return
    }
    setEdges(p => [...p, { from:f, to:t }])
    setEFrom(''); setETo('')
    setResult({ type:'info', msg:`Aresta ${f} ${directed ? '→' : '—'} ${t} adicionada.` })
  }

  const removeEdge = (from, to) => {
    setEdges(p => p.filter(e => !(e.from === from && e.to === to)))
    setHighlight({})
    setResult({ type:'info', msg:`Aresta ${from} ${directed ? '→' : '—'} ${to} removida.` })
  }

  const runDFS = () => {
    const start = percursoStart || vertices[0]
    if (!start) return
    const order = dfs(start, buildAdj(vertices, edges, directed))
    setHighlight({ nodes: order, order })
    setResult({ type:'dfs', title:`DFS a partir de ${start}`, data: order })
  }

  const runBFS = () => {
    const start = percursoStart || vertices[0]
    if (!start) return
    const order = bfs(start, buildAdj(vertices, edges, directed))
    setHighlight({ nodes: order, order })
    setResult({ type:'bfs', title:`BFS a partir de ${start}`, data: order })
  }

  const runFecho = () => {
    const v = fechoVertex || vertices[0]
    if (!v) return
    let adj, title
    if (!directed) {
      adj   = buildAdj(vertices, edges, false)
      title = `Fecho transitivo de ${v}`
    } else {
      adj   = fechoType === 'direto'
        ? buildAdj(vertices, edges, true)
        : buildReverseAdj(vertices, edges)
      title = `Fecho ${fechoType} de ${v}`
    }
    const reach = calcFecho(v, adj)
    setHighlight({ nodes: [v, ...reach], selected: v })
    setResult({ type:'fecho', title, data: reach })
  }

  const runAnalise = () => {
    const conexo = isConnected(vertices, edges, directed)
    const sccs   = directed ? kosarajuSCC(vertices, edges) : null
    let comps = null
    if (!directed && !conexo) {
      const adj  = buildAdj(vertices, edges, false)
      const seen = new Set()
      comps = []
      vertices.forEach(v => {
        if (!seen.has(v)) {
          const c = dfs(v, adj)
          c.forEach(x => seen.add(x))
          comps.push(c)
        }
      })
    }
    setHighlight({})
    setResult({ type:'analise', conexo, sccs, comps })
  }

  const handleNodeClick = v => {
    if (activeTab === 'Arestas' && connectingFrom) {
      if (!edges.some(e => e.from === connectingFrom && e.to === v)) {
        setEdges(p => [...p, { from: connectingFrom, to: v }])
        setResult({ type:'info', msg:`Aresta ${connectingFrom} ${directed ? '→' : '—'} ${v} adicionada.` })
      } else {
        setResult({ type:'error', msg:'Essa aresta já existe.' })
      }
      setConnectingFrom(null); setHighlight({})
      return
    }
    if (activeTab === 'Arestas') {
      setConnectingFrom(v)
      setHighlight({ selected: v })
      setResult({ type:'info', msg:`Clique em outro vértice para conectar com "${v}". Pode clicar no mesmo para self-loop.` })
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
      setVertices(p => [...p, v])
      setPositions(prev => ({ ...prev, [v]: { x, y } }))
      setResult({ type:'info', msg:`Vértice "${v}" adicionado.` })
    }
  }

  const clearHighlight = () => { setHighlight({}); setResult(null); setConnectingFrom(null) }
  const edgesDisplay = directed
    ? edges
    : edges.filter((e, i) =>
        e.from === e.to ||
        !edges.slice(0, i).some(x => x.from === e.to && x.to === e.from)
      )

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">GraphLab</span>
        </div>
        <div className="header-center">
          <button
            className={`toggle-btn ${!directed ? 'active' : ''}`}
            onClick={() => { setDirected(false); setEdges([]); clearHighlight() }}
          >Não-dirigido</button>
          <button
            className={`toggle-btn ${directed ? 'active' : ''}`}
            onClick={() => { setDirected(true); setEdges([]); clearHighlight() }}
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
                onClick={() => { setActiveTab(t); clearHighlight() }}>{t}</button>
            ))}
          </nav>

          <div className="panel-content">
            {activeTab === 'Vértices' && (
              <div className="section">
                <p className="hint">Clique no canvas para adicionar, ou use o campo abaixo:</p>
                <div className="input-row">
                  <input value={vInput} onChange={e => setVInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addVertex()}
                    placeholder="Nome (ex: A)" maxLength={4} className="inp" />
                  <button className="btn-orange" onClick={addVertex}>+</button>
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
                  <button className="btn-orange" onClick={addEdge}>+</button>
                </div>
                <div className="list">
                  {edgesDisplay.length === 0 && <p className="empty">Nenhuma aresta ainda.</p>}
                  {edgesDisplay.map((e, i) => (
                    <div key={i} className="list-item">
                      <span className="edge-label">{e.from} {directed ? '→' : '—'} {e.to}</span>
                      <button className="btn-remove" onClick={() => removeEdge(e.from, e.to)}>✕</button>
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
          </div>
        </aside>
        <main className="canvas-area">
          <GraphCanvas
            vertices={vertices} edges={edges} directed={directed} highlight={highlight}
            onNodeClick={handleNodeClick} onCanvasClick={handleCanvasClick}
            draggingNode={draggingNode} setDraggingNode={setDraggingNode}
            positions={positions} setPositions={setPositions}
          />
          {vertices.length === 0 && (
            <div className="canvas-empty">
              <p>Vá em <strong>Vértices</strong> e clique no canvas para começar</p>
            </div>
          )}
        </main>
        <aside className="result-panel">
          <div className="result-title">Resultado</div>
          {!result && <p className="empty" style={{ padding:'1rem' }}>Execute uma operação para ver o resultado aqui.</p>}
          {result?.type === 'info'  && <div className="result-info">{result.msg}</div>}
          {result?.type === 'error' && <div className="result-error">{result.msg}</div>}
          {(result?.type === 'dfs' || result?.type === 'bfs') && (
            <div className="result-block">
              <div className="result-subtitle">{result.title}</div>
              <div className="result-seq">
                {result.data.map((v, i) => (
                  <span key={i} className="seq-chip">
                    <span className="seq-num">{i+1}</span>{v}
                    {i < result.data.length-1 && <span className="seq-arrow">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result?.type === 'fecho' && (
            <div className="result-block">
              <div className="result-subtitle">{result.title}</div>
              {result.data.length === 0
                ? <p className="empty" style={{ padding:'8px 0' }}>Nenhum vértice alcançável.</p>
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
                  <div className="result-subtitle" style={{ marginTop:12 }}>SCCs — Kosaraju:</div>
                  {result.sccs.map((scc, i) => (
                    <div key={i} className="scc-item">
                      <span className="scc-num">SCC {i+1}</span>
                      <span className="chip-list">{scc.map(v => <span key={v} className="chip">{v}</span>)}</span>
                    </div>
                  ))}
                </div>
              )}
              {!directed && result.comps && (
                <div>
                  <div className="result-subtitle" style={{ marginTop:12 }}>Componentes conexas:</div>
                  {result.comps.map((c, i) => (
                    <div key={i} className="scc-item">
                      <span className="scc-num">C{i+1}</span>
                      <span className="chip-list">{c.map(v => <span key={v} className="chip">{v}</span>)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && <button className="btn-clear" onClick={clearHighlight}>Limpar destaque</button>}
        </aside>
      </div>
    </div>
  )
}